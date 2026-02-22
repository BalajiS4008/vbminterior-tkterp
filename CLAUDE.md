# CLAUDE.md — VBM Interior Construction Ticket Manager

## Project Overview

A **Construction & Interior Business Management PWA** built for VBM Interior. It manages projects, tickets (site issues), clients, quotations, invoices, payments, expenses, timesheets, and reporting. The application is bilingual (English / Tamil) with role-based access control and targets mobile-first field usage on construction sites.

**Live Firebase project:** `vbm-tktmngt`

---

## Tech Stack

| Layer          | Technology                                               |
| -------------- | -------------------------------------------------------- |
| Framework      | React 19 + TypeScript 5.9 (strict mode)                 |
| Build          | Vite 7 (`@vitejs/plugin-react`)                          |
| UI Library     | MUI (Material UI) v7 + Emotion                          |
| State / Data   | TanStack React Query v5, React Context                   |
| Routing        | React Router DOM v7                                      |
| Backend        | Firebase (Auth, Firestore, Storage)                      |
| i18n           | i18next + react-i18next (English `en` / Tamil `ta`)     |
| Charts         | Recharts + React Three Fiber / Drei (3D dashboard)       |
| PDF            | jsPDF                                                    |
| Drag & Drop    | @dnd-kit (Kanban board)                                  |
| PWA            | vite-plugin-pwa + Workbox                                |
| Linting        | ESLint 9 flat config + typescript-eslint + react-hooks   |
| Package Mgr    | npm (lockfile v3)                                        |

---

## Commands

```bash
npm run dev        # Start Vite dev server with HMR
npm run build      # TypeScript check (tsc -b) then Vite production build
npm run lint       # ESLint across all .ts/.tsx files
npm run preview    # Preview production build locally
```

There is **no test framework** configured. No `test` script exists.

---

## Project Structure

```
/
├── index.html                  # SPA entry point (root div + PWA meta)
├── package.json                # Dependencies and scripts
├── vite.config.ts              # Vite + PWA plugin config
├── tsconfig.json               # References tsconfig.app.json + tsconfig.node.json
├── tsconfig.app.json           # App TS config (strict, ES2022, noUnusedLocals)
├── eslint.config.js            # ESLint flat config
├── firestore.indexes.json      # Firestore composite index definitions
├── .env.example                # Template for Firebase env vars
├── App_planner.md              # Master feature planner document
├── IMPLEMENTATION_PLAN.md      # Detailed implementation plan
├── docs/
│   ├── firestore-schema.md     # Firestore collection schemas
│   └── role-permissions.json   # Role-permission matrix
├── scripts/                    # Utility scripts (test.js, u.js)
├── src/
│   ├── main.tsx                # React root (StrictMode + createRoot)
│   ├── App.tsx                 # Router, providers, lazy-loaded routes
│   ├── App.css                 # Minimal global CSS
│   ├── index.css               # Base styles
│   ├── vite-env.d.ts           # Vite client type declarations
│   ├── config/                 # App configuration
│   │   ├── firebase.ts         # Firebase init (auth, db, storage exports)
│   │   ├── constants.ts        # Routes, status options, categories, colors
│   │   ├── permissions.ts      # Permission definitions & role-permission mapping
│   │   ├── i18n.ts             # i18next initialization
│   │   ├── theme.ts            # MUI light/dark theme definitions
│   │   └── statusColors.ts     # Status-to-color mappings
│   ├── types/
│   │   └── index.ts            # All TypeScript interfaces and type unions
│   ├── contexts/
│   │   ├── AuthContext.tsx      # Firebase auth + Firestore user data + permissions
│   │   ├── ThemeContext.tsx     # Light/dark mode toggle
│   │   ├── NotificationContext.tsx  # In-app notification snackbar
│   │   └── index.ts            # Barrel export
│   ├── hooks/
│   │   ├── useFirestore.ts     # Generic Firestore CRUD hook
│   │   ├── useRealtimeData.ts  # Real-time Firestore subscriptions
│   │   ├── useRoleBasedData.ts # Data hooks filtered by user role/permissions
│   │   ├── useMediaUpload.ts   # Firebase Storage upload with progress
│   │   ├── useDebounce.ts      # Debounced values and callbacks
│   │   ├── usePWA.ts           # PWA install prompt handling
│   │   ├── usePushNotifications.ts  # FCM push notifications
│   │   ├── useSwipeActions.ts  # Mobile swipe gesture handling
│   │   ├── usePullToRefresh.ts # Pull-to-refresh gesture
│   │   └── index.ts            # Barrel export
│   ├── services/               # Firestore data access layer
│   │   ├── projectService.ts
│   │   ├── ticketService.ts
│   │   ├── clientService.ts
│   │   ├── invoiceService.ts
│   │   ├── quotationService.ts
│   │   ├── paymentService.ts
│   │   ├── expenseService.ts
│   │   ├── timeEntryService.ts
│   │   ├── userService.ts
│   │   ├── activityService.ts
│   │   ├── notificationService.ts
│   │   ├── settingsService.ts
│   │   ├── pdfService.ts       # jsPDF-based PDF generation
│   │   ├── reportService.ts    # Aggregate report calculations
│   │   ├── pushNotificationService.ts
│   │   └── index.ts            # Barrel export
│   ├── utils/
│   │   ├── formatters.ts       # Currency, date, number formatting
│   │   ├── validators.ts       # Form validation helpers
│   │   ├── generators.ts       # ID/number generators
│   │   ├── calculations.ts     # Financial calculations
│   │   ├── dateRangeUtils.ts   # Date range utilities
│   │   └── index.ts            # Barrel export
│   ├── components/
│   │   ├── common/             # Shared UI components
│   │   │   ├── LoadingSpinner.tsx
│   │   │   ├── ProtectedRoute.tsx   # Permission-gated route wrapper
│   │   │   ├── PageHeader.tsx
│   │   │   ├── StatusChip.tsx
│   │   │   ├── EmptyState.tsx
│   │   │   ├── ConfirmDialog.tsx
│   │   │   ├── AdvancedFilters.tsx
│   │   │   ├── ActivityTimeline.tsx
│   │   │   ├── ResponsiveList.tsx
│   │   │   ├── PWAPrompt.tsx
│   │   │   ├── PullToRefresh.tsx
│   │   │   ├── SwipeableListItem.tsx
│   │   │   ├── CameraCapture.tsx
│   │   │   └── index.ts
│   │   ├── layout/
│   │   │   ├── MainLayout.tsx       # Sidebar + Header + BottomNav shell
│   │   │   ├── AuthLayout.tsx       # Login/auth page layout
│   │   │   ├── Sidebar.tsx
│   │   │   ├── Header.tsx
│   │   │   ├── BottomNavigation.tsx  # Mobile bottom nav
│   │   │   └── index.ts
│   │   ├── dashboard/          # 3D chart components (Three.js)
│   │   ├── invoices/           # LineItemsEditor, FinancialSummaryEditor
│   │   ├── kanban/             # KanbanBoard, KanbanColumn, KanbanCard
│   │   ├── media/              # FileUploader, ImageGallery
│   │   └── settings/           # NotificationSettings, PermissionEditor
│   ├── pages/
│   │   ├── auth/               # LoginPage, ForgotPasswordPage
│   │   ├── dashboard/          # DashboardPage, NotificationsPage
│   │   ├── projects/           # List, Detail, Form pages
│   │   ├── tickets/            # List, Detail, Form, KanbanBoard pages
│   │   ├── clients/            # List, Detail, Form pages
│   │   ├── invoices/           # Invoice + Quotation List, Detail, Form pages
│   │   ├── payments/           # List, Detail, Form pages
│   │   ├── expenses/           # List, Detail, Form pages
│   │   ├── timesheet/          # TimesheetPage, TimeEntryFormPage
│   │   ├── calendar/           # CalendarPage
│   │   ├── reports/            # ReportsPage + 5 report sub-pages
│   │   ├── settings/           # SettingsPage, UserManagement
│   │   └── NotFoundPage.tsx
│   └── locales/
│       ├── en/translation.json # English translations
│       └── ta/translation.json # Tamil translations
└── public/                     # Static assets (PWA icons)
```

---

## Architecture & Key Patterns

### Provider Stack (App.tsx)

Providers wrap the entire app in this order:
```
QueryClientProvider → ThemeProvider → AuthProvider → NotificationProvider → BrowserRouter
```

### Routing

- All routes defined in `src/App.tsx` using React Router v7
- Route constants in `src/config/constants.ts` (`ROUTES` object)
- Pages are **lazy-loaded** with `React.lazy()` and wrapped in `<Suspense>`
- Protected routes use `<ProtectedRoute requiredPermission="...">` component
- Auth routes use `<AuthLayout />`, protected routes use `<MainLayout />`

### Authentication & Authorization

- Firebase Authentication (email/password)
- User profile stored in Firestore `users` collection
- `AuthContext` provides: `currentUser`, `userData`, `hasPermission()`, `hasAnyPermission()`
- 4 roles: `admin`, `supervisor`, `worker`, `client`
- Permissions follow `entity.action` format (e.g., `projects.view`, `tickets.create`)
- Default permissions per role defined in `src/config/permissions.ts`
- Custom per-user permission additions/removals supported

### Data Layer

- All Firestore operations go through service files in `src/services/`
- Each service is a singleton object (e.g., `projectService`, `ticketService`)
- Services handle CRUD operations, queries with filters, and pagination
- Real-time data uses custom hooks in `src/hooks/useRealtimeData.ts` (Firestore `onSnapshot`)
- Role-based data filtering in `src/hooks/useRoleBasedData.ts`
- TanStack React Query used with 5-minute stale time, 1 retry

### Firestore Collections

Primary collections: `users`, `projects`, `tickets`, `ticket_comments`, `quotations`, `invoices`, `payments`, `expenses`, `timeEntries`, `notifications`, `settings`, `activityLogs`

Composite indexes defined in `firestore.indexes.json` (notifications by userId + createdAt).

### i18n (Internationalization)

- Two languages: English (`en`) and Tamil (`ta`)
- Translation files: `src/locales/{en,ta}/translation.json`
- Initialized in `src/config/i18n.ts`
- Language preference saved to localStorage (`user_language` key)
- Many constants include bilingual labels (`labelEn` / `labelTa`)
- Use `useTranslation()` hook from react-i18next in components

### Theming

- MUI-based light and dark themes in `src/config/theme.ts`
- Primary: `#1976D2` (blue), Secondary: `#FF6F00` (construction orange)
- Font stack: Inter, system fonts, Noto Sans Tamil
- `ThemeContext` manages light/dark mode toggle (persisted to localStorage)

### PWA

- Configured via `vite-plugin-pwa` in `vite.config.ts`
- Service worker auto-updates
- Workbox runtime caching for Firestore API and Google Fonts
- PWA install prompt handled by `usePWA` hook and `PWAPrompt` component

### Mobile-First Features

- `BottomNavigation` component for mobile
- Swipe gestures (`useSwipeActions`, `SwipeableListItem`)
- Pull-to-refresh (`usePullToRefresh`)
- Camera capture (`CameraCapture` component)
- Responsive list layouts (`ResponsiveList`)

---

## Type System

All TypeScript types are centralized in `src/types/index.ts`. Key types:

- **Roles:** `UserRole = 'admin' | 'supervisor' | 'worker' | 'client'`
- **Permissions:** String union type (`Permission`) with `entity.action` format
- **Entities:** `Project`, `Ticket`, `Client`, `Quotation`, `Invoice`, `Payment`, `Expense`, `TimeEntry`
- **Statuses:** Separate status types per entity (e.g., `TicketStatus`, `ProjectStatus`, `InvoiceStatus`)
- **Filters:** Typed filter interfaces per entity (e.g., `TicketFilters`, `ProjectFilters`)

TypeScript is configured with strict mode, `noUnusedLocals`, `noUnusedParameters`, and `erasableSyntaxOnly`.

---

## Environment Variables

Firebase credentials via Vite env vars (prefixed with `VITE_`):

```
VITE_FIREBASE_API_KEY
VITE_FIREBASE_AUTH_DOMAIN
VITE_FIREBASE_PROJECT_ID
VITE_FIREBASE_STORAGE_BUCKET
VITE_FIREBASE_MESSAGING_SENDER_ID
VITE_FIREBASE_APP_ID
VITE_FIREBASE_MEASUREMENT_ID
```

Fallback values are hardcoded in `src/config/firebase.ts` for development.

Create `.env.local` from `.env.example` for local overrides.

---

## Conventions

### File Naming

- Pages: `PascalCase` with `Page` suffix (e.g., `ProjectListPage.tsx`, `TicketDetailPage.tsx`)
- Components: `PascalCase` (e.g., `LoadingSpinner.tsx`, `StatusChip.tsx`)
- Services: `camelCase` with `Service` suffix (e.g., `projectService.ts`)
- Hooks: `camelCase` with `use` prefix (e.g., `useFirestore.ts`, `useRealtimeData.ts`)
- Barrel exports via `index.ts` in each directory

### Page Pattern

Each entity follows a consistent CRUD page pattern:
- `{Entity}ListPage.tsx` — List view with filters
- `{Entity}DetailPage.tsx` — Detail/show view
- `{Entity}FormPage.tsx` — Create/edit form (same component, mode detected by route param)

### Component Organization

- `components/common/` — Reusable UI primitives
- `components/layout/` — App shell (sidebar, header, nav)
- `components/{feature}/` — Feature-specific components used by pages
- `pages/{feature}/` — Route-level page components

### Service Pattern

Services are objects with methods that interact with Firestore:
```typescript
export const entityService = {
  getAll: async (filters?) => { ... },
  getById: async (id: string) => { ... },
  create: async (data) => { ... },
  update: async (id: string, data) => { ... },
  delete: async (id: string) => { ... },
};
```

### Constants & Configuration

- All route paths in `ROUTES` constant (`src/config/constants.ts`)
- Status/category options include bilingual labels
- Colors for statuses defined as `const` objects
- App settings (currency, prefixes, tax config) stored in Firestore `settings` collection

---

## Currency & Locale

- Default currency: INR (Indian Rupee, symbol `₹`)
- Date format: `dd/MM/yyyy` (using date-fns)
- ID prefixes: `TKT-` (tickets), `QT-` (quotations), `INV-` (invoices)

---

## Known Cavebase Notes

- `src/pages/tickets/TicketListPage.tsx.bak` and `TicketListPage_new.tsx` are backup/WIP files
- Firebase credentials have hardcoded fallbacks in `firebase.ts` (acceptable for this project)
- No test suite configured — there are no test files or test dependencies
- ESLint uses flat config format (ESLint 9+)
- The 3D dashboard charts use React Three Fiber (Three.js) — these are in `src/components/dashboard/`
