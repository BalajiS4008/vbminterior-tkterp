import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import type { QueryDocumentSnapshot, DocumentData } from 'firebase/firestore';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { auth, db } from '../config/firebase';
import type { User, UserRole, Permission } from '../types';
import { getPermissionsForRole, mergePermissions } from '../config/permissions';

const COLLECTION_NAME = 'users';

const convertTimestamp = (timestamp: Timestamp | undefined): Date => {
  return timestamp ? timestamp.toDate() : new Date();
};

const mapUserFromFirestore = (doc: QueryDocumentSnapshot<DocumentData>): User => {
  const data = doc.data();
  const rolePermissions = getPermissionsForRole(data.role);
  const customPermissions = data.customPermissions || { additions: [], removals: [] };

  // Calculate effective permissions by merging role defaults with custom modifications
  const effectivePermissions = mergePermissions(
    rolePermissions,
    customPermissions.additions || [],
    customPermissions.removals || []
  );

  return {
    id: doc.id,
    email: data.email,
    displayName: data.displayName,
    phone: data.phone,
    role: data.role,
    permissions: effectivePermissions,
    customPermissions: {
      additions: customPermissions.additions || [],
      removals: customPermissions.removals || [],
    },
    language: data.language || 'en',
    avatarUrl: data.avatarUrl,
    isActive: data.isActive ?? true,
    createdAt: convertTimestamp(data.createdAt),
    updatedAt: convertTimestamp(data.updatedAt),
  };
};

export const userService = {
  async getAll(): Promise<User[]> {
    const collectionRef = collection(db, COLLECTION_NAME);
    const q = query(collectionRef, orderBy('displayName', 'asc'));
    const snapshot = await getDocs(q);

    return snapshot.docs.map(mapUserFromFirestore);
  },

  async getById(id: string): Promise<User | null> {
    const docRef = doc(db, COLLECTION_NAME, id);
    const snapshot = await getDoc(docRef);

    if (!snapshot.exists()) {
      return null;
    }

    return mapUserFromFirestore(snapshot as QueryDocumentSnapshot<DocumentData>);
  },

  async getByRole(role: UserRole): Promise<User[]> {
    const collectionRef = collection(db, COLLECTION_NAME);
    const q = query(
      collectionRef,
      where('role', '==', role),
      where('isActive', '==', true),
      orderBy('displayName', 'asc')
    );
    const snapshot = await getDocs(q);

    return snapshot.docs.map(mapUserFromFirestore);
  },

  async getActiveUsers(): Promise<User[]> {
    const collectionRef = collection(db, COLLECTION_NAME);
    const q = query(
      collectionRef,
      where('isActive', '==', true),
      orderBy('displayName', 'asc')
    );
    const snapshot = await getDocs(q);

    return snapshot.docs.map(mapUserFromFirestore);
  },

  async create(
    email: string,
    password: string,
    userData: {
      displayName: string;
      phone?: string;
      role: UserRole;
      language?: 'en' | 'ta';
    }
  ): Promise<string> {
    // Create Firebase Auth user
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const uid = userCredential.user.uid;

    // Update display name in Auth
    await updateProfile(userCredential.user, {
      displayName: userData.displayName,
    });

    // Create Firestore document
    const docRef = doc(db, COLLECTION_NAME, uid);
    await setDoc(docRef, {
      email,
      displayName: userData.displayName,
      phone: userData.phone || null,
      role: userData.role,
      permissions: getPermissionsForRole(userData.role),
      language: userData.language || 'en',
      isActive: true,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    return uid;
  },

  async update(id: string, updates: Partial<User>): Promise<void> {
    const docRef = doc(db, COLLECTION_NAME, id);
    const updateData: Record<string, any> = {
      ...updates,
      updatedAt: serverTimestamp(),
    };

    // If role is being updated, also update permissions
    if (updates.role) {
      updateData.permissions = getPermissionsForRole(updates.role);
    }

    // Remove undefined values and id
    delete updateData.id;
    delete updateData.email;
    delete updateData.createdAt;
    Object.keys(updateData).forEach((key) => {
      if (updateData[key] === undefined) {
        delete updateData[key];
      }
    });

    await updateDoc(docRef, updateData);
  },

  async updateRole(id: string, role: UserRole, clearCustomPermissions: boolean = true): Promise<void> {
    const docRef = doc(db, COLLECTION_NAME, id);
    const updateData: Record<string, any> = {
      role,
      updatedAt: serverTimestamp(),
    };

    // Optionally clear custom permissions when role changes
    if (clearCustomPermissions) {
      updateData.customPermissions = { additions: [], removals: [] };
    }

    await updateDoc(docRef, updateData);
  },

  async updateCustomPermissions(
    id: string,
    additions: Permission[],
    removals: Permission[]
  ): Promise<void> {
    const docRef = doc(db, COLLECTION_NAME, id);
    await updateDoc(docRef, {
      customPermissions: { additions, removals },
      updatedAt: serverTimestamp(),
    });
  },

  async resetToRoleDefaults(id: string): Promise<void> {
    const docRef = doc(db, COLLECTION_NAME, id);
    await updateDoc(docRef, {
      customPermissions: { additions: [], removals: [] },
      updatedAt: serverTimestamp(),
    });
  },

  async deactivate(id: string): Promise<void> {
    const docRef = doc(db, COLLECTION_NAME, id);
    await updateDoc(docRef, {
      isActive: false,
      updatedAt: serverTimestamp(),
    });
  },

  async activate(id: string): Promise<void> {
    const docRef = doc(db, COLLECTION_NAME, id);
    await updateDoc(docRef, {
      isActive: true,
      updatedAt: serverTimestamp(),
    });
  },

  async delete(id: string): Promise<void> {
    // Note: This only deletes the Firestore document
    // The Firebase Auth user needs to be deleted separately via Admin SDK
    const docRef = doc(db, COLLECTION_NAME, id);
    await deleteDoc(docRef);
  },
};

export default userService;
