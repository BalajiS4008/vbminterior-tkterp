import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore';
import type { QueryDocumentSnapshot, DocumentData } from 'firebase/firestore';
import { db } from '../config/firebase';
import type { QuotationStatus } from '../types';

const COLLECTION_NAME = 'quotations';

interface QuotationItem {
  description: string;
  quantity: number;
  unitPrice: number;
  unit: string;
  amount: number;
}

interface ScopeOfWork {
  title: string;
  details: string[];
}

interface QuotationData {
  id: string;
  quotationNumber: string;
  projectId: string;
  projectName: string;
  clientId: string;
  clientName: string;
  status: QuotationStatus;
  createdDate: Date;
  validUntil: Date;
  subject: string;
  items: QuotationItem[];
  scopeOfWork?: ScopeOfWork[];
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  discountPercent: number;
  discountAmount: number;
  total: number;
  notes?: string;
  termsAndConditions?: string;
  includeBreakdown: boolean;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

const convertTimestamp = (timestamp: any): Date => {
  return timestamp?.toDate ? timestamp.toDate() : new Date();
};

const mapQuotationFromFirestore = (doc: QueryDocumentSnapshot<DocumentData>): QuotationData => {
  const data = doc.data();
  return {
    id: doc.id,
    quotationNumber: data.quotationNumber,
    projectId: data.projectId,
    projectName: data.projectName,
    clientId: data.clientId,
    clientName: data.clientName,
    status: data.status,
    createdDate: convertTimestamp(data.createdDate),
    validUntil: convertTimestamp(data.validUntil),
    subject: data.subject,
    items: data.items || [],
    scopeOfWork: data.scopeOfWork || [],
    subtotal: data.subtotal || 0,
    taxRate: data.taxRate || 0,
    taxAmount: data.taxAmount || 0,
    discountPercent: data.discountPercent || 0,
    discountAmount: data.discountAmount || 0,
    total: data.total || 0,
    notes: data.notes,
    termsAndConditions: data.termsAndConditions,
    includeBreakdown: data.includeBreakdown ?? true,
    createdBy: data.createdBy,
    createdAt: convertTimestamp(data.createdAt),
    updatedAt: convertTimestamp(data.updatedAt),
  };
};

export const quotationService = {
  async getAll(
    projectId?: string,
    status?: QuotationStatus[]
  ): Promise<{ quotations: QuotationData[] }> {
    const collectionRef = collection(db, COLLECTION_NAME);
    const constraints: any[] = [];

    if (projectId) {
      constraints.push(where('projectId', '==', projectId));
    }
    if (status && status.length > 0) {
      constraints.push(where('status', 'in', status));
    }
    constraints.push(orderBy('createdAt', 'desc'));

    const q = query(collectionRef, ...constraints);
    const snapshot = await getDocs(q);
    const quotations = snapshot.docs.map(mapQuotationFromFirestore);
    return { quotations };
  },

  async getById(id: string): Promise<QuotationData | null> {
    const docRef = doc(db, COLLECTION_NAME, id);
    const snapshot = await getDoc(docRef);
    if (!snapshot.exists()) {
      return null;
    }
    return mapQuotationFromFirestore(snapshot as QueryDocumentSnapshot<DocumentData>);
  },

  async create(data: Omit<QuotationData, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const collectionRef = collection(db, COLLECTION_NAME);
    const docRef = await addDoc(collectionRef, {
      ...data,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return docRef.id;
  },

  async update(id: string, data: Partial<QuotationData>): Promise<void> {
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

  async updateStatus(id: string, status: QuotationStatus): Promise<void> {
    const docRef = doc(db, COLLECTION_NAME, id);
    await updateDoc(docRef, {
      status,
      updatedAt: serverTimestamp(),
    });
  },

  async getNextQuotationNumber(prefix: string = 'QT'): Promise<string> {
    const year = new Date().getFullYear();
    const collectionRef = collection(db, COLLECTION_NAME);
    const q = query(
      collectionRef,
      where('quotationNumber', '>=', `${prefix}-${year}`),
      where('quotationNumber', '<', `${prefix}-${year + 1}`),
      orderBy('quotationNumber', 'desc')
    );
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      return `${prefix}-${year}-001`;
    }

    const lastNumber = snapshot.docs[0].data().quotationNumber;
    const parts = lastNumber.split('-');
    const sequence = parseInt(parts[2] || '0', 10) + 1;
    return `${prefix}-${year}-${sequence.toString().padStart(3, '0')}`;
  },
};

export default quotationService;
