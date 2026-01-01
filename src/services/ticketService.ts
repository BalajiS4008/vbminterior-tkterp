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
import type { Ticket, TicketStatus, TicketFilters, PaginationParams, TicketComment, Attachment } from '../types';
import { generateTicketNumber } from '../utils';

const COLLECTION_NAME = 'tickets';
const COMMENTS_COLLECTION = 'ticket_comments';
const COUNTERS_COLLECTION = 'counters';

const convertTimestamp = (timestamp: Timestamp | undefined): Date => {
  return timestamp ? timestamp.toDate() : new Date();
};

const mapTicketFromFirestore = (doc: QueryDocumentSnapshot<DocumentData>): Ticket => {
  const data = doc.data();
  return {
    id: doc.id,
    ticketNumber: data.ticketNumber,
    title: data.title,
    description: data.description,
    projectId: data.projectId,
    location: data.location,
    category: data.category,
    priority: data.priority,
    status: data.status,
    assignedTo: data.assignedTo || [],
    dueDate: data.dueDate ? convertTimestamp(data.dueDate) : undefined,
    attachments: (data.attachments || []).map((att: any) => ({
      ...att,
      uploadedAt: convertTimestamp(att.uploadedAt),
    })),
    createdBy: data.createdBy,
    createdAt: convertTimestamp(data.createdAt),
    updatedAt: convertTimestamp(data.updatedAt),
    resolvedAt: data.resolvedAt ? convertTimestamp(data.resolvedAt) : undefined,
    closedAt: data.closedAt ? convertTimestamp(data.closedAt) : undefined,
  };
};

const mapCommentFromFirestore = (doc: QueryDocumentSnapshot<DocumentData>): TicketComment => {
  const data = doc.data();
  return {
    id: doc.id,
    ticketId: data.ticketId,
    userId: data.userId,
    userName: data.userName,
    content: data.content,
    attachments: data.attachments,
    createdAt: convertTimestamp(data.createdAt),
  };
};

export const ticketService = {
  async getNextTicketNumber(prefix: string = 'TKT'): Promise<string> {
    const counterRef = doc(db, COUNTERS_COLLECTION, 'tickets');
    const currentMonth = new Date().toISOString().slice(0, 7).replace('-', '');

    return await runTransaction(db, async (transaction) => {
      const counterDoc = await transaction.get(counterRef);

      let sequence = 1;
      if (counterDoc.exists()) {
        const data = counterDoc.data();
        if (data.lastMonth === currentMonth) {
          sequence = (data.lastNumber || 0) + 1;
        }
      }

      transaction.set(counterRef, {
        prefix,
        lastNumber: sequence,
        lastMonth: currentMonth,
      });

      return generateTicketNumber(prefix, sequence);
    });
  },

  async getAll(
    filters?: TicketFilters,
    pagination?: PaginationParams,
    lastDoc?: QueryDocumentSnapshot<DocumentData>
  ): Promise<{ tickets: Ticket[]; lastDoc: QueryDocumentSnapshot<DocumentData> | null }> {
    const collectionRef = collection(db, COLLECTION_NAME);
    const constraints: any[] = [];

    // Apply filters
    if (filters?.projectId) {
      constraints.push(where('projectId', '==', filters.projectId));
    }
    if (filters?.status && filters.status.length > 0) {
      constraints.push(where('status', 'in', filters.status));
    }
    if (filters?.priority && filters.priority.length > 0) {
      constraints.push(where('priority', 'in', filters.priority));
    }
    if (filters?.category && filters.category.length > 0) {
      constraints.push(where('category', 'in', filters.category));
    }
    if (filters?.assignedTo) {
      constraints.push(where('assignedTo', 'array-contains', filters.assignedTo));
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

    const tickets = snapshot.docs.map(mapTicketFromFirestore);
    const newLastDoc = snapshot.docs.length > 0 ? snapshot.docs[snapshot.docs.length - 1] : null;

    return { tickets, lastDoc: newLastDoc };
  },

  async getById(id: string): Promise<Ticket | null> {
    const docRef = doc(db, COLLECTION_NAME, id);
    const snapshot = await getDoc(docRef);

    if (!snapshot.exists()) {
      return null;
    }

    return mapTicketFromFirestore(snapshot as QueryDocumentSnapshot<DocumentData>);
  },

  async getByProjectId(projectId: string): Promise<Ticket[]> {
    const collectionRef = collection(db, COLLECTION_NAME);
    // Simple query without orderBy to avoid requiring composite index
    const q = query(
      collectionRef,
      where('projectId', '==', projectId)
    );
    const snapshot = await getDocs(q);

    // Sort in memory instead
    const tickets = snapshot.docs.map(mapTicketFromFirestore);
    return tickets.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  },

  async create(ticket: Omit<Ticket, 'id' | 'ticketNumber' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const ticketNumber = await this.getNextTicketNumber();
    const collectionRef = collection(db, COLLECTION_NAME);

    const docRef = await addDoc(collectionRef, {
      ...ticket,
      ticketNumber,
      dueDate: ticket.dueDate ? Timestamp.fromDate(ticket.dueDate) : null,
      attachments: ticket.attachments.map((att) => ({
        ...att,
        uploadedAt: Timestamp.fromDate(att.uploadedAt),
      })),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    return docRef.id;
  },

  async update(id: string, updates: Partial<Ticket>): Promise<void> {
    const docRef = doc(db, COLLECTION_NAME, id);
    const updateData: Record<string, any> = {
      ...updates,
      updatedAt: serverTimestamp(),
    };

    // Convert dates to Timestamps
    if (updates.dueDate) {
      updateData.dueDate = Timestamp.fromDate(updates.dueDate);
    }

    // Remove undefined values and id
    delete updateData.id;
    delete updateData.ticketNumber;
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

  async updateStatus(id: string, status: TicketStatus): Promise<void> {
    const docRef = doc(db, COLLECTION_NAME, id);
    const updates: Record<string, any> = {
      status,
      updatedAt: serverTimestamp(),
    };

    if (status === 'resolved') {
      updates.resolvedAt = serverTimestamp();
    } else if (status === 'closed') {
      updates.closedAt = serverTimestamp();
    }

    await updateDoc(docRef, updates);
  },

  async assignUsers(id: string, userIds: string[]): Promise<void> {
    const docRef = doc(db, COLLECTION_NAME, id);
    await updateDoc(docRef, {
      assignedTo: userIds,
      updatedAt: serverTimestamp(),
    });
  },

  async addAttachment(id: string, attachment: Attachment): Promise<void> {
    const ticket = await this.getById(id);
    if (!ticket) throw new Error('Ticket not found');

    const docRef = doc(db, COLLECTION_NAME, id);
    await updateDoc(docRef, {
      attachments: [
        ...ticket.attachments,
        {
          ...attachment,
          uploadedAt: Timestamp.fromDate(attachment.uploadedAt),
        },
      ],
      updatedAt: serverTimestamp(),
    });
  },

  // Comments
  async getComments(ticketId: string): Promise<TicketComment[]> {
    const collectionRef = collection(db, COMMENTS_COLLECTION);
    const q = query(
      collectionRef,
      where('ticketId', '==', ticketId),
      orderBy('createdAt', 'asc')
    );
    const snapshot = await getDocs(q);

    return snapshot.docs.map(mapCommentFromFirestore);
  },

  async addComment(comment: Omit<TicketComment, 'id' | 'createdAt'>): Promise<string> {
    const collectionRef = collection(db, COMMENTS_COLLECTION);
    const docRef = await addDoc(collectionRef, {
      ...comment,
      createdAt: serverTimestamp(),
    });

    return docRef.id;
  },

  async deleteComment(commentId: string): Promise<void> {
    const docRef = doc(db, COMMENTS_COLLECTION, commentId);
    await deleteDoc(docRef);
  },
};

export default ticketService;
