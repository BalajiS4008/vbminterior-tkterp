import type { LineItem, FinancialSummary } from '../types';

/**
 * Calculate line item total
 */
export const calculateLineItemTotal = (quantity: number, unitPrice: number): number => {
  return Math.round(quantity * unitPrice * 100) / 100;
};

/**
 * Calculate subtotal from line items
 */
export const calculateSubtotal = (lineItems: LineItem[]): number => {
  return lineItems.reduce((sum, item) => sum + item.total, 0);
};

/**
 * Calculate discount amount
 */
export const calculateDiscount = (subtotal: number, discountPercent: number): number => {
  if (!discountPercent || discountPercent <= 0) return 0;
  return Math.round(subtotal * (discountPercent / 100) * 100) / 100;
};

/**
 * Calculate tax amount
 */
export const calculateTax = (
  subtotal: number,
  taxPercent: number,
  discountAmount: number = 0
): number => {
  if (!taxPercent || taxPercent <= 0) return 0;
  const taxableAmount = subtotal - discountAmount;
  return Math.round(taxableAmount * (taxPercent / 100) * 100) / 100;
};

/**
 * Calculate grand total
 */
export const calculateGrandTotal = (
  subtotal: number,
  discountAmount: number = 0,
  taxAmount: number = 0,
  additionalCharges: number = 0
): number => {
  return Math.round((subtotal - discountAmount + taxAmount + additionalCharges) * 100) / 100;
};

/**
 * Calculate complete financial summary
 */
export const calculateFinancialSummary = (
  lineItems: LineItem[],
  discountPercent?: number,
  taxPercent?: number,
  additionalCharges?: number
): FinancialSummary => {
  const subtotal = calculateSubtotal(lineItems);
  const discountAmount = discountPercent ? calculateDiscount(subtotal, discountPercent) : 0;
  const taxAmount = taxPercent ? calculateTax(subtotal, taxPercent, discountAmount) : 0;
  const grandTotal = calculateGrandTotal(subtotal, discountAmount, taxAmount, additionalCharges || 0);

  return {
    subtotal,
    discountPercent,
    discountAmount: discountAmount || undefined,
    taxPercent,
    taxAmount: taxAmount || undefined,
    additionalCharges,
    grandTotal,
  };
};

/**
 * Calculate project progress based on completed tickets
 */
export const calculateProjectProgress = (
  totalTickets: number,
  completedTickets: number
): number => {
  if (totalTickets === 0) return 0;
  return Math.round((completedTickets / totalTickets) * 100);
};

/**
 * Calculate days remaining until due date
 */
export const calculateDaysRemaining = (dueDate: Date): number => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(dueDate);
  due.setHours(0, 0, 0, 0);
  const diffTime = due.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

/**
 * Check if invoice is overdue
 */
export const isInvoiceOverdue = (dueDate: Date, status: string): boolean => {
  if (status === 'paid' || status === 'cancelled') return false;
  return calculateDaysRemaining(dueDate) < 0;
};
