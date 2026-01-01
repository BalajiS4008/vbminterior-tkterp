import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import type { QueryDocumentSnapshot, DocumentData } from 'firebase/firestore';
import { db } from '../config/firebase';
import type { Project, ProjectStatus, ProjectFilters, PaginationParams } from '../types';

const COLLECTION_NAME = 'projects';

const convertTimestamp = (timestamp: Timestamp | undefined): Date => {
  return timestamp ? timestamp.toDate() : new Date();
};

const mapProjectFromFirestore = (doc: QueryDocumentSnapshot<DocumentData>): Project => {
  const data = doc.data();
  return {
    id: doc.id,
    name: data.name,
    description: data.description,
    clientId: data.clientId,
    clientName: data.clientName,
    clientContact: data.clientContact,
    clientEmail: data.clientEmail,
    clientAddress: data.clientAddress,
    location: data.location,
    budget: data.budget,
    startDate: convertTimestamp(data.startDate),
    endDate: convertTimestamp(data.endDate),
    status: data.status,
    progress: data.progress || 0,
    assignedUsers: data.assignedUsers || [],
    tags: data.tags || [],
    createdBy: data.createdBy,
    createdAt: convertTimestamp(data.createdAt),
    updatedAt: convertTimestamp(data.updatedAt),
  };
};

export const projectService = {
  async getAll(
    filters?: ProjectFilters,
    pagination?: PaginationParams,
    lastDoc?: QueryDocumentSnapshot<DocumentData>
  ): Promise<{ projects: Project[]; lastDoc: QueryDocumentSnapshot<DocumentData> | null }> {
    const collectionRef = collection(db, COLLECTION_NAME);
    const constraints: any[] = [];

    // Apply filters
    if (filters?.status && filters.status.length > 0) {
      constraints.push(where('status', 'in', filters.status));
    }

    // Apply sorting
    constraints.push(orderBy(pagination?.sortBy || 'createdAt', pagination?.sortOrder || 'desc'));

    // Apply pagination
    if (lastDoc) {
      constraints.push(startAfter(lastDoc));
    }
    constraints.push(limit(pagination?.limit || 10));

    const q = query(collectionRef, ...constraints);
    const snapshot = await getDocs(q);

    const projects = snapshot.docs.map(mapProjectFromFirestore);
    const newLastDoc = snapshot.docs.length > 0 ? snapshot.docs[snapshot.docs.length - 1] : null;

    return { projects, lastDoc: newLastDoc };
  },

  async getById(id: string): Promise<Project | null> {
    const docRef = doc(db, COLLECTION_NAME, id);
    const snapshot = await getDoc(docRef);

    if (!snapshot.exists()) {
      return null;
    }

    return mapProjectFromFirestore(snapshot as QueryDocumentSnapshot<DocumentData>);
  },

  async getByUserId(userId: string): Promise<Project[]> {
    const collectionRef = collection(db, COLLECTION_NAME);
    const q = query(
      collectionRef,
      where('assignedUsers', 'array-contains', userId),
      orderBy('createdAt', 'desc')
    );
    const snapshot = await getDocs(q);

    return snapshot.docs.map(mapProjectFromFirestore);
  },

  async create(project: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const collectionRef = collection(db, COLLECTION_NAME);
    const docRef = await addDoc(collectionRef, {
      ...project,
      startDate: Timestamp.fromDate(project.startDate),
      endDate: Timestamp.fromDate(project.endDate),
      progress: project.progress || 0,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    return docRef.id;
  },

  async update(id: string, updates: Partial<Project>): Promise<void> {
    const docRef = doc(db, COLLECTION_NAME, id);
    const updateData: Record<string, any> = {
      ...updates,
      updatedAt: serverTimestamp(),
    };

    // Convert dates to Timestamps
    if (updates.startDate) {
      updateData.startDate = Timestamp.fromDate(updates.startDate);
    }
    if (updates.endDate) {
      updateData.endDate = Timestamp.fromDate(updates.endDate);
    }

    // Remove undefined values and id
    delete updateData.id;
    delete updateData.createdAt;
    Object.keys(updateData).forEach((key) => {
      if (updateData[key] === undefined) {
        delete updateData[key];
      }
    });

    await updateDoc(docRef, updateData);
  },

  async delete(id: string): Promise<void> {
    const docRef = doc(db, COLLECTION_NAME, id);
    await deleteDoc(docRef);
  },

  async updateProgress(id: string, progress: number): Promise<void> {
    const docRef = doc(db, COLLECTION_NAME, id);
    await updateDoc(docRef, {
      progress,
      updatedAt: serverTimestamp(),
    });
  },

  async updateStatus(id: string, status: ProjectStatus): Promise<void> {
    const docRef = doc(db, COLLECTION_NAME, id);
    await updateDoc(docRef, {
      status,
      updatedAt: serverTimestamp(),
    });
  },

  async assignUsers(id: string, userIds: string[]): Promise<void> {
    const docRef = doc(db, COLLECTION_NAME, id);
    await updateDoc(docRef, {
      assignedUsers: userIds,
      updatedAt: serverTimestamp(),
    });
  },
};

export default projectService;
