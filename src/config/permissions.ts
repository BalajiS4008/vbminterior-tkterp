import type { Permission, UserRole } from '../types';

// Permission categories for UI grouping
export type PermissionCategory = 'projects' | 'tickets' | 'documents' | 'media' | 'admin';

export interface PermissionInfo {
  key: Permission;
  category: PermissionCategory;
  label: { en: string; ta: string };
  description: { en: string; ta: string };
}

// All permissions with their metadata
export const allPermissions: PermissionInfo[] = [
  // Projects
  { key: 'projects.view', category: 'projects', label: { en: 'View Projects', ta: 'திட்டங்களைக் காண்' }, description: { en: 'View project details and list', ta: 'திட்ட விவரங்களைப் பார்க்கவும்' } },
  { key: 'projects.create', category: 'projects', label: { en: 'Create Projects', ta: 'திட்டங்களை உருவாக்கு' }, description: { en: 'Create new projects', ta: 'புதிய திட்டங்களை உருவாக்கவும்' } },
  { key: 'projects.edit', category: 'projects', label: { en: 'Edit Projects', ta: 'திட்டங்களைத் திருத்து' }, description: { en: 'Modify existing projects', ta: 'ஏற்கனவே உள்ள திட்டங்களை மாற்றவும்' } },
  { key: 'projects.delete', category: 'projects', label: { en: 'Delete Projects', ta: 'திட்டங்களை நீக்கு' }, description: { en: 'Remove projects permanently', ta: 'திட்டங்களை நிரந்தரமாக நீக்கவும்' } },
  // Tickets
  { key: 'tickets.view', category: 'tickets', label: { en: 'View Tickets', ta: 'டிக்கெட்டுகளைக் காண்' }, description: { en: 'View ticket details and list', ta: 'டிக்கெட் விவரங்களைப் பார்க்கவும்' } },
  { key: 'tickets.create', category: 'tickets', label: { en: 'Create Tickets', ta: 'டிக்கெட்டுகளை உருவாக்கு' }, description: { en: 'Create new tickets', ta: 'புதிய டிக்கெட்டுகளை உருவாக்கவும்' } },
  { key: 'tickets.edit', category: 'tickets', label: { en: 'Edit Tickets', ta: 'டிக்கெட்டுகளைத் திருத்து' }, description: { en: 'Modify existing tickets', ta: 'ஏற்கனவே உள்ள டிக்கெட்டுகளை மாற்றவும்' } },
  { key: 'tickets.delete', category: 'tickets', label: { en: 'Delete Tickets', ta: 'டிக்கெட்டுகளை நீக்கு' }, description: { en: 'Remove tickets permanently', ta: 'டிக்கெட்டுகளை நிரந்தரமாக நீக்கவும்' } },
  { key: 'tickets.assign', category: 'tickets', label: { en: 'Assign Tickets', ta: 'டிக்கெட்டுகளை ஒதுக்கு' }, description: { en: 'Assign tickets to users', ta: 'பயனர்களுக்கு டிக்கெட்டுகளை ஒதுக்கவும்' } },
  // Documents (Quotations & Invoices)
  { key: 'quotations.view', category: 'documents', label: { en: 'View Quotations', ta: 'மேற்கோள்களைக் காண்' }, description: { en: 'View quotation details and list', ta: 'மேற்கோள் விவரங்களைப் பார்க்கவும்' } },
  { key: 'quotations.create', category: 'documents', label: { en: 'Create Quotations', ta: 'மேற்கோள்களை உருவாக்கு' }, description: { en: 'Create new quotations', ta: 'புதிய மேற்கோள்களை உருவாக்கவும்' } },
  { key: 'quotations.edit', category: 'documents', label: { en: 'Edit Quotations', ta: 'மேற்கோள்களைத் திருத்து' }, description: { en: 'Modify existing quotations', ta: 'ஏற்கனவே உள்ள மேற்கோள்களை மாற்றவும்' } },
  { key: 'quotations.delete', category: 'documents', label: { en: 'Delete Quotations', ta: 'மேற்கோள்களை நீக்கு' }, description: { en: 'Remove quotations permanently', ta: 'மேற்கோள்களை நிரந்தரமாக நீக்கவும்' } },
  { key: 'invoices.view', category: 'documents', label: { en: 'View Invoices', ta: 'விலைப்பட்டிகளைக் காண்' }, description: { en: 'View invoice details and list', ta: 'விலைப்பட்டி விவரங்களைப் பார்க்கவும்' } },
  { key: 'invoices.create', category: 'documents', label: { en: 'Create Invoices', ta: 'விலைப்பட்டிகளை உருவாக்கு' }, description: { en: 'Create new invoices', ta: 'புதிய விலைப்பட்டிகளை உருவாக்கவும்' } },
  { key: 'invoices.edit', category: 'documents', label: { en: 'Edit Invoices', ta: 'விலைப்பட்டிகளைத் திருத்து' }, description: { en: 'Modify existing invoices', ta: 'ஏற்கனவே உள்ள விலைப்பட்டிகளை மாற்றவும்' } },
  { key: 'invoices.delete', category: 'documents', label: { en: 'Delete Invoices', ta: 'விலைப்பட்டிகளை நீக்கு' }, description: { en: 'Remove invoices permanently', ta: 'விலைப்பட்டிகளை நிரந்தரமாக நீக்கவும்' } },
  { key: 'invoices.download', category: 'documents', label: { en: 'Download Invoices', ta: 'விலைப்பட்டிகளைப் பதிவிறக்கு' }, description: { en: 'Download invoice PDFs', ta: 'விலைப்பட்டி PDFகளை பதிவிறக்கவும்' } },
  // Media
  { key: 'media.upload', category: 'media', label: { en: 'Upload Media', ta: 'மீடியாவை பதிவேற்று' }, description: { en: 'Upload images and files', ta: 'படங்களையும் கோப்புகளையும் பதிவேற்றவும்' } },
  { key: 'media.delete', category: 'media', label: { en: 'Delete Media', ta: 'மீடியாவை நீக்கு' }, description: { en: 'Remove uploaded files', ta: 'பதிவேற்றிய கோப்புகளை நீக்கவும்' } },
  // Admin
  { key: 'users.manage', category: 'admin', label: { en: 'Manage Users', ta: 'பயனர்களை நிர்வகி' }, description: { en: 'Create, edit and delete users', ta: 'பயனர்களை உருவாக்கவும், திருத்தவும், நீக்கவும்' } },
  { key: 'settings.manage', category: 'admin', label: { en: 'Manage Settings', ta: 'அமைப்புகளை நிர்வகி' }, description: { en: 'Configure application settings', ta: 'பயன்பாட்டு அமைப்புகளை உள்ளமைக்கவும்' } },
  { key: 'reports.view', category: 'admin', label: { en: 'View Reports', ta: 'அறிக்கைகளைக் காண்' }, description: { en: 'Access analytics and reports', ta: 'பகுப்பாய்வு மற்றும் அறிக்கைகளை அணுகவும்' } },
];

// Permission category labels
export const permissionCategoryLabels: Record<PermissionCategory, { en: string; ta: string }> = {
  projects: { en: 'Projects', ta: 'திட்டங்கள்' },
  tickets: { en: 'Tickets', ta: 'டிக்கெட்டுகள்' },
  documents: { en: 'Quotations & Invoices', ta: 'மேற்கோள்கள் & விலைப்பட்டிகள்' },
  media: { en: 'Media', ta: 'மீடியா' },
  admin: { en: 'Administration', ta: 'நிர்வாகம்' },
};

// Get permissions grouped by category
export const getPermissionsByCategory = (): Record<PermissionCategory, PermissionInfo[]> => {
  return allPermissions.reduce((acc, perm) => {
    if (!acc[perm.category]) {
      acc[perm.category] = [];
    }
    acc[perm.category].push(perm);
    return acc;
  }, {} as Record<PermissionCategory, PermissionInfo[]>);
};

// Get permission info by key
export const getPermissionInfo = (key: Permission): PermissionInfo | undefined => {
  return allPermissions.find(p => p.key === key);
};

// Merge role permissions with custom permissions
export const mergePermissions = (
  rolePermissions: Permission[],
  customAdditions: Permission[] = [],
  customRemovals: Permission[] = []
): Permission[] => {
  const merged = new Set(rolePermissions);
  customAdditions.forEach(p => merged.add(p));
  customRemovals.forEach(p => merged.delete(p));
  return Array.from(merged);
};

// Default role permissions configuration
export const defaultRolePermissions: Record<UserRole, Permission[]> = {
  admin: [
    'projects.create',
    'projects.edit',
    'projects.delete',
    'projects.view',
    'tickets.create',
    'tickets.edit',
    'tickets.delete',
    'tickets.view',
    'tickets.assign',
    'media.upload',
    'media.delete',
    'quotations.create',
    'quotations.edit',
    'quotations.delete',
    'quotations.view',
    'invoices.create',
    'invoices.edit',
    'invoices.delete',
    'invoices.view',
    'invoices.download',
    'users.manage',
    'settings.manage',
    'reports.view',
  ],
  supervisor: [
    'projects.create',
    'projects.edit',
    'projects.view',
    'tickets.create',
    'tickets.edit',
    'tickets.view',
    'tickets.assign',
    'media.upload',
    'quotations.view',
    'invoices.view',
    'invoices.download',
    'reports.view',
  ],
  worker: [
    'projects.view',
    'tickets.view',
    'tickets.create',
    'tickets.edit', // Only assigned tickets
    'quotations.view',
    'invoices.view',
    'media.upload',
  ],
  client: [
    'projects.view',
    'tickets.view',
    'quotations.view',
    'invoices.view',
    'invoices.download',
  ],
};

// Permission labels for UI display
export const permissionLabels: Record<Permission, { en: string; ta: string }> = {
  'projects.create': { en: 'Create Projects', ta: 'திட்டங்களை உருவாக்கு' },
  'projects.edit': { en: 'Edit Projects', ta: 'திட்டங்களைத் திருத்து' },
  'projects.delete': { en: 'Delete Projects', ta: 'திட்டங்களை நீக்கு' },
  'projects.view': { en: 'View Projects', ta: 'திட்டங்களைக் காண்' },
  'tickets.create': { en: 'Create Tickets', ta: 'டிக்கெட்டுகளை உருவாக்கு' },
  'tickets.edit': { en: 'Edit Tickets', ta: 'டிக்கெட்டுகளைத் திருத்து' },
  'tickets.delete': { en: 'Delete Tickets', ta: 'டிக்கெட்டுகளை நீக்கு' },
  'tickets.view': { en: 'View Tickets', ta: 'டிக்கெட்டுகளைக் காண்' },
  'tickets.assign': { en: 'Assign Tickets', ta: 'டிக்கெட்டுகளை ஒதுக்கு' },
  'media.upload': { en: 'Upload Media', ta: 'மீடியாவை பதிவேற்று' },
  'media.delete': { en: 'Delete Media', ta: 'மீடியாவை நீக்கு' },
  'quotations.create': { en: 'Create Quotations', ta: 'மேற்கோள்களை உருவாக்கு' },
  'quotations.edit': { en: 'Edit Quotations', ta: 'மேற்கோள்களைத் திருத்து' },
  'quotations.delete': { en: 'Delete Quotations', ta: 'மேற்கோள்களை நீக்கு' },
  'quotations.view': { en: 'View Quotations', ta: 'மேற்கோள்களைக் காண்' },
  'invoices.create': { en: 'Create Invoices', ta: 'விலைப்பட்டிகளை உருவாக்கு' },
  'invoices.edit': { en: 'Edit Invoices', ta: 'விலைப்பட்டிகளைத் திருத்து' },
  'invoices.delete': { en: 'Delete Invoices', ta: 'விலைப்பட்டிகளை நீக்கு' },
  'invoices.view': { en: 'View Invoices', ta: 'விலைப்பட்டிகளைக் காண்' },
  'invoices.download': { en: 'Download Invoices', ta: 'விலைப்பட்டிகளைப் பதிவிறக்கு' },
  'users.manage': { en: 'Manage Users', ta: 'பயனர்களை நிர்வகி' },
  'settings.manage': { en: 'Manage Settings', ta: 'அமைப்புகளை நிர்வகி' },
  'reports.view': { en: 'View Reports', ta: 'அறிக்கைகளைக் காண்' },
};

// Role labels for UI display
export const roleLabels: Record<UserRole, { en: string; ta: string }> = {
  admin: { en: 'Administrator', ta: 'நிர்வாகி' },
  supervisor: { en: 'Project Manager / Supervisor', ta: 'திட்ட மேலாளர் / கண்காணிப்பாளர்' },
  worker: { en: 'Worker / Technician', ta: 'தொழிலாளி / தொழில்நுட்பவியலாளர்' },
  client: { en: 'Client', ta: 'வாடிக்கையாளர்' },
};

// Check if a user has a specific permission
export const hasPermission = (userPermissions: Permission[], permission: Permission): boolean => {
  return userPermissions.includes(permission);
};

// Check if user has any of the specified permissions
export const hasAnyPermission = (userPermissions: Permission[], permissions: Permission[]): boolean => {
  return permissions.some(permission => userPermissions.includes(permission));
};

// Check if user has all of the specified permissions
export const hasAllPermissions = (userPermissions: Permission[], permissions: Permission[]): boolean => {
  return permissions.every(permission => userPermissions.includes(permission));
};

// Get permissions for a role
export const getPermissionsForRole = (role: UserRole): Permission[] => {
  return defaultRolePermissions[role] || [];
};
