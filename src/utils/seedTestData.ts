/**
 * Seed test data utility for verifying financial calculations
 * on Project Detail Page and Expense List Page.
 *
 * Creates a test project with:
 * - 2 invoices (revenue)
 * - 6 expenses across different statuses (draft, submitted, approved, rejected)
 * - 2 payments
 *
 * Expected financial results:
 * ─────────────────────────────────────────────
 * Budget:              ₹10,00,000
 * Revenue (invoices):  ₹3,50,000 + ₹2,00,000 = ₹5,50,000
 * Expenses:
 *   Approved:          ₹50,000 + ₹80,000 = ₹1,30,000
 *   Submitted:         ₹25,000 + ₹45,000 = ₹70,000
 *   Draft:             ₹15,000
 *   Rejected:          ₹60,000  (excluded from totals)
 *   Total (non-rej):   ₹1,30,000 + ₹70,000 + ₹15,000 = ₹2,15,000
 * Profit/Loss:         ₹5,50,000 - ₹2,15,000 = ₹3,35,000
 * Profit Margin:       (3,35,000 / 5,50,000) * 100 = 60.9%
 * Budget Utilization:  (2,15,000 / 10,00,000) * 100 = 21.5%
 * Payments:            ₹1,50,000 + ₹50,000 = ₹2,00,000
 * Outstanding:         ₹5,50,000 - ₹2,00,000 = ₹3,50,000
 * ─────────────────────────────────────────────
 */

import {
  collection,
  doc,
  setDoc,
  serverTimestamp,
  Timestamp,
  deleteDoc,
  getDocs,
  query,
  where,
} from 'firebase/firestore';
import { db } from '../config/firebase';

const TEST_PROJECT_ID = 'test-financial-project-001';
const TEST_PREFIX = 'TEST-FIN';

const now = new Date();
const startDate = new Date(now.getFullYear(), now.getMonth() - 2, 1);
const endDate = new Date(now.getFullYear(), now.getMonth() + 4, 1);

const testProject = {
  name: '[TEST] Villa Renovation - Financial Verification',
  description: 'Test project to verify financial calculations across expenses, invoices, and payments.',
  clientName: 'Test Client - Ravi Kumar',
  clientContact: '9876543210',
  clientEmail: 'test@example.com',
  clientAddress: 'Chennai, Tamil Nadu',
  location: 'ECR Road, Chennai',
  budget: 1000000, // ₹10,00,000
  startDate: Timestamp.fromDate(startDate),
  endDate: Timestamp.fromDate(endDate),
  status: 'active',
  progress: 35,
  createdBy: 'seed-script',
  assignedUsers: ['seed-script'],
  createdAt: serverTimestamp(),
  updatedAt: serverTimestamp(),
  tags: ['test', 'financial-verification'],
};

const businessDetails = {
  companyName: 'VBM Interior',
  address: 'Chennai, TN',
  phone: '9876543210',
  email: 'info@vbminterior.com',
};

const clientDetails = {
  name: 'Test Client - Ravi Kumar',
  address: 'Chennai, Tamil Nadu',
  phone: '9876543210',
  email: 'test@example.com',
};

// 2 Invoices: total revenue = ₹5,50,000
const testInvoices = [
  {
    id: `${TEST_PREFIX}-INV-001`,
    invoiceNumber: `${TEST_PREFIX}-INV-001`,
    projectId: TEST_PROJECT_ID,
    businessDetails,
    clientDetails,
    lineItems: [
      { id: 'li-1', name: 'Interior Design Work', quantity: 1, unitPrice: 350000, total: 350000 },
    ],
    financialSummary: {
      subtotal: 350000,
      grandTotal: 350000, // ₹3,50,000
    },
    issueDate: Timestamp.fromDate(new Date(now.getFullYear(), now.getMonth() - 1, 15)),
    dueDate: Timestamp.fromDate(new Date(now.getFullYear(), now.getMonth(), 15)),
    status: 'sent',
    createdBy: 'seed-script',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  },
  {
    id: `${TEST_PREFIX}-INV-002`,
    invoiceNumber: `${TEST_PREFIX}-INV-002`,
    projectId: TEST_PROJECT_ID,
    businessDetails,
    clientDetails,
    lineItems: [
      { id: 'li-2', name: 'Furniture & Materials', quantity: 1, unitPrice: 200000, total: 200000 },
    ],
    financialSummary: {
      subtotal: 200000,
      grandTotal: 200000, // ₹2,00,000
    },
    issueDate: Timestamp.fromDate(new Date(now.getFullYear(), now.getMonth(), 1)),
    dueDate: Timestamp.fromDate(new Date(now.getFullYear(), now.getMonth() + 1, 1)),
    status: 'sent',
    createdBy: 'seed-script',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  },
];

// 6 Expenses across all statuses
const testExpenses = [
  // APPROVED expenses: ₹50,000 + ₹80,000 = ₹1,30,000
  {
    id: `${TEST_PREFIX}-EXP-001`,
    expenseNumber: `${TEST_PREFIX}-EXP-001`,
    projectId: TEST_PROJECT_ID,
    projectName: testProject.name,
    category: 'materials',
    description: 'Cement & Steel - Approved',
    amount: 45000,
    taxAmount: 5000,
    totalAmount: 50000, // ₹50,000
    expenseDate: Timestamp.fromDate(new Date(now.getFullYear(), now.getMonth() - 1, 10)),
    vendorName: 'ABC Materials',
    paymentMethod: 'bank_transfer',
    paymentStatus: 'paid',
    status: 'approved',
    approvedBy: 'seed-script',
    approvedAt: Timestamp.fromDate(new Date(now.getFullYear(), now.getMonth() - 1, 12)),
    createdBy: 'seed-script',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  },
  {
    id: `${TEST_PREFIX}-EXP-002`,
    expenseNumber: `${TEST_PREFIX}-EXP-002`,
    projectId: TEST_PROJECT_ID,
    projectName: testProject.name,
    category: 'labor',
    description: 'Carpenter Labor - Approved',
    amount: 75000,
    taxAmount: 5000,
    totalAmount: 80000, // ₹80,000
    expenseDate: Timestamp.fromDate(new Date(now.getFullYear(), now.getMonth() - 1, 20)),
    vendorName: 'Kumar Carpentry',
    paymentMethod: 'cash',
    paymentStatus: 'paid',
    status: 'approved',
    approvedBy: 'seed-script',
    approvedAt: Timestamp.fromDate(new Date(now.getFullYear(), now.getMonth() - 1, 22)),
    createdBy: 'seed-script',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  },
  // SUBMITTED (pending) expenses: ₹25,000 + ₹45,000 = ₹70,000
  {
    id: `${TEST_PREFIX}-EXP-003`,
    expenseNumber: `${TEST_PREFIX}-EXP-003`,
    projectId: TEST_PROJECT_ID,
    projectName: testProject.name,
    category: 'transport',
    description: 'Material Transport - Pending Approval',
    amount: 23000,
    taxAmount: 2000,
    totalAmount: 25000, // ₹25,000
    expenseDate: Timestamp.fromDate(new Date(now.getFullYear(), now.getMonth(), 5)),
    vendorName: 'Fast Logistics',
    paymentMethod: 'upi',
    paymentStatus: 'paid',
    status: 'submitted',
    createdBy: 'seed-script',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  },
  {
    id: `${TEST_PREFIX}-EXP-004`,
    expenseNumber: `${TEST_PREFIX}-EXP-004`,
    projectId: TEST_PROJECT_ID,
    projectName: testProject.name,
    category: 'equipment',
    description: 'Equipment Rental - Pending Approval',
    amount: 40000,
    taxAmount: 5000,
    totalAmount: 45000, // ₹45,000
    expenseDate: Timestamp.fromDate(new Date(now.getFullYear(), now.getMonth(), 8)),
    vendorName: 'Rental Hub',
    paymentMethod: 'cheque',
    paymentStatus: 'pending',
    status: 'submitted',
    createdBy: 'seed-script',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  },
  // DRAFT expense: ₹15,000
  {
    id: `${TEST_PREFIX}-EXP-005`,
    expenseNumber: `${TEST_PREFIX}-EXP-005`,
    projectId: TEST_PROJECT_ID,
    projectName: testProject.name,
    category: 'utilities',
    description: 'Electricity Bill - Draft',
    amount: 14000,
    taxAmount: 1000,
    totalAmount: 15000, // ₹15,000
    expenseDate: Timestamp.fromDate(new Date(now.getFullYear(), now.getMonth(), 10)),
    paymentMethod: 'cash',
    paymentStatus: 'pending',
    status: 'draft',
    createdBy: 'seed-script',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  },
  // REJECTED expense: ₹60,000 (should be excluded from totals)
  {
    id: `${TEST_PREFIX}-EXP-006`,
    expenseNumber: `${TEST_PREFIX}-EXP-006`,
    projectId: TEST_PROJECT_ID,
    projectName: testProject.name,
    category: 'professional_fees',
    description: 'Consultant Fee - REJECTED (should NOT count)',
    amount: 55000,
    taxAmount: 5000,
    totalAmount: 60000, // ₹60,000
    expenseDate: Timestamp.fromDate(new Date(now.getFullYear(), now.getMonth(), 3)),
    vendorName: 'XYZ Consulting',
    paymentMethod: 'bank_transfer',
    paymentStatus: 'pending',
    status: 'rejected',
    createdBy: 'seed-script',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  },
];

// 2 Payments: total = ₹2,00,000
const testPayments = [
  {
    id: `${TEST_PREFIX}-PAY-001`,
    paymentNumber: `${TEST_PREFIX}-PAY-001`,
    invoiceId: `${TEST_PREFIX}-INV-001`,
    invoiceNumber: `${TEST_PREFIX}-INV-001`,
    clientId: 'test-client-001',
    clientName: 'Test Client - Ravi Kumar',
    projectId: TEST_PROJECT_ID,
    projectName: testProject.name,
    amount: 150000, // ₹1,50,000
    paymentDate: Timestamp.fromDate(new Date(now.getFullYear(), now.getMonth() - 1, 25)),
    paymentMethod: 'bank_transfer',
    referenceNumber: 'REF-TEST-001',
    notes: 'Partial payment for INV-001',
    receivedBy: 'seed-script',
    createdBy: 'seed-script',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  },
  {
    id: `${TEST_PREFIX}-PAY-002`,
    paymentNumber: `${TEST_PREFIX}-PAY-002`,
    invoiceId: `${TEST_PREFIX}-INV-002`,
    invoiceNumber: `${TEST_PREFIX}-INV-002`,
    clientId: 'test-client-001',
    clientName: 'Test Client - Ravi Kumar',
    projectId: TEST_PROJECT_ID,
    projectName: testProject.name,
    amount: 50000, // ₹50,000
    paymentDate: Timestamp.fromDate(new Date(now.getFullYear(), now.getMonth(), 5)),
    paymentMethod: 'upi',
    referenceNumber: 'REF-TEST-002',
    notes: 'Advance payment for INV-002',
    receivedBy: 'seed-script',
    createdBy: 'seed-script',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  },
];

export const expectedResults = {
  budget: 1000000,
  totalRevenue: 550000,
  approvedExpenses: 130000,
  pendingExpenses: 70000,
  draftExpenses: 15000,
  rejectedExpenses: 60000,
  totalExpenses: 215000, // approved + pending + draft (non-rejected)
  profitLoss: 335000, // 550000 - 215000
  profitMargin: 60.9, // (335000 / 550000) * 100
  budgetUtilization: 21.5, // (215000 / 1000000) * 100
  totalPayments: 200000,
  outstandingAmount: 350000, // 550000 - 200000
  expensesByCategory: [
    { category: 'labor', total: 80000, count: 1 },
    { category: 'materials', total: 50000, count: 1 },
    { category: 'equipment', total: 45000, count: 1 },
    { category: 'transport', total: 25000, count: 1 },
    { category: 'utilities', total: 15000, count: 1 },
  ],
};

export const TEST_PROJECT_ID_VALUE = TEST_PROJECT_ID;

export async function seedTestData(): Promise<string> {
  // Create project
  await setDoc(doc(db, 'projects', TEST_PROJECT_ID), testProject);

  // Create invoices
  for (const invoice of testInvoices) {
    const { id, ...data } = invoice;
    await setDoc(doc(db, 'invoices', id), data);
  }

  // Create expenses
  for (const expense of testExpenses) {
    const { id, ...data } = expense;
    await setDoc(doc(db, 'expenses', id), data);
  }

  // Create payments
  for (const payment of testPayments) {
    const { id, ...data } = payment;
    await setDoc(doc(db, 'payments', id), data);
  }

  return TEST_PROJECT_ID;
}

export async function cleanupTestData(): Promise<void> {
  // Delete project
  await deleteDoc(doc(db, 'projects', TEST_PROJECT_ID));

  // Delete invoices
  for (const invoice of testInvoices) {
    await deleteDoc(doc(db, 'invoices', invoice.id));
  }

  // Delete expenses
  for (const expense of testExpenses) {
    await deleteDoc(doc(db, 'expenses', expense.id));
  }

  // Delete payments
  for (const payment of testPayments) {
    await deleteDoc(doc(db, 'payments', payment.id));
  }
}
