import { useState, useCallback } from 'react';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  limit,
  type DocumentData,
  type QueryConstraint,
  type QueryDocumentSnapshot,
  Timestamp,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import type { PaginationParams } from '../types';

interface UseFirestoreReturn<T> {
  loading: boolean;
  error: string | null;
  getDocument: (collectionName: string, docId: string) => Promise<T | null>;
  getDocuments: (
    collectionName: string,
    constraints?: QueryConstraint[],
    pagination?: PaginationParams
  ) => Promise<{ data: T[]; lastDoc: QueryDocumentSnapshot<DocumentData> | null }>;
  addDocument: (collectionName: string, data: Partial<T>) => Promise<string>;
  updateDocument: (collectionName: string, docId: string, data: Partial<T>) => Promise<void>;
  deleteDocument: (collectionName: string, docId: string) => Promise<void>;
}

export function useFirestore<T extends DocumentData>(): UseFirestoreReturn<T> {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const convertTimestamps = (data: DocumentData): T => {
    const converted: Record<string, unknown> = { ...data };
    for (const key in converted) {
      if (converted[key] instanceof Timestamp) {
        converted[key] = (converted[key] as Timestamp).toDate();
      }
    }
    return converted as T;
  };

  const getDocument = useCallback(async (collectionName: string, docId: string): Promise<T | null> => {
    setLoading(true);
    setError(null);
    try {
      const docRef = doc(db, collectionName, docId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        return { id: docSnap.id, ...convertTimestamps(docSnap.data()) };
      }
      return null;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch document';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const getDocuments = useCallback(
    async (
      collectionName: string,
      constraints: QueryConstraint[] = [],
      pagination?: PaginationParams
    ): Promise<{ data: T[]; lastDoc: QueryDocumentSnapshot<DocumentData> | null }> => {
      setLoading(true);
      setError(null);
      try {
        const collectionRef = collection(db, collectionName);
        let queryConstraints = [...constraints];

        if (pagination) {
          if (pagination.sortBy) {
            queryConstraints.push(orderBy(pagination.sortBy, pagination.sortOrder || 'asc'));
          }
          queryConstraints.push(limit(pagination.limit));
        }

        const q = query(collectionRef, ...queryConstraints);
        const querySnapshot = await getDocs(q);

        const data: T[] = [];
        let lastDoc: QueryDocumentSnapshot<DocumentData> | null = null;

        querySnapshot.forEach((doc) => {
          data.push({ id: doc.id, ...convertTimestamps(doc.data()) });
          lastDoc = doc;
        });

        return { data, lastDoc };
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to fetch documents';
        setError(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const addDocument = useCallback(async (collectionName: string, data: Partial<T>): Promise<string> => {
    setLoading(true);
    setError(null);
    try {
      const collectionRef = collection(db, collectionName);
      const docRef = await addDoc(collectionRef, {
        ...data,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      return docRef.id;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to add document';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateDocument = useCallback(
    async (collectionName: string, docId: string, data: Partial<T>): Promise<void> => {
      setLoading(true);
      setError(null);
      try {
        const docRef = doc(db, collectionName, docId);
        await updateDoc(docRef, {
          ...data,
          updatedAt: serverTimestamp(),
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to update document';
        setError(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const deleteDocument = useCallback(async (collectionName: string, docId: string): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      const docRef = doc(db, collectionName, docId);
      await deleteDoc(docRef);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete document';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    error,
    getDocument,
    getDocuments,
    addDocument,
    updateDocument,
    deleteDocument,
  };
}

export default useFirestore;
