import { vi } from 'vitest'

// Mock axios
export const mockAxios = {
  get: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
  delete: vi.fn(),
  interceptors: {
    request: { use: vi.fn() },
    response: { use: vi.fn() }
  }
}

// Mock API client
export const mockApiClient = {
  get: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
  delete: vi.fn(),
  interceptors: {
    request: { use: vi.fn() },
    response: { use: vi.fn() }
  }
}

// Mock toast
export const mockToast = {
  success: vi.fn(),
  error: vi.fn(),
  loading: vi.fn(),
  dismiss: vi.fn(),
}

// Mock PDF generation
export const mockPdfUtils = {
  generateOrderReceipt: vi.fn(),
  generateOrderReceiptA4: vi.fn(),
  generateGatepass: vi.fn(),
  generateBagLabel: vi.fn(),
  generateAssignmentReceipt: vi.fn(),
}

// Mock services
export const mockUserService = {
  getAllUsers: vi.fn(),
  createUser: vi.fn(),
  updateUser: vi.fn(),
  deleteUser: vi.fn(),
  changePassword: vi.fn(),
  changeUsername: vi.fn(),
  updateProfile: vi.fn(),
}

export const mockOrderService = {
  getAllOrders: vi.fn(),
  createOrder: vi.fn(),
  updateOrder: vi.fn(),
  deleteOrder: vi.fn(),
  getOrderSummary: vi.fn(),
}

export const mockDashboardService = {
  getQuickStats: vi.fn(),
  getOrdersTrend: vi.fn(),
  getOrderStatusDistribution: vi.fn(),
  getRecentOrders: vi.fn(),
}
