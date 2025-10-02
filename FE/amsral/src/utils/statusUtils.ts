/**
 * Standardized Status Utilities
 * Provides consistent status colors, labels, and formatting across the entire app
 */

// Standardized status types
export type OrderStatus = 'Pending' | 'In Progress' | 'Complete' | 'Confirmed' | 'Processing' | 'Delivered' | 'QC';
export type BillingStatus = 'pending' | 'invoiced' | 'paid';
export type AssignmentStatus = 'Pending' | 'In Progress' | 'Completed';

// Status color mapping - consistent across all pages
export const STATUS_COLORS = {
  // Order Status Colors
  'Pending': 'bg-yellow-100 text-yellow-800',        // Yellow/orange for pending
  'In Progress': 'bg-yellow-100 text-yellow-800',    // Yellow for in progress
  'Complete': 'bg-green-100 text-green-800',        // Green for complete
  'Confirmed': 'bg-purple-100 text-purple-800',      // Purple for confirmed
  'Processing': 'bg-orange-100 text-orange-800',     // Orange for processing
  'Delivered': 'bg-blue-100 text-blue-800',          // Blue for delivered
  'QC': 'bg-pink-100 text-pink-800',               // Amber for QC (quality control)
  
  // Billing Status Colors - now consistent with order status
  'pending': 'bg-yellow-100 text-yellow-800',        // Same as Pending (yellow/orange)
  'invoiced': 'bg-blue-100 text-blue-800',           // Same as Delivered (blue)
  'paid': 'bg-green-100 text-green-800',             // Same as Completed (green)
  
  // Assignment Status Colors (removed duplicates - using same keys as order status)
  
  // Special statuses
  'Assigned': 'bg-cyan-100 text-cyan-800',           // Cyan for assigned (different from Pending and Delivered)
} as const;

// Status label mapping - ensures consistent case sensitivity
export const STATUS_LABELS = {
  // Order Status Labels
  'pending': 'Pending',
  'in_progress': 'In Progress',
  'completed': 'Complete',
  'confirmed': 'Confirmed',
  'processing': 'Processing',
  'delivered': 'Delivered',
  'assigned': 'Assigned',
  'complete': 'Complete', // Map 'complete' to 'Complete' for consistency
  'qc': 'QC',              // Quality Control status
  
  // Billing Status Labels - now using sentence case (removed duplicate 'pending')
  'invoiced': 'Invoiced',
  'paid': 'Paid',
} as const;

/**
 * Get standardized status color class
 */
export const getStatusColor = (status: string, type: 'order' | 'billing' | 'assignment' = 'order'): string => {
  const normalizedStatus = normalizeStatus(status, type);
  return STATUS_COLORS[normalizedStatus as keyof typeof STATUS_COLORS] || 'bg-gray-100 text-gray-800';
};

/**
 * Get standardized status label
 */
export const getStatusLabel = (status: string, type: 'order' | 'billing' | 'assignment' = 'order'): string => {
  const normalizedStatus = normalizeStatus(status, type);
  return STATUS_LABELS[normalizedStatus as keyof typeof STATUS_LABELS] || status;
};

/**
 * Normalize status to standard format
 */
export const normalizeStatus = (status: string, type: 'order' | 'billing' | 'assignment' = 'order'): string => {
  if (!status) return type === 'billing' ? 'pending' : 'Pending';
  
  const lowerStatus = status.toLowerCase();
  
  // Handle order status normalization
  if (type === 'order') {
    switch (lowerStatus) {
      case 'pending':
        return 'Pending';
      case 'in progress':
      case 'in_progress':
        return 'In Progress';
      case 'completed':
      case 'complete':
        return 'Complete';
      case 'confirmed':
        return 'Confirmed';
      case 'processing':
        return 'Processing';
      case 'delivered':
        return 'Delivered';
      case 'assigned':
        return 'Assigned';
      case 'qc':
        return 'QC';
      default:
        return 'Pending';
    }
  }
  
  // Handle billing status normalization
  if (type === 'billing') {
    switch (lowerStatus) {
      case 'pending':
        return 'pending';
      case 'invoiced':
        return 'invoiced';
      case 'paid':
        return 'paid';
      default:
        return 'pending';
    }
  }
  
  // Handle assignment status normalization
  if (type === 'assignment') {
    switch (lowerStatus) {
      case 'pending':
        return 'Pending';
      case 'in progress':
      case 'in_progress':
        return 'In Progress';
      case 'completed':
      case 'complete':
        return 'Complete';
      default:
        return 'Pending';
    }
  }
  
  return status;
};

/**
 * Check if status represents completion
 */
export const isCompletedStatus = (status: string): boolean => {
  const normalized = normalizeStatus(status, 'order');
  return normalized === 'Complete' || normalized === 'Delivered';
};

/**
 * Check if status represents in progress
 */
export const isInProgressStatus = (status: string): boolean => {
  const normalized = normalizeStatus(status, 'order');
  return normalized === 'In Progress' || normalized === 'Processing';
};

/**
 * Check if status represents pending
 */
export const isPendingStatus = (status: string): boolean => {
  const normalized = normalizeStatus(status, 'order');
  return normalized === 'Pending' || normalized === 'Confirmed';
};
