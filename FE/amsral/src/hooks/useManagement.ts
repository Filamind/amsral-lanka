import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { orderService, type ManagementOrder, type UpdateOrderRequest } from '../services/orderService';
import toast from 'react-hot-toast';

// Query Keys
export const managementKeys = {
  all: ['management'] as const,
  orders: (filters: ManagementOrderFilters) => [...managementKeys.all, 'orders', filters] as const,
};

// Types
export interface ManagementOrderFilters {
  page: number;
  limit: number;
  orderId?: number;
  customerName?: string;
}

export interface UpdateDeliveryRequest {
  orderId: number;
  deliveryCount: number;
  isDelivered: boolean;
}

// Custom hook for fetching management orders
export function useManagementOrders(filters: ManagementOrderFilters) {
  return useQuery<{
    orders: ManagementOrder[];
    pagination: {
      currentPage: number;
      totalPages: number;
      totalRecords: number;
      limit: number;
      hasNextPage: boolean;
      hasPrevPage: boolean;
    };
  }>({
    queryKey: managementKeys.orders(filters),
    queryFn: async () => {
      const response = await orderService.getManagementOrders(filters);
      if (!response.success) {
        throw new Error('Failed to fetch management orders');
      }
      return {
        orders: response.data.orders,
        pagination: {
          currentPage: response.data.pagination.currentPage,
          totalPages: response.data.pagination.totalPages,
          totalRecords: response.data.pagination.totalRecords,
          limit: response.data.pagination.limit,
          hasNextPage: response.data.pagination.currentPage < response.data.pagination.totalPages,
          hasPrevPage: response.data.pagination.currentPage > 1
        }
      };
    },
    staleTime: 2 * 60 * 1000, // 2 minutes - management data changes frequently
    gcTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Custom hook for updating delivery status
export function useUpdateDelivery() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ orderId, deliveryCount, isDelivered }: UpdateDeliveryRequest) => {
      const updateData: UpdateOrderRequest = {
        status: isDelivered ? 'Delivered' : 'Completed',
        deliveryCount: deliveryCount
      };

      const response = await orderService.updateOrder(orderId, updateData);
      if (!response.success) {
        throw new Error('Failed to update delivery status');
      }
      return response.data;
    },
    onSuccess: () => {
      // Invalidate and refetch management orders
      queryClient.invalidateQueries({ 
        queryKey: [...managementKeys.all, 'orders'],
        exact: false 
      });
      toast.success('Order delivery status updated successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update delivery status');
    }
  });
}
