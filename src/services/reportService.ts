import {
  collection,
  getDocs,
  query,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import type { Invoice, Payment, Expense, TimeEntry, Ticket } from '../types';

export interface DateRange {
  start: Date;
  end: Date;
}

export interface RevenueMetrics {
  totalRevenue: number;
  paidRevenue: number;
  pendingRevenue: number;
  overdueRevenue: number;
  revenueByMonth: { month: string; revenue: number; paid: number }[];
  revenueByProject: { projectId: string; projectName: string; revenue: number }[];
  revenueByClient: { clientId: string; clientName: string; revenue: number }[];
}

export interface ExpenseMetrics {
  totalExpenses: number;
  approvedExpenses: number;
  pendingExpenses: number;
  expensesByCategory: { category: string; amount: number }[];
  expensesByMonth: { month: string; amount: number }[];
  expensesByProject: { projectId: string; projectName: string; amount: number }[];
}

export interface ProfitabilityMetrics {
  totalRevenue: number;
  totalExpenses: number;
  grossProfit: number;
  profitMargin: number;
  profitByMonth: { month: string; revenue: number; expenses: number; profit: number }[];
  profitByProject: { projectId: string; projectName: string; revenue: number; expenses: number; profit: number }[];
}

export interface TimeMetrics {
  totalHours: number;
  billableHours: number;
  nonBillableHours: number;
  utilizationRate: number;
  hoursByProject: { projectId: string; projectName: string; hours: number; billableHours: number }[];
  hoursByUser: { userId: string; userName: string; hours: number; billableHours: number }[];
  hoursByMonth: { month: string; hours: number; billableHours: number }[];
}

export interface TicketMetrics {
  totalTickets: number;
  openTickets: number;
  closedTickets: number;
  avgResolutionTime: number;
  ticketsByStatus: { status: string; count: number }[];
  ticketsByPriority: { priority: string; count: number }[];
  ticketsByMonth: { month: string; created: number; resolved: number }[];
}

export interface DashboardSummary {
  revenue: {
    total: number;
    paid: number;
    pending: number;
    trend: number;
  };
  expenses: {
    total: number;
    approved: number;
    pending: number;
    trend: number;
  };
  profit: {
    gross: number;
    margin: number;
    trend: number;
  };
  time: {
    totalHours: number;
    billableHours: number;
    utilizationRate: number;
  };
  tickets: {
    open: number;
    closed: number;
    avgResolution: number;
  };
}

// Helper to get month key from date
const getMonthKey = (date: Date): string => {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
};

// Helper to format month key for display
const formatMonthKey = (key: string): string => {
  const [year, month] = key.split('-');
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${months[parseInt(month) - 1]} ${year}`;
};

// Helper to convert Firestore timestamp
const toDate = (value: any): Date => {
  if (!value) return new Date();
  if (value.toDate) return value.toDate();
  if (value instanceof Date) return value;
  return new Date(value);
};

export const reportService = {
  // Get dashboard summary
  async getDashboardSummary(dateRange: DateRange): Promise<DashboardSummary> {
    const [invoices, payments, expenses, timeEntries, tickets] = await Promise.all([
      this.fetchInvoices(dateRange),
      this.fetchPayments(dateRange),
      this.fetchExpenses(dateRange),
      this.fetchTimeEntries(dateRange),
      this.fetchTickets(dateRange),
    ]);

    // Calculate previous period for trends
    const periodLength = dateRange.end.getTime() - dateRange.start.getTime();
    const prevDateRange: DateRange = {
      start: new Date(dateRange.start.getTime() - periodLength),
      end: new Date(dateRange.start.getTime() - 1),
    };

    const [prevInvoices, prevExpenses] = await Promise.all([
      this.fetchInvoices(prevDateRange),
      this.fetchExpenses(prevDateRange),
    ]);

    // Revenue calculations
    const totalRevenue = invoices.reduce((sum, inv) => sum + (inv.financialSummary?.grandTotal || 0), 0);
    const paidRevenue = payments.reduce((sum, pay) => sum + (pay.amount || 0), 0);
    const pendingRevenue = invoices
      .filter(inv => inv.status === 'draft' || inv.status === 'sent')
      .reduce((sum, inv) => sum + (inv.financialSummary?.grandTotal || 0), 0);
    const prevRevenue = prevInvoices.reduce((sum, inv) => sum + (inv.financialSummary?.grandTotal || 0), 0);
    const revenueTrend = prevRevenue > 0 ? ((totalRevenue - prevRevenue) / prevRevenue) * 100 : 0;

    // Expense calculations
    const totalExpenses = expenses.reduce((sum, exp) => sum + (exp.amount || 0), 0);
    const approvedExpenses = expenses
      .filter(exp => exp.status === 'approved')
      .reduce((sum, exp) => sum + (exp.amount || 0), 0);
    const pendingExpenses = expenses
      .filter(exp => exp.status === 'submitted')
      .reduce((sum, exp) => sum + (exp.amount || 0), 0);
    const prevExpenseTotal = prevExpenses.reduce((sum, exp) => sum + (exp.amount || 0), 0);
    const expenseTrend = prevExpenseTotal > 0 ? ((totalExpenses - prevExpenseTotal) / prevExpenseTotal) * 100 : 0;

    // Profit calculations
    const grossProfit = totalRevenue - totalExpenses;
    const profitMargin = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;
    const prevProfit = prevRevenue - prevExpenseTotal;
    const profitTrend = prevProfit !== 0 ? ((grossProfit - prevProfit) / Math.abs(prevProfit)) * 100 : 0;

    // Time calculations
    const totalMinutes = timeEntries.reduce((sum, entry) => sum + (entry.duration || 0), 0);
    const billableMinutes = timeEntries
      .filter(entry => entry.billable)
      .reduce((sum, entry) => sum + (entry.duration || 0), 0);
    const totalHours = Math.round((totalMinutes / 60) * 100) / 100;
    const billableHours = Math.round((billableMinutes / 60) * 100) / 100;
    const utilizationRate = totalMinutes > 0 ? (billableMinutes / totalMinutes) * 100 : 0;

    // Ticket calculations
    const openTickets = tickets.filter(t => t.status !== 'closed' && t.status !== 'resolved').length;
    const closedTickets = tickets.filter(t => t.status === 'closed' || t.status === 'resolved').length;
    const resolvedTickets = tickets.filter(t => t.resolvedAt && t.createdAt);
    const avgResolution = resolvedTickets.length > 0
      ? resolvedTickets.reduce((sum, t) => {
          const created = toDate(t.createdAt).getTime();
          const resolved = toDate(t.resolvedAt).getTime();
          return sum + (resolved - created);
        }, 0) / resolvedTickets.length / (1000 * 60 * 60 * 24) // Convert to days
      : 0;

    return {
      revenue: {
        total: totalRevenue,
        paid: paidRevenue,
        pending: pendingRevenue,
        trend: Math.round(revenueTrend * 10) / 10,
      },
      expenses: {
        total: totalExpenses,
        approved: approvedExpenses,
        pending: pendingExpenses,
        trend: Math.round(expenseTrend * 10) / 10,
      },
      profit: {
        gross: grossProfit,
        margin: Math.round(profitMargin * 10) / 10,
        trend: Math.round(profitTrend * 10) / 10,
      },
      time: {
        totalHours,
        billableHours,
        utilizationRate: Math.round(utilizationRate * 10) / 10,
      },
      tickets: {
        open: openTickets,
        closed: closedTickets,
        avgResolution: Math.round(avgResolution * 10) / 10,
      },
    };
  },

  // Get revenue metrics
  async getRevenueMetrics(dateRange: DateRange): Promise<RevenueMetrics> {
    const [invoices, payments] = await Promise.all([
      this.fetchInvoices(dateRange),
      this.fetchPayments(dateRange),
    ]);

    const totalRevenue = invoices.reduce((sum, inv) => sum + (inv.financialSummary?.grandTotal || 0), 0);
    const paidRevenue = payments.reduce((sum, pay) => sum + (pay.amount || 0), 0);
    const pendingRevenue = invoices
      .filter(inv => inv.status === 'draft' || inv.status === 'sent')
      .reduce((sum, inv) => sum + (inv.financialSummary?.grandTotal || 0), 0);
    const overdueRevenue = invoices
      .filter(inv => inv.status === 'overdue')
      .reduce((sum, inv) => sum + (inv.financialSummary?.grandTotal || 0), 0);

    // Group by month
    const revenueByMonthMap = new Map<string, { revenue: number; paid: number }>();
    invoices.forEach(inv => {
      const monthKey = getMonthKey(toDate(inv.issueDate));
      const current = revenueByMonthMap.get(monthKey) || { revenue: 0, paid: 0 };
      current.revenue += inv.financialSummary?.grandTotal || 0;
      revenueByMonthMap.set(monthKey, current);
    });
    payments.forEach(pay => {
      const monthKey = getMonthKey(toDate(pay.paymentDate));
      const current = revenueByMonthMap.get(monthKey) || { revenue: 0, paid: 0 };
      current.paid += pay.amount || 0;
      revenueByMonthMap.set(monthKey, current);
    });

    const revenueByMonth = Array.from(revenueByMonthMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, data]) => ({
        month: formatMonthKey(month),
        revenue: data.revenue,
        paid: data.paid,
      }));

    // Group by project
    const revenueByProjectMap = new Map<string, { projectName: string; revenue: number }>();
    invoices.forEach(inv => {
      if (inv.projectId) {
        const current = revenueByProjectMap.get(inv.projectId) || {
          projectName: inv.clientDetails?.name || 'Unknown',
          revenue: 0
        };
        current.revenue += inv.financialSummary?.grandTotal || 0;
        revenueByProjectMap.set(inv.projectId, current);
      }
    });

    const revenueByProject = Array.from(revenueByProjectMap.entries())
      .map(([projectId, data]) => ({
        projectId,
        projectName: data.projectName,
        revenue: data.revenue,
      }))
      .sort((a, b) => b.revenue - a.revenue);

    // Group by client
    const revenueByClientMap = new Map<string, { clientName: string; revenue: number }>();
    invoices.forEach(inv => {
      if (inv.projectId) {
        const current = revenueByClientMap.get(inv.projectId) || {
          clientName: inv.clientDetails?.name || 'Unknown',
          revenue: 0
        };
        current.revenue += inv.financialSummary?.grandTotal || 0;
        revenueByClientMap.set(inv.projectId, current);
      }
    });

    const revenueByClient = Array.from(revenueByClientMap.entries())
      .map(([clientId, data]) => ({
        clientId,
        clientName: data.clientName,
        revenue: data.revenue,
      }))
      .sort((a, b) => b.revenue - a.revenue);

    return {
      totalRevenue,
      paidRevenue,
      pendingRevenue,
      overdueRevenue,
      revenueByMonth,
      revenueByProject,
      revenueByClient,
    };
  },

  // Get expense metrics
  async getExpenseMetrics(dateRange: DateRange): Promise<ExpenseMetrics> {
    const expenses = await this.fetchExpenses(dateRange);

    const totalExpenses = expenses.reduce((sum, exp) => sum + (exp.amount || 0), 0);
    const approvedExpenses = expenses
      .filter(exp => exp.status === 'approved')
      .reduce((sum, exp) => sum + (exp.amount || 0), 0);
    const pendingExpenses = expenses
      .filter(exp => exp.status === 'submitted')
      .reduce((sum, exp) => sum + (exp.amount || 0), 0);

    // Group by category
    const expensesByCategoryMap = new Map<string, number>();
    expenses.forEach(exp => {
      const category = exp.category || 'Other';
      const current = expensesByCategoryMap.get(category) || 0;
      expensesByCategoryMap.set(category, current + (exp.amount || 0));
    });

    const expensesByCategory = Array.from(expensesByCategoryMap.entries())
      .map(([category, amount]) => ({ category, amount }))
      .sort((a, b) => b.amount - a.amount);

    // Group by month
    const expensesByMonthMap = new Map<string, number>();
    expenses.forEach(exp => {
      const monthKey = getMonthKey(toDate(exp.expenseDate));
      const current = expensesByMonthMap.get(monthKey) || 0;
      expensesByMonthMap.set(monthKey, current + (exp.amount || 0));
    });

    const expensesByMonth = Array.from(expensesByMonthMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, amount]) => ({
        month: formatMonthKey(month),
        amount,
      }));

    // Group by project
    const expensesByProjectMap = new Map<string, { projectName: string; amount: number }>();
    expenses.forEach(exp => {
      if (exp.projectId) {
        const current = expensesByProjectMap.get(exp.projectId) || {
          projectName: exp.projectName || 'Unknown',
          amount: 0
        };
        current.amount += exp.amount || 0;
        expensesByProjectMap.set(exp.projectId, current);
      }
    });

    const expensesByProject = Array.from(expensesByProjectMap.entries())
      .map(([projectId, data]) => ({
        projectId,
        projectName: data.projectName,
        amount: data.amount,
      }))
      .sort((a, b) => b.amount - a.amount);

    return {
      totalExpenses,
      approvedExpenses,
      pendingExpenses,
      expensesByCategory,
      expensesByMonth,
      expensesByProject,
    };
  },

  // Get profitability metrics
  async getProfitabilityMetrics(dateRange: DateRange): Promise<ProfitabilityMetrics> {
    const [invoices, expenses] = await Promise.all([
      this.fetchInvoices(dateRange),
      this.fetchExpenses(dateRange),
    ]);

    const totalRevenue = invoices.reduce((sum, inv) => sum + (inv.financialSummary?.grandTotal || 0), 0);
    const totalExpenses = expenses.reduce((sum, exp) => sum + (exp.amount || 0), 0);
    const grossProfit = totalRevenue - totalExpenses;
    const profitMargin = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;

    // Group by month
    const profitByMonthMap = new Map<string, { revenue: number; expenses: number }>();
    invoices.forEach(inv => {
      const monthKey = getMonthKey(toDate(inv.issueDate));
      const current = profitByMonthMap.get(monthKey) || { revenue: 0, expenses: 0 };
      current.revenue += inv.financialSummary?.grandTotal || 0;
      profitByMonthMap.set(monthKey, current);
    });
    expenses.forEach(exp => {
      const monthKey = getMonthKey(toDate(exp.expenseDate));
      const current = profitByMonthMap.get(monthKey) || { revenue: 0, expenses: 0 };
      current.expenses += exp.amount || 0;
      profitByMonthMap.set(monthKey, current);
    });

    const profitByMonth = Array.from(profitByMonthMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, data]) => ({
        month: formatMonthKey(month),
        revenue: data.revenue,
        expenses: data.expenses,
        profit: data.revenue - data.expenses,
      }));

    // Group by project
    const profitByProjectMap = new Map<string, { projectName: string; revenue: number; expenses: number }>();
    invoices.forEach(inv => {
      if (inv.projectId) {
        const current = profitByProjectMap.get(inv.projectId) || {
          projectName: inv.clientDetails?.name || 'Unknown',
          revenue: 0,
          expenses: 0
        };
        current.revenue += inv.financialSummary?.grandTotal || 0;
        profitByProjectMap.set(inv.projectId, current);
      }
    });
    expenses.forEach(exp => {
      if (exp.projectId) {
        const current = profitByProjectMap.get(exp.projectId) || {
          projectName: exp.projectName || 'Unknown',
          revenue: 0,
          expenses: 0
        };
        current.expenses += exp.amount || 0;
        profitByProjectMap.set(exp.projectId, current);
      }
    });

    const profitByProject = Array.from(profitByProjectMap.entries())
      .map(([projectId, data]) => ({
        projectId,
        projectName: data.projectName,
        revenue: data.revenue,
        expenses: data.expenses,
        profit: data.revenue - data.expenses,
      }))
      .sort((a, b) => b.profit - a.profit);

    return {
      totalRevenue,
      totalExpenses,
      grossProfit,
      profitMargin: Math.round(profitMargin * 10) / 10,
      profitByMonth,
      profitByProject,
    };
  },

  // Get time metrics
  async getTimeMetrics(dateRange: DateRange): Promise<TimeMetrics> {
    const timeEntries = await this.fetchTimeEntries(dateRange);

    const totalMinutes = timeEntries.reduce((sum, entry) => sum + (entry.duration || 0), 0);
    const billableMinutes = timeEntries
      .filter(entry => entry.billable)
      .reduce((sum, entry) => sum + (entry.duration || 0), 0);
    const totalHours = Math.round((totalMinutes / 60) * 100) / 100;
    const billableHours = Math.round((billableMinutes / 60) * 100) / 100;
    const nonBillableHours = Math.round(((totalMinutes - billableMinutes) / 60) * 100) / 100;
    const utilizationRate = totalMinutes > 0 ? (billableMinutes / totalMinutes) * 100 : 0;

    // Group by project
    const hoursByProjectMap = new Map<string, { projectName: string; minutes: number; billableMinutes: number }>();
    timeEntries.forEach(entry => {
      if (entry.projectId) {
        const current = hoursByProjectMap.get(entry.projectId) || {
          projectName: entry.projectName || 'Unknown',
          minutes: 0,
          billableMinutes: 0
        };
        current.minutes += entry.duration || 0;
        if (entry.billable) {
          current.billableMinutes += entry.duration || 0;
        }
        hoursByProjectMap.set(entry.projectId, current);
      }
    });

    const hoursByProject = Array.from(hoursByProjectMap.entries())
      .map(([projectId, data]) => ({
        projectId,
        projectName: data.projectName,
        hours: Math.round((data.minutes / 60) * 100) / 100,
        billableHours: Math.round((data.billableMinutes / 60) * 100) / 100,
      }))
      .sort((a, b) => b.hours - a.hours);

    // Group by user
    const hoursByUserMap = new Map<string, { userName: string; minutes: number; billableMinutes: number }>();
    timeEntries.forEach(entry => {
      if (entry.userId) {
        const current = hoursByUserMap.get(entry.userId) || {
          userName: entry.userName || 'Unknown',
          minutes: 0,
          billableMinutes: 0
        };
        current.minutes += entry.duration || 0;
        if (entry.billable) {
          current.billableMinutes += entry.duration || 0;
        }
        hoursByUserMap.set(entry.userId, current);
      }
    });

    const hoursByUser = Array.from(hoursByUserMap.entries())
      .map(([userId, data]) => ({
        userId,
        userName: data.userName,
        hours: Math.round((data.minutes / 60) * 100) / 100,
        billableHours: Math.round((data.billableMinutes / 60) * 100) / 100,
      }))
      .sort((a, b) => b.hours - a.hours);

    // Group by month
    const hoursByMonthMap = new Map<string, { minutes: number; billableMinutes: number }>();
    timeEntries.forEach(entry => {
      const monthKey = getMonthKey(toDate(entry.date));
      const current = hoursByMonthMap.get(monthKey) || { minutes: 0, billableMinutes: 0 };
      current.minutes += entry.duration || 0;
      if (entry.billable) {
        current.billableMinutes += entry.duration || 0;
      }
      hoursByMonthMap.set(monthKey, current);
    });

    const hoursByMonth = Array.from(hoursByMonthMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, data]) => ({
        month: formatMonthKey(month),
        hours: Math.round((data.minutes / 60) * 100) / 100,
        billableHours: Math.round((data.billableMinutes / 60) * 100) / 100,
      }));

    return {
      totalHours,
      billableHours,
      nonBillableHours,
      utilizationRate: Math.round(utilizationRate * 10) / 10,
      hoursByProject,
      hoursByUser,
      hoursByMonth,
    };
  },

  // Get ticket metrics
  async getTicketMetrics(dateRange: DateRange): Promise<TicketMetrics> {
    const tickets = await this.fetchTickets(dateRange);

    const totalTickets = tickets.length;
    const openTickets = tickets.filter(t => t.status !== 'closed' && t.status !== 'resolved').length;
    const closedTickets = tickets.filter(t => t.status === 'closed' || t.status === 'resolved').length;

    // Calculate average resolution time
    const resolvedTickets = tickets.filter(t => t.resolvedAt && t.createdAt);
    const avgResolutionTime = resolvedTickets.length > 0
      ? resolvedTickets.reduce((sum, t) => {
          const created = toDate(t.createdAt).getTime();
          const resolved = toDate(t.resolvedAt).getTime();
          return sum + (resolved - created);
        }, 0) / resolvedTickets.length / (1000 * 60 * 60 * 24)
      : 0;

    // Group by status
    const ticketsByStatusMap = new Map<string, number>();
    tickets.forEach(t => {
      const count = ticketsByStatusMap.get(t.status) || 0;
      ticketsByStatusMap.set(t.status, count + 1);
    });

    const ticketsByStatus = Array.from(ticketsByStatusMap.entries())
      .map(([status, count]) => ({ status, count }));

    // Group by priority
    const ticketsByPriorityMap = new Map<string, number>();
    tickets.forEach(t => {
      const count = ticketsByPriorityMap.get(t.priority) || 0;
      ticketsByPriorityMap.set(t.priority, count + 1);
    });

    const ticketsByPriority = Array.from(ticketsByPriorityMap.entries())
      .map(([priority, count]) => ({ priority, count }));

    // Group by month
    const ticketsByMonthMap = new Map<string, { created: number; resolved: number }>();
    tickets.forEach(t => {
      const monthKey = getMonthKey(toDate(t.createdAt));
      const current = ticketsByMonthMap.get(monthKey) || { created: 0, resolved: 0 };
      current.created += 1;
      ticketsByMonthMap.set(monthKey, current);

      if (t.resolvedAt) {
        const resolvedMonthKey = getMonthKey(toDate(t.resolvedAt));
        const resolvedCurrent = ticketsByMonthMap.get(resolvedMonthKey) || { created: 0, resolved: 0 };
        resolvedCurrent.resolved += 1;
        ticketsByMonthMap.set(resolvedMonthKey, resolvedCurrent);
      }
    });

    const ticketsByMonth = Array.from(ticketsByMonthMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, data]) => ({
        month: formatMonthKey(month),
        created: data.created,
        resolved: data.resolved,
      }));

    return {
      totalTickets,
      openTickets,
      closedTickets,
      avgResolutionTime: Math.round(avgResolutionTime * 10) / 10,
      ticketsByStatus,
      ticketsByPriority,
      ticketsByMonth,
    };
  },

  // Helper: Fetch invoices for date range
  async fetchInvoices(dateRange: DateRange): Promise<Invoice[]> {
    try {
      const q = query(collection(db, 'invoices'));
      const snapshot = await getDocs(q);
      return snapshot.docs
        .map(d => ({ ...d.data(), id: d.id } as Invoice))
        .filter(inv => {
          const date = toDate(inv.issueDate);
          return date >= dateRange.start && date <= dateRange.end;
        });
    } catch (error) {
      console.error('Error fetching invoices:', error);
      return [];
    }
  },

  // Helper: Fetch payments for date range
  async fetchPayments(dateRange: DateRange): Promise<Payment[]> {
    try {
      const q = query(collection(db, 'payments'));
      const snapshot = await getDocs(q);
      return snapshot.docs
        .map(d => ({ ...d.data(), id: d.id } as Payment))
        .filter(pay => {
          const date = toDate(pay.paymentDate);
          return date >= dateRange.start && date <= dateRange.end;
        });
    } catch (error) {
      console.error('Error fetching payments:', error);
      return [];
    }
  },

  // Helper: Fetch expenses for date range
  async fetchExpenses(dateRange: DateRange): Promise<Expense[]> {
    try {
      const q = query(collection(db, 'expenses'));
      const snapshot = await getDocs(q);
      return snapshot.docs
        .map(d => ({ ...d.data(), id: d.id } as Expense))
        .filter(exp => {
          const date = toDate(exp.expenseDate);
          return date >= dateRange.start && date <= dateRange.end;
        });
    } catch (error) {
      console.error('Error fetching expenses:', error);
      return [];
    }
  },

  // Helper: Fetch time entries for date range
  async fetchTimeEntries(dateRange: DateRange): Promise<TimeEntry[]> {
    try {
      const q = query(collection(db, 'timeEntries'));
      const snapshot = await getDocs(q);
      return snapshot.docs
        .map(d => ({ ...d.data(), id: d.id } as TimeEntry))
        .filter(entry => {
          const date = toDate(entry.date);
          return date >= dateRange.start && date <= dateRange.end;
        });
    } catch (error) {
      console.error('Error fetching time entries:', error);
      return [];
    }
  },

  // Helper: Fetch tickets for date range
  async fetchTickets(dateRange: DateRange): Promise<Ticket[]> {
    try {
      const q = query(collection(db, 'tickets'));
      const snapshot = await getDocs(q);
      return snapshot.docs
        .map(d => ({ ...d.data(), id: d.id } as Ticket))
        .filter(ticket => {
          const date = toDate(ticket.createdAt);
          return date >= dateRange.start && date <= dateRange.end;
        });
    } catch (error) {
      console.error('Error fetching tickets:', error);
      return [];
    }
  },
};

export default reportService;
