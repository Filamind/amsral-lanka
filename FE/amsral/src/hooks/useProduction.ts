/* eslint-disable @typescript-eslint/no-explicit-any */
import { useQuery } from '@tanstack/react-query';
import { orderService } from '../services/orderService';
import { itemService } from '../services/itemService';
import { washingTypeService } from '../services/washingTypeService';
import { processTypeService } from '../services/processTypeService';

// Query Keys
export const productionKeys = {
  all: ['production'] as const,
  records: (filters: { page: number; limit: number; search?: string }) => 
    [...productionKeys.all, 'records', filters] as const,
  items: ['items'] as const,
  washingTypes: ['washingTypes'] as const,
  processTypes: ['processTypes'] as const,
};

// Types
export type ProcessRecord = {
  id: string;
  orderId: number;
  orderRef: string;
  trackingNumber?: string;
  customerName: string;
  item: string;
  itemId?: string;
  quantity: number;
  remainingQuantity: number;
  washType: string;
  processTypes: string[];
  status: string;
  createdAt: string;
  complete: boolean;
};

export type DropdownOption = {
  value: string;
  label: string;
};

export type WashingTypeOption = {
  value: string;
  label: string;
};

// Custom hook for fetching production records
export function useProductionRecords(filters: {
  page: number;
  limit: number;
  search?: string;
}) {
  return useQuery<{
    records: ProcessRecord[];
    pagination: {
      currentPage: number;
      totalPages: number;
      totalRecords: number;
      limit: number;
    };
  }>({
    queryKey: productionKeys.records(filters),
    queryFn: async () => {
      const response = await orderService.getAllProductionRecords({
        page: filters.page,
        limit: filters.limit,
        search: filters.search || undefined
      });

      if (!response.success) {
        throw new Error('Failed to fetch production records');
      }

      // Transform records into production records
      const productionRecords: ProcessRecord[] = [];
      const records = (response.data as any).records || [];

      records.forEach((record: any) => {
        productionRecords.push({
          id: record.id.toString(),
          orderId: record.orderId,
          orderRef: `${record.orderId}`,
          trackingNumber: record.trackingNumber || 'N/A',
          customerName: record.customerName || 'Unknown Customer',
          item: record.itemName || 'Unknown Item', // Use itemName from API
          itemId: record.itemId,
          quantity: record.quantity,
          remainingQuantity: record.remainingQuantity || 0,
          washType: record.washTypeName || record.washType, // Use washTypeName from API
          processTypes: record.processTypeNames || record.processTypes || [], // Use processTypeNames from API
          status: 'pending',
          createdAt: record.createdAt ? new Date(record.createdAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
          complete: record.complete || false
        });
      });

      return {
        records: productionRecords,
        pagination: response.data.pagination || {
          currentPage: 1,
          totalPages: 1,
          totalRecords: productionRecords.length,
          limit: filters.limit,
        }
      };
    },
    staleTime: 2 * 60 * 1000, // 2 minutes - production data changes frequently
    gcTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Custom hook for fetching items (reuse from existing hooks)
export function useItems() {
  return useQuery<DropdownOption[]>({
    queryKey: productionKeys.items,
    queryFn: async () => {
      const response = await itemService.getItemsList();
      return response.data;
    },
    staleTime: 10 * 60 * 1000, // 10 minutes - items data changes less frequently
    gcTime: 30 * 60 * 1000, // 30 minutes
  });
}

// Custom hook for fetching washing types
export function useWashingTypes() {
  return useQuery<WashingTypeOption[]>({
    queryKey: productionKeys.washingTypes,
    queryFn: async () => {
      const response = await washingTypeService.getWashingTypes({ limit: 100 });
      return response.data.washingTypes.map(washType => ({
        value: washType.id,
        label: `${washType.name} (${washType.code})`
      }));
    },
    staleTime: 10 * 60 * 1000, // 10 minutes - washing types change less frequently
    gcTime: 30 * 60 * 1000, // 30 minutes
  });
}

// Custom hook for fetching process types
export function useProcessTypes() {
  return useQuery<DropdownOption[]>({
    queryKey: productionKeys.processTypes,
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
