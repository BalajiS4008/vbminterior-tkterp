import {
  collection,
  getDocs,
  addDoc,
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

const COLLECTION_NAME = 'activity_logs';

export type ActivityType =
  | 'project_created'
  | 'project_updated'
  | 'project_deleted'
  | 'project_status_changed'
  | 'ticket_created'
  | 'ticket_updated'
  | 'ticket_deleted'
  | 'ticket_status_changed'
  | 'ticket_assigned'
  | 'ticket_comment_added'
  | 'quotation_created'
  | 'quotation_updated'
  | 'quotation_sent'
  | 'quotation_approved'
  | 'quotation_rejected'
  | 'invoice_created'
  | 'invoice_updated'
  | 'invoice_sent'
  | 'invoice_paid'
  | 'user_login'
  | 'user_logout'
  | 'user_created'
  | 'user_updated'
  | 'user_role_changed'
  | 'attachment_uploaded'
  | 'attachment_deleted';

export interface ActivityLog {
  id: string;
  type: ActivityType;
  entityType: 'project' | 'ticket' | 'quotation' | 'invoice' | 'user' | 'attachment';
  entityId: string;
  entityName?: string;
  userId: string;
  userName: string;
  description: string;
  metadata?: Record<string, any>;
  createdAt: Date;
}

export interface ActivityLogFilters {
  entityType?: string;
  entityId?: string;
  userId?: string;
  type?: ActivityType[];
  startDate?: Date;
  endDate?: Date;
}

const convertTimestamp = (timestamp: Timestamp | undefined): Date => {
  return timestamp ? timestamp.toDate() : new Date();
};

const mapActivityFromFirestore = (doc: QueryDocumentSnapshot<DocumentData>): ActivityLog => {
  const data = doc.data();
  return {
    id: doc.id,
    type: data.type,
    entityType: data.entityType,
    entityId: data.entityId,
    entityName: data.entityName,
    userId: data.userId,
    userName: data.userName,
    description: data.description,
    metadata: data.metadata,
    createdAt: convertTimestamp(data.createdAt),
  };
};

export const activityService = {
  async log(
    activity: Omit<ActivityLog, 'id' | 'createdAt'>
  ): Promise<string> {
    const collectionRef = collection(db, COLLECTION_NAME);
    const docRef = await addDoc(collectionRef, {
      ...activity,
      createdAt: serverTimestamp(),
    });
    return docRef.id;
  },

  async getAll(
    filters?: ActivityLogFilters,
    pageSize: number = 50,
    lastDoc?: QueryDocumentSnapshot<DocumentData>
  ): Promise<{ logs: ActivityLog[]; lastDoc: QueryDocumentSnapshot<DocumentData> | null }> {
    const collectionRef = collection(db, COLLECTION_NAME);
    const constraints: any[] = [];

    if (filters?.entityType) {
      constraints.push(where('entityType', '==', filters.entityType));
    }
    if (filters?.entityId) {
      constraints.push(where('entityId', '==', filters.entityId));
    }
    if (filters?.userId) {
      constraints.push(where('userId', '==', filters.userId));
    }
    if (filters?.type && filters.type.length > 0) {
      constraints.push(where('type', 'in', filters.type));
    }
    if (filters?.startDate) {
      constraints.push(where('createdAt', '>=', Timestamp.fromDate(filters.startDate)));
    }
    if (filters?.endDate) {
      constraints.push(where('createdAt', '<=', Timestamp.fromDate(filters.endDate)));
    }

    constraints.push(orderBy('createdAt', 'desc'));

    if (lastDoc) {
      constraints.push(startAfter(lastDoc));
    }
    constraints.push(limit(pageSize));

    const q = query(collectionRef, ...constraints);
    const snapshot = await getDocs(q);

    const logs = snapshot.docs.map(mapActivityFromFirestore);
    const newLastDoc = snapshot.docs.length > 0 ? snapshot.docs[snapshot.docs.length - 1] : null;

    return { logs, lastDoc: newLastDoc };
  },

  async getByEntity(
    entityType: string,
    entityId: string,
    pageSize: number = 20
  ): Promise<ActivityLog[]> {
    const { logs } = await this.getAll({ entityType, entityId }, pageSize);
    return logs;
  },

  async getByUser(userId: string, pageSize: number = 50): Promise<ActivityLog[]> {
    const { logs } = await this.getAll({ userId }, pageSize);
    return logs;
  },

  // Helper methods for common activity logging
  async logProjectActivity(
    type: ActivityType,
    projectId: string,
    projectName: string,
    userId: string,
    userName: string,
    metadata?: Record<string, any>
  ): Promise<string> {
    const descriptions: Record<string, string> = {
      project_created: `${userName} created project "${projectName}"`,
      project_updated: `${userName} updated project "${projectName}"`,
      project_deleted: `${userName} deleted project "${projectName}"`,
      project_status_changed: `${userName} changed status of project "${projectName}" to ${metadata?.newStatus}`,
    };

    return this.log({
      type,
      entityType: 'project',
      entityId: projectId,
      entityName: projectName,
      userId,
      userName,
      description: descriptions[type] || `${userName} performed ${type} on project "${projectName}"`,
      metadata,
    });
  },

  async logTicketActivity(
    type: ActivityType,
    ticketId: string,
    ticketNumber: string,
    userId: string,
    userName: string,
    metadata?: Record<string, any>
  ): Promise<string> {
    const descriptions: Record<string, string> = {
      ticket_created: `${userName} created ticket ${ticketNumber}`,
      ticket_updated: `${userName} updated ticket ${ticketNumber}`,
      ticket_deleted: `${userName} deleted ticket ${ticketNumber}`,
      ticket_status_changed: `${userName} changed status of ticket ${ticketNumber} to ${metadata?.newStatus}`,
      ticket_assigned: `${userName} assigned ticket ${ticketNumber} to ${metadata?.assigneeName}`,
      ticket_comment_added: `${userName} added a comment to ticket ${ticketNumber}`,
    };

    return this.log({
      type,
      entityType: 'ticket',
      entityId: ticketId,
      entityName: ticketNumber,
      userId,
      userName,
      description: descriptions[type] || `${userName} performed ${type} on ticket ${ticketNumber}`,
      metadata,
    });
  },

  async logInvoiceActivity(
    type: ActivityType,
    invoiceId: string,
    invoiceNumber: string,
    userId: string,
    userName: string,
    metadata?: Record<string, any>
  ): Promise<string> {
    const descriptions: Record<string, string> = {
      invoice_created: `${userName} created invoice ${invoiceNumber}`,
      invoice_updated: `${userName} updated invoice ${invoiceNumber}`,
      invoice_sent: `${userName} sent invoice ${invoiceNumber} to client`,
      invoice_paid: `Invoice ${invoiceNumber} marked as paid`,
    };

    return this.log({
      type,
      entityType: 'invoice',
      entityId: invoiceId,
      entityName: invoiceNumber,
      userId,
      userName,
      description: descriptions[type] || `${userName} performed ${type} on invoice ${invoiceNumber}`,
      metadata,
    });
  },

  async logQuotationActivity(
    type: ActivityType,
    quotationId: string,
    quotationNumber: string,
    userId: string,
    userName: string,
    metadata?: Record<string, any>
  ): Promise<string> {
    const descriptions: Record<string, string> = {
      quotation_created: `${userName} created quotation ${quotationNumber}`,
      quotation_updated: `${userName} updated quotation ${quotationNumber}`,
      quotation_sent: `${userName} sent quotation ${quotationNumber} to client`,
      quotation_approved: `Quotation ${quotationNumber} was approved`,
      quotation_rejected: `Quotation ${quotationNumber} was rejected`,
    };

    return this.log({
      type,
      entityType: 'quotation',
      entityId: quotationId,
      entityName: quotationNumber,
      userId,
      userName,
      description: descriptions[type] || `${userName} performed ${type} on quotation ${quotationNumber}`,
      metadata,
    });
  },
};

export default activityService;
