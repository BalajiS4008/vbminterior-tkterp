import { format } from 'date-fns';

/**
 * Generate a unique ticket number
 * Format: TKT-YYYYMM-XXXX (e.g., TKT-202412-0001)
 */
export const generateTicketNumber = (prefix: string, sequence: number): string => {
  const datePart = format(new Date(), 'yyyyMM');
  const sequencePart = sequence.toString().padStart(4, '0');
  return `${prefix}-${datePart}-${sequencePart}`;
};

/**
 * Generate a unique quotation number
 * Format: QT-YYYY-XXXX (e.g., QT-2024-0001)
 */
export const generateQuotationNumber = (prefix: string, sequence: number): string => {
  const year = format(new Date(), 'yyyy');
  const sequencePart = sequence.toString().padStart(4, '0');
  return `${prefix}-${year}-${sequencePart}`;
};

/**
 * Generate a unique invoice number
 * Format: INV-YYYY-XXXX (e.g., INV-2024-0001)
 */
export const generateInvoiceNumber = (prefix: string, sequence: number): string => {
  const year = format(new Date(), 'yyyy');
  const sequencePart = sequence.toString().padStart(4, '0');
  return `${prefix}-${year}-${sequencePart}`;
};

/**
 * Generate a random color for charts/avatars
 */
export const generateRandomColor = (): string => {
  const colors = [
    '#1976D2', '#388E3C', '#D32F2F', '#7B1FA2', '#1976D2',
    '#C2185B', '#512DA8', '#0097A7', '#00796B', '#689F38',
    '#FFA000', '#E64A19', '#5D4037', '#455A64', '#F57C00',
  ];
  return colors[Math.floor(Math.random() * colors.length)];
};

/**
 * Generate initials from name
 */
export const generateInitials = (name: string): string => {
  if (!name) return '?';
  const parts = name.trim().split(' ').filter(Boolean);
  if (parts.length === 1) {
    return parts[0].substring(0, 2).toUpperCase();
  }
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

/**
 * Generate a slug from text
 */
export const generateSlug = (text: string): string => {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

/**
 * Generate unique ID for line items
 */
export const generateLineItemId = (): string => {
  return `item-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};
