# Firestore Database Schema

## Collections Overview

```
firestore/
├── users/
├── projects/
├── tickets/
├── ticket_comments/
├── quotations/
├── invoices/
├── templates/
├── notifications/
├── settings/
└── counters/
```

---

## 1. Users Collection

**Path:** `users/{userId}`

```typescript
{
  id: string;                    // Firebase Auth UID
  email: string;                 // User email
  displayName: string;           // Full name
  phone?: string;                // Phone number
  role: 'admin' | 'supervisor' | 'worker' | 'client';
  permissions: string[];         // Custom permissions array
  language: 'en' | 'ta';         // Preferred language
  avatarUrl?: string;            // Profile photo URL
  isActive: boolean;             // Account status
  createdAt: Timestamp;
  updatedAt: Timestamp;
  lastLoginAt?: Timestamp;
}
```

**Indexes:**
- `role` (for filtering by role)
- `isActive` (for active users query)

---

## 2. Projects Collection

**Path:** `projects/{projectId}`

```typescript
{
  id: string;                    // Auto-generated
  name: string;                  // Project name
  description: string;           // Project description
  clientName: string;            // Client name
  clientContact?: string;        // Client phone
  clientEmail?: string;          // Client email
  clientAddress?: string;        // Client address
  location: string;              // Project location
  budget: number;                // Budget amount
  startDate: Timestamp;          // Start date
  endDate: Timestamp;            // Expected end date
  status: 'planning' | 'in_progress' | 'on_hold' | 'completed' | 'cancelled';
  progress: number;              // 0-100 percentage
  assignedUsers: string[];       // Array of user IDs
  tags?: string[];               // Project tags
  createdBy: string;             // User ID who created
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

**Indexes:**
- `status` + `createdAt` (for filtered list)
- `assignedUsers` (array-contains for user's projects)
- `createdBy` (for owner queries)

---

## 3. Tickets Collection

**Path:** `tickets/{ticketId}`

```typescript
{
  id: string;                    // Auto-generated
  ticketNumber: string;          // e.g., "TKT-202412-0001"
  title: string;                 // Ticket title
  description: string;           // Detailed description
  projectId: string;             // Reference to project
  location: string;              // Area within project
  category: 'electrical' | 'plumbing' | 'carpentry' | 'painting' |
            'flooring' | 'roofing' | 'hvac' | 'masonry' | 'general' | 'other';
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'open' | 'in_progress' | 'pending' | 'resolved' | 'closed';
  assignedTo: string[];          // Array of user IDs
  dueDate?: Timestamp;           // Due date
  attachments: Attachment[];     // Embedded attachments
  createdBy: string;             // User ID who created
  createdAt: Timestamp;
  updatedAt: Timestamp;
  resolvedAt?: Timestamp;
  closedAt?: Timestamp;
}

// Embedded Attachment type
interface Attachment {
  id: string;
  name: string;
  url: string;
  type: 'image' | 'pdf' | 'document';
  size: number;
  uploadedBy: string;
  uploadedAt: Timestamp;
}
```

**Indexes:**
- `projectId` + `status` + `createdAt`
- `assignedTo` (array-contains)
- `status` + `priority` + `createdAt`
- `ticketNumber` (for search)

---

## 4. Ticket Comments Collection

**Path:** `ticket_comments/{commentId}`

```typescript
{
  id: string;                    // Auto-generated
  ticketId: string;              // Reference to ticket
  userId: string;                // Commenter user ID
  userName: string;              // Denormalized for display
  content: string;               // Comment text
  attachments?: Attachment[];    // Optional attachments
  createdAt: Timestamp;
}
```

**Indexes:**
- `ticketId` + `createdAt`

---

## 5. Quotations Collection

**Path:** `quotations/{quotationId}`

```typescript
{
  id: string;                    // Auto-generated
  quotationNumber: string;       // e.g., "QT-2024-0001"
  projectId: string;             // Reference to project
  businessDetails: {
    companyName: string;
    address: string;
    phone: string;
    email: string;
    gstNumber?: string;
    logoUrl?: string;
  };
  clientDetails: {
    name: string;
    address: string;
    phone?: string;
    email?: string;
    gstNumber?: string;
  };
  lineItems: LineItem[];         // Embedded line items
  financialSummary: {
    subtotal: number;
    discountPercent?: number;
    discountAmount?: number;
    taxPercent?: number;
    taxAmount?: number;
    additionalCharges?: number;
    additionalChargesDescription?: string;
    grandTotal: number;
  };
  issueDate: Timestamp;
  expiryDate: Timestamp;
  status: 'draft' | 'sent' | 'approved' | 'rejected' | 'cancelled';
  notes?: string;
  termsAndConditions?: string;
  templateId?: string;           // Reference to template
  createdBy: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// Embedded LineItem type
interface LineItem {
  id: string;
  name: string;
  description?: string;
  quantity: number;
  unitPrice: number;
  unit?: string;
  total: number;
}
```

**Indexes:**
- `projectId` + `createdAt`
- `status` + `createdAt`
- `quotationNumber` (for search)

---

## 6. Invoices Collection

**Path:** `invoices/{invoiceId}`

```typescript
{
  id: string;                    // Auto-generated
  invoiceNumber: string;         // e.g., "INV-2024-0001"
  quotationId?: string;          // Optional reference to quotation
  projectId: string;             // Reference to project
  ticketIds?: string[];          // Optional references to tickets
  businessDetails: {
    companyName: string;
    address: string;
    phone: string;
    email: string;
    gstNumber?: string;
    logoUrl?: string;
  };
  clientDetails: {
    name: string;
    address: string;
    phone?: string;
    email?: string;
    gstNumber?: string;
  };
  lineItems: LineItem[];         // Embedded line items
  financialSummary: {
    subtotal: number;
    discountPercent?: number;
    discountAmount?: number;
    taxPercent?: number;
    taxAmount?: number;
    additionalCharges?: number;
    additionalChargesDescription?: string;
    grandTotal: number;
  };
  issueDate: Timestamp;
  dueDate: Timestamp;
  paidDate?: Timestamp;
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
  notes?: string;
  termsAndConditions?: string;
  templateId?: string;           // Reference to template
  createdBy: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

**Indexes:**
- `projectId` + `createdAt`
- `status` + `dueDate`
- `invoiceNumber` (for search)
- `quotationId` (for linking)

---

## 7. Templates Collection

**Path:** `templates/{templateId}`

```typescript
{
  id: string;
  name: string;                  // Template name
  type: 'quotation' | 'invoice';
  layout: 'modern' | 'classic' | 'minimal';
  primaryColor: string;          // Hex color
  secondaryColor: string;        // Hex color
  fontFamily: string;
  logoPosition: 'left' | 'center' | 'right';
  showGst: boolean;
  showDiscount: boolean;
  showAdditionalCharges: boolean;
  customFields?: Array<{
    label: string;
    value: string;
  }>;
  isDefault: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

---

## 8. Notifications Collection

**Path:** `notifications/{notificationId}`

```typescript
{
  id: string;
  userId: string;                // Recipient user ID
  type: 'ticket_assigned' | 'ticket_status_changed' | 'ticket_comment' |
        'project_deadline' | 'invoice_generated' | 'invoice_overdue' |
        'quotation_approved' | 'quotation_rejected';
  title: string;
  message: string;
  data?: {                       // Contextual data
    projectId?: string;
    ticketId?: string;
    invoiceId?: string;
    quotationId?: string;
  };
  isRead: boolean;
  createdAt: Timestamp;
}
```

**Indexes:**
- `userId` + `isRead` + `createdAt` (for user's unread notifications)

---

## 9. Settings Collection

**Path:** `settings/app`

```typescript
{
  id: 'app';                     // Singleton document
  businessDetails: {
    companyName: string;
    address: string;
    phone: string;
    email: string;
    gstNumber?: string;
    logoUrl?: string;
  };
  currency: string;              // e.g., "INR"
  currencySymbol: string;        // e.g., "₹"
  defaultLanguage: 'en' | 'ta';
  enableTax: boolean;
  defaultTaxPercent: number;
  enableDiscount: boolean;
  enableAdditionalCharges: boolean;
  quotationPrefix: string;       // e.g., "QT"
  invoicePrefix: string;         // e.g., "INV"
  ticketPrefix: string;          // e.g., "TKT"
  defaultPaymentTerms: number;   // Days
  termsAndConditions: string;
  updatedAt: Timestamp;
}
```

---

## 10. Counters Collection

**Path:** `counters/{counterType}`

Used for generating sequential document numbers.

```typescript
// counters/tickets
{
  id: 'tickets';
  prefix: 'TKT';
  lastNumber: number;            // e.g., 42
  lastMonth: string;             // e.g., "202412"
}

// counters/quotations
{
  id: 'quotations';
  prefix: 'QT';
  lastNumber: number;
  lastYear: string;              // e.g., "2024"
}

// counters/invoices
{
  id: 'invoices';
  prefix: 'INV';
  lastNumber: number;
  lastYear: string;
}
```

---

## Security Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Helper functions
    function isAuthenticated() {
      return request.auth != null;
    }

    function isAdmin() {
      return isAuthenticated() &&
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }

    function hasPermission(permission) {
      return isAuthenticated() &&
        permission in get(/databases/$(database)/documents/users/$(request.auth.uid)).data.permissions;
    }

    function isOwner(userId) {
      return isAuthenticated() && request.auth.uid == userId;
    }

    // Users collection
    match /users/{userId} {
      allow read: if isAuthenticated();
      allow create: if isAdmin();
      allow update: if isOwner(userId) || isAdmin();
      allow delete: if isAdmin();
    }

    // Projects collection
    match /projects/{projectId} {
      allow read: if hasPermission('projects.view');
      allow create: if hasPermission('projects.create');
      allow update: if hasPermission('projects.edit');
      allow delete: if hasPermission('projects.delete');
    }

    // Tickets collection
    match /tickets/{ticketId} {
      allow read: if hasPermission('tickets.view');
      allow create: if hasPermission('tickets.create');
      allow update: if hasPermission('tickets.edit');
      allow delete: if hasPermission('tickets.delete');
    }

    // Ticket comments
    match /ticket_comments/{commentId} {
      allow read: if hasPermission('tickets.view');
      allow create: if hasPermission('tickets.view');
      allow update, delete: if isOwner(resource.data.userId) || isAdmin();
    }

    // Quotations
    match /quotations/{quotationId} {
      allow read: if hasPermission('quotations.view');
      allow create: if hasPermission('quotations.create');
      allow update: if hasPermission('quotations.edit');
      allow delete: if hasPermission('quotations.delete');
    }

    // Invoices
    match /invoices/{invoiceId} {
      allow read: if hasPermission('invoices.view');
      allow create: if hasPermission('invoices.create');
      allow update: if hasPermission('invoices.edit');
      allow delete: if hasPermission('invoices.delete');
    }

    // Templates
    match /templates/{templateId} {
      allow read: if isAuthenticated();
      allow write: if isAdmin();
    }

    // Notifications
    match /notifications/{notificationId} {
      allow read: if isOwner(resource.data.userId);
      allow update: if isOwner(resource.data.userId);
      allow create, delete: if isAdmin();
    }

    // Settings (singleton)
    match /settings/{settingId} {
      allow read: if isAuthenticated();
      allow write: if hasPermission('settings.manage');
    }

    // Counters (internal use)
    match /counters/{counterId} {
      allow read, write: if isAuthenticated();
    }
  }
}
```

---

## Storage Structure

```
storage/
├── logos/
│   └── {userId}/
│       └── logo.{ext}
├── projects/
│   └── {projectId}/
│       └── {attachmentId}.{ext}
├── tickets/
│   └── {ticketId}/
│       └── {attachmentId}.{ext}
└── avatars/
    └── {userId}/
        └── avatar.{ext}
```

---

## Index Configuration (firestore.indexes.json)

```json
{
  "indexes": [
    {
      "collectionGroup": "projects",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "status", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "tickets",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "projectId", "order": "ASCENDING" },
        { "fieldPath": "status", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "tickets",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "status", "order": "ASCENDING" },
        { "fieldPath": "priority", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "invoices",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "status", "order": "ASCENDING" },
        { "fieldPath": "dueDate", "order": "ASCENDING" }
      ]
    },
    {
      "collectionGroup": "notifications",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "userId", "order": "ASCENDING" },
        { "fieldPath": "isRead", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    }
  ]
}
```
