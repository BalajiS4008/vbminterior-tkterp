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
  Timestamp,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import type {
  Expense,
  ExpenseCategory,
  ExpenseFilters,
} from '../types';

const COLLECTION_NAME = 'expenses';

// Generate expense number
const getNextExpenseNumber = async (): Promise<string> => {
  const year = new Date().getFullYear();
  const prefix = `EXP-${year}-`;

  const expensesRef = collection(db, COLLECTION_NAME);
  const q = query(
    expensesRef,
    where('expenseNumber', '>=', prefix),
    where('expenseNumber', '<=', prefix + '\uf8ff'),
    orderBy('expenseNumber', 'desc'),
    limit(1)
  );

  const snapshot = await getDocs(q);

  if (snapshot.empty) {
    return `${prefix}0001`;
  }

  const lastExpense = snapshot.docs[0].data();
  const lastNumber = parseInt(lastExpense.expenseNumber.split('-').pop() || '0', 10);
  return `${prefix}${String(lastNumber + 1).padStart(4, '0')}`;
};

// Convert Firestore document to Expense
const docToExpense = (doc: any): Expense => ({
  id: doc.id,
  ...doc.data(),
  expenseDate: doc.data().expenseDate?.toDate?.() || new Date(),
  approvedAt: doc.data().approvedAt?.toDate?.() || null,
  createdAt: doc.data().createdAt?.toDate?.() || new Date(),
  updatedAt: doc.data().updatedAt?.toDate?.() || new Date(),
});

// Convert Expense to Firestore document
const expenseToDoc = (expense: Partial<Expense>): Record<string, any> => {
  const data: Record<string, any> = { ...expense };

  // Convert Date objects to Timestamps
  if (expense.expenseDate) {
    data.expenseDate = Timestamp.fromDate(expense.expenseDate);
  }
  if (expense.approvedAt) {
    data.approvedAt = Timestamp.fromDate(expense.approvedAt);
  }

  // Remove undefined values
  Object.keys(data).forEach(key => {
    if (data[key] === undefined) {
      delete data[key];
    }
  });

  return data;
};

export const expenseService = {
  // Get all expenses with optional filters
  async getAll(
    filters?: ExpenseFilters
  ): Promise<{ expenses: Expense[]; total: number }> {
    const expensesRef = collection(db, COLLECTION_NAME);
    let q = query(expensesRef, orderBy('createdAt', 'desc'));

    // Apply filters
    if (filters?.projectId) {
      q = query(q, where('projectId', '==', filters.projectId));
    }
    if (filters?.category && filters.category.length > 0) {
      q = query(q, where('category', 'in', filters.category));
    }
    if (filters?.status && filters.status.length > 0) {
      q = query(q, where('status', 'in', filters.status));
    }
    if (filters?.paymentStatus && filters.paymentStatus.length > 0) {
      q = query(q, where('paymentStatus', 'in', filters.paymentStatus));
    }

    const snapshot = await getDocs(q);
    let expenses = snapshot.docs.map(docToExpense);

    // Apply date range filter (client-side for simplicity)
    if (filters?.dateRange) {
      const { start, end } = filters.dateRange;
      expenses = expenses.filter(
        expense =>
          expense.expenseDate >= start && expense.expenseDate <= end
      );
    }

    return {
      expenses,
      total: expenses.length,
    };
  },

  // Get expense by ID
  async getById(id: string): Promise<Expense | null> {
    const docRef = doc(db, COLLECTION_NAME, id);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return null;
    }

    return docToExpense(docSnap);
  },

  // Get expenses by project
  async getByProjectId(projectId: string): Promise<Expense[]> {
    const expensesRef = collection(db, COLLECTION_NAME);
    const q = query(
      expensesRef,
      where('projectId', '==', projectId),
      orderBy('expenseDate', 'desc')
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(docToExpense);
  },

  // Get expenses by category
  async getByCategory(category: ExpenseCategory): Promise<Expense[]> {
    const expensesRef = collection(db, COLLECTION_NAME);
    const q = query(
      expensesRef,
      where('category', '==', category),
      orderBy('expenseDate', 'desc')
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(docToExpense);
  },

  // Create new expense
  async create(
    expense: Omit<Expense, 'id' | 'expenseNumber' | 'createdAt' | 'updatedAt'>
  ): Promise<Expense> {
    const expenseNumber = await getNextExpenseNumber();

    const docData = {
      ...expenseToDoc(expense),
      expenseNumber,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    const docRef = await addDoc(collection(db, COLLECTION_NAME), docData);
    const newDoc = await getDoc(docRef);

    return docToExpense(newDoc);
  },

  // Update expense
  async update(
    id: string,
    updates: Partial<Expense>
  ): Promise<Expense> {
    const docRef = doc(db, COLLECTION_NAME, id);

    const updateData: Record<string, any> = {
      ...expenseToDoc(updates),
      updatedAt: serverTimestamp(),
    };

    // Remove id from updates
    delete updateData.id;

    await updateDoc(docRef, updateData);
    const updatedDoc = await getDoc(docRef);

    return docToExpense(updatedDoc);
  },

  // Delete expense
  async delete(id: string): Promise<void> {
    const docRef = doc(db, COLLECTION_NAME, id);
    await deleteDoc(docRef);
  },

  // Approve expense
  async approve(id: string, approverId: string): Promise<Expense> {
    return this.update(id, {
      status: 'approved',
      approvedBy: approverId,
      approvedAt: new Date(),
    });
  },

  // Reject expense
  async reject(id: string): Promise<Expense> {
    return this.update(id, {
      status: 'rejected',
    });
  },

  // Get total expenses by project
  async getTotalByProject(projectId: string): Promise<number> {
    const expenses = await this.getByProjectId(projectId);
    return expenses
      .filter(e => e.status === 'approved')
      .reduce((sum, e) => sum + e.totalAmount, 0);
  },

  // Get expense summary by category
  async getSummaryByCategory(
    projectId?: string
  ): Promise<Array<{ category: ExpenseCategory; total: number; count: number }>> {
    const { expenses } = await this.getAll(
      projectId ? { projectId } : undefined
    );

    const approvedExpenses = expenses.filter(e => e.status === 'approved');
    const categoryMap = new Map<ExpenseCategory, { total: number; count: number }>();

    approvedExpenses.forEach(expense => {
      const existing = categoryMap.get(expense.category) || { total: 0, count: 0 };
      categoryMap.set(expense.category, {
        total: existing.total + expense.totalAmount,
        count: existing.count + 1,
      });
    });

    return Array.from(categoryMap.entries()).map(([category, data]) => ({
      category,
      ...data,
    }));
  },

  // Get recent expenses
  async getRecentExpenses(limitCount: number = 10): Promise<Expense[]> {
    const expensesRef = collection(db, COLLECTION_NAME);
    const q = query(
      expensesRef,
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(docToExpense);
  },

  // Get expenses pending approval
  async getPendingApproval(): Promise<Expense[]> {
    const expensesRef = collection(db, COLLECTION_NAME);
    const q = query(
      expensesRef,
      where('status', '==', 'submitted'),
      orderBy('createdAt', 'desc')
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(docToExpense);
  },

  // Get expense statistics
  async getStatistics(
    projectId?: string,
    dateRange?: { start: Date; end: Date }
  ): Promise<{
    totalExpenses: number;
    totalAmount: number;
    pendingAmount: number;
    approvedAmount: number;
    byCategory: Array<{ category: ExpenseCategory; amount: number }>;
  }> {
    const { expenses } = await this.getAll(
      projectId || dateRange
        ? { projectId, dateRange }
        : undefined
    );

    const totalExpenses = expenses.length;
    const totalAmount = expenses.reduce((sum, e) => sum + e.totalAmount, 0);
    const pendingAmount = expenses
      .filter(e => e.status === 'submitted')
      .reduce((sum, e) => sum + e.totalAmount, 0);
    const approvedAmount = expenses
      .filter(e => e.status === 'approved')
      .reduce((sum, e) => sum + e.totalAmount, 0);

    // Group by category
    const categoryMap = new Map<ExpenseCategory, number>();
    expenses.forEach(expense => {
      const existing = categoryMap.get(expense.category) || 0;
      categoryMap.set(expense.category, existing + expense.totalAmount);
    });

    const byCategory = Array.from(categoryMap.entries()).map(([category, amount]) => ({
      category,
      amount,
    }));

    return {
      totalExpenses,
      totalAmount,
      pendingAmount,
      approvedAmount,
      byCategory,
    };
  },
};
