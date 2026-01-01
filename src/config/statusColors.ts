// Centralized status and priority colors for consistency across the app

export const TICKET_STATUS_COLORS: Record<string, string> = {
  open: '#2196F3',
  in_progress: '#FF9800',
  pending: '#9C27B0',
  resolved: '#4CAF50',
  closed: '#607D8B',
};

export const TICKET_PRIORITY_COLORS: Record<string, string> = {
  low: '#4CAF50',
  medium: '#FF9800',
  high: '#f44336',
  critical: '#9C27B0',
};

export const PROJECT_STATUS_COLORS: Record<string, string> = {
  planning: '#9E9E9E',
  active: '#2196F3',
  in_progress: '#FF9800',
  on_hold: '#F44336',
  completed: '#4CAF50',
  cancelled: '#607D8B',
};

export const INVOICE_STATUS_COLORS: Record<string, string> = {
  draft: '#9E9E9E',
  sent: '#2196F3',
  paid: '#4CAF50',
  partial: '#FF9800',
  overdue: '#F44336',
  cancelled: '#607D8B',
};

export const QUOTATION_STATUS_COLORS: Record<string, string> = {
  draft: '#9E9E9E',
  sent: '#2196F3',
  approved: '#4CAF50',
  rejected: '#F44336',
  expired: '#FF9800',
};

export const PAYMENT_METHOD_COLORS: Record<string, string> = {
  cash: '#4CAF50',
  cheque: '#FF9800',
  bank_transfer: '#2196F3',
  upi: '#9C27B0',
  card: '#00BCD4',
  other: '#607D8B',
};

export const EXPENSE_STATUS_COLORS: Record<string, string> = {
  draft: '#9E9E9E',
  submitted: '#FF9800',
  approved: '#4CAF50',
  rejected: '#F44336',
};

export const EXPENSE_CATEGORY_COLORS: Record<string, string> = {
  materials: '#1976D2',
  labor: '#388E3C',
  equipment: '#F57C00',
  transport: '#7B1FA2',
  permits: '#C2185B',
  utilities: '#00796B',
  subcontractor: '#5D4037',
  office: '#455A64',
  travel: '#0097A7',
  miscellaneous: '#616161',
};

export const TIME_ENTRY_STATUS_COLORS: Record<string, string> = {
  running: '#FF9800',
  completed: '#4CAF50',
  approved: '#2196F3',
};

export const CLIENT_STATUS_COLORS: Record<string, string> = {
  active: '#4CAF50',
  inactive: '#9E9E9E',
  prospect: '#FF9800',
};

// Calendar event type colors
export const CALENDAR_EVENT_COLORS: Record<string, string> = {
  ticket_due: '#F44336',
  project_milestone: '#2196F3',
  invoice_due: '#FF9800',
  payment_reminder: '#4CAF50',
  meeting: '#9C27B0',
  task: '#00BCD4',
  custom: '#607D8B',
};

// Utility function to get color with alpha
export const withAlpha = (color: string, alpha: number): string => {
  // Convert hex to rgba
  const hex = color.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};
