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
  serverTimestamp,
  Timestamp,
  runTransaction,
} from 'firebase/firestore';
import type { QueryDocumentSnapshot, DocumentData } from 'firebase/firestore';
import { db } from '../config/firebase';
import type { Payment, PaymentFilters, InvoicePaymentSummary, PaymentStatus } from '../types';

const PAYMENTS_COLLECTION = 'payments';
const COUNTERS_COLLECTION = 'counters';

const convertTimestamp = (timestamp: Timestamp | undefined): Date => {
  return timestamp ? timestamp.toDate() : new Date();
};

const mapPaymentFromFirestore = (doc: QueryDocumentSnapshot<DocumentData>): Payment => {
  const data = doc.data();
  return {
    id: doc.id,
    paymentNumber: data.paymentNumber,
    invoiceId: data.invoiceId,
    invoiceNumber: data.invoiceNumber,
    clientId: data.clientId,
    clientName: data.clientName,
    projectId: data.projectId,
    projectName: data.projectName,
    amount: data.amount,
    paymentDate: convertTimestamp(data.paymentDate),
    paymentMethod: data.paymentMethod,
    referenceNumber: data.referenceNumber,
    bankName: data.bankName,
    notes: data.notes,
    attachments: data.attachments || [],
    receivedBy: data.receivedBy,
    createdBy: data.createdBy,
    createdAt: convertTimestamp(data.createdAt),
    updatedAt: convertTimestamp(data.updatedAt),
  };
};

export const paymentService = {
  async getNextPaymentNumber(prefix: string = 'PAY'): Promise<string> {
    const counterRef = doc(db, COUNTERS_COLLECTION, 'payments');
    const currentYear = new Date().getFullYear().toString();

    return await runTransaction(db, async (transaction) => {
      const counterDoc = await transaction.get(counterRef);

      let sequence = 1;
      if (counterDoc.exists()) {
        const data = counterDoc.data();
        if (data.lastYear === currentYear) {
          sequence = (data.lastNumber || 0) + 1;
        }
      }

      transaction.set(counterRef, {
        prefix,
        lastNumber: sequence,
        lastYear: currentYear,
      });

      return `${prefix}-${currentYear}-${sequence.toString().padStart(4, '0')}`;
    });
  },

  async getAll(filters?: PaymentFilters): Promise<{ payments: Payment[] }> {
    const collectionRef = collection(db, PAYMENTS_COLLECTION);
    const constraints: any[] = [];

    if (filters?.invoiceId) {
      constraints.push(where('invoiceId', '==', filters.invoiceId));
    }
    if (filters?.clientId) {
      constraints.push(where('clientId', '==', filters.clientId));
    }
    if (filters?.projectId) {
      constraints.push(where('projectId', '==', filters.projectId));
    }
    if (filters?.paymentMethod && filters.paymentMethod.length > 0) {
      constraints.push(where('paymentMethod', 'in', filters.paymentMethod));
    }

    constraints.push(orderBy('paymentDate', 'desc'));

    const q = query(collectionRef, ...constraints);
    const snapshot = await getDocs(q);
    const payments = snapshot.docs.map(mapPaymentFromFirestore);

    // Filter by date range in memory if needed
    if (filters?.dateRange) {
      const { start, end } = filters.dateRange;
      return {
        payments: payments.filter(
          (p) => p.paymentDate >= start && p.paymentDate <= end
        ),
      };
    }

    return { payments };
  },

  async getById(id: string): Promise<Payment | null> {
    const docRef = doc(db, PAYMENTS_COLLECTION, id);
    const snapshot = await getDoc(docRef);

    if (!snapshot.exists()) {
      return null;
    }

    return mapPaymentFromFirestore(snapshot as QueryDocumentSnapshot<DocumentData>);
  },

  async getByInvoiceId(invoiceId: string): Promise<Payment[]> {
    const collectionRef = collection(db, PAYMENTS_COLLECTION);
    const q = query(
      collectionRef,
      where('invoiceId', '==', invoiceId),
      orderBy('paymentDate', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(mapPaymentFromFirestore);
  },

  async getByClientId(clientId: string): Promise<Payment[]> {
    const collectionRef = collection(db, PAYMENTS_COLLECTION);
    const q = query(
      collectionRef,
      where('clientId', '==', clientId),
      orderBy('paymentDate', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(mapPaymentFromFirestore);
  },

  async create(
    payment: Omit<Payment, 'id' | 'paymentNumber' | 'createdAt' | 'updatedAt'>
  ): Promise<string> {
    const paymentNumber = await this.getNextPaymentNumber();
    const collectionRef = collection(db, PAYMENTS_COLLECTION);

    const docRef = await addDoc(collectionRef, {
      ...payment,
      paymentNumber,
      paymentDate: Timestamp.fromDate(payment.paymentDate),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    return docRef.id;
  },

  async update(id: string, updates: Partial<Payment>): Promise<void> {
    const docRef = doc(db, PAYMENTS_COLLECTION, id);
    const updateData: Record<string, any> = {
      ...updates,
      updatedAt: serverTimestamp(),
    };

    if (updates.paymentDate) {
      updateData.paymentDate = Timestamp.fromDate(updates.paymentDate);
    }

    delete updateData.id;
    delete updateData.paymentNumber;
    delete updateData.createdAt;

    await updateDoc(docRef, updateData);
  },

  async delete(id: string): Promise<void> {
    const docRef = doc(db, PAYMENTS_COLLECTION, id);
    await deleteDoc(docRef);
  },

  async getInvoicePaymentSummary(
    invoiceId: string,
    invoiceNumber: string,
    totalAmount: number
  ): Promise<InvoicePaymentSummary> {
    const payments = await this.getByInvoiceId(invoiceId);
    const paidAmount = payments.reduce((sum, p) => sum + p.amount, 0);
    const balanceAmount = totalAmount - paidAmount;

    let status: PaymentStatus = 'unpaid';
    if (paidAmount >= totalAmount) {
      status = paidAmount > totalAmount ? 'overpaid' : 'paid';
    } else if (paidAmount > 0) {
      status = 'partial';
    }

    const lastPaymentDate = payments.length > 0 ? payments[0].paymentDate : undefined;

    return {
      invoiceId,
      invoiceNumber,
      totalAmount,
      paidAmount,
      balanceAmount,
      payments,
      lastPaymentDate,
      status,
    };
  },

  async getTotalPaymentsByClient(clientId: string): Promise<number> {
    const payments = await this.getByClientId(clientId);
    return payments.reduce((sum, p) => sum + p.amount, 0);
  },

  async getRecentPayments(limit: number = 10): Promise<Payment[]> {
    const collectionRef = collection(db, PAYMENTS_COLLECTION);
    const q = query(collectionRef, orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.slice(0, limit).map(mapPaymentFromFirestore);
  },
};

export default paymentService;
