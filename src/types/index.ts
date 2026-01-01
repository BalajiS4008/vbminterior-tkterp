// ============================================
// Construction Ticket Management App - Types
// ============================================

// User & Role Types
export type UserRole = 'admin' | 'supervisor' | 'worker' | 'client';

export interface User {
  id: string;
  email: string;
  displayName: string;
  phone?: string;
  role: UserRole;
  permissions: Permission[];
  // Custom permission modifications (added/removed from role defaults)
  customPermissions?: {
    additions: Permission[];  // Permissions added beyond role defaults
    removals: Permission[];   // Permissions removed from role defaults
  };
  language: 'en' | 'ta';
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
  avatarUrl?: string;
}

export interface RolePermissions {
  role: UserRole;
  permissions: Permission[];
}

export type Permission =
  | 'projects.create'
  | 'projects.edit'
  | 'projects.delete'
  | 'projects.view'
  | 'tickets.create'
  | 'tickets.edit'
  | 'tickets.delete'
  | 'tickets.view'
  | 'tickets.assign'
  | 'media.upload'
  | 'media.delete'
  | 'quotations.create'
  | 'quotations.edit'
  | 'quotations.delete'
  | 'quotations.view'
  | 'invoices.create'
  | 'invoices.edit'
  | 'invoices.delete'
  | 'invoices.view'
  | 'invoices.download'
  | 'users.manage'
  | 'settings.manage'
  | 'reports.view';

// Client Types
export type ClientStatus = 'active' | 'inactive' | 'prospect';
export type ClientSource = 'referral' | 'website' | 'advertisement' | 'walk-in' | 'other';

export interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  alternatePhone?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  gstNumber?: string;
  panNumber?: string;
  contactPerson?: string;
  contactPersonPhone?: string;
  notes?: string;
  tags?: string[];
  source?: ClientSource;
  status: ClientStatus;
  totalProjects: number;
  totalRevenue: number;
  outstandingAmount: number;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ClientFilters {
  status?: ClientStatus[];
  source?: ClientSource[];
  searchQuery?: string;
}

// Project Types
export type ProjectStatus = 'planning' | 'active' | 'in_progress' | 'on_hold' | 'completed' | 'cancelled';

export interface Project {
  id: string;
  name: string;
  description: string;
  clientId?: string;
  clientName: string;
  clientContact?: string;
  clientEmail?: string;
  clientAddress?: string;
  location: string;
  budget: number;
  startDate: Date;
  endDate: Date;
  status: ProjectStatus;
  progress: number; // 0-100
  createdBy: string;
  assignedUsers: string[];
  createdAt: Date;
  updatedAt: Date;
  tags?: string[];
}

// Ticket Types
export type TicketStatus = 'open' | 'in_progress' | 'pending' | 'resolved' | 'closed';
export type TicketPriority = 'low' | 'medium' | 'high' | 'critical';
export type TicketCategory =
  | 'electrical'
  | 'plumbing'
  | 'carpentry'
  | 'painting'
  | 'flooring'
  | 'roofing'
  | 'hvac'
  | 'masonry'
  | 'general'
  | 'other';

export interface Ticket {
  id: string;
  ticketNumber: string; // e.g., "TKT-001"
  title: string;
  description: string;
  projectId: string;
  projectName?: string;
  location: string; // Area within project
  category: TicketCategory;
  priority: TicketPriority;
  status: TicketStatus;
  assignedTo: string[];
  dueDate?: Date;
  attachments: Attachment[];
  tags?: string[];
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  resolvedAt?: Date;
  closedAt?: Date;
}

export interface TicketComment {
  id: string;
  ticketId: string;
  userId: string;
  userName: string;
  content: string;
  attachments?: Attachment[];
  createdAt: Date;
}

export interface Attachment {
  id: string;
  name: string;
  url: string;
  type: 'image' | 'pdf' | 'document';
  size: number;
  uploadedBy: string;
  uploadedAt: Date;
}

// Quotation & Invoice Types
export type DocumentStatus = 'draft' | 'sent' | 'approved' | 'rejected' | 'paid' | 'cancelled' | 'overdue';
export type DocumentType = 'quotation' | 'invoice';
export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
export type QuotationStatus = 'draft' | 'sent' | 'approved' | 'rejected' | 'expired';

export interface LineItem {
  id: string;
  name: string;
  description?: string;
  quantity: number;
  unitPrice: number;
  unit?: string;
  total: number;
}

export interface BusinessDetails {
  companyName: string;
  address: string;
  phone: string;
  email: string;
  gstNumber?: string;
  logoUrl?: string;
}

export interface ClientDetails {
  name: string;
  address: string;
  phone?: string;
  email?: string;
  gstNumber?: string;
}

export interface FinancialSummary {
  subtotal: number;
  discountPercent?: number;
  discountAmount?: number;
  taxPercent?: number;
  taxAmount?: number;
  additionalCharges?: number;
  additionalChargesDescription?: string;
  grandTotal: number;
}

export interface Quotation {
  id: string;
  quotationNumber: string; // e.g., "QT-2024-001"
  projectId: string;
  businessDetails: BusinessDetails;
  clientDetails: ClientDetails;
  lineItems: LineItem[];
  financialSummary: FinancialSummary;
  issueDate: Date;
  expiryDate: Date;
  status: DocumentStatus;
  notes?: string;
  termsAndConditions?: string;
  templateId?: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Invoice {
  id: string;
  invoiceNumber: string; // e.g., "INV-2024-001"
  quotationId?: string; // Optional link to quotation
  projectId: string;
  ticketIds?: string[]; // Optional links to tickets
  businessDetails: BusinessDetails;
  clientDetails: ClientDetails;
  lineItems: LineItem[];
  financialSummary: FinancialSummary;
  issueDate: Date;
  dueDate: Date;
  paidDate?: Date;
  status: DocumentStatus;
  notes?: string;
  termsAndConditions?: string;
  templateId?: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

// Invoice Template Types
export type TemplateLayout = 'modern' | 'classic' | 'minimal';

export interface InvoiceTemplate {
  id: string;
  name: string;
  layout: TemplateLayout;
  primaryColor: string;
  secondaryColor: string;
  fontFamily: string;
  logoPosition: 'left' | 'center' | 'right';
  showGst: boolean;
  showDiscount: boolean;
  showAdditionalCharges: boolean;
  customFields?: { label: string; value: string }[];
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Notification Types
export type NotificationType =
  | 'ticket_assigned'
  | 'ticket_status_changed'
  | 'ticket_comment'
  | 'project_deadline'
  | 'invoice_generated'
  | 'invoice_overdue'
  | 'quotation_approved'
  | 'quotation_rejected';

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, string>;
  isRead: boolean;
  createdAt: Date;
}

// Settings Types
export interface AppSettings {
  id: string;
  businessDetails: BusinessDetails;
  currency: string;
  currencySymbol: string;
  defaultLanguage: 'en' | 'ta';
  enableTax: boolean;
  defaultTaxPercent: number;
  enableDiscount: boolean;
  enableAdditionalCharges: boolean;
  quotationPrefix: string;
  invoicePrefix: string;
  ticketPrefix: string;
  defaultPaymentTerms: number; // Days
  termsAndConditions: string;
}

// Activity Log Types
export interface ActivityLog {
  id: string;
  userId: string;
  userName: string;
  action: string;
  entityType: 'project' | 'ticket' | 'quotation' | 'invoice' | 'user';
  entityId: string;
  details?: string;
  createdAt: Date;
}

// Filter & Pagination Types
export interface PaginationParams {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface TicketFilters {
  projectId?: string;
  status?: TicketStatus[];
  priority?: TicketPriority[];
  category?: TicketCategory[];
  assignedTo?: string;
  dateRange?: {
    start: Date;
    end: Date;
  };
}

export interface ProjectFilters {
  status?: ProjectStatus[];
  dateRange?: {
    start: Date;
    end: Date;
  };
}

// Dashboard Stats Types
export interface DashboardStats {
  totalProjects: number;
  activeProjects: number;
  totalTickets: number;
  openTickets: number;
  resolvedTickets: number;
  pendingInvoices: number;
  totalRevenue: number;
  overdueInvoices: number;
}

// Payment Types
export type PaymentMethod = 'cash' | 'cheque' | 'bank_transfer' | 'upi' | 'card' | 'other';
export type PaymentStatus = 'unpaid' | 'partial' | 'paid' | 'overpaid';

export interface Payment {
  id: string;
  paymentNumber: string;
  invoiceId: string;
  invoiceNumber: string;
  clientId: string;
  clientName: string;
  projectId?: string;
  projectName?: string;
  amount: number;
  paymentDate: Date;
  paymentMethod: PaymentMethod;
  referenceNumber?: string;
  bankName?: string;
  notes?: string;
  attachments?: Attachment[];
  receivedBy: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface InvoicePaymentSummary {
  invoiceId: string;
  invoiceNumber: string;
  totalAmount: number;
  paidAmount: number;
  balanceAmount: number;
  payments: Payment[];
  lastPaymentDate?: Date;
  status: PaymentStatus;
}

export interface PaymentFilters {
  invoiceId?: string;
  clientId?: string;
  projectId?: string;
  paymentMethod?: PaymentMethod[];
  dateRange?: {
    start: Date;
    end: Date;
  };
}

// Expense Types
export type ExpenseCategory =
  | 'materials'
  | 'labor'
  | 'equipment'
  | 'transport'
  | 'utilities'
  | 'office'
  | 'professional_fees'
  | 'permits'
  | 'insurance'
  | 'other';

export type ExpenseStatus = 'draft' | 'submitted' | 'approved' | 'rejected';
export type ExpensePaymentStatus = 'paid' | 'pending' | 'partial';

export interface Expense {
  id: string;
  expenseNumber: string;
  projectId?: string;
  projectName?: string;
  category: ExpenseCategory;
  subcategory?: string;
  description: string;
  amount: number;
  taxAmount?: number;
  totalAmount: number;
  expenseDate: Date;
  vendorId?: string;
  vendorName?: string;
  paymentMethod: PaymentMethod;
  paymentStatus: ExpensePaymentStatus;
  referenceNumber?: string;
  attachments?: Attachment[];
  tags?: string[];
  notes?: string;
  approvedBy?: string;
  approvedAt?: Date;
  status: ExpenseStatus;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ExpenseFilters {
  projectId?: string;
  category?: ExpenseCategory[];
  status?: ExpenseStatus[];
  paymentStatus?: ExpensePaymentStatus[];
  dateRange?: {
    start: Date;
    end: Date;
  };
}

// Time Tracking Types
export type TimeEntryStatus = 'draft' | 'submitted' | 'approved' | 'rejected';

export interface TimeEntry {
  id: string;
  userId: string;
  userName: string;
  projectId: string;
  projectName: string;
  ticketId?: string;
  ticketNumber?: string;
  date: Date;
  startTime: string; // HH:mm format
  endTime: string; // HH:mm format
  duration: number; // Duration in minutes
  description: string;
  category?: string;
  billable: boolean;
  hourlyRate?: number;
  status: TimeEntryStatus;
  approvedBy?: string;
  approvedAt?: Date;
  notes?: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface TimeEntryFilters {
  userId?: string;
  projectId?: string;
  ticketId?: string;
  status?: TimeEntryStatus[];
  billable?: boolean;
  dateRange?: {
    start: Date;
    end: Date;
  };
}

export interface TimesheetSummary {
  userId: string;
  userName: string;
  weekStartDate: Date;
  weekEndDate: Date;
  totalHours: number;
  billableHours: number;
  nonBillableHours: number;
  entriesByDate: Record<string, TimeEntry[]>;
  status: 'draft' | 'submitted' | 'approved' | 'rejected';
}

export interface WorkloadData {
  userId: string;
  userName: string;
  totalTickets: number;
  openTickets: number;
  inProgressTickets: number;
  hoursLogged: number;
  hoursThisWeek: number;
}
