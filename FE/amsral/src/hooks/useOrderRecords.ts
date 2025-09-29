import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { orderService, type Order, type CreateOrderRecordRequest, type UpdateOrderRecordRequest, type ErrorResponse } from '../services/orderService';
import { washingTypeService } from '../services/washingTypeService';
import { processTypeService } from '../services/processTypeService';
import toast from 'react-hot-toast';

// Query Keys
export const orderRecordsKeys = {
  all: ['orderRecords'] as const,
  order: (orderId: number) => [...orderRecordsKeys.all, 'order', orderId] as const,
  washingTypes: ['washingTypes'] as const,
  processTypes: ['processTypes'] as const,
};

// Types
export interface ProcessRecord {
  id: string;
  orderId?: number;
  quantity: string;
  washType: string;
  processTypes: string[];
  trackingNumber?: string;
  status?: string;
  isCompleted?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export type WashingTypeOption = {
  value: string;
  label: string;
  name: string;
  code: string;
};

export type ProcessTypeOption = {
  value: string;
  label: string;
};

// Custom hook for fetching order details
export function useOrder(orderId: number) {
  return useQuery<Order>({
    queryKey: orderRecordsKeys.order(orderId),
    queryFn: async () => {
      const response = await orderService.getOrder(orderId);
      if (!response.success) {
        throw new Error('Failed to fetch order');
      }
      return response.data;
    },
    staleTime: 2 * 60 * 1000, // 2 minutes - order data changes frequently
    gcTime: 5 * 60 * 1000, // 5 minutes
    enabled: !!orderId, // Only run if orderId is provided
  });
}

// Custom hook for fetching washing types
export function useWashingTypes() {
  return useQuery<WashingTypeOption[]>({
    queryKey: orderRecordsKeys.washingTypes,
    queryFn: async () => {
      const response = await washingTypeService.getWashingTypes({ limit: 100 });
      return response.data.washingTypes.map(washType => ({
        value: washType.id,
        label: `${washType.name} (${washType.code})`,
        name: washType.name,
        code: washType.code
      }));
    },
    staleTime: 10 * 60 * 1000, // 10 minutes - washing types change less frequently
    gcTime: 30 * 60 * 1000, // 30 minutes
  });
}

// Custom hook for fetching process types
export function useProcessTypes() {
  return useQuery<ProcessTypeOption[]>({
    queryKey: orderRecordsKeys.processTypes,
    queryFn: async () => {
      const response = await processTypeService.getProcessTypesList();
      return response.data.map(item => ({
        value: item.value.toString(),
        label: item.label
      }));
    },
    staleTime: 10 * 60 * 1000, // 10 minutes - process types change less frequently
    gcTime: 30 * 60 * 1000, // 30 minutes
  });
}

// Mutation hook for adding order records
export function useAddOrderRecord() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ orderId, recordData }: { orderId: number; recordData: CreateOrderRecordRequest }) => {
      const response = await orderService.addOrderRecord(orderId, recordData);
      if (!response.success) {
        throw new Error('Failed to add record');
      }
      return response.data;
    },
    onSuccess: (data, variables) => {
      // Invalidate and refetch order data
      queryClient.invalidateQueries({ queryKey: orderRecordsKeys.order(variables.orderId) });
      toast.success(`Record added successfully with tracking number: ${data.trackingNumber}`);
    },
    onError: (error: ErrorResponse) => {
      toast.error(error.message || 'Failed to add record. Please try again.');
    },
  });
}

// Mutation hook for updating order records
export function useUpdateOrderRecord() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      orderId, 
      recordId, 
      recordData 
    }: { 
      orderId: number; 
      recordId: number; 
      recordData: UpdateOrderRecordRequest 
    }) => {
      const response = await orderService.updateOrderRecord(orderId, recordId, recordData);
      if (!response.success) {
        throw new Error('Failed to update record');
      }
      return response.data;
    },
    onSuccess: (_, variables) => {
      // Invalidate and refetch order data
      queryClient.invalidateQueries({ queryKey: orderRecordsKeys.order(variables.orderId) });
      toast.success('Record updated successfully');
    },
    onError: (error: ErrorResponse) => {
      toast.error(error.message || 'Failed to update record. Please try again.');
    },
  });
}

// Mutation hook for deleting order records
export function useDeleteOrderRecord() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ orderId, recordId }: { orderId: number; recordId: number }) => {
      const response = await orderService.deleteOrderRecord(orderId, recordId);
      if (!response.success) {
        throw new Error(response.message || 'Failed to delete record');
      }
      return { orderId, recordId, message: response.message };
    },
    onSuccess: (data) => {
      // Invalidate and refetch order data
      queryClient.invalidateQueries({ queryKey: orderRecordsKeys.order(data.orderId) });
      toast.success('Record deleted successfully');
    },
    onError: (error: ErrorResponse) => {
      toast.error(error.message || 'Failed to delete record. Please try again.');
    },
  });
}
