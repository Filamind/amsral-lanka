import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { BillingService, type Invoice, type InvoiceFilters, type InvoiceRecord } from '../services/billingService';
import { CustomerService, type Customer } from '../services/customerService';
import toast from 'react-hot-toast';

// Query Keys
export const billingKeys = {
  all: ['billing'] as const,
  orders: (filters: BillingOrderFilters) => [...billingKeys.all, 'orders', filters] as const,
  invoices: (filters: InvoiceFilters) => [...billingKeys.all, 'invoices', filters] as const,
  customers: ['customers'] as const,
};

// Types
export interface BillingOrderFilters {
  page: number;
  limit: number;
  customerId?: string;
  status?: string;
  billingStatus?: string;
  search?: string;
}

export interface BillingOrder {
  id: number;
  date: string;
  referenceNo: string;
  customerId: string;
  customerName: string;
  quantity: number;
  notes: string | null;
  deliveryDate: string;
  status: 'Pending' | 'Invoiced' | 'Complete' | 'Paid' | 'In Progress' | 'Completed' | 'Confirmed' | 'Processing' | 'Delivered' | 'QC';
  billingStatus: 'pending' | 'invoiced' | 'paid';
  recordsCount: number;
  complete: boolean;
  createdAt: string;
  updatedAt: string;
  records: unknown[];
  amount?: number;
  paymentAmount?: number;
  balance?: number;
}

export interface CreateInvoiceRequest {
  invoiceNumber: string;
  customerName: string;
  orderIds: number[];
  records: InvoiceRecord[];
  orderTotals: { orderId: number; totalPrice: number }[];
  taxRate: number;
  paymentTerms: number;
  notes?: string;
}

export interface UpdatePaymentStatusRequest {
  invoiceId: string;
  paymentAmount: number;
  paymentDate: string;
  paymentMethod: string;
  notes?: string;
}

// Custom hook for fetching billing orders
export function useBillingOrders(filters: BillingOrderFilters) {
  return useQuery<{
    orders: BillingOrder[];
    pagination: {
      currentPage: number;
      totalPages: number;
      totalItems: number;
      itemsPerPage: number;
      hasNextPage: boolean;
      hasPrevPage: boolean;
    };
  }>({
    queryKey: billingKeys.orders(filters),
    queryFn: async () => {
      // Make two API calls to get both QC and Complete orders
      const [qcResponse, completeResponse] = await Promise.all([
        BillingService.getBillingOrders({
          page: filters.page,
          limit: filters.limit,
          customerId: filters.customerId,
          status: 'QC',
          billingStatus: 'pending',
        }),
        BillingService.getBillingOrders({
          page: filters.page,
          limit: filters.limit,
          customerId: filters.customerId,
          status: 'Complete',
          billingStatus: 'pending',
        })
      ]);

      if (!qcResponse.success || !completeResponse.success) {
        throw new Error('Failed to fetch billing orders');
      }

      // Combine orders from both responses
      const qcOrders = qcResponse.data.orders as BillingOrder[];
      const completeOrders = completeResponse.data.orders as BillingOrder[];
      let filteredOrders = [...qcOrders, ...completeOrders];

      // Apply search filter
      if (filters.search && filters.search.trim()) {
        const searchTerm = filters.search.toLowerCase().trim();
        filteredOrders = filteredOrders.filter(order =>
          order.id.toString().includes(searchTerm) ||
          order.customerName.toLowerCase().includes(searchTerm)
        );
      }

      // Calculate combined pagination
      const totalItems = (qcResponse.data.pagination?.totalItems || 0) + (completeResponse.data.pagination?.totalItems || 0);
      
      return {
        orders: filteredOrders,
        pagination: {
          currentPage: filters.page,
          totalPages: Math.ceil(totalItems / filters.limit),
          totalItems: totalItems,
          itemsPerPage: filters.limit,
          hasNextPage: filters.page < Math.ceil(totalItems / filters.limit),
          hasPrevPage: filters.page > 1
        }
      };
    },
    staleTime: 2 * 60 * 1000, // 2 minutes - billing data changes frequently
    gcTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Custom hook for fetching invoices
export function useInvoices(filters: InvoiceFilters) {
  return useQuery<{
    invoices: Invoice[];
    pagination: {
      currentPage: number;
      totalPages: number;
      totalItems: number;
      itemsPerPage: number;
      hasNextPage: boolean;
      hasPrevPage: boolean;
    };
  }>({
    queryKey: billingKeys.invoices(filters),
    queryFn: async () => {
      const response = await BillingService.getInvoices(filters);
      if (!response.success) {
        throw new Error('Failed to fetch invoices');
      }
      return {
        invoices: response.data.invoices,
        pagination: {
          currentPage: response.data.pagination?.currentPage || 1,
          totalPages: response.data.pagination?.totalPages || 1,
          totalItems: response.data.pagination?.totalItems || response.data.invoices.length,
          itemsPerPage: response.data.pagination?.itemsPerPage || filters.limit || 10,
          hasNextPage: (response.data.pagination?.currentPage || 1) < (response.data.pagination?.totalPages || 1),
          hasPrevPage: (response.data.pagination?.currentPage || 1) > 1
        }
      };
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Custom hook for fetching customers
export function useBillingCustomers() {
  return useQuery<Customer[]>({
    queryKey: billingKeys.customers,
    queryFn: async () => {
      const response = await CustomerService.getAllCustomers({
        limit: 100,
        isActive: true
      });
      return response.customers;
    },
    staleTime: 10 * 60 * 1000, // 10 minutes - customer data changes less frequently
    gcTime: 15 * 60 * 1000, // 15 minutes
  });
}

// Custom hook for creating invoices
export function useCreateInvoice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateInvoiceRequest) => {
      const response = await BillingService.createInvoice(data);
      if (!response.success) {
        throw new Error(response.message || 'Failed to create invoice');
      }
      return response.data;
    },
    onSuccess: () => {
      // Invalidate and refetch orders and invoices
      queryClient.invalidateQueries({ queryKey: billingKeys.all });
      toast.success('Invoice created successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create invoice');
    }
  });
}

// Custom hook for updating payment status
export function useUpdatePaymentStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: UpdatePaymentStatusRequest) => {
      const response = await BillingService.updateInvoicePaymentStatus(parseInt(data.invoiceId), true, data.paymentAmount);
      if (!response.success) {
        throw new Error(response.message || 'Failed to update payment status');
      }
      return response.data;
    },
    onSuccess: () => {
      // Invalidate and refetch invoices
      queryClient.invalidateQueries({ queryKey: billingKeys.all });
      toast.success('Payment status updated successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update payment status');
    }
  });
}
