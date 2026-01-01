# Ticket Management Application - Implementation Plan

> **Document Version:** 1.0
> **Created Date:** December 30, 2025
> **Application:** Construction Ticket Management System
> **Platform:** Web/Tablet/Mobile Responsive Application

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Current Application Analysis](#current-application-analysis)
3. [Technology Stack](#technology-stack)
4. [Implemented Features](#implemented-features)
5. [Feature Gap Analysis](#feature-gap-analysis)
6. [Required Features for Business Management](#required-features-for-business-management)
7. [UI/UX Responsive Design Strategy](#uiux-responsive-design-strategy)
8. [Implementation Roadmap](#implementation-roadmap)
9. [Database Schema Extensions](#database-schema-extensions)
10. [API/Service Layer Extensions](#apiservice-layer-extensions)
11. [Priority Matrix](#priority-matrix)
12. [Technical Recommendations](#technical-recommendations)

---

## Executive Summary

This document outlines the comprehensive analysis and implementation plan for enhancing the Ticket Management Application into a full-featured business management system capable of handling multiple projects. The application is built on modern React architecture with Firebase backend and requires enhancements in financial management, team collaboration, reporting, and mobile responsiveness.

### Key Objectives

- Transform the application into a complete multi-project business management solution
- Implement missing critical business features (payments, expenses, reporting)
- Enhance mobile and tablet user experience
- Improve team collaboration capabilities
- Add advanced analytics and reporting

---

## Current Application Analysis

### Project Structure Overview

```
ticket-management/
├── src/
│   ├── components/          # UI components (common, layout, domain-specific)
│   │   ├── common/          # Reusable components
│   │   ├── layout/          # Layout components (Header, Sidebar, MainLayout)
│   │   ├── dashboard/       # Dashboard-specific components
│   │   ├── invoices/        # Invoice components
│   │   ├── media/           # File upload and gallery components
│   │   └── settings/        # Settings components
│   ├── pages/               # Page components
│   │   ├── auth/            # Authentication pages
│   │   ├── dashboard/       # Dashboard page
│   │   ├── tickets/         # Ticket management pages
│   │   ├── projects/        # Project management pages
│   │   ├── quotations/      # Quotation pages
│   │   ├── invoices/        # Invoice pages
│   │   └── settings/        # Settings pages
│   ├── services/            # Firebase service layer
│   ├── contexts/            # React contexts (Auth, Theme, Notifications)
│   ├── hooks/               # Custom React hooks
│   ├── config/              # Configuration files
│   ├── locales/             # Translation files (en, ta)
│   ├── types/               # TypeScript type definitions
│   ├── utils/               # Utility functions
│   ├── main.tsx             # Entry point
│   └── App.tsx              # Root component with routing
├── dist/                    # Production build output
├── public/                  # Static assets
└── package.json             # Dependencies and scripts
```

### Codebase Statistics

| Metric | Value |
|--------|-------|
| Total Lines of Code | ~35,089 |
| Source Files | 63 |
| Components | 40+ |
| Pages | 15+ |
| Services | 8 |
| Custom Hooks | 6 |
| Supported Languages | 2 (English, Tamil) |

---

## Technology Stack

### Frontend Technologies

| Technology | Version | Purpose |
|------------|---------|---------|
| React | 19.2.0 | UI Framework |
| TypeScript | Latest | Type Safety |
| Vite | 7.2.4 | Build Tool & Dev Server |
| React Router | 7.11.0 | Client-side Routing |
| Material-UI (MUI) | 7.3.6 | UI Component Library |
| Emotion | Latest | CSS-in-JS Styling |
| React Query | 5.90.14 | Server State Management |
| i18next | 25.7.3 | Internationalization |
| Recharts | 3.6.0 | Charts & Visualizations |
| jsPDF | 3.0.4 | PDF Generation |
| date-fns | 4.1.0 | Date Manipulation |
| UUID | 13.0.0 | Unique ID Generation |

### Backend Technologies (Firebase)

| Service | Purpose |
|---------|---------|
| Firebase Authentication | User authentication (Email/Password) |
| Cloud Firestore | Real-time NoSQL database |
| Cloud Storage | File storage for attachments |

### Development Tools

| Tool | Purpose |
|------|---------|
| ESLint | Code linting |
| TypeScript Compiler | Type checking |
| Vite | Hot Module Replacement (HMR) |

---

## Implemented Features

### Authentication & Authorization

| Feature | Status | Description |
|---------|--------|-------------|
| Email/Password Login | ✅ Complete | Firebase authentication |
| Forgot Password | ✅ Complete | Password reset via email |
| Role-Based Access Control | ✅ Complete | 4 roles: Admin, Supervisor, Worker, Client |
| Permission System | ✅ Complete | 23 granular permissions |
| Custom Permissions | ✅ Complete | Per-user permission overrides |
| Session Persistence | ✅ Complete | Remember logged-in users |
| Protected Routes | ✅ Complete | Permission-based route guards |

#### User Roles & Default Permissions

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         ROLE HIERARCHY                                   │
├─────────────────────────────────────────────────────────────────────────┤
│  ADMIN                                                                   │
│  └── Full access to all 23 permissions                                  │
│      └── Can manage users, settings, and all business operations        │
├─────────────────────────────────────────────────────────────────────────┤
│  SUPERVISOR                                                              │
│  └── Projects: view, create, edit                                       │
│  └── Tickets: view, create, edit, assign                                │
│  └── Documents: quotations (all), invoices (view, create, edit)         │
│  └── Media: upload                                                       │
│  └── Reports: view                                                       │
├─────────────────────────────────────────────────────────────────────────┤
│  WORKER                                                                  │
│  └── Projects: view                                                      │
│  └── Tickets: view, create, edit (assigned only)                        │
│  └── Documents: quotations (view), invoices (view)                      │
│  └── Media: upload                                                       │
├─────────────────────────────────────────────────────────────────────────┤
│  CLIENT                                                                  │
│  └── Projects: view (own projects only)                                 │
│  └── Tickets: view (own projects only)                                  │
│  └── Documents: quotations (view), invoices (view, download)            │
└─────────────────────────────────────────────────────────────────────────┘
```

### Dashboard Module

| Feature | Status | Description |
|---------|--------|-------------|
| Statistics Cards | ✅ Complete | Total projects, tickets, revenue, etc. |
| Ticket Status Chart | ✅ Complete | Pie chart showing ticket distribution |
| Project Progress Chart | ✅ Complete | Bar chart for project completion |
| Revenue Chart | ✅ Complete | Line/Area chart for financial trends |
| Recent Activity | ✅ Complete | Timeline of recent actions |
| Quick Actions | ✅ Complete | Shortcuts to common tasks |

### Project Management Module

| Feature | Status | Description |
|---------|--------|-------------|
| Project List | ✅ Complete | Paginated list with filters |
| Project Details | ✅ Complete | Full project information view |
| Create Project | ✅ Complete | Form with validation |
| Edit Project | ✅ Complete | Update project details |
| Delete Project | ✅ Complete | Soft delete with confirmation |
| Project Status | ✅ Complete | 6 statuses: planning, active, in_progress, on_hold, completed, cancelled |
| Progress Tracking | ✅ Complete | 0-100% progress indicator |
| Client Assignment | ✅ Complete | Link projects to clients |
| Team Assignment | ✅ Complete | Assign users to projects |
| Tags/Labels | ✅ Complete | Categorize projects |

### Ticket Management Module

| Feature | Status | Description |
|---------|--------|-------------|
| Ticket List | ✅ Complete | Advanced filtering and search |
| Ticket Details | ✅ Complete | Full ticket information |
| Create Ticket | ✅ Complete | Form with project selection |
| Edit Ticket | ✅ Complete | Update ticket details |
| Delete Ticket | ✅ Complete | With confirmation dialog |
| Auto Ticket Numbers | ✅ Complete | Sequential numbering (TKT-XXXX) |
| Priority Levels | ✅ Complete | Low, Medium, High, Critical |
| Status Workflow | ✅ Complete | Open → In Progress → Pending → Resolved → Closed |
| Comments | ✅ Complete | Discussion thread on tickets |
| Attachments | ✅ Complete | File uploads with preview |
| Assignment | ✅ Complete | Assign to team members |
| Due Dates | ✅ Complete | Deadline tracking |

#### Ticket Categories

| Category | Icon | Description |
|----------|------|-------------|
| Electrical | ⚡ | Electrical work |
| Plumbing | 🔧 | Water and drainage |
| Carpentry | 🪚 | Wood work |
| Painting | 🎨 | Paint jobs |
| Flooring | 🏠 | Floor installation |
| Roofing | 🏗️ | Roof work |
| HVAC | ❄️ | Heating/cooling |
| Masonry | 🧱 | Brick/stone work |
| General | 📋 | General tasks |
| Other | ❓ | Miscellaneous |

### Quotation Management Module

| Feature | Status | Description |
|---------|--------|-------------|
| Quotation List | ✅ Complete | List with status filters |
| Quotation Details | ✅ Complete | Full quotation view |
| Create Quotation | ✅ Complete | Line items editor |
| Edit Quotation | ✅ Complete | Update quotation |
| Delete Quotation | ✅ Complete | With confirmation |
| Auto Numbering | ✅ Complete | Sequential (QT-XXXX) |
| Line Items | ✅ Complete | Add/edit/remove items |
| Financial Calculations | ✅ Complete | Subtotal, tax, discount, total |
| Status Workflow | ✅ Complete | Draft → Sent → Approved/Rejected/Expired |
| Terms & Conditions | ✅ Complete | Customizable text |
| PDF Generation | ✅ Complete | Export to PDF |

### Invoice Management Module

| Feature | Status | Description |
|---------|--------|-------------|
| Invoice List | ✅ Complete | List with filters |
| Invoice Details | ✅ Complete | Full invoice view |
| Create Invoice | ✅ Complete | From quotation or standalone |
| Edit Invoice | ✅ Complete | Update invoice |
| Delete Invoice | ✅ Complete | With confirmation |
| Auto Numbering | ✅ Complete | Sequential (INV-XXXX) |
| Line Items | ✅ Complete | Itemized billing |
| Financial Summary | ✅ Complete | Tax, discount, charges |
| Status Workflow | ✅ Complete | Draft → Sent → Paid/Overdue/Cancelled |
| Due Date Tracking | ✅ Complete | Payment deadlines |
| PDF Generation | ✅ Complete | Downloadable invoices |
| Invoice Templates | ✅ Complete | Modern, Classic, Minimal |
| GST Support | ✅ Complete | Indian tax compliance |

### Settings Module

| Feature | Status | Description |
|---------|--------|-------------|
| User Management | ✅ Complete | CRUD for users |
| Role Assignment | ✅ Complete | Assign roles to users |
| Permission Editor | ✅ Complete | Custom permission overrides |
| Business Details | ✅ Complete | Company info configuration |
| Invoice Settings | ✅ Complete | Prefixes, terms, defaults |
| Template Management | ✅ Complete | Invoice template customization |
| Language Settings | ✅ Complete | English/Tamil selection |
| Theme Settings | ✅ Complete | Light/Dark mode |

### Notifications Module

| Feature | Status | Description |
|---------|--------|-------------|
| Notification Center | ✅ Complete | View all notifications |
| Real-time Updates | ✅ Complete | Instant notifications |
| Mark as Read | ✅ Complete | Individual/bulk marking |
| Notification Types | ✅ Complete | 8 types (ticket, project, invoice, etc.) |
| In-app Alerts | ✅ Complete | Toast notifications |

### Common Components

| Component | Status | Description |
|-----------|--------|-------------|
| PageHeader | ✅ Complete | Title, breadcrumbs, actions |
| StatusChip | ✅ Complete | Color-coded status badges |
| LoadingSpinner | ✅ Complete | Full-screen and inline |
| ConfirmDialog | ✅ Complete | Confirmation modals |
| EmptyState | ✅ Complete | No data messaging |
| AdvancedFilters | ✅ Complete | Filter panel component |
| ActivityTimeline | ✅ Complete | Activity log display |
| FileUploader | ✅ Complete | Drag-drop file upload |
| ImageGallery | ✅ Complete | Image viewer with lightbox |

### Responsive Design (Current State)

| Feature | Status | Notes |
|---------|--------|-------|
| Grid Layout | ✅ Basic | MUI Grid system |
| Responsive Sidebar | ✅ Basic | Drawer on mobile |
| Responsive Tables | ⚠️ Partial | Horizontal scroll only |
| Mobile Forms | ⚠️ Partial | Needs optimization |
| Touch Targets | ⚠️ Partial | Some buttons too small |
| Bottom Navigation | ❌ Missing | Mobile-specific nav needed |

---

## Feature Gap Analysis

### Critical Missing Features

| Feature | Business Impact | Priority |
|---------|-----------------|----------|
| Payment Tracking | Cannot track invoice payments | 🔴 Critical |
| Expense Management | No project cost tracking | 🔴 Critical |
| Client Management UI | Client data exists but no dedicated page | 🔴 Critical |
| Financial Reports | No profitability analysis | 🔴 Critical |
| Email Integration | Cannot send documents electronically | 🟠 High |

### Important Missing Features

| Feature | Business Impact | Priority |
|---------|-----------------|----------|
| Kanban Board | No visual task management | 🟠 High |
| Time Tracking | Cannot bill hourly work | 🟠 High |
| Calendar View | No scheduling interface | 🟠 High |
| Team Workload | Cannot balance assignments | 🟠 High |
| Budget vs Actual | No cost comparison | 🟠 High |

### Nice-to-Have Features

| Feature | Business Impact | Priority |
|---------|-----------------|----------|
| Inventory Management | Manual material tracking | 🟡 Medium |
| Vendor Management | No supplier database | 🟡 Medium |
| Recurring Invoices | Manual invoice creation | 🟡 Medium |
| PWA Support | No offline capability | 🟡 Medium |
| Push Notifications | No mobile alerts | 🟡 Medium |

---

## Required Features for Business Management

### Phase 1: Core Business Features

#### 1.1 Client Management Module

**Purpose:** Dedicated interface for managing client information, history, and relationships.

**Features:**
- Client list with search and filters
- Client detail page with:
  - Contact information
  - Associated projects
  - Quotation history
  - Invoice history
  - Payment history
  - Communication log
- Create/Edit client forms
- Client dashboard with statistics
- Quick actions (create project, create quotation)

**Data Model Extension:**
```typescript
interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  alternatePhone?: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  gstNumber?: string;
  panNumber?: string;
  contactPerson?: string;
  contactPersonPhone?: string;
  notes?: string;
  tags?: string[];
  source?: 'referral' | 'website' | 'advertisement' | 'walk-in' | 'other';
  status: 'active' | 'inactive' | 'prospect';
  totalProjects: number;
  totalRevenue: number;
  outstandingAmount: number;
  createdBy: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

**Pages to Create:**
- `/clients` - Client list page
- `/clients/new` - Create client form
- `/clients/:id` - Client detail page
- `/clients/:id/edit` - Edit client form

#### 1.2 Payment Tracking Module

**Purpose:** Record and track payments against invoices.

**Features:**
- Payment recording form
- Partial payment support
- Payment methods (Cash, Cheque, Bank Transfer, UPI, Card)
- Payment history per invoice
- Payment receipts generation
- Outstanding balance tracking
- Payment reminders
- Bulk payment recording

**Data Model:**
```typescript
interface Payment {
  id: string;
  paymentNumber: string;        // PAY-XXXX
  invoiceId: string;
  invoiceNumber: string;
  clientId: string;
  clientName: string;
  projectId?: string;
  amount: number;
  paymentDate: Timestamp;
  paymentMethod: 'cash' | 'cheque' | 'bank_transfer' | 'upi' | 'card' | 'other';
  referenceNumber?: string;     // Cheque no, transaction ID
  bankName?: string;
  notes?: string;
  attachments?: Attachment[];   // Payment proof
  receivedBy: string;
  createdBy: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

interface InvoicePaymentSummary {
  invoiceId: string;
  totalAmount: number;
  paidAmount: number;
  balanceAmount: number;
  payments: Payment[];
  lastPaymentDate?: Timestamp;
  status: 'unpaid' | 'partial' | 'paid' | 'overpaid';
}
```

**Pages to Create:**
- `/payments` - Payment list page
- `/payments/new` - Record payment form
- `/payments/:id` - Payment detail/receipt
- `/invoices/:id/payments` - Invoice payment history

#### 1.3 Expense Tracking Module

**Purpose:** Track project expenses and costs.

**Features:**
- Expense entry form
- Expense categories
- Receipt upload
- Project-wise expense tracking
- Vendor/Supplier linking
- Approval workflow (optional)
- Expense reports
- Reimbursement tracking

**Data Model:**
```typescript
interface Expense {
  id: string;
  expenseNumber: string;        // EXP-XXXX
  projectId?: string;
  projectName?: string;
  category: ExpenseCategory;
  subcategory?: string;
  description: string;
  amount: number;
  taxAmount?: number;
  totalAmount: number;
  expenseDate: Timestamp;
  vendorId?: string;
  vendorName?: string;
  paymentMethod: 'cash' | 'cheque' | 'bank_transfer' | 'upi' | 'card' | 'credit';
  paymentStatus: 'paid' | 'pending' | 'partial';
  referenceNumber?: string;
  attachments?: Attachment[];   // Bills, receipts
  tags?: string[];
  notes?: string;
  approvedBy?: string;
  approvedAt?: Timestamp;
  status: 'draft' | 'submitted' | 'approved' | 'rejected';
  createdBy: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

type ExpenseCategory =
  | 'materials'
  | 'labor'
  | 'equipment'
  | 'transport'
  | 'permits'
  | 'utilities'
  | 'subcontractor'
  | 'office'
  | 'travel'
  | 'miscellaneous';
```

**Pages to Create:**
- `/expenses` - Expense list page
- `/expenses/new` - Create expense form
- `/expenses/:id` - Expense detail page
- `/expenses/:id/edit` - Edit expense form
- `/projects/:id/expenses` - Project expenses view

#### 1.4 Reports & Analytics Module

**Purpose:** Business intelligence and reporting.

**Features:**
- Dashboard with KPIs
- Revenue reports
- Expense reports
- Profitability analysis (per project, overall)
- Client-wise reports
- Team performance reports
- Ticket analytics
- Export to Excel/PDF
- Date range filters
- Comparison reports (month-over-month, year-over-year)

**Report Types:**
```typescript
interface ReportConfig {
  id: string;
  name: string;
  type: ReportType;
  filters: ReportFilters;
  columns: string[];
  groupBy?: string;
  sortBy?: string;
  chartType?: 'bar' | 'line' | 'pie' | 'area';
}

type ReportType =
  | 'revenue_summary'
  | 'expense_summary'
  | 'profit_loss'
  | 'project_profitability'
  | 'client_revenue'
  | 'payment_collection'
  | 'outstanding_invoices'
  | 'ticket_summary'
  | 'team_performance'
  | 'aging_report';

interface ReportFilters {
  dateRange: { start: Date; end: Date };
  projectIds?: string[];
  clientIds?: string[];
  userIds?: string[];
  status?: string[];
}
```

**Pages to Create:**
- `/reports` - Reports dashboard
- `/reports/revenue` - Revenue reports
- `/reports/expenses` - Expense reports
- `/reports/profitability` - Profit/Loss reports
- `/reports/clients` - Client reports
- `/reports/projects` - Project reports
- `/reports/team` - Team performance

#### 1.5 Calendar & Scheduling Module

**Purpose:** Visual scheduling and deadline management.

**Features:**
- Monthly/Weekly/Daily views
- Project timelines
- Ticket due dates
- Invoice due dates
- Payment reminders
- Drag-and-drop rescheduling
- Color coding by type/priority
- Team availability view
- Milestone tracking

**Data Model:**
```typescript
interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  type: 'ticket_due' | 'project_milestone' | 'invoice_due' | 'payment_reminder' | 'meeting' | 'task' | 'custom';
  entityType?: 'ticket' | 'project' | 'invoice' | 'quotation';
  entityId?: string;
  startDate: Timestamp;
  endDate?: Timestamp;
  allDay: boolean;
  color?: string;
  assignedTo?: string[];
  reminders?: Reminder[];
  recurring?: RecurringConfig;
  createdBy: string;
  createdAt: Timestamp;
}

interface Reminder {
  type: 'email' | 'notification' | 'both';
  before: number;  // minutes before event
}
```

**Pages to Create:**
- `/calendar` - Calendar view page
- `/calendar/month` - Monthly view
- `/calendar/week` - Weekly view
- `/calendar/day` - Daily view

### Phase 2: Team & Collaboration Features

#### 2.1 Enhanced Team Management

**Features:**
- Worker profiles with skills
- Availability calendar
- Workload distribution view
- Performance metrics
- Skill-based assignment suggestions
- Leave management
- Contact directory

**Data Model Extension:**
```typescript
interface UserProfile extends User {
  skills?: string[];
  hourlyRate?: number;
  department?: string;
  designation?: string;
  joiningDate?: Timestamp;
  reportingTo?: string;
  availability?: AvailabilitySchedule;
  performanceMetrics?: {
    ticketsCompleted: number;
    averageResolutionTime: number;
    customerRating: number;
  };
}

interface AvailabilitySchedule {
  monday: { start: string; end: string; available: boolean };
  tuesday: { start: string; end: string; available: boolean };
  // ... other days
  exceptions: LeaveRecord[];
}

interface LeaveRecord {
  date: Timestamp;
  type: 'leave' | 'holiday' | 'half_day';
  reason?: string;
}
```

#### 2.2 Kanban Board

**Purpose:** Visual ticket/task management with drag-and-drop.

**Features:**
- Board view for tickets
- Customizable columns (by status)
- Drag-and-drop status changes
- Quick edit cards
- Filters (project, assignee, priority)
- Swimlanes (by project, assignee)
- WIP limits
- Card aging indicators

**Implementation:**
- Use `@dnd-kit/core` for drag-and-drop
- Real-time sync with Firestore
- Optimistic updates for smooth UX

#### 2.3 Time Tracking

**Purpose:** Log work hours for billing and productivity analysis.

**Features:**
- Start/Stop timer
- Manual time entry
- Time logs per ticket
- Daily/Weekly timesheets
- Time reports
- Billable vs non-billable hours
- Export for payroll

**Data Model:**
```typescript
interface TimeEntry {
  id: string;
  userId: string;
  userName: string;
  ticketId?: string;
  ticketNumber?: string;
  projectId?: string;
  projectName?: string;
  description: string;
  startTime: Timestamp;
  endTime?: Timestamp;
  duration: number;          // minutes
  billable: boolean;
  hourlyRate?: number;
  billedAmount?: number;
  status: 'running' | 'completed' | 'approved';
  approvedBy?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

interface Timesheet {
  id: string;
  userId: string;
  weekStart: Timestamp;
  entries: TimeEntry[];
  totalHours: number;
  billableHours: number;
  status: 'draft' | 'submitted' | 'approved' | 'rejected';
  submittedAt?: Timestamp;
  approvedBy?: string;
  approvedAt?: Timestamp;
}
```

**Pages to Create:**
- `/timesheet` - Weekly timesheet view
- `/timesheet/log` - Time entry form
- `/reports/time` - Time reports

#### 2.4 Document Management

**Purpose:** Centralized document storage and management.

**Features:**
- Project document folders
- Document upload with metadata
- Version control
- Document sharing
- Preview support (images, PDFs)
- Search within documents
- Access control

**Data Model:**
```typescript
interface Document {
  id: string;
  name: string;
  description?: string;
  projectId?: string;
  folderId?: string;
  fileUrl: string;
  fileType: string;
  fileSize: number;
  mimeType: string;
  version: number;
  previousVersions?: DocumentVersion[];
  tags?: string[];
  accessLevel: 'public' | 'team' | 'restricted';
  allowedUsers?: string[];
  uploadedBy: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

interface Folder {
  id: string;
  name: string;
  projectId?: string;
  parentFolderId?: string;
  createdBy: string;
  createdAt: Timestamp;
}
```

### Phase 3: Advanced Business Features

#### 3.1 Inventory Management

**Purpose:** Track materials, tools, and stock levels.

**Features:**
- Item catalog
- Stock tracking
- Purchase orders
- Stock adjustments
- Low stock alerts
- Usage tracking per project
- Inventory valuation

**Data Model:**
```typescript
interface InventoryItem {
  id: string;
  name: string;
  description?: string;
  sku: string;
  category: string;
  unit: string;
  currentStock: number;
  minStockLevel: number;
  maxStockLevel?: number;
  unitCost: number;
  sellingPrice?: number;
  location?: string;
  supplier?: string;
  images?: string[];
  isActive: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

interface StockMovement {
  id: string;
  itemId: string;
  type: 'in' | 'out' | 'adjustment';
  quantity: number;
  previousStock: number;
  newStock: number;
  reason: string;
  projectId?: string;
  purchaseOrderId?: string;
  referenceNumber?: string;
  unitCost?: number;
  totalCost?: number;
  createdBy: string;
  createdAt: Timestamp;
}

interface PurchaseOrder {
  id: string;
  poNumber: string;
  vendorId: string;
  vendorName: string;
  items: PurchaseOrderItem[];
  subtotal: number;
  taxAmount: number;
  totalAmount: number;
  status: 'draft' | 'sent' | 'partial' | 'received' | 'cancelled';
  expectedDelivery?: Timestamp;
  receivedDate?: Timestamp;
  notes?: string;
  createdBy: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

#### 3.2 Vendor/Supplier Management

**Purpose:** Manage supplier relationships and purchases.

**Features:**
- Vendor database
- Contact management
- Purchase history
- Payment tracking
- Vendor ratings
- Price comparisons

**Data Model:**
```typescript
interface Vendor {
  id: string;
  name: string;
  email?: string;
  phone: string;
  alternatePhone?: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  gstNumber?: string;
  panNumber?: string;
  contactPerson?: string;
  bankDetails?: BankDetails;
  categories?: string[];        // What they supply
  rating?: number;              // 1-5
  notes?: string;
  status: 'active' | 'inactive' | 'blacklisted';
  totalPurchases: number;
  outstandingAmount: number;
  createdBy: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

interface BankDetails {
  accountName: string;
  accountNumber: string;
  bankName: string;
  ifscCode: string;
  branch?: string;
}
```

#### 3.3 Budget Management

**Purpose:** Track estimated vs actual project costs.

**Features:**
- Project budget creation
- Budget categories
- Expense tracking against budget
- Variance analysis
- Budget alerts (over/under)
- Forecasting
- Budget revision history

**Data Model:**
```typescript
interface ProjectBudget {
  id: string;
  projectId: string;
  version: number;
  categories: BudgetCategory[];
  totalBudget: number;
  contingency: number;
  approvedBy?: string;
  approvedAt?: Timestamp;
  status: 'draft' | 'approved' | 'revised';
  createdBy: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

interface BudgetCategory {
  id: string;
  name: string;
  estimatedAmount: number;
  actualAmount: number;
  variance: number;
  variancePercent: number;
  subcategories?: BudgetSubcategory[];
}

interface BudgetVsActual {
  projectId: string;
  totalBudget: number;
  totalExpenses: number;
  totalVariance: number;
  variancePercent: number;
  status: 'under_budget' | 'on_track' | 'over_budget';
  categoryBreakdown: BudgetCategory[];
  projectedFinal: number;
}
```

#### 3.4 Email Integration

**Purpose:** Send documents and notifications via email.

**Features:**
- Send invoices via email
- Send quotations via email
- Email templates
- Bulk email
- Email tracking (opened, clicked)
- Scheduled emails
- Email history

**Implementation Options:**
1. Firebase Extensions (SendGrid, Mailgun)
2. Cloud Functions with Nodemailer
3. Third-party service integration

#### 3.5 Recurring Invoices

**Purpose:** Automate invoice generation for recurring billing.

**Features:**
- Recurring invoice templates
- Frequency settings (weekly, monthly, quarterly, yearly)
- Auto-generation
- Email on generation
- Skip/pause capability
- End date configuration

**Data Model:**
```typescript
interface RecurringInvoice {
  id: string;
  templateId: string;
  clientId: string;
  projectId?: string;
  frequency: 'weekly' | 'biweekly' | 'monthly' | 'quarterly' | 'yearly';
  dayOfMonth?: number;          // For monthly
  dayOfWeek?: number;           // For weekly
  startDate: Timestamp;
  endDate?: Timestamp;
  nextGenerationDate: Timestamp;
  lineItems: LineItem[];
  financialSummary: FinancialSummary;
  autoSend: boolean;
  emailTemplate?: string;
  status: 'active' | 'paused' | 'completed' | 'cancelled';
  generatedInvoices: string[];  // Invoice IDs
  createdBy: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

### Phase 4: Mobile & UX Enhancements

#### 4.1 Progressive Web App (PWA)

**Features:**
- Service worker for offline support
- App manifest for installation
- Offline data sync
- Background sync
- Cache strategies

**Implementation:**
```typescript
// vite.config.ts additions
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'Ticket Management',
        short_name: 'TicketMgr',
        theme_color: '#1976D2',
        icons: [/* icon configs */],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
        runtimeCaching: [/* cache configs */],
      },
    }),
  ],
});
```

#### 4.2 Push Notifications

**Features:**
- Firebase Cloud Messaging integration
- Notification preferences
- Topic-based subscriptions
- Click actions
- Notification badges

#### 4.3 Mobile-Optimized UI

**Features:**
- Bottom navigation bar
- Floating action buttons
- Swipe gestures
- Pull-to-refresh
- Infinite scroll
- Touch-optimized inputs
- Mobile-specific views

#### 4.4 Camera Integration

**Features:**
- Direct camera capture
- Image compression
- Multiple image upload
- Annotation tools
- Barcode/QR scanning

---

## UI/UX Responsive Design Strategy

### Breakpoint System

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         BREAKPOINT DEFINITIONS                           │
├─────────────────────────────────────────────────────────────────────────┤
│  xs (Extra Small)  │  0 - 599px      │  Mobile phones (portrait)        │
│  sm (Small)        │  600 - 899px    │  Mobile phones (landscape),      │
│                    │                 │  Small tablets                    │
│  md (Medium)       │  900 - 1199px   │  Tablets                         │
│  lg (Large)        │  1200 - 1535px  │  Laptops, Desktops               │
│  xl (Extra Large)  │  1536px+        │  Large desktops, TVs             │
└─────────────────────────────────────────────────────────────────────────┘
```

### Layout Strategy by Device

#### Mobile (xs: 0-599px)

```
┌─────────────────────────────────────┐
│           APP HEADER                │
│  ☰  Logo        🔔 👤              │
├─────────────────────────────────────┤
│                                     │
│         MAIN CONTENT                │
│                                     │
│   Single column layout              │
│   Card-based lists                  │
│   Stacked forms                     │
│   Full-width tables (scroll)        │
│                                     │
│                                     │
│                              [FAB]  │
├─────────────────────────────────────┤
│  🏠   📋   ➕   📊   ⚙️            │
│  Home Tickets New  Reports Settings │
└─────────────────────────────────────┘
```

**Key Mobile Patterns:**
- Bottom navigation bar (5 items max)
- Floating Action Button for primary action
- Card-based lists instead of tables
- Collapsible sections
- Swipe gestures for actions
- Pull-to-refresh
- Sticky headers
- Full-screen modals

#### Tablet (sm/md: 600-1199px)

```
┌───────────────────────────────────────────────────────────────┐
│                        APP HEADER                              │
│  ☰  Logo              Search...              🔔  👤  Theme    │
├────────┬──────────────────────────────────────────────────────┤
│        │                                                       │
│  Mini  │              MAIN CONTENT                             │
│  Side  │                                                       │
│  bar   │     Two-column layout                                 │
│        │     Split view (list + detail)                        │
│  🏠    │     Hybrid card/table views                          │
│  📋    │     Multi-column forms                                │
│  📁    │                                                       │
│  💰    │                                                       │
│  📊    │                                                       │
│  ⚙️    │                                                       │
│        │                                                       │
└────────┴──────────────────────────────────────────────────────┘
```

**Key Tablet Patterns:**
- Collapsible sidebar (mini variant)
- Split view for master-detail
- 2-column form layouts
- Responsive data tables
- Touch-friendly controls
- Hover states still useful

#### Desktop (lg/xl: 1200px+)

```
┌──────────────────────────────────────────────────────────────────────────┐
│                              APP HEADER                                   │
│  Logo          Search...                          🔔  👤  Theme  Help   │
├──────────────┬───────────────────────────────────────────────────────────┤
│              │                                                            │
│   SIDEBAR    │                    MAIN CONTENT                            │
│              │                                                            │
│  Dashboard   │     Multi-column layouts                                   │
│  Projects    │     Full data tables with sorting/filtering                │
│  Tickets     │     Side panels for quick view                             │
│  Quotations  │     Dashboard widgets grid                                 │
│  Invoices    │     Inline editing                                         │
│  Clients     │     Keyboard shortcuts                                     │
│  Expenses    │                                                            │
│  Reports     │                                                            │
│  Calendar    │                                                            │
│  Settings    │                                                            │
│              │                                                            │
│              │                                                            │
│  Collapse ◀  │                                                            │
└──────────────┴───────────────────────────────────────────────────────────┘
```

**Key Desktop Patterns:**
- Full sidebar navigation
- Multi-column content areas
- Data tables with advanced features
- Side panels and drawers
- Keyboard navigation
- Right-click context menus
- Drag-and-drop functionality

### Component Responsive Patterns

#### Navigation Component

```typescript
// Mobile: Bottom Navigation
<BottomNavigation sx={{ display: { xs: 'flex', md: 'none' } }}>
  <BottomNavigationAction label="Home" icon={<HomeIcon />} />
  <BottomNavigationAction label="Tickets" icon={<TicketIcon />} />
  <BottomNavigationAction label="Add" icon={<AddIcon />} />
  <BottomNavigationAction label="Reports" icon={<ChartIcon />} />
  <BottomNavigationAction label="More" icon={<MoreIcon />} />
</BottomNavigation>

// Tablet/Desktop: Sidebar
<Drawer
  variant={{ xs: 'temporary', md: 'permanent' }}
  sx={{ width: { md: miniVariant ? 72 : 240 } }}
>
  {/* Navigation items */}
</Drawer>
```

#### List/Table Component

```typescript
// Responsive List Component
const ResponsiveList = ({ data }) => {
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  if (isMobile) {
    return (
      <Stack spacing={2}>
        {data.map(item => (
          <Card key={item.id}>
            <CardContent>
              {/* Card layout for mobile */}
            </CardContent>
          </Card>
        ))}
      </Stack>
    );
  }

  return (
    <Table>
      {/* Full table for desktop */}
    </Table>
  );
};
```

#### Form Component

```typescript
// Responsive Form Layout
<Grid container spacing={2}>
  <Grid size={{ xs: 12, sm: 6, md: 4 }}>
    <TextField label="Field 1" fullWidth />
  </Grid>
  <Grid size={{ xs: 12, sm: 6, md: 4 }}>
    <TextField label="Field 2" fullWidth />
  </Grid>
  <Grid size={{ xs: 12, sm: 6, md: 4 }}>
    <TextField label="Field 3" fullWidth />
  </Grid>
</Grid>
```

### Touch Target Guidelines

| Element | Minimum Size | Recommended Size |
|---------|--------------|------------------|
| Buttons | 44px × 44px | 48px × 48px |
| Icons | 24px × 24px | 40px touch area |
| List Items | 48px height | 56px height |
| Form Inputs | 40px height | 48px height |
| Spacing | 8px minimum | 16px between targets |

### Typography Scale

```typescript
// Responsive Typography
const theme = createTheme({
  typography: {
    h1: {
      fontSize: '2rem',
      [breakpoints.up('md')]: { fontSize: '2.5rem' },
      [breakpoints.up('lg')]: { fontSize: '3rem' },
    },
    h2: {
      fontSize: '1.5rem',
      [breakpoints.up('md')]: { fontSize: '2rem' },
      [breakpoints.up('lg')]: { fontSize: '2.25rem' },
    },
    body1: {
      fontSize: '0.875rem',
      [breakpoints.up('md')]: { fontSize: '1rem' },
    },
  },
});
```

---

## Implementation Roadmap

### Sprint 1: Foundation & Quick Wins (2 weeks equivalent effort)

#### Week 1 Tasks

| Task | Description | Files to Create/Modify |
|------|-------------|----------------------|
| Client Management UI | Create client list and detail pages | `pages/clients/*`, `services/clientService.ts` |
| Mobile Bottom Navigation | Add bottom nav for mobile | `components/layout/BottomNavigation.tsx` |
| Card-based Mobile Lists | Create responsive list components | `components/common/ResponsiveList.tsx` |

#### Week 2 Tasks

| Task | Description | Files to Create/Modify |
|------|-------------|----------------------|
| Dashboard Filters | Add project/date filtering | `pages/dashboard/DashboardPage.tsx` |
| Enhanced Stats | Add more KPIs to dashboard | `components/dashboard/*` |
| Mobile Form Optimization | Improve form UX on mobile | `components/common/ResponsiveForm.tsx` |

#### Deliverables
- [ ] Client Management Module (List, Detail, Create, Edit)
- [ ] Bottom Navigation Component
- [ ] Responsive List Component
- [ ] Dashboard Filter Panel
- [ ] Mobile-optimized Forms

### Sprint 2: Financial Enhancements (2 weeks equivalent effort)

#### Week 3 Tasks

| Task | Description | Files to Create/Modify |
|------|-------------|----------------------|
| Payment Model | Create payment data structures | `types/index.ts`, `services/paymentService.ts` |
| Payment Recording | Build payment entry form | `pages/payments/*` |
| Invoice Payment History | Add payment tab to invoices | `pages/invoices/InvoiceDetailPage.tsx` |

#### Week 4 Tasks

| Task | Description | Files to Create/Modify |
|------|-------------|----------------------|
| Expense Model | Create expense data structures | `types/index.ts`, `services/expenseService.ts` |
| Expense Entry | Build expense forms and lists | `pages/expenses/*` |
| Basic Reports | Create revenue/expense reports | `pages/reports/*` |

#### Deliverables
- [ ] Payment Tracking Module
- [ ] Expense Management Module
- [ ] Payment Recording Form
- [ ] Invoice Payment History View
- [ ] Basic Financial Reports

### Sprint 3: Team & Productivity (2 weeks equivalent effort)

#### Week 5 Tasks

| Task | Description | Files to Create/Modify |
|------|-------------|----------------------|
| Kanban Board | Implement drag-drop board | `pages/tickets/KanbanBoard.tsx` |
| Board Filters | Add filters to board view | `components/tickets/BoardFilters.tsx` |
| Card Component | Create ticket card for board | `components/tickets/TicketCard.tsx` |

#### Week 6 Tasks

| Task | Description | Files to Create/Modify |
|------|-------------|----------------------|
| Time Entry Model | Create time tracking structures | `types/index.ts`, `services/timeService.ts` |
| Time Logging | Build time entry interface | `pages/timesheet/*` |
| Calendar View | Implement calendar component | `pages/calendar/*` |

#### Deliverables
- [ ] Kanban Board for Tickets
- [ ] Time Tracking Module
- [ ] Calendar View
- [ ] Team Workload View

### Sprint 4: Advanced Features (2 weeks equivalent effort)

#### Week 7 Tasks

| Task | Description | Files to Create/Modify |
|------|-------------|----------------------|
| Inventory Model | Create inventory structures | `types/index.ts`, `services/inventoryService.ts` |
| Item Catalog | Build inventory management | `pages/inventory/*` |
| Stock Tracking | Implement stock movements | `components/inventory/*` |

#### Week 8 Tasks

| Task | Description | Files to Create/Modify |
|------|-------------|----------------------|
| Vendor Management | Create vendor module | `pages/vendors/*` |
| Budget Tracking | Implement budget vs actual | `pages/projects/BudgetView.tsx` |
| Advanced Reports | Build comprehensive reports | `pages/reports/*` |

#### Deliverables
- [ ] Inventory Management Module
- [ ] Vendor/Supplier Module
- [ ] Budget Tracking
- [ ] Advanced Financial Reports

### Sprint 5: Mobile Excellence (2 weeks equivalent effort)

#### Week 9 Tasks

| Task | Description | Files to Create/Modify |
|------|-------------|----------------------|
| PWA Setup | Configure service worker | `vite.config.ts`, `public/manifest.json` |
| Offline Support | Implement offline data | `services/offlineService.ts` |
| Push Notifications | Set up FCM | `services/notificationService.ts` |

#### Week 10 Tasks

| Task | Description | Files to Create/Modify |
|------|-------------|----------------------|
| Camera Integration | Add camera capture | `components/media/CameraCapture.tsx` |
| Gesture Support | Implement swipe actions | `hooks/useSwipeActions.ts` |
| Polish & Testing | Final responsive testing | Various |

#### Deliverables
- [ ] PWA with Offline Support
- [ ] Push Notifications
- [ ] Camera Integration
- [ ] Swipe Gestures
- [ ] Fully Responsive UI

---

## Database Schema Extensions

### New Firestore Collections

```
ticket-management/
├── users/                  # Existing
├── projects/               # Existing
├── tickets/                # Existing
├── ticket_comments/        # Existing
├── quotations/             # Existing
├── invoices/               # Existing
├── notifications/          # Existing
├── counters/               # Existing
├── activity_logs/          # Existing
├── clients/                # Existing (enhance)
│
├── payments/               # NEW - Payment records
│   └── {paymentId}
│       ├── paymentNumber
│       ├── invoiceId
│       ├── amount
│       ├── paymentDate
│       ├── paymentMethod
│       └── ...
│
├── expenses/               # NEW - Expense records
│   └── {expenseId}
│       ├── expenseNumber
│       ├── projectId
│       ├── category
│       ├── amount
│       └── ...
│
├── time_entries/           # NEW - Time tracking
│   └── {entryId}
│       ├── userId
│       ├── ticketId
│       ├── duration
│       └── ...
│
├── timesheets/             # NEW - Weekly timesheets
│   └── {timesheetId}
│       ├── userId
│       ├── weekStart
│       ├── entries[]
│       └── ...
│
├── inventory_items/        # NEW - Inventory catalog
│   └── {itemId}
│       ├── name
│       ├── sku
│       ├── currentStock
│       └── ...
│
├── stock_movements/        # NEW - Stock transactions
│   └── {movementId}
│       ├── itemId
│       ├── type
│       ├── quantity
│       └── ...
│
├── purchase_orders/        # NEW - Purchase orders
│   └── {poId}
│       ├── poNumber
│       ├── vendorId
│       ├── items[]
│       └── ...
│
├── vendors/                # NEW - Supplier database
│   └── {vendorId}
│       ├── name
│       ├── contact
│       ├── categories[]
│       └── ...
│
├── project_budgets/        # NEW - Budget tracking
│   └── {budgetId}
│       ├── projectId
│       ├── categories[]
│       ├── totalBudget
│       └── ...
│
├── calendar_events/        # NEW - Calendar events
│   └── {eventId}
│       ├── title
│       ├── type
│       ├── startDate
│       └── ...
│
├── documents/              # NEW - Document management
│   └── {documentId}
│       ├── name
│       ├── projectId
│       ├── fileUrl
│       └── ...
│
├── folders/                # NEW - Document folders
│   └── {folderId}
│       ├── name
│       ├── projectId
│       └── ...
│
└── recurring_invoices/     # NEW - Recurring billing
    └── {recurringId}
        ├── clientId
        ├── frequency
        ├── lineItems[]
        └── ...
```

### Index Requirements

```javascript
// Firestore composite indexes needed

// Payments
{ invoiceId: ASC, paymentDate: DESC }
{ clientId: ASC, paymentDate: DESC }

// Expenses
{ projectId: ASC, expenseDate: DESC }
{ category: ASC, expenseDate: DESC }
{ status: ASC, createdAt: DESC }

// Time Entries
{ userId: ASC, startTime: DESC }
{ ticketId: ASC, startTime: DESC }
{ projectId: ASC, startTime: DESC }

// Inventory
{ category: ASC, name: ASC }
{ currentStock: ASC }  // For low stock queries

// Stock Movements
{ itemId: ASC, createdAt: DESC }
{ projectId: ASC, createdAt: DESC }

// Calendar Events
{ type: ASC, startDate: ASC }
{ assignedTo: ARRAY_CONTAINS, startDate: ASC }

// Documents
{ projectId: ASC, createdAt: DESC }
{ folderId: ASC, name: ASC }
```

---

## API/Service Layer Extensions

### New Services to Create

```typescript
// services/paymentService.ts
export const paymentService = {
  create: (payment: Omit<Payment, 'id'>) => Promise<string>,
  getById: (id: string) => Promise<Payment | null>,
  getByInvoice: (invoiceId: string) => Promise<Payment[]>,
  getByClient: (clientId: string, filters?: PaymentFilters) => Promise<Payment[]>,
  update: (id: string, data: Partial<Payment>) => Promise<void>,
  delete: (id: string) => Promise<void>,
  generatePaymentNumber: () => Promise<string>,
  getPaymentSummary: (invoiceId: string) => Promise<InvoicePaymentSummary>,
};

// services/expenseService.ts
export const expenseService = {
  create: (expense: Omit<Expense, 'id'>) => Promise<string>,
  getById: (id: string) => Promise<Expense | null>,
  getByProject: (projectId: string, filters?: ExpenseFilters) => Promise<Expense[]>,
  getAll: (filters?: ExpenseFilters) => Promise<Expense[]>,
  update: (id: string, data: Partial<Expense>) => Promise<void>,
  delete: (id: string) => Promise<void>,
  generateExpenseNumber: () => Promise<string>,
  getExpenseSummary: (projectId?: string) => Promise<ExpenseSummary>,
};

// services/timeService.ts
export const timeService = {
  startTimer: (data: Omit<TimeEntry, 'id' | 'endTime' | 'duration'>) => Promise<string>,
  stopTimer: (id: string) => Promise<void>,
  createManualEntry: (entry: Omit<TimeEntry, 'id'>) => Promise<string>,
  getByUser: (userId: string, dateRange: DateRange) => Promise<TimeEntry[]>,
  getByTicket: (ticketId: string) => Promise<TimeEntry[]>,
  getTimesheet: (userId: string, weekStart: Date) => Promise<Timesheet>,
  submitTimesheet: (timesheetId: string) => Promise<void>,
  approveTimesheet: (timesheetId: string, approverId: string) => Promise<void>,
};

// services/inventoryService.ts
export const inventoryService = {
  createItem: (item: Omit<InventoryItem, 'id'>) => Promise<string>,
  getItem: (id: string) => Promise<InventoryItem | null>,
  getAllItems: (filters?: InventoryFilters) => Promise<InventoryItem[]>,
  updateItem: (id: string, data: Partial<InventoryItem>) => Promise<void>,
  deleteItem: (id: string) => Promise<void>,
  adjustStock: (itemId: string, adjustment: StockAdjustment) => Promise<void>,
  recordUsage: (itemId: string, usage: StockUsage) => Promise<void>,
  getLowStockItems: () => Promise<InventoryItem[]>,
  getStockMovements: (itemId: string) => Promise<StockMovement[]>,
};

// services/vendorService.ts
export const vendorService = {
  create: (vendor: Omit<Vendor, 'id'>) => Promise<string>,
  getById: (id: string) => Promise<Vendor | null>,
  getAll: (filters?: VendorFilters) => Promise<Vendor[]>,
  update: (id: string, data: Partial<Vendor>) => Promise<void>,
  delete: (id: string) => Promise<void>,
  getPurchaseHistory: (vendorId: string) => Promise<PurchaseOrder[]>,
};

// services/budgetService.ts
export const budgetService = {
  createBudget: (budget: Omit<ProjectBudget, 'id'>) => Promise<string>,
  getBudget: (projectId: string) => Promise<ProjectBudget | null>,
  updateBudget: (id: string, data: Partial<ProjectBudget>) => Promise<void>,
  getBudgetVsActual: (projectId: string) => Promise<BudgetVsActual>,
  getVarianceReport: (projectId: string) => Promise<VarianceReport>,
};

// services/calendarService.ts
export const calendarService = {
  createEvent: (event: Omit<CalendarEvent, 'id'>) => Promise<string>,
  getEvents: (dateRange: DateRange, filters?: EventFilters) => Promise<CalendarEvent[]>,
  updateEvent: (id: string, data: Partial<CalendarEvent>) => Promise<void>,
  deleteEvent: (id: string) => Promise<void>,
  getUpcoming: (userId: string, days: number) => Promise<CalendarEvent[]>,
};

// services/reportService.ts
export const reportService = {
  getRevenueReport: (filters: ReportFilters) => Promise<RevenueReport>,
  getExpenseReport: (filters: ReportFilters) => Promise<ExpenseReport>,
  getProfitLossReport: (filters: ReportFilters) => Promise<ProfitLossReport>,
  getProjectProfitability: (projectId: string) => Promise<ProfitabilityReport>,
  getClientReport: (clientId: string) => Promise<ClientReport>,
  getAgingReport: () => Promise<AgingReport>,
  getTeamPerformance: (filters: ReportFilters) => Promise<TeamPerformanceReport>,
  exportToExcel: (report: any, filename: string) => Promise<Blob>,
  exportToPDF: (report: any, filename: string) => Promise<Blob>,
};

// services/documentService.ts
export const documentService = {
  upload: (file: File, metadata: DocumentMetadata) => Promise<Document>,
  getByProject: (projectId: string) => Promise<Document[]>,
  getByFolder: (folderId: string) => Promise<Document[]>,
  createFolder: (folder: Omit<Folder, 'id'>) => Promise<string>,
  moveDocument: (documentId: string, folderId: string) => Promise<void>,
  deleteDocument: (id: string) => Promise<void>,
  shareDocument: (id: string, userIds: string[]) => Promise<void>,
};
```

### New Custom Hooks

```typescript
// hooks/usePayments.ts
export const usePayments = (invoiceId?: string) => {
  // Fetch and manage payments
};

// hooks/useExpenses.ts
export const useExpenses = (projectId?: string) => {
  // Fetch and manage expenses
};

// hooks/useTimeTracking.ts
export const useTimeTracking = () => {
  // Timer controls and time entries
};

// hooks/useInventory.ts
export const useInventory = () => {
  // Inventory management
};

// hooks/useCalendar.ts
export const useCalendar = (dateRange: DateRange) => {
  // Calendar events
};

// hooks/useReports.ts
export const useReports = (reportType: ReportType) => {
  // Report generation
};

// hooks/useResponsive.ts
export const useResponsive = () => {
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'md'));
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'));
  return { isMobile, isTablet, isDesktop };
};

// hooks/useSwipeActions.ts
export const useSwipeActions = (actions: SwipeAction[]) => {
  // Swipe gesture handling for mobile
};
```

---

## Priority Matrix

### Priority 1: Must Have (Critical for Business)

| Feature | Business Value | Effort | Dependencies |
|---------|---------------|--------|--------------|
| Payment Tracking | Revenue tracking | Medium | Invoice module |
| Client Management UI | Customer relationship | Low | Client model exists |
| Expense Tracking | Cost management | Medium | None |
| Basic Financial Reports | Business insights | Medium | Payments, Expenses |
| Mobile Bottom Navigation | Usability | Low | None |

### Priority 2: Should Have (High Value)

| Feature | Business Value | Effort | Dependencies |
|---------|---------------|--------|--------------|
| Kanban Board | Productivity | Medium | Ticket module |
| Calendar View | Scheduling | Medium | None |
| Time Tracking | Billing accuracy | Medium | None |
| Budget vs Actual | Cost control | Medium | Expense tracking |
| Responsive Tables/Cards | Mobile UX | Medium | None |

### Priority 3: Could Have (Nice to Have)

| Feature | Business Value | Effort | Dependencies |
|---------|---------------|--------|--------------|
| Inventory Management | Resource tracking | High | Vendor module |
| Vendor Management | Supplier relations | Medium | None |
| Email Integration | Communication | Medium | Cloud Functions |
| Recurring Invoices | Automation | Medium | Invoice module |
| Document Management | Organization | Medium | Storage |

### Priority 4: Won't Have (Future Consideration)

| Feature | Business Value | Effort | Dependencies |
|---------|---------------|--------|--------------|
| PWA/Offline Support | Accessibility | High | Service Worker |
| Push Notifications | Engagement | Medium | FCM |
| Advanced Analytics | BI | High | Reports module |
| Multi-tenant | Scale | Very High | Architecture change |

---

## Technical Recommendations

### Performance Optimizations

1. **Code Splitting**
   ```typescript
   // Lazy load pages
   const DashboardPage = lazy(() => import('./pages/dashboard/DashboardPage'));
   const ProjectListPage = lazy(() => import('./pages/projects/ProjectListPage'));
   ```

2. **Virtualization for Long Lists**
   ```typescript
   // Use react-window for large datasets
   import { FixedSizeList } from 'react-window';
   ```

3. **Memoization**
   ```typescript
   // Memoize expensive computations
   const filteredData = useMemo(() =>
     data.filter(item => matchesFilter(item, filters)),
     [data, filters]
   );
   ```

4. **Image Optimization**
   - Use WebP format
   - Implement lazy loading
   - Generate thumbnails for galleries

### Security Best Practices

1. **Firestore Security Rules**
   ```javascript
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       // Ensure proper access control
       match /payments/{paymentId} {
         allow read: if isAuthenticated() && hasPermission('invoices.view');
         allow write: if isAuthenticated() && hasPermission('invoices.create');
       }
     }
   }
   ```

2. **Input Validation**
   - Validate all user inputs
   - Sanitize data before storage
   - Use TypeScript strict mode

3. **Authentication**
   - Implement session timeout
   - Add rate limiting
   - Log security events

### Testing Strategy

1. **Unit Tests**
   - Test utility functions
   - Test custom hooks
   - Test service methods

2. **Integration Tests**
   - Test Firebase interactions
   - Test form submissions
   - Test navigation flows

3. **E2E Tests**
   - Test critical user journeys
   - Test responsive behavior
   - Test cross-browser compatibility

### Monitoring & Logging

1. **Error Tracking**
   - Implement error boundaries
   - Add Sentry or similar service
   - Log errors to Firestore

2. **Analytics**
   - Track page views
   - Track feature usage
   - Monitor performance metrics

3. **Health Checks**
   - Monitor Firebase quotas
   - Track API response times
   - Alert on errors

---

## Appendix

### A. File Structure for New Features

```
src/
├── pages/
│   ├── clients/
│   │   ├── ClientListPage.tsx
│   │   ├── ClientDetailPage.tsx
│   │   ├── ClientFormPage.tsx
│   │   └── index.ts
│   ├── payments/
│   │   ├── PaymentListPage.tsx
│   │   ├── PaymentFormPage.tsx
│   │   ├── PaymentDetailPage.tsx
│   │   └── index.ts
│   ├── expenses/
│   │   ├── ExpenseListPage.tsx
│   │   ├── ExpenseFormPage.tsx
│   │   ├── ExpenseDetailPage.tsx
│   │   └── index.ts
│   ├── reports/
│   │   ├── ReportsPage.tsx
│   │   ├── RevenueReport.tsx
│   │   ├── ExpenseReport.tsx
│   │   ├── ProfitabilityReport.tsx
│   │   └── index.ts
│   ├── calendar/
│   │   ├── CalendarPage.tsx
│   │   └── index.ts
│   ├── timesheet/
│   │   ├── TimesheetPage.tsx
│   │   ├── TimeEntryForm.tsx
│   │   └── index.ts
│   ├── inventory/
│   │   ├── InventoryListPage.tsx
│   │   ├── InventoryItemForm.tsx
│   │   ├── StockMovementPage.tsx
│   │   └── index.ts
│   └── vendors/
│       ├── VendorListPage.tsx
│       ├── VendorDetailPage.tsx
│       ├── VendorFormPage.tsx
│       └── index.ts
├── components/
│   ├── common/
│   │   ├── ResponsiveList.tsx
│   │   ├── ResponsiveTable.tsx
│   │   ├── MobileCard.tsx
│   │   └── SwipeableCard.tsx
│   ├── layout/
│   │   ├── BottomNavigation.tsx
│   │   └── FloatingActionButton.tsx
│   ├── payments/
│   │   ├── PaymentForm.tsx
│   │   ├── PaymentHistory.tsx
│   │   └── PaymentSummary.tsx
│   ├── expenses/
│   │   ├── ExpenseForm.tsx
│   │   ├── ExpenseCard.tsx
│   │   └── CategorySelect.tsx
│   ├── reports/
│   │   ├── ReportFilters.tsx
│   │   ├── ReportChart.tsx
│   │   └── ReportTable.tsx
│   ├── calendar/
│   │   ├── CalendarView.tsx
│   │   ├── EventCard.tsx
│   │   └── EventForm.tsx
│   ├── timesheet/
│   │   ├── Timer.tsx
│   │   ├── TimeEntryRow.tsx
│   │   └── WeeklyView.tsx
│   ├── inventory/
│   │   ├── ItemCard.tsx
│   │   ├── StockBadge.tsx
│   │   └── MovementForm.tsx
│   └── kanban/
│       ├── KanbanBoard.tsx
│       ├── KanbanColumn.tsx
│       └── KanbanCard.tsx
├── services/
│   ├── paymentService.ts
│   ├── expenseService.ts
│   ├── timeService.ts
│   ├── inventoryService.ts
│   ├── vendorService.ts
│   ├── budgetService.ts
│   ├── calendarService.ts
│   ├── reportService.ts
│   └── documentService.ts
└── hooks/
    ├── usePayments.ts
    ├── useExpenses.ts
    ├── useTimeTracking.ts
    ├── useInventory.ts
    ├── useCalendar.ts
    ├── useReports.ts
    ├── useResponsive.ts
    └── useSwipeActions.ts
```

### B. Route Configuration Update

```typescript
// App.tsx route additions
const routes = [
  // Existing routes...

  // Client routes
  { path: '/clients', element: <ClientListPage />, permission: 'clients.view' },
  { path: '/clients/new', element: <ClientFormPage />, permission: 'clients.create' },
  { path: '/clients/:id', element: <ClientDetailPage />, permission: 'clients.view' },
  { path: '/clients/:id/edit', element: <ClientFormPage />, permission: 'clients.edit' },

  // Payment routes
  { path: '/payments', element: <PaymentListPage />, permission: 'payments.view' },
  { path: '/payments/new', element: <PaymentFormPage />, permission: 'payments.create' },
  { path: '/payments/:id', element: <PaymentDetailPage />, permission: 'payments.view' },

  // Expense routes
  { path: '/expenses', element: <ExpenseListPage />, permission: 'expenses.view' },
  { path: '/expenses/new', element: <ExpenseFormPage />, permission: 'expenses.create' },
  { path: '/expenses/:id', element: <ExpenseDetailPage />, permission: 'expenses.view' },
  { path: '/expenses/:id/edit', element: <ExpenseFormPage />, permission: 'expenses.edit' },

  // Report routes
  { path: '/reports', element: <ReportsPage />, permission: 'reports.view' },
  { path: '/reports/revenue', element: <RevenueReport />, permission: 'reports.view' },
  { path: '/reports/expenses', element: <ExpenseReport />, permission: 'reports.view' },
  { path: '/reports/profitability', element: <ProfitabilityReport />, permission: 'reports.view' },

  // Calendar route
  { path: '/calendar', element: <CalendarPage />, permission: 'calendar.view' },

  // Timesheet routes
  { path: '/timesheet', element: <TimesheetPage />, permission: 'timesheet.view' },
  { path: '/timesheet/log', element: <TimeEntryForm />, permission: 'timesheet.create' },

  // Inventory routes
  { path: '/inventory', element: <InventoryListPage />, permission: 'inventory.view' },
  { path: '/inventory/new', element: <InventoryItemForm />, permission: 'inventory.create' },
  { path: '/inventory/:id', element: <InventoryDetailPage />, permission: 'inventory.view' },

  // Vendor routes
  { path: '/vendors', element: <VendorListPage />, permission: 'vendors.view' },
  { path: '/vendors/new', element: <VendorFormPage />, permission: 'vendors.create' },
  { path: '/vendors/:id', element: <VendorDetailPage />, permission: 'vendors.view' },
];
```

### C. New Permissions to Add

```typescript
// Add to Permission type
type Permission =
  // Existing permissions...

  // Client permissions
  | 'clients.view'
  | 'clients.create'
  | 'clients.edit'
  | 'clients.delete'

  // Payment permissions
  | 'payments.view'
  | 'payments.create'
  | 'payments.edit'
  | 'payments.delete'

  // Expense permissions
  | 'expenses.view'
  | 'expenses.create'
  | 'expenses.edit'
  | 'expenses.delete'
  | 'expenses.approve'

  // Timesheet permissions
  | 'timesheet.view'
  | 'timesheet.create'
  | 'timesheet.edit'
  | 'timesheet.approve'

  // Inventory permissions
  | 'inventory.view'
  | 'inventory.create'
  | 'inventory.edit'
  | 'inventory.delete'
  | 'inventory.adjust'

  // Vendor permissions
  | 'vendors.view'
  | 'vendors.create'
  | 'vendors.edit'
  | 'vendors.delete'

  // Calendar permissions
  | 'calendar.view'
  | 'calendar.create'
  | 'calendar.edit'
  | 'calendar.delete'

  // Budget permissions
  | 'budgets.view'
  | 'budgets.create'
  | 'budgets.edit'
  | 'budgets.approve';
```

---

## Conclusion

This implementation plan provides a comprehensive roadmap for transforming the Ticket Management Application into a full-featured business management system. The plan is organized into prioritized phases, ensuring that critical business features are delivered first while maintaining flexibility for future enhancements.

### Key Success Factors

1. **Incremental Delivery** - Deliver features in small, testable increments
2. **User Feedback** - Gather feedback after each sprint
3. **Mobile-First** - Prioritize mobile experience
4. **Performance** - Monitor and optimize continuously
5. **Security** - Implement security best practices from the start

### Next Steps

1. Review and approve the implementation plan
2. Set up development environment for new features
3. Begin Sprint 1 with Client Management and Mobile Navigation
4. Establish regular review cadence

---

*Document prepared for Ticket Management Application Enhancement Project*
