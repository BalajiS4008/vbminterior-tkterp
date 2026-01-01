import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  where,
  serverTimestamp,
} from 'firebase/firestore';
import type { QueryDocumentSnapshot, DocumentData } from 'firebase/firestore';
import { db } from '../config/firebase';
import type { Client, ClientStatus, ClientFilters } from '../types';

const COLLECTION_NAME = 'clients';

const convertTimestamp = (timestamp: any): Date => {
  return timestamp?.toDate ? timestamp.toDate() : new Date();
};

const mapClientFromFirestore = (doc: QueryDocumentSnapshot<DocumentData>): Client => {
  const data = doc.data();
  return {
    id: doc.id,
    name: data.name || '',
    email: data.email || '',
    phone: data.phone || '',
    alternatePhone: data.alternatePhone,
    address: data.address,
    city: data.city,
    state: data.state,
    pincode: data.pincode,
    gstNumber: data.gstNumber,
    panNumber: data.panNumber,
    contactPerson: data.contactPerson,
    contactPersonPhone: data.contactPersonPhone,
    notes: data.notes,
    tags: data.tags || [],
    source: data.source,
    status: data.status || 'active',
    totalProjects: data.totalProjects || 0,
    totalRevenue: data.totalRevenue || 0,
    outstandingAmount: data.outstandingAmount || 0,
    createdBy: data.createdBy || '',
    createdAt: convertTimestamp(data.createdAt),
    updatedAt: convertTimestamp(data.updatedAt),
  };
};

export const clientService = {
  async getAll(filters?: ClientFilters): Promise<{ clients: Client[] }> {
    const collectionRef = collection(db, COLLECTION_NAME);
    let q = query(collectionRef, orderBy('name', 'asc'));

    // Apply status filter if provided
    if (filters?.status && filters.status.length > 0) {
      q = query(collectionRef, where('status', 'in', filters.status), orderBy('name', 'asc'));
    }

    const snapshot = await getDocs(q);
    let clients = snapshot.docs.map(mapClientFromFirestore);

    // Apply search filter client-side
    if (filters?.searchQuery) {
      const term = filters.searchQuery.toLowerCase();
      clients = clients.filter(
        (client) =>
          client.name.toLowerCase().includes(term) ||
          client.email.toLowerCase().includes(term) ||
          client.phone.includes(term) ||
          client.city?.toLowerCase().includes(term) ||
          client.contactPerson?.toLowerCase().includes(term)
      );
    }

    return { clients };
  },

  async getById(id: string): Promise<Client | null> {
    const docRef = doc(db, COLLECTION_NAME, id);
    const snapshot = await getDoc(docRef);
    if (!snapshot.exists()) {
      return null;
    }
    return mapClientFromFirestore(snapshot as QueryDocumentSnapshot<DocumentData>);
  },

  async create(data: Omit<Client, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const collectionRef = collection(db, COLLECTION_NAME);
    const docRef = await addDoc(collectionRef, {
      ...data,
      totalProjects: data.totalProjects || 0,
      totalRevenue: data.totalRevenue || 0,
      outstandingAmount: data.outstandingAmount || 0,
      status: data.status || 'active',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return docRef.id;
  },

  async update(id: string, data: Partial<Client>): Promise<void> {
    const docRef = doc(db, COLLECTION_NAME, id);
    await updateDoc(docRef, {
      ...data,
      updatedAt: serverTimestamp(),
    });
  },

  async delete(id: string): Promise<void> {
    const docRef = doc(db, COLLECTION_NAME, id);
    await deleteDoc(docRef);
  },

  async search(searchTerm: string): Promise<Client[]> {
    const collectionRef = collection(db, COLLECTION_NAME);
    const q = query(collectionRef, orderBy('name', 'asc'));
    const snapshot = await getDocs(q);
    const clients = snapshot.docs.map(mapClientFromFirestore);
    const term = searchTerm.toLowerCase();
    return clients.filter(
      (client) =>
        client.name.toLowerCase().includes(term) ||
        client.email.toLowerCase().includes(term) ||
        client.phone.includes(term) ||
        client.city?.toLowerCase().includes(term)
    );
  },

  async updateStats(clientId: string, stats: { totalProjects?: number; totalRevenue?: number; outstandingAmount?: number }): Promise<void> {
    const docRef = doc(db, COLLECTION_NAME, clientId);
    await updateDoc(docRef, {
      ...stats,
      updatedAt: serverTimestamp(),
    });
  },

  async getByStatus(status: ClientStatus): Promise<Client[]> {
    const collectionRef = collection(db, COLLECTION_NAME);
    const q = query(collectionRef, where('status', '==', status), orderBy('name', 'asc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(mapClientFromFirestore);
  },
};

export default clientService;
