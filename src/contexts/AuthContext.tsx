import React, { createContext, useContext, useEffect, useState, useCallback, useMemo, type ReactNode } from 'react';
import {
  type User as FirebaseUser,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  onAuthStateChanged,
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../config/firebase';
import type { User, Permission } from '../types';
import { getPermissionsForRole, mergePermissions } from '../config/permissions';

interface AuthContextType {
  currentUser: FirebaseUser | null;
  userData: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  hasPermission: (permission: Permission) => boolean;
  hasAnyPermission: (permissions: Permission[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [userData, setUserData] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);

      if (user) {
        // Fetch user data from Firestore
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            const data = userDoc.data();
            const role = data.role || 'worker';
            const rolePermissions = getPermissionsForRole(role);
            const customPermissions = data.customPermissions || { additions: [], removals: [] };

            // Merge role permissions with custom modifications
            const effectivePermissions = mergePermissions(
              rolePermissions,
              customPermissions.additions || [],
              customPermissions.removals || []
            );

            setUserData({
              id: user.uid,
              email: user.email || '',
              displayName: data.displayName || user.displayName || '',
              phone: data.phone,
              role,
              permissions: effectivePermissions,
              customPermissions: {
                additions: customPermissions.additions || [],
                removals: customPermissions.removals || [],
              },
              language: data.language || 'en',
              createdAt: data.createdAt?.toDate() || new Date(),
              updatedAt: data.updatedAt?.toDate() || new Date(),
              isActive: data.isActive ?? true,
              avatarUrl: data.avatarUrl,
            });
          } else {
            // User document doesn't exist, create with admin role
            // This ensures the first user gets full access
            const defaultRole = 'admin';
            const newUserData = {
              email: user.email || '',
              displayName: user.displayName || '',
              role: defaultRole,
              language: 'en',
              isActive: true,
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
            };

            // Create the user document in Firestore
            await setDoc(doc(db, 'users', user.uid), newUserData);

            setUserData({
              id: user.uid,
              email: user.email || '',
              displayName: user.displayName || '',
              role: defaultRole,
              permissions: getPermissionsForRole(defaultRole),
              language: 'en',
              createdAt: new Date(),
              updatedAt: new Date(),
              isActive: true,
            });
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
        }
      } else {
        setUserData(null);
      }

      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const login = useCallback(async (email: string, password: string): Promise<void> => {
    await signInWithEmailAndPassword(auth, email, password);
  }, []);

  const logout = useCallback(async (): Promise<void> => {
    await signOut(auth);
    setUserData(null);
  }, []);

  const resetPassword = useCallback(async (email: string): Promise<void> => {
    await sendPasswordResetEmail(auth, email);
  }, []);

  const hasPermission = useCallback((permission: Permission): boolean => {
    if (!userData) return false;
    return userData.permissions.includes(permission);
  }, [userData]);

  const hasAnyPermission = useCallback((permissions: Permission[]): boolean => {
    if (!userData) return false;
    return permissions.some((permission) => userData.permissions.includes(permission));
  }, [userData]);

  const value: AuthContextType = useMemo(() => ({
    currentUser,
    userData,
    loading,
    login,
    logout,
    resetPassword,
    hasPermission,
    hasAnyPermission,
  }), [currentUser, userData, loading, login, logout, resetPassword, hasPermission, hasAnyPermission]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
