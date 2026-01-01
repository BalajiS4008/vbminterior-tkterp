import { useMemo } from 'react';
import { where, orderBy, limit } from 'firebase/firestore';
import type { QueryConstraint } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import { useRealtimeCollection, useRealtimeDocument } from './useRealtimeData';
import type { Project, Ticket, Quotation, Invoice } from '../types';

/**
 * Role-based data filtering hook
 *
 * - Admin/Supervisor/Worker: Full visibility to all data
 * - Client: Only sees projects where they are the client (clientId matches their userId)
 *           and related tickets, quotations, invoices
 */

// Project mapper function
const projectMapper = (doc: any): Project => ({
  ...doc,
  startDate: doc.startDate?.toDate() || new Date(),
  endDate: doc.endDate?.toDate() || new Date(),
  createdAt: doc.createdAt?.toDate() || new Date(),
  updatedAt: doc.updatedAt?.toDate() || new Date(),
});

// Ticket mapper function
const ticketMapper = (doc: any): Ticket => ({
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
});

// Quotation mapper function
const quotationMapper = (doc: any): Quotation => ({
  ...doc,
  issueDate: doc.issueDate?.toDate() || new Date(),
  expiryDate: doc.expiryDate?.toDate() || new Date(),
  createdAt: doc.createdAt?.toDate() || new Date(),
  updatedAt: doc.updatedAt?.toDate() || new Date(),
});

// Invoice mapper function
const invoiceMapper = (doc: any): Invoice => ({
  ...doc,
  issueDate: doc.issueDate?.toDate() || new Date(),
  dueDate: doc.dueDate?.toDate() || new Date(),
  paidDate: doc.paidDate?.toDate(),
  createdAt: doc.createdAt?.toDate() || new Date(),
  updatedAt: doc.updatedAt?.toDate() || new Date(),
});

/**
 * Hook for fetching projects with role-based filtering
 * Clients only see projects where they are assigned as the client
 */
export function useRoleBasedProjects(statuses?: string[]) {
  const { userData } = useAuth();
  const isClient = userData?.role === 'client';
  const userId = userData?.id;

  const statusesKey = statuses ? JSON.stringify(statuses.sort()) : '';

  const constraints = useMemo(() => {
    const result: QueryConstraint[] = [];

    // For clients, filter by clientId (they should only see their own projects)
    if (isClient && userId) {
      result.push(where('clientId', '==', userId));
    }

    if (statuses && statuses.length > 0) {
      result.push(where('status', 'in', statuses));
    }

    result.push(orderBy('createdAt', 'desc'));
    result.push(limit(50));

    return result;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isClient, userId, statusesKey]);

  return useRealtimeCollection<Project>('projects', constraints, projectMapper, true);
}

/**
 * Hook for fetching tickets with role-based filtering
 * Clients only see tickets for their projects
 */
export function useRoleBasedTickets(
  projectId?: string,
  assignedTo?: string,
  statuses?: string[]
) {
  const { userData } = useAuth();
  const isClient = userData?.role === 'client';
  const userId = userData?.id;

  const statusesKey = statuses ? JSON.stringify(statuses.sort()) : '';

  // For clients viewing tickets without a specific projectId,
  // we need to filter by projects they have access to
  // However, Firestore doesn't support joins, so we need to handle this differently
  // The simplest approach: clients must navigate through their projects to see tickets
  // OR we add a clientId field to tickets (denormalized)

  const constraints = useMemo(() => {
    const result: QueryConstraint[] = [];

    if (projectId) {
      result.push(where('projectId', '==', projectId));
    }

    // For clients without a projectId filter, they shouldn't see any tickets
    // They should navigate through their projects
    if (isClient && !projectId) {
      // Return empty result by using a condition that won't match
      // This prevents clients from seeing all tickets on the main tickets page
      result.push(where('clientId', '==', userId || 'no-match'));
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
  }, [projectId, assignedTo, statusesKey, isClient, userId]);

  return useRealtimeCollection<Ticket>('tickets', constraints, ticketMapper, true);
}

/**
 * Hook for fetching a single project with access check
 */
export function useRoleBasedProject(projectId: string | null) {
  const { userData } = useAuth();

  const { data, loading, error } = useRealtimeDocument<Project>(
    'projects',
    projectId,
    projectMapper
  );

  // For clients, verify they have access to this project
  const hasAccess = useMemo(() => {
    if (!userData || !data) return true; // Still loading or no data
    if (userData.role !== 'client') return true; // Non-clients have full access
    return data.clientId === userData.id;
  }, [userData, data]);

  return {
    data: hasAccess ? data : null,
    loading,
    error,
    hasAccess,
  };
}

/**
 * Hook for fetching quotations with role-based filtering
 */
export function useRoleBasedQuotations(projectId?: string) {
  const { userData } = useAuth();
  const isClient = userData?.role === 'client';
  const userId = userData?.id;

  const constraints = useMemo(() => {
    const result: QueryConstraint[] = [];

    if (projectId) {
      result.push(where('projectId', '==', projectId));
    }

    // For clients, filter by their clientId in the quotation
    if (isClient && userId) {
      result.push(where('clientDetails.clientId', '==', userId));
    }

    result.push(orderBy('createdAt', 'desc'));
    result.push(limit(50));

    return result;
  }, [projectId, isClient, userId]);

  return useRealtimeCollection<Quotation>('quotations', constraints, quotationMapper, true);
}

/**
 * Hook for fetching invoices with role-based filtering
 */
export function useRoleBasedInvoices(projectId?: string, statuses?: string[]) {
  const { userData } = useAuth();
  const isClient = userData?.role === 'client';
  const userId = userData?.id;

  const statusesKey = statuses ? JSON.stringify(statuses.sort()) : '';

  const constraints = useMemo(() => {
    const result: QueryConstraint[] = [];

    if (projectId) {
      result.push(where('projectId', '==', projectId));
    }

    // For clients, filter by their clientId in the invoice
    if (isClient && userId) {
      result.push(where('clientDetails.clientId', '==', userId));
    }

    if (statuses && statuses.length > 0) {
      result.push(where('status', 'in', statuses));
    }

    result.push(orderBy('createdAt', 'desc'));
    result.push(limit(50));

    return result;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId, isClient, userId, statusesKey]);

  return useRealtimeCollection<Invoice>('invoices', constraints, invoiceMapper, true);
}

/**
 * Hook for role-based dashboard stats
 */
export function useRoleBasedDashboardStats() {
  const { userData } = useAuth();
  const isClient = userData?.role === 'client';
  const userId = userData?.id;

  // For clients, get stats only for their projects
  const { data: projects } = useRoleBasedProjects();
  const { data: tickets } = useRoleBasedTickets();
  const { data: invoices } = useRoleBasedInvoices();

  const stats = useMemo(() => {
    return {
      totalProjects: projects.length,
      activeProjects: projects.filter(p => p.status === 'active' || p.status === 'in_progress').length,
      totalTickets: tickets.length,
      openTickets: tickets.filter(t => ['open', 'in_progress', 'pending'].includes(t.status)).length,
      resolvedTickets: tickets.filter(t => ['resolved', 'closed'].includes(t.status)).length,
      pendingInvoices: invoices.filter(i => i.status === 'sent' || i.status === 'overdue').length,
      totalRevenue: invoices.filter(i => i.status === 'paid').reduce((sum, i) => sum + (i.financialSummary?.grandTotal || 0), 0),
      overdueInvoices: invoices.filter(i => i.status === 'overdue').length,
    };
  }, [projects, tickets, invoices]);

  return {
    stats,
    loading: false,
    isClientView: isClient,
    userId,
  };
}

export default {
  useRoleBasedProjects,
  useRoleBasedTickets,
  useRoleBasedProject,
  useRoleBasedQuotations,
  useRoleBasedInvoices,
  useRoleBasedDashboardStats,
};
