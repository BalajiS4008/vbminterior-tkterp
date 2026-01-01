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
  runTransaction,
} from 'firebase/firestore';
import type { QueryDocumentSnapshot, DocumentData } from 'firebase/firestore';
import { db } from '../config/firebase';
import type { Invoice, Quotation, DocumentStatus, PaginationParams } from '../types';
import { generateInvoiceNumber, generateQuotationNumber } from '../utils';

const INVOICES_COLLECTION = 'invoices';
const QUOTATIONS_COLLECTION = 'quotations';
const COUNTERS_COLLECTION = 'counters';

const convertTimestamp = (timestamp: Timestamp | undefined): Date => {
  return timestamp ? timestamp.toDate() : new Date();
};

const mapInvoiceFromFirestore = (doc: QueryDocumentSnapshot<DocumentData>): Invoice => {
  const data = doc.data();
  return {
    id: doc.id,
    invoiceNumber: data.invoiceNumber,
    quotationId: data.quotationId,
    projectId: data.projectId,
    ticketIds: data.ticketIds,
    businessDetails: data.businessDetails,
    clientDetails: data.clientDetails,
    lineItems: data.lineItems,
    financialSummary: data.financialSummary,
    issueDate: convertTimestamp(data.issueDate),
    dueDate: convertTimestamp(data.dueDate),
    paidDate: data.paidDate ? convertTimestamp(data.paidDate) : undefined,
    status: data.status,
    notes: data.notes,
    termsAndConditions: data.termsAndConditions,
    templateId: data.templateId,
    createdBy: data.createdBy,
    createdAt: convertTimestamp(data.createdAt),
    updatedAt: convertTimestamp(data.updatedAt),
  };
};

const mapQuotationFromFirestore = (doc: QueryDocumentSnapshot<DocumentData>): Quotation => {
  const data = doc.data();
  return {
    id: doc.id,
    quotationNumber: data.quotationNumber,
    projectId: data.projectId,
    businessDetails: data.businessDetails,
    clientDetails: data.clientDetails,
    lineItems: data.lineItems,
    financialSummary: data.financialSummary,
    issueDate: convertTimestamp(data.issueDate),
    expiryDate: convertTimestamp(data.expiryDate),
    status: data.status,
    notes: data.notes,
    termsAndConditions: data.termsAndConditions,
    templateId: data.templateId,
    createdBy: data.createdBy,
    createdAt: convertTimestamp(data.createdAt),
    updatedAt: convertTimestamp(data.updatedAt),
  };
};

export const invoiceService = {
  // Invoice methods
  async getNextInvoiceNumber(prefix: string = 'INV'): Promise<string> {
    const counterRef = doc(db, COUNTERS_COLLECTION, 'invoices');
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

      return generateInvoiceNumber(prefix, sequence);
    });
  },

  async getAllInvoices(
    projectId?: string,
    status?: DocumentStatus[],
    pagination?: PaginationParams,
    lastDoc?: QueryDocumentSnapshot<DocumentData>
  ): Promise<{ invoices: Invoice[]; lastDoc: QueryDocumentSnapshot<DocumentData> | null }> {
    const collectionRef = collection(db, INVOICES_COLLECTION);
    const constraints: any[] = [];

    if (projectId) {
      constraints.push(where('projectId', '==', projectId));
    }
    if (status && status.length > 0) {
      constraints.push(where('status', 'in', status));
    }

    constraints.push(orderBy(pagination?.sortBy || 'createdAt', pagination?.sortOrder || 'desc'));

    if (lastDoc) {
      constraints.push(startAfter(lastDoc));
    }
    constraints.push(limit(pagination?.limit || 10));

    const q = query(collectionRef, ...constraints);
    const snapshot = await getDocs(q);

    const invoices = snapshot.docs.map(mapInvoiceFromFirestore);
    const newLastDoc = snapshot.docs.length > 0 ? snapshot.docs[snapshot.docs.length - 1] : null;

    return { invoices, lastDoc: newLastDoc };
  },

  async getInvoiceById(id: string): Promise<Invoice | null> {
    const docRef = doc(db, INVOICES_COLLECTION, id);
    const snapshot = await getDoc(docRef);

    if (!snapshot.exists()) {
      return null;
    }

    return mapInvoiceFromFirestore(snapshot as QueryDocumentSnapshot<DocumentData>);
  },

  async getByProjectId(projectId: string): Promise<Invoice[]> {
    const collectionRef = collection(db, INVOICES_COLLECTION);
    // Simple query without orderBy to avoid requiring composite index
    const q = query(
      collectionRef,
      where('projectId', '==', projectId)
    );
    const snapshot = await getDocs(q);

    // Sort in memory instead
    const invoices = snapshot.docs.map(mapInvoiceFromFirestore);
    return invoices.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  },

  async createInvoice(invoice: Omit<Invoice, 'id' | 'invoiceNumber' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const invoiceNumber = await this.getNextInvoiceNumber();
    const collectionRef = collection(db, INVOICES_COLLECTION);

    const docRef = await addDoc(collectionRef, {
      ...invoice,
      invoiceNumber,
      issueDate: Timestamp.fromDate(invoice.issueDate),
      dueDate: Timestamp.fromDate(invoice.dueDate),
      paidDate: invoice.paidDate ? Timestamp.fromDate(invoice.paidDate) : null,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    return docRef.id;
  },

  async updateInvoice(id: string, updates: Partial<Invoice>): Promise<void> {
    const docRef = doc(db, INVOICES_COLLECTION, id);
    const updateData: Record<string, any> = {
      ...updates,
      updatedAt: serverTimestamp(),
    };

    if (updates.issueDate) {
      updateData.issueDate = Timestamp.fromDate(updates.issueDate);
    }
    if (updates.dueDate) {
      updateData.dueDate = Timestamp.fromDate(updates.dueDate);
    }
    if (updates.paidDate) {
      updateData.paidDate = Timestamp.fromDate(updates.paidDate);
    }

    delete updateData.id;
    delete updateData.invoiceNumber;
    delete updateData.createdAt;

    await updateDoc(docRef, updateData);
  },

  async deleteInvoice(id: string): Promise<void> {
    const docRef = doc(db, INVOICES_COLLECTION, id);
    await deleteDoc(docRef);
  },

  async markInvoiceAsPaid(id: string): Promise<void> {
    const docRef = doc(db, INVOICES_COLLECTION, id);
    await updateDoc(docRef, {
      status: 'paid',
      paidDate: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  },

  // Quotation methods
  async getNextQuotationNumber(prefix: string = 'QT'): Promise<string> {
    const counterRef = doc(db, COUNTERS_COLLECTION, 'quotations');
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

      return generateQuotationNumber(prefix, sequence);
    });
  },

  async getAllQuotations(
    projectId?: string,
    status?: DocumentStatus[],
    pagination?: PaginationParams,
    lastDoc?: QueryDocumentSnapshot<DocumentData>
  ): Promise<{ quotations: Quotation[]; lastDoc: QueryDocumentSnapshot<DocumentData> | null }> {
    const collectionRef = collection(db, QUOTATIONS_COLLECTION);
    const constraints: any[] = [];

    if (projectId) {
      constraints.push(where('projectId', '==', projectId));
    }
    if (status && status.length > 0) {
      constraints.push(where('status', 'in', status));
    }

    constraints.push(orderBy(pagination?.sortBy || 'createdAt', pagination?.sortOrder || 'desc'));

    if (lastDoc) {
      constraints.push(startAfter(lastDoc));
    }
    constraints.push(limit(pagination?.limit || 10));

    const q = query(collectionRef, ...constraints);
    const snapshot = await getDocs(q);

    const quotations = snapshot.docs.map(mapQuotationFromFirestore);
    const newLastDoc = snapshot.docs.length > 0 ? snapshot.docs[snapshot.docs.length - 1] : null;

    return { quotations, lastDoc: newLastDoc };
  },

  async getQuotationById(id: string): Promise<Quotation | null> {
    const docRef = doc(db, QUOTATIONS_COLLECTION, id);
    const snapshot = await getDoc(docRef);

    if (!snapshot.exists()) {
      return null;
    }

    return mapQuotationFromFirestore(snapshot as QueryDocumentSnapshot<DocumentData>);
  },

  async createQuotation(quotation: Omit<Quotation, 'id' | 'quotationNumber' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const quotationNumber = await this.getNextQuotationNumber();
    const collectionRef = collection(db, QUOTATIONS_COLLECTION);

    const docRef = await addDoc(collectionRef, {
      ...quotation,
      quotationNumber,
      issueDate: Timestamp.fromDate(quotation.issueDate),
      expiryDate: Timestamp.fromDate(quotation.expiryDate),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    return docRef.id;
  },

  async updateQuotation(id: string, updates: Partial<Quotation>): Promise<void> {
    const docRef = doc(db, QUOTATIONS_COLLECTION, id);
    const updateData: Record<string, any> = {
      ...updates,
      updatedAt: serverTimestamp(),
    };

    if (updates.issueDate) {
      updateData.issueDate = Timestamp.fromDate(updates.issueDate);
    }
    if (updates.expiryDate) {
      updateData.expiryDate = Timestamp.fromDate(updates.expiryDate);
    }

    delete updateData.id;
    delete updateData.quotationNumber;
    delete updateData.createdAt;

    await updateDoc(docRef, updateData);
  },

  async deleteQuotation(id: string): Promise<void> {
    const docRef = doc(db, QUOTATIONS_COLLECTION, id);
    await deleteDoc(docRef);
  },

  async convertQuotationToInvoice(quotationId: string, dueDate: Date): Promise<string> {
    const quotation = await this.getQuotationById(quotationId);
    if (!quotation) throw new Error('Quotation not found');

    const invoiceId = await this.createInvoice({
      quotationId: quotation.id,
      projectId: quotation.projectId,
      businessDetails: quotation.businessDetails,
      clientDetails: quotation.clientDetails,
      lineItems: quotation.lineItems,
      financialSummary: quotation.financialSummary,
      issueDate: new Date(),
      dueDate,
      status: 'draft',
      notes: quotation.notes,
      termsAndConditions: quotation.termsAndConditions,
      templateId: quotation.templateId,
      createdBy: quotation.createdBy,
    });

    // Update quotation status
    await this.updateQuotation(quotationId, { status: 'approved' });

    return invoiceId;
  },
};

export default invoiceService;
