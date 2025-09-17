// User interface for role utilities
export interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
}

export type UserRole = 'admin' | 'manager' | 'user';

export interface RolePermissions {
  canViewDashboard: boolean;
  canViewUsers: boolean;
  canViewEmployees: boolean;
  canViewCustomers: boolean;
  canViewSystemData: boolean;
  canViewOrders: boolean;
  canViewProduction: boolean;
  canViewManagement: boolean;
  canViewBilling: boolean;
  canViewPrinter: boolean;
  canViewIntegrations: boolean;
  canEdit: boolean;
  canDelete: boolean;
}

/**
 * Get user role from user object
 */
export const getUserRole = (user: User | null): UserRole => {
  if (!user || !user.role) {
    return 'user'; // Default to user role if no role is found
  }
  
  // Debug: Log the user object to understand its structure
  console.log('getUserRole - user object:', user);
  console.log('getUserRole - user.role type:', typeof user.role);
  console.log('getUserRole - user.role value:', user.role);
  
  // Handle different possible role formats
  let roleString: string;
  
  if (typeof user.role === 'string') {
    roleString = user.role;
  } else if (typeof user.role === 'object' && user.role !== null && 'name' in user.role) {
    // If role is an object with a name property
    roleString = (user.role as { name: string }).name || '';
  } else {
    // Fallback: convert to string
    roleString = String(user.role);
  }
  
  console.log('getUserRole - roleString:', roleString);
  
  // Normalize role to lowercase for comparison
  const normalizedRole = roleString.toLowerCase();
  
  if (normalizedRole === 'admin') return 'admin';
  if (normalizedRole === 'manager') return 'manager';
  return 'user';
};

/**
 * Get permissions based on user role
 */
export const getRolePermissions = (user: User | null): RolePermissions => {
  const role = getUserRole(user);
  
  switch (role) {
    case 'admin':
      return {
        canViewDashboard: true,
        canViewUsers: true,
        canViewEmployees: true,
        canViewCustomers: true,
        canViewSystemData: true,
        canViewOrders: true,
        canViewProduction: true,
        canViewManagement: true,
        canViewBilling: true,
        canViewPrinter: true,
        canViewIntegrations: true,
        canEdit: true,
        canDelete: true,
      };
    
    case 'manager':
      return {
        canViewDashboard: false,
        canViewUsers: false,
        canViewEmployees: false,
        canViewCustomers: false,
        canViewSystemData: false,
        canViewOrders: true,
        canViewProduction: true,
        canViewManagement: true,
        canViewBilling: false,
        canViewPrinter: true,
        canViewIntegrations: false,
        canEdit: false,
        canDelete: false,
      };
    
    case 'user':
    default:
      return {
        canViewDashboard: false,
        canViewUsers: false,
        canViewEmployees: false,
        canViewCustomers: false,
        canViewSystemData: false,
        canViewOrders: true,
        canViewProduction: true,
        canViewManagement: false,
        canViewBilling: false,
        canViewPrinter: true,
        canViewIntegrations: false,
        canEdit: false,
        canDelete: false,
      };
  }
};

/**
 * Check if user has specific permission
 */
export const hasPermission = (user: User | null, permission: keyof RolePermissions): boolean => {
  const permissions = getRolePermissions(user);
  return permissions[permission];
};

/**
 * Check if user is admin
 */
export const isAdmin = (user: User | null): boolean => {
  return getUserRole(user) === 'admin';
};

/**
 * Check if user is manager
 */
export const isManager = (user: User | null): boolean => {
  return getUserRole(user) === 'manager';
};

/**
 * Check if user is regular user
 */
export const isUser = (user: User | null): boolean => {
  return getUserRole(user) === 'user';
};
