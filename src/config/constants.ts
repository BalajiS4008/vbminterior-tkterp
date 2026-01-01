// Application Constants

export const APP_NAME = 'Construction Ticket Manager';
export const APP_VERSION = '1.0.0';

// Pagination
export const DEFAULT_PAGE_SIZE = 10;
export const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];

// File Upload
export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
export const ALLOWED_DOCUMENT_TYPES = ['application/pdf'];

// Date Formats
export const DATE_FORMAT = 'dd/MM/yyyy';
export const DATE_TIME_FORMAT = 'dd/MM/yyyy HH:mm';
export const API_DATE_FORMAT = 'yyyy-MM-dd';

// Currency
export const DEFAULT_CURRENCY = 'INR';
export const DEFAULT_CURRENCY_SYMBOL = '₹';

// Document Prefixes
export const DEFAULT_TICKET_PREFIX = 'TKT';
export const DEFAULT_QUOTATION_PREFIX = 'QT';
export const DEFAULT_INVOICE_PREFIX = 'INV';

// Status Colors
export const PROJECT_STATUS_COLORS = {
  planning: '#2196F3',
  active: '#4CAF50',
  in_progress: '#FF9800',
  on_hold: '#9E9E9E',
  completed: '#4CAF50',
  cancelled: '#F44336',
} as const;

export const TICKET_STATUS_COLORS = {
  open: '#2196F3',
  in_progress: '#FF9800',
  pending: '#9C27B0',
  resolved: '#4CAF50',
  closed: '#607D8B',
} as const;

export const TICKET_PRIORITY_COLORS = {
  low: '#8BC34A',
  medium: '#FFC107',
  high: '#FF9800',
  critical: '#F44336',
} as const;

export const DOCUMENT_STATUS_COLORS = {
  draft: '#9E9E9E',
  sent: '#2196F3',
  approved: '#4CAF50',
  rejected: '#F44336',
  paid: '#4CAF50',
  cancelled: '#607D8B',
  overdue: '#FF5722',
} as const;

// Ticket Categories
export const TICKET_CATEGORIES = [
  { value: 'electrical', labelEn: 'Electrical', labelTa: 'மின்சாரம்' },
  { value: 'plumbing', labelEn: 'Plumbing', labelTa: 'குழாய் வேலை' },
  { value: 'carpentry', labelEn: 'Carpentry', labelTa: 'தச்சு வேலை' },
  { value: 'painting', labelEn: 'Painting', labelTa: 'வர்ணம் பூசுதல்' },
  { value: 'flooring', labelEn: 'Flooring', labelTa: 'தரை அமைப்பு' },
  { value: 'roofing', labelEn: 'Roofing', labelTa: 'கூரை வேலை' },
  { value: 'hvac', labelEn: 'HVAC', labelTa: 'குளிரூட்டல்' },
  { value: 'masonry', labelEn: 'Masonry', labelTa: 'கற்றளை வேலை' },
  { value: 'general', labelEn: 'General', labelTa: 'பொது' },
  { value: 'other', labelEn: 'Other', labelTa: 'மற்றவை' },
] as const;

// Priority Options
export const PRIORITY_OPTIONS = [
  { value: 'low', labelEn: 'Low', labelTa: 'குறைவு' },
  { value: 'medium', labelEn: 'Medium', labelTa: 'நடுத்தரம்' },
  { value: 'high', labelEn: 'High', labelTa: 'உயர்வு' },
  { value: 'critical', labelEn: 'Critical', labelTa: 'அவசரம்' },
] as const;

// Status Options
export const TICKET_STATUS_OPTIONS = [
  { value: 'open', labelEn: 'Open', labelTa: 'திறந்தது' },
  { value: 'in_progress', labelEn: 'In Progress', labelTa: 'நடைபெறுகிறது' },
  { value: 'pending', labelEn: 'Pending', labelTa: 'நிலுவையில்' },
  { value: 'resolved', labelEn: 'Resolved', labelTa: 'தீர்வு' },
  { value: 'closed', labelEn: 'Closed', labelTa: 'மூடப்பட்டது' },
] as const;

export const PROJECT_STATUS_OPTIONS = [
  { value: 'planning', labelEn: 'Planning', labelTa: 'திட்டமிடல்' },
  { value: 'active', labelEn: 'Active', labelTa: 'செயலில்' },
  { value: 'in_progress', labelEn: 'In Progress', labelTa: 'நடைபெறுகிறது' },
  { value: 'on_hold', labelEn: 'On Hold', labelTa: 'நிறுத்தி வைக்கப்பட்டது' },
  { value: 'completed', labelEn: 'Completed', labelTa: 'நிறைவு' },
  { value: 'cancelled', labelEn: 'Cancelled', labelTa: 'ரத்து' },
] as const;

export const INVOICE_STATUS_OPTIONS = [
  { value: 'draft', labelEn: 'Draft', labelTa: 'வரைவு' },
  { value: 'sent', labelEn: 'Sent', labelTa: 'அனுப்பப்பட்டது' },
  { value: 'paid', labelEn: 'Paid', labelTa: 'செலுத்தப்பட்டது' },
  { value: 'overdue', labelEn: 'Overdue', labelTa: 'தாமதமானது' },
  { value: 'cancelled', labelEn: 'Cancelled', labelTa: 'ரத்து' },
] as const;

export const QUOTATION_STATUS_OPTIONS = [
  { value: 'draft', labelEn: 'Draft', labelTa: 'வரைவு' },
  { value: 'sent', labelEn: 'Sent', labelTa: 'அனுப்பப்பட்டது' },
  { value: 'approved', labelEn: 'Approved', labelTa: 'ஒப்புதல்' },
  { value: 'rejected', labelEn: 'Rejected', labelTa: 'நிராகரிக்கப்பட்டது' },
  { value: 'expired', labelEn: 'Expired', labelTa: 'காலாவதி' },
] as const;

export const PAYMENT_TERMS_OPTIONS = [
  { value: 'immediate', label: 'Immediate' },
  { value: 'net15', label: 'Net 15 Days' },
  { value: 'net30', label: 'Net 30 Days' },
  { value: 'net45', label: 'Net 45 Days' },
  { value: 'net60', label: 'Net 60 Days' },
  { value: 'custom', label: 'Custom' },
] as const;

// Payment Method Options
export const PAYMENT_METHOD_OPTIONS = [
  { value: 'cash', labelEn: 'Cash', labelTa: 'பணம்' },
  { value: 'cheque', labelEn: 'Cheque', labelTa: 'காசோலை' },
  { value: 'bank_transfer', labelEn: 'Bank Transfer', labelTa: 'வங்கி பரிமாற்றம்' },
  { value: 'upi', labelEn: 'UPI', labelTa: 'UPI' },
  { value: 'card', labelEn: 'Card', labelTa: 'அட்டை' },
  { value: 'other', labelEn: 'Other', labelTa: 'மற்றவை' },
] as const;

export const PAYMENT_STATUS_COLORS = {
  unpaid: '#F44336',
  partial: '#FF9800',
  paid: '#4CAF50',
  overpaid: '#2196F3',
} as const;

// Expense Category Options
export const EXPENSE_CATEGORY_OPTIONS = [
  { value: 'materials', labelEn: 'Materials', labelTa: 'பொருட்கள்' },
  { value: 'labor', labelEn: 'Labor', labelTa: 'உழைப்பு' },
  { value: 'equipment', labelEn: 'Equipment', labelTa: 'உபகரணங்கள்' },
  { value: 'transport', labelEn: 'Transport', labelTa: 'போக்குவரத்து' },
  { value: 'utilities', labelEn: 'Utilities', labelTa: 'பயன்பாடுகள்' },
  { value: 'office', labelEn: 'Office', labelTa: 'அலுவலகம்' },
  { value: 'professional_fees', labelEn: 'Professional Fees', labelTa: 'தொழில்முறை கட்டணம்' },
  { value: 'permits', labelEn: 'Permits', labelTa: 'அனுமதிகள்' },
  { value: 'insurance', labelEn: 'Insurance', labelTa: 'காப்பீடு' },
  { value: 'other', labelEn: 'Other', labelTa: 'மற்றவை' },
] as const;

export const EXPENSE_STATUS_OPTIONS = [
  { value: 'draft', labelEn: 'Draft', labelTa: 'வரைவு' },
  { value: 'submitted', labelEn: 'Submitted', labelTa: 'சமர்ப்பிக்கப்பட்டது' },
  { value: 'approved', labelEn: 'Approved', labelTa: 'ஒப்புதல்' },
  { value: 'rejected', labelEn: 'Rejected', labelTa: 'நிராகரிக்கப்பட்டது' },
] as const;

// Routes
export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  FORGOT_PASSWORD: '/forgot-password',
  DASHBOARD: '/dashboard',
  PROJECTS: '/projects',
  PROJECT_DETAIL: '/projects/:id',
  PROJECT_CREATE: '/projects/new',
  PROJECT_EDIT: '/projects/:id/edit',
  TICKETS: '/tickets',
  TICKET_DETAIL: '/tickets/:id',
  TICKET_CREATE: '/tickets/new',
  TICKET_EDIT: '/tickets/:id/edit',
  TICKET_KANBAN: '/tickets/kanban',
  CLIENTS: '/clients',
  CLIENT_DETAIL: '/clients/:id',
  CLIENT_CREATE: '/clients/new',
  CLIENT_EDIT: '/clients/:id/edit',
  QUOTATIONS: '/quotations',
  QUOTATION_DETAIL: '/quotations/:id',
  QUOTATION_CREATE: '/quotations/new',
  QUOTATION_EDIT: '/quotations/:id/edit',
  INVOICES: '/invoices',
  INVOICE_DETAIL: '/invoices/:id',
  INVOICE_CREATE: '/invoices/new',
  INVOICE_EDIT: '/invoices/:id/edit',
  PAYMENTS: '/payments',
  PAYMENT_DETAIL: '/payments/:id',
  PAYMENT_CREATE: '/payments/new',
  EXPENSES: '/expenses',
  EXPENSE_DETAIL: '/expenses/:id',
  EXPENSE_CREATE: '/expenses/new',
  EXPENSE_EDIT: '/expenses/:id/edit',
  TIMESHEET: '/timesheet',
  TIMESHEET_ENTRY: '/timesheet/entry/:id',
  TIMESHEET_CREATE: '/timesheet/new',
  CALENDAR: '/calendar',
  REPORTS: '/reports',
  REPORTS_REVENUE: '/reports/revenue',
  REPORTS_EXPENSES: '/reports/expenses',
  REPORTS_PROFITABILITY: '/reports/profitability',
  REPORTS_TIME: '/reports/time',
  REPORTS_TICKETS: '/reports/tickets',
  SETTINGS: '/settings',
  SETTINGS_PROFILE: '/settings/profile',
  SETTINGS_USERS: '/settings/users',
  SETTINGS_ROLES: '/settings/roles',
  SETTINGS_INVOICE: '/settings/invoice',
  SETTINGS_TEMPLATES: '/settings/templates',
  NOTIFICATIONS: '/notifications',
} as const;

// Client Status Options
export const CLIENT_STATUS_OPTIONS = [
  { value: 'active', labelEn: 'Active', labelTa: 'செயலில்' },
  { value: 'inactive', labelEn: 'Inactive', labelTa: 'செயலற்ற' },
  { value: 'prospect', labelEn: 'Prospect', labelTa: 'வாய்ப்புள்ள' },
] as const;

export const CLIENT_STATUS_COLORS = {
  active: '#4CAF50',
  inactive: '#9E9E9E',
  prospect: '#2196F3',
} as const;

// Client Source Options
export const CLIENT_SOURCE_OPTIONS = [
  { value: 'referral', labelEn: 'Referral', labelTa: 'பரிந்துரை' },
  { value: 'website', labelEn: 'Website', labelTa: 'வலைத்தளம்' },
  { value: 'advertisement', labelEn: 'Advertisement', labelTa: 'விளம்பரம்' },
  { value: 'walk-in', labelEn: 'Walk-in', labelTa: 'நேரடி வருகை' },
  { value: 'other', labelEn: 'Other', labelTa: 'மற்றவை' },
] as const;

// Local Storage Keys
export const STORAGE_KEYS = {
  AUTH_TOKEN: 'auth_token',
  USER_LANGUAGE: 'user_language',
  THEME_MODE: 'theme_mode',
} as const;
