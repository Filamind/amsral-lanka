import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { orderService, type OrderStatus } from '../services/orderService';
import toast from 'react-hot-toast';

// Query Keys
export const qcKeys = {
  all: ['qc'] as const,
  completedOrders: (filters: QCFilters) => [...qcKeys.all, 'completedOrders', filters] as const,
};

// Types
export interface QCFilters {
  status: OrderStatus;
}

export interface CompletedOrder {
  id: number;
  customerName: string;
  quantity: number;
  returnQuantity?: number;
  deliveryQuantity?: number;
  date: string;
  deliveryDate: string;
  status: string;
  billingStatus?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DamageCounts {
  [recordId: number]: number;
}

// Custom hook for fetching completed orders
export function useCompletedOrders(filters: QCFilters) {
  return useQuery<CompletedOrder[]>({
    queryKey: qcKeys.completedOrders(filters),
    queryFn: async () => {
      const response = await orderService.getManagementOrders(filters);
      
      if (!response.success || !response.data) {
        throw new Error('Failed to fetch completed orders');
      }
      
      // Transform ManagementOrder[] to CompletedOrder[]
      const orders = response.data.orders || [];
      return orders.map(order => ({
        id: order.id,
        customerName: order.customerName,
        quantity: order.quantity,
        returnQuantity: order.quantity, // Use quantity as returnQuantity for QC
        deliveryQuantity: order.quantity, // Use quantity as deliveryQuantity
        date: order.date,
        deliveryDate: order.deliveryDate,
        status: order.status,
        billingStatus: order.billingStatus,
        createdAt: order.createdAt,
        updatedAt: order.updatedAt
      }));
    },
    staleTime: 2 * 60 * 1000, // 2 minutes - QC data changes frequently
    gcTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Custom hook for saving damage records
export function useSaveDamageRecords() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      orderId, 
      damageCounts 
    }: { 
      orderId: number; 
      damageCounts: DamageCounts 
    }) => {
      const response = await orderService.saveDamageRecords(orderId, damageCounts);
      return response;
    },
    onSuccess: () => {
      // Invalidate and refetch completed orders
      queryClient.invalidateQueries({ 
        queryKey: [...qcKeys.all, 'completedOrders'],
        exact: false 
      });
      toast.success('Damage records saved successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to save damage records');
    }
  });
}
