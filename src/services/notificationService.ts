import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  writeBatch,
  getCountFromServer,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import type { Notification, NotificationType } from '../types';

const COLLECTION_NAME = 'notifications';

export interface CreateNotificationInput {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, string>;
}

export const notificationService = {
  // Create a single notification
  async create(input: CreateNotificationInput): Promise<string> {
    const collectionRef = collection(db, COLLECTION_NAME);
    const docRef = await addDoc(collectionRef, {
      ...input,
      isRead: false,
      createdAt: serverTimestamp(),
    });
    return docRef.id;
  },

  // Create notifications for multiple users
  async createForUsers(
    userIds: string[],
    notification: Omit<CreateNotificationInput, 'userId'>
  ): Promise<void> {
    if (userIds.length === 0) return;

    const batch = writeBatch(db);
    const collectionRef = collection(db, COLLECTION_NAME);

    userIds.forEach((userId) => {
      const docRef = doc(collectionRef);
      batch.set(docRef, {
        ...notification,
        userId,
        isRead: false,
        createdAt: serverTimestamp(),
      });
    });

    await batch.commit();
  },

  // Mark a notification as read
  async markAsRead(notificationId: string): Promise<void> {
    const docRef = doc(db, COLLECTION_NAME, notificationId);
    await updateDoc(docRef, {
      isRead: true,
    });
  },

  // Mark all notifications as read for a user
  async markAllAsRead(userId: string): Promise<void> {
    const collectionRef = collection(db, COLLECTION_NAME);
    const q = query(
      collectionRef,
      where('userId', '==', userId),
      where('isRead', '==', false)
    );
    const snapshot = await getDocs(q);

    if (snapshot.empty) return;

    const batch = writeBatch(db);
    snapshot.docs.forEach((doc) => {
      batch.update(doc.ref, { isRead: true });
    });

    await batch.commit();
  },

  // Delete a notification
  async delete(notificationId: string): Promise<void> {
    const docRef = doc(db, COLLECTION_NAME, notificationId);
    await deleteDoc(docRef);
  },

  // Delete all notifications for a user
  async deleteAllForUser(userId: string): Promise<void> {
    const collectionRef = collection(db, COLLECTION_NAME);
    const q = query(collectionRef, where('userId', '==', userId));
    const snapshot = await getDocs(q);

    if (snapshot.empty) return;

    const batch = writeBatch(db);
    snapshot.docs.forEach((doc) => {
      batch.delete(doc.ref);
    });

    await batch.commit();
  },

  // Get unread count for a user
  async getUnreadCount(userId: string): Promise<number> {
    const collectionRef = collection(db, COLLECTION_NAME);
    const q = query(
      collectionRef,
      where('userId', '==', userId),
      where('isRead', '==', false)
    );
    const snapshot = await getCountFromServer(q);
    return snapshot.data().count;
  },

  // Get notifications for a user
  async getForUser(
    userId: string,
    limitCount: number = 50
  ): Promise<Notification[]> {
    const collectionRef = collection(db, COLLECTION_NAME);
    const q = query(
      collectionRef,
      where('userId', '==', userId),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );
    const snapshot = await getDocs(q);

    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date(),
    })) as Notification[];
  },

  // Notification creation helpers for specific events
  notifyTicketAssigned(
    assignedUserIds: string[],
    ticketId: string,
    ticketTitle: string,
    assignedByName: string
  ): Promise<void> {
    return this.createForUsers(assignedUserIds, {
      type: 'ticket_assigned',
      title: 'New ticket assigned',
      message: `${assignedByName} assigned you to "${ticketTitle}"`,
      data: { ticketId },
    });
  },

  notifyTicketStatusChanged(
    userIds: string[],
    ticketId: string,
    ticketTitle: string,
    newStatus: string,
    changedByName: string
  ): Promise<void> {
    const statusLabels: Record<string, string> = {
      open: 'Open',
      in_progress: 'In Progress',
      pending: 'Pending',
      resolved: 'Resolved',
      closed: 'Closed',
    };

    return this.createForUsers(userIds, {
      type: 'ticket_status_changed',
      title: 'Ticket status updated',
      message: `${changedByName} changed "${ticketTitle}" to ${statusLabels[newStatus] || newStatus}`,
      data: { ticketId, status: newStatus },
    });
  },

  notifyTicketComment(
    userIds: string[],
    ticketId: string,
    ticketTitle: string,
    commenterName: string
  ): Promise<void> {
    return this.createForUsers(userIds, {
      type: 'ticket_comment',
      title: 'New comment on ticket',
      message: `${commenterName} commented on "${ticketTitle}"`,
      data: { ticketId },
    });
  },

  notifyInvoiceGenerated(
    userId: string,
    invoiceId: string,
    invoiceNumber: string,
    amount: string
  ): Promise<void> {
    return this.create({
      userId,
      type: 'invoice_generated',
      title: 'Invoice generated',
      message: `Invoice ${invoiceNumber} for ${amount} has been generated`,
      data: { invoiceId, invoiceNumber },
    }).then(() => undefined);
  },

  notifyInvoiceOverdue(
    userId: string,
    invoiceId: string,
    invoiceNumber: string,
    daysOverdue: number
  ): Promise<void> {
    return this.create({
      userId,
      type: 'invoice_overdue',
      title: 'Invoice overdue',
      message: `Invoice ${invoiceNumber} is overdue by ${daysOverdue} day${daysOverdue > 1 ? 's' : ''}`,
      data: { invoiceId, invoiceNumber },
    }).then(() => undefined);
  },

  notifyQuotationApproved(
    userId: string,
    quotationId: string,
    quotationNumber: string,
    clientName: string
  ): Promise<void> {
    return this.create({
      userId,
      type: 'quotation_approved',
      title: 'Quotation approved',
      message: `${clientName} has approved quotation ${quotationNumber}`,
      data: { quotationId, quotationNumber },
    }).then(() => undefined);
  },

  notifyQuotationRejected(
    userId: string,
    quotationId: string,
    quotationNumber: string,
    clientName: string
  ): Promise<void> {
    return this.create({
      userId,
      type: 'quotation_rejected',
      title: 'Quotation rejected',
      message: `${clientName} has rejected quotation ${quotationNumber}`,
      data: { quotationId, quotationNumber },
    }).then(() => undefined);
  },

  notifyProjectDeadline(
    userIds: string[],
    projectId: string,
    projectName: string,
    daysRemaining: number
  ): Promise<void> {
    return this.createForUsers(userIds, {
      type: 'project_deadline',
      title: 'Project deadline approaching',
      message: `${projectName} is due in ${daysRemaining} day${daysRemaining > 1 ? 's' : ''}`,
      data: { projectId },
    });
  },
};

export default notificationService;
