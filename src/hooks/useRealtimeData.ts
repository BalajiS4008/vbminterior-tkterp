import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
  collection,
  doc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
} from 'firebase/firestore';
import type { QueryConstraint, DocumentData, Unsubscribe } from 'firebase/firestore';
import { db } from '../config/firebase';
import type { Notification } from '../types';

// Utility to create a stable key from constraints
function createConstraintKey(constraints: QueryConstraint[]): string {
  // QueryConstraint.type and internal properties can help create a stable key
  return constraints.map((c, i) => {
    // Use JSON stringify of the constraint's internal structure
    // The constraint object has type property and internal _field, _value, etc.
    try {
      return JSON.stringify(c);
    } catch {
      return `constraint-${i}`;
    }
  }).join('|');
}

// Generic hook for real-time collection data
export function useRealtimeCollection<T>(
  collectionName: string,
  constraints: QueryConstraint[] = [],
  mapper: (doc: DocumentData) => T,
  enabled: boolean = true
) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Use refs to store mapper and constraints to avoid including them in deps
  const mapperRef = useRef(mapper);
  mapperRef.current = mapper;

  const constraintsRef = useRef(constraints);
  constraintsRef.current = constraints;

  // Create a stable constraint key for dependency tracking
  const constraintKey = useMemo(() => createConstraintKey(constraints), [constraints]);

  useEffect(() => {
    if (!enabled) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const collectionRef = collection(db, collectionName);
    const currentConstraints = constraintsRef.current;
    const q = currentConstraints.length > 0
      ? query(collectionRef, ...currentConstraints)
      : query(collectionRef);

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const items = snapshot.docs.map((doc) => mapperRef.current({ id: doc.id, ...doc.data() }));
        setData(items);
        setLoading(false);
      },
      (err) => {
        console.error(`Error listening to ${collectionName}:`, err);
        setError(err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [collectionName, constraintKey, enabled]);

  return { data, loading, error };
}

// Generic hook for real-time single document
export function useRealtimeDocument<T>(
  collectionName: string,
  documentId: string | null,
  mapper: (doc: DocumentData) => T
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Use ref to store mapper to avoid including it in deps
  const mapperRef = useRef(mapper);
  mapperRef.current = mapper;

  useEffect(() => {
    if (!documentId) {
      setData(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const docRef = doc(db, collectionName, documentId);

    const unsubscribe = onSnapshot(
      docRef,
      (snapshot) => {
        if (snapshot.exists()) {
          setData(mapperRef.current({ id: snapshot.id, ...snapshot.data() }));
        } else {
          setData(null);
        }
        setLoading(false);
      },
      (err) => {
        console.error(`Error listening to ${collectionName}/${documentId}:`, err);
        setError(err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [collectionName, documentId]);

  return { data, loading, error };
}

// Projects real-time hook
export function useRealtimeProjects(userId?: string, statuses?: string[]) {
  // Serialize statuses for stable dependency comparison
  const statusesKey = statuses ? JSON.stringify(statuses.sort()) : '';

  const constraints = useMemo(() => {
    const result: QueryConstraint[] = [];

    if (userId) {
      result.push(where('assignedUsers', 'array-contains', userId));
    }
    if (statuses && statuses.length > 0) {
      result.push(where('status', 'in', statuses));
    }
    result.push(orderBy('createdAt', 'desc'));
    result.push(limit(50));

    return result;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, statusesKey]);

  const mapper = useCallback((doc: DocumentData) => ({
    ...doc,
    startDate: doc.startDate?.toDate() || new Date(),
    endDate: doc.endDate?.toDate() || new Date(),
    createdAt: doc.createdAt?.toDate() || new Date(),
    updatedAt: doc.updatedAt?.toDate() || new Date(),
  }), []);

  return useRealtimeCollection(
    'projects',
    constraints,
    mapper,
    true
  );
}

// Tickets real-time hook
export function useRealtimeTickets(
  projectId?: string,
  assignedTo?: string,
  statuses?: string[]
) {
  // Serialize statuses for stable dependency comparison
  const statusesKey = statuses ? JSON.stringify(statuses.sort()) : '';

  const constraints = useMemo(() => {
    const result: QueryConstraint[] = [];

    if (projectId) {
      result.push(where('projectId', '==', projectId));
    }
    if (assignedTo) {
      result.push(where('assignedTo', 'array-contains', assignedTo));
    }
    if (statuses && statuses.length > 0) {
      result.push(where('status', 'in', statuses));
    }
    result.push(orderBy('createdAt', 'desc'));
    result.push(limit(100));

    return result;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId, assignedTo, statusesKey]);

  const mapper = useCallback((doc: DocumentData) => ({
    ...doc,
    dueDate: doc.dueDate?.toDate(),
    createdAt: doc.createdAt?.toDate() || new Date(),
    updatedAt: doc.updatedAt?.toDate() || new Date(),
    resolvedAt: doc.resolvedAt?.toDate(),
    closedAt: doc.closedAt?.toDate(),
    attachments: (doc.attachments || []).map((att: any) => ({
      ...att,
      uploadedAt: att.uploadedAt?.toDate() || new Date(),
    })),
  }), []);

  return useRealtimeCollection(
    'tickets',
    constraints,
    mapper,
    true
  );
}

// Single ticket with comments
export function useRealtimeTicketWithComments(ticketId: string | null) {
  const [comments, setComments] = useState<any[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(true);

  const mapper = useCallback((doc: DocumentData) => ({
    ...doc,
    dueDate: doc.dueDate?.toDate(),
    createdAt: doc.createdAt?.toDate() || new Date(),
    updatedAt: doc.updatedAt?.toDate() || new Date(),
    resolvedAt: doc.resolvedAt?.toDate(),
    closedAt: doc.closedAt?.toDate(),
    attachments: (doc.attachments || []).map((att: any) => ({
      ...att,
      uploadedAt: att.uploadedAt?.toDate() || new Date(),
    })),
  }), []);

  const ticket = useRealtimeDocument('tickets', ticketId, mapper);

  useEffect(() => {
    if (!ticketId) {
      setComments([]);
      setCommentsLoading(false);
      return;
    }

    setCommentsLoading(true);

    const commentsRef = collection(db, 'ticket_comments');
    const q = query(
      commentsRef,
      where('ticketId', '==', ticketId),
      orderBy('createdAt', 'asc')
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const commentData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate() || new Date(),
        }));
        setComments(commentData);
        setCommentsLoading(false);
      },
      (err) => {
        console.error('Error listening to comments:', err);
        setCommentsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [ticketId]);

  return {
    ticket: ticket.data,
    ticketLoading: ticket.loading,
    ticketError: ticket.error,
    comments,
    commentsLoading,
  };
}

// Notifications real-time hook
export function useRealtimeNotifications(userId: string | null, unreadOnly: boolean = false) {
  const constraints = useMemo(() => {
    const result: QueryConstraint[] = [];

    if (userId) {
      result.push(where('userId', '==', userId));
    }
    if (unreadOnly) {
      result.push(where('isRead', '==', false));
    }
    result.push(orderBy('createdAt', 'desc'));
    result.push(limit(50));

    return result;
  }, [userId, unreadOnly]);

  const mapper = useCallback((doc: DocumentData): Notification => ({
    id: doc.id,
    userId: doc.userId,
    type: doc.type,
    title: doc.title,
    message: doc.message,
    data: doc.data,
    isRead: doc.isRead ?? false,
    createdAt: doc.createdAt?.toDate() || new Date(),
  }), []);

  return useRealtimeCollection<Notification>(
    'notifications',
    constraints,
    mapper,
    !!userId
  );
}

// Unread notification count hook
export function useUnreadNotificationCount(userId: string | null) {
  const { data, loading, error } = useRealtimeNotifications(userId, true);
  return { count: data.length, loading, error };
}

// Quotations real-time hook
export function useRealtimeQuotations(projectId?: string, clientId?: string) {
  const constraints = useMemo(() => {
    const result: QueryConstraint[] = [];

    if (projectId) {
      result.push(where('projectId', '==', projectId));
    }
    if (clientId) {
      result.push(where('clientId', '==', clientId));
    }
    result.push(orderBy('createdAt', 'desc'));
    result.push(limit(50));

    return result;
  }, [projectId, clientId]);

  const mapper = useCallback((doc: DocumentData) => ({
    ...doc,
    validUntil: doc.validUntil?.toDate() || new Date(),
    createdAt: doc.createdAt?.toDate() || new Date(),
    updatedAt: doc.updatedAt?.toDate() || new Date(),
  }), []);

  return useRealtimeCollection(
    'quotations',
    constraints,
    mapper,
    true
  );
}

// Invoices real-time hook
export function useRealtimeInvoices(projectId?: string, clientId?: string, statuses?: string[]) {
  // Serialize statuses for stable dependency comparison
  const statusesKey = statuses ? JSON.stringify(statuses.sort()) : '';

  const constraints = useMemo(() => {
    const result: QueryConstraint[] = [];

    if (projectId) {
      result.push(where('projectId', '==', projectId));
    }
    if (clientId) {
      result.push(where('clientId', '==', clientId));
    }
    if (statuses && statuses.length > 0) {
      result.push(where('status', 'in', statuses));
    }
    result.push(orderBy('createdAt', 'desc'));
    result.push(limit(50));

    return result;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId, clientId, statusesKey]);

  const mapper = useCallback((doc: DocumentData) => ({
    ...doc,
    issueDate: doc.issueDate?.toDate() || new Date(),
    dueDate: doc.dueDate?.toDate() || new Date(),
    paidDate: doc.paidDate?.toDate(),
    createdAt: doc.createdAt?.toDate() || new Date(),
    updatedAt: doc.updatedAt?.toDate() || new Date(),
  }), []);

  return useRealtimeCollection(
    'invoices',
    constraints,
    mapper,
    true
  );
}

// Dashboard stats real-time hook
export function useRealtimeDashboardStats(userId?: string, role?: string) {
  const [stats, setStats] = useState({
    totalProjects: 0,
    activeProjects: 0,
    totalTickets: 0,
    openTickets: 0,
    pendingInvoices: 0,
    overdueTickets: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Don't set up listeners until we have a valid userId (unless admin)
    if (!userId && role !== 'admin') {
      setLoading(false);
      return;
    }

    let cancelled = false;
    const unsubscribes: Unsubscribe[] = [];

    const handleError = (source: string) => (err: Error) => {
      console.error(`Error listening to ${source}:`, err);
      if (!cancelled) {
        setLoading(false);
      }
    };

    // Listen to projects
    const projectsRef = collection(db, 'projects');
    const projectsQuery = role === 'admin'
      ? query(projectsRef)
      : query(projectsRef, where('assignedUsers', 'array-contains', userId!));

    unsubscribes.push(
      onSnapshot(projectsQuery, (snapshot) => {
        if (cancelled) return;
        const projects = snapshot.docs.map(d => d.data());
        setStats(prev => ({
          ...prev,
          totalProjects: projects.length,
          activeProjects: projects.filter(p => p.status === 'active').length,
        }));
      }, handleError('projects'))
    );

    // Listen to tickets
    const ticketsRef = collection(db, 'tickets');
    const ticketsQuery = role === 'admin'
      ? query(ticketsRef)
      : query(ticketsRef, where('assignedTo', 'array-contains', userId!));

    unsubscribes.push(
      onSnapshot(ticketsQuery, (snapshot) => {
        if (cancelled) return;
        const tickets = snapshot.docs.map(d => d.data());
        const now = new Date();
        setStats(prev => ({
          ...prev,
          totalTickets: tickets.length,
          openTickets: tickets.filter(t =>
            ['open', 'in_progress', 'pending'].includes(t.status)
          ).length,
          overdueTickets: tickets.filter(t => {
            const dueDate = t.dueDate?.toDate();
            return dueDate && dueDate < now && !['resolved', 'closed'].includes(t.status);
          }).length,
        }));
      }, handleError('tickets'))
    );

    // Listen to invoices
    const invoicesRef = collection(db, 'invoices');
    unsubscribes.push(
      onSnapshot(query(invoicesRef, where('status', 'in', ['pending', 'overdue'])), (snapshot) => {
        if (cancelled) return;
        setStats(prev => ({
          ...prev,
          pendingInvoices: snapshot.docs.length,
        }));
      }, handleError('invoices'))
    );

    if (!cancelled) {
      setLoading(false);
    }

    return () => {
      cancelled = true;
      unsubscribes.forEach(unsub => unsub());
    };
  }, [userId, role]);

  return { stats, loading };
}

export default {
  useRealtimeCollection,
  useRealtimeDocument,
  useRealtimeProjects,
  useRealtimeTickets,
  useRealtimeTicketWithComments,
  useRealtimeNotifications,
  useUnreadNotificationCount,
  useRealtimeQuotations,
  useRealtimeInvoices,
  useRealtimeDashboardStats,
};
