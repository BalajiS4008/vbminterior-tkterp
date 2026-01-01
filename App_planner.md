Below is the **regenerated, consolidated planner** for the **Construction / Interior Ticket Management App**, with the **Quotation & Invoice module fully integrated**, delivered **strictly in Markdown format** and structured for **AI agent handling, parsing, and future automation**.

---

# 📘 Construction Ticket Management App – Master Planner

*(React + Firebase | Mobile First | Bilingual | WCAG | AI-Agent Ready)*

---

## 1. App Overview

A **premium, mobile-responsive web application** designed for **interior and construction businesses** to manage:

* Multiple projects
* Tickets & site issues
* Project timelines & progress
* Quotations & invoices
* Media (images, PDFs)
* Role-based workflows

Built using:

* **React (latest)**
* **Firebase (Auth, Firestore, Storage, FCM)**
* **English / Tamil localization**
* **WCAG 2.1 AA accessibility compliance**

---

## 2. Core Goals

* Handle **multiple projects simultaneously**
* Provide **role-based access** for Admin, Supervisor, Worker, Client
* Enable **real-time collaboration**
* Support **field usage on mobile**
* Generate **professional quotations & invoices**
* Ensure **high performance, no memory leaks**
* Be **AI-agent friendly** (clean structure, predictable schemas)

---

## 3. Technology Stack

### Frontend

* React (latest)
* TypeScript (recommended)
* React Router
* React Query / TanStack Query
* i18next (English / Tamil)
* MUI / Ant Design (accessible components)
* PDF generation (pdf-lib / jsPDF)
* Charting (Recharts)

### Backend (Firebase)

* Firebase Authentication
* Firestore (NoSQL DB)
* Firebase Storage (media)
* Firebase Cloud Messaging (notifications)
* Firebase Security Rules

---

## 4. Roles & Permissions

### Default Roles

| Role                             | Capabilities                          |
| -------------------------------- | ------------------------------------- |
| **Admin**                        | Full access, settings, billing, users |
| **Project Manager / Supervisor** | Projects, tickets, limited billing    |
| **Worker / Technician**          | Assigned tickets only                 |
| **Client (Optional)**            | View-only (projects, invoices)        |

### Permission Matrix (Configurable)

* Create/Edit/Delete Projects
* Create/Edit/Delete Tickets
* Upload Media
* Generate Quotations
* Generate Invoices
* Download PDFs
* View Financial Data
* Manage Users & Roles

> Admin has all permissions by default.
> Other roles can be granted permissions via **Settings → Role Management**.

---

## 5. App Pages (Route Planner)

### 5.1 Authentication

* Login
* Forgot Password
* Role-based redirect after login

---

### 5.2 Dashboard (Role-Based)

* Project summary
* Ticket status counts
* Pending invoices
* Alerts & notifications
* Quick actions

---

### 5.3 Project Management

#### Pages

* Project List
* Project Detail

#### Features

* Project info (client, budget, timeline)
* Gantt / timeline view
* Linked tickets
* Linked quotations & invoices
* Document repository

---

### 5.4 Ticket Management

#### Ticket Fields

* Ticket ID
* Title
* Description
* Project
* Location / Area
* Category
* Priority
* Status
* Assigned users
* Due date
* Attachments (images, PDFs)
* Activity log & comments

#### Pages

* Ticket List (filters, search)
* Ticket Detail
* Create / Edit Ticket

---

### 5.5 Media Management

* Image uploads (site photos)
* PDF uploads (drawings, approvals)
* Preview support
* Stored in Firebase Storage
* Linked to tickets/projects

---

## 6. 📄 Quotation & Invoice Module (Integrated)

### 6.1 Document Types

* Quotation (Estimate)
* Invoice

Both share a **common engine** with template-level configuration.

---

### 6.2 Core Fields (Default)

#### Business Details

* Company name
* Address
* GST / Tax ID
* Logo

#### Client Details

* Client name
* Address
* Contact info

#### Document Metadata

* Quotation / Invoice number (auto-generated)
* Issue date
* Expiry date (Quotation)
* Due date (Invoice)
* Status (Draft, Sent, Paid, Cancelled)

#### Line Items

* Item name
* Description
* Quantity
* Unit price
* Line total

#### Financial Summary

* Subtotal
* Discount (optional)
* Tax (optional)
* Additional charges (optional)
* Grand total

#### Footer

* Notes
* Terms & conditions
* Authorized signature (optional)

---

### 6.3 Field Control (Settings-Driven)

Admin-configurable toggles:

* Enable / disable tax
* Enable / disable discount
* Enable additional charges
* Custom fields (label + value)
* Currency selection
* Rounding rules

> These controls live in **Settings → Invoice Configuration**

---

### 6.4 Templates (Premium UI)

* Multiple templates supported
* Template properties:

  * Layout (modern, classic, minimal)
  * Color theme
  * Font style
  * Logo placement
  * Field visibility

Templates can be assigned:

* By client type
* By project
* By role

---

### 6.5 Linking Logic

* Invoice ↔ Project (mandatory)
* Invoice ↔ Ticket (optional, multi-link)
* Quotation ↔ Project
* One quotation → multiple invoices (future-ready)

---

### 6.6 PDF Generation

* Download as PDF
* Print-ready layout
* Watermark for Draft
* Language-aware (English / Tamil)
* Secure (read-only)

---

### 6.7 Permissions

| Action                  | Default |
| ----------------------- | ------- |
| Create Quote            | Admin   |
| Convert Quote → Invoice | Admin   |
| Download PDF            | Admin   |
| Grant Access            | Admin   |

Optional permissions can be assigned to:

* Project Managers
* Finance users

---

## 7. Notifications System

### Types

* In-app notifications
* Push notifications (FCM)

### Triggers

* Ticket assigned
* Status change
* Invoice generated
* Invoice overdue
* Project deadline approaching

---

## 8. Localization (English / Tamil)

* Default language configurable
* User-level language preference
* Dynamic runtime switching
* Tamil Unicode-safe fonts
* PDF language support

---

## 9. Accessibility (WCAG 2.1 AA)

* Semantic HTML
* Keyboard navigation
* Focus indicators
* ARIA labels
* Screen-reader support
* Color contrast compliance
* Error messaging via `aria-live`

---

## 10. Performance & Memory Safety

### Best Practices

* Route-based code splitting
* Lazy loading heavy modules
* Cleanup `useEffect` listeners
* Memoization for lists
* Virtualized tables
* Image compression
* Firebase query pagination

---

## 11. Firebase Data Model (High-Level)

### Collections

* users
* roles
* projects
* tickets
* ticket_comments
* quotations
* invoices
* templates
* settings
* notifications

---

## 12. Mobile-First Design

* Responsive layouts
* Touch-friendly controls
* Offline-ready (PWA optional)
* Optimized for field usage

---

## 13. Future Enhancements (Optional)

* Offline sync
* Client payment gateway
* GST reports
* Accounting export
* AI-based cost estimation
* WhatsApp invoice sharing

---

## 14. AI-Agent Compatibility Notes

* Predictable section headers
* Flat, logical hierarchy
* Clear responsibility boundaries
* Config-first architecture
* Schema-driven documents

---

### ✅ This planner now fully includes:

* Ticket management
* Project management
* Media uploads
* Notifications
* **Quotation & Invoice generation**
* Role-based access
* Performance & accessibility
* Mobile responsiveness
* Markdown-only format

If you want next steps, I can:

* Convert this into **Firestore schema**
* Provide **React folder structure**
* Design **Invoice PDF layout spec**
* Create **role-permission JSON**
* Generate **user stories / epics**
