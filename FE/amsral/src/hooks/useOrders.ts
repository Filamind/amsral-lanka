import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { orderService, type CreateOrderRequest, type ErrorResponse } from '../services/orderService';
import CustomerService from '../services/customerService';
import { itemService } from '../services/itemService';
import toast from 'react-hot-toast';

// Query Keys
export const ordersKeys = {
  all: ['orders'] as const,
  lists: () => [...ordersKeys.all, 'list'] as const,
  list: (filters: { page: number; limit: number; search?: string; excludeDelivered?: boolean }) => 
    [...ordersKeys.lists(), filters] as const,
  customers: ['customers'] as const,
  items: ['items'] as const,
};

// Types
type ProcessRecord = {
  id: string;
  itemId: string;
  quantity: number;
  washType: string;
  processTypes: string[];
};

export type OrderRow = {
  id: number;
  date: string;
  customerId: string;
  customerName: string;
  itemId?: string;
  quantity: number;
  gpNo?: string;
  notes: string;
  records: ProcessRecord[];
  recordsCount: number;
  deliveryDate: string;
  status: string;
  complete: boolean;
  overdue: boolean;
  createdAt: string;
  updatedAt: string;
  actions: number;
  [key: string]: string | number | boolean | ProcessRecord[] | undefined;
};

// Types for the return data
type OrdersData = {
  orders: OrderRow[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalRecords: number;
    limit: number;
  };
};

// Custom hook for fetching orders
export function useOrders(filters: {
  page: number;
  limit: number;
  search?: string;
  excludeDelivered?: boolean;
}) {
  return useQuery<OrdersData>({
    queryKey: ordersKeys.list(filters),
    queryFn: async () => {
      const response = await orderService.getOrders({
        page: filters.page,
        limit: filters.limit,
        search: filters.search || undefined,
        excludeDelivered: filters.excludeDelivered || true,
      });

      if (!response.success) {
        throw new Error('Failed to fetch orders');
      }

      // Transform the data to match OrderRow format
      const orderRows: OrderRow[] = response.data.orders.map(order => ({
        id: order.id,
        date: order.date,
        customerId: order.customerId,
        customerName: order.customerName,
        itemId: order.itemId || undefined,
        quantity: order.quantity,
        notes: order.notes,
        records: order.records.map(record => ({
          id: record.id.toString(),
          itemId: record.itemId,
          quantity: record.quantity,
          washType: record.washType,
          processTypes: record.processTypes
        })),
        recordsCount: order.recordsCount,
        deliveryDate: order.deliveryDate,
        status: order.status,
        complete: order.complete,
        overdue: order.overdue || false,
        createdAt: order.createdAt,
        updatedAt: order.updatedAt,
        actions: order.id,
      }));

      return {
        orders: orderRows,
        pagination: response.data.pagination,
      };
    },
    staleTime: 2 * 60 * 1000, // 2 minutes - orders data changes frequently
    gcTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Types for dropdown options
type DropdownOption = {
  value: string;
  label: string;
};

// Custom hook for fetching customers (for dropdown)
export function useCustomers() {
  return useQuery<DropdownOption[]>({
    queryKey: ordersKeys.customers,
    queryFn: async () => {
      const response = await CustomerService.getAllCustomers({
        limit: 100,
        isActive: true
      });
      return response.customers.map(customer => ({
        value: customer.id!.toString(),
        label: `${customer.firstName} - ${customer.customerCode || 'N/A'}`.trim()
      }));
    },
    staleTime: 10 * 60 * 1000, // 10 minutes - customer data changes less frequently
    gcTime: 30 * 60 * 1000, // 30 minutes
  });
}

// Custom hook for fetching items (for dropdown)
export function useItems() {
  return useQuery<DropdownOption[]>({
    queryKey: ordersKeys.items,
    queryFn: async () => {
      const response = await itemService.getItemsList();
      return response.data;
    },
    staleTime: 10 * 60 * 1000, // 10 minutes - items data changes less frequently
    gcTime: 30 * 60 * 1000, // 30 minutes
  });
}

// Mutation hook for creating orders
export function useCreateOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (orderData: CreateOrderRequest) => {
      const response = await orderService.createOrder(orderData);
      if (!response.success) {
        throw new Error(response.message || 'Failed to create order');
      }
      return response.data;
    },
    onSuccess: (data) => {
      // Invalidate and refetch orders list
      queryClient.invalidateQueries({ queryKey: ordersKeys.lists() });
      toast.success(`Order ${data.id} created successfully! You can now add process records by clicking on the order.`);
    },
    onError: (error: ErrorResponse) => {
      toast.error(error.message || 'Failed to create order. Please try again.');
    },
  });
}

// Mutation hook for updating orders
export function useUpdateOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<CreateOrderRequest> }) => {
      const response = await orderService.updateOrder(id, data);
      if (!response.success) {
        throw new Error('Failed to update order');
      }
      return response.data;
    },
    onSuccess: (data) => {
      // Invalidate and refetch orders list
      queryClient.invalidateQueries({ queryKey: ordersKeys.lists() });
      toast.success(`Order ${data.id} updated successfully!`);
    },
    onError: (error: ErrorResponse) => {
      toast.error(error.message || 'Failed to update order. Please try again.');
    },
  });
}

// Mutation hook for deleting orders
export function useDeleteOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (orderId: number) => {
      const response = await orderService.deleteOrder(orderId);
      if (!response.success) {
        throw new Error(response.message || 'Failed to delete order');
      }
      return { orderId, message: response.message };
    },
    onSuccess: (data) => {
      // Invalidate and refetch orders list
      queryClient.invalidateQueries({ queryKey: ordersKeys.lists() });
      toast.success(`Order ${data.orderId} deleted successfully`);
    },
    onError: (error: ErrorResponse) => {
      toast.error(error.message || 'Failed to delete order. Please try again.');
    },
  });
}
