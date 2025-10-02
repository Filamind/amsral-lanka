import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { itemService, type Item } from '../services/itemService';
import { washingTypeService, type WashingType } from '../services/washingTypeService';
import { machineTypeService, type MachineType } from '../services/machineTypeService';
import { processTypeService, type ProcessType } from '../services/processTypeService';
import toast from 'react-hot-toast';

// Query Keys
export const systemDataKeys = {
  all: ['systemData'] as const,
  items: (page: number, limit: number, search?: string) => [...systemDataKeys.all, 'items', { page, limit, search }] as const,
  washingTypes: (page: number, limit: number, search?: string) => [...systemDataKeys.all, 'washingTypes', { page, limit, search }] as const,
  machines: (page: number, limit: number, search?: string) => [...systemDataKeys.all, 'machines', { page, limit, search }] as const,
  processTypes: (page: number, limit: number, search?: string) => [...systemDataKeys.all, 'processTypes', { page, limit, search }] as const,
};

// Types
export interface PaginationData {
  currentPage: number;
  totalPages: number;
  totalRecords: number;
  limit: number;
}

// Items hooks
export function useItems(page: number, limit: number, search?: string) {
  return useQuery<{
    items: Item[];
    pagination: PaginationData;
  }>({
    queryKey: systemDataKeys.items(page, limit, search),
    queryFn: async () => {
      const response = await itemService.getItems(page, limit, search);
      if (!response.success) {
        throw new Error('Failed to fetch items');
      }
      return {
        items: response.data.items,
        pagination: response.data.pagination
      };
    },
    staleTime: 5 * 60 * 1000, // 5 minutes - system data changes less frequently
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
}

export function useCreateItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { name: string; code: string; description?: string }) => {
      const item = await itemService.createItem(data);
      return item;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: systemDataKeys.all });
      toast.success('Item created successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create item');
    }
  });
}

export function useUpdateItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: { name: string; code: string; description?: string } }) => {
      const item = await itemService.updateItem(id, data);
      return item;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: systemDataKeys.all });
      toast.success('Item updated successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update item');
    }
  });
}

export function useDeleteItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await itemService.deleteItem(id);
      return { id, message: 'Item deleted successfully' };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: systemDataKeys.all });
      toast.success('Item deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete item');
    }
  });
}

// Washing Types hooks
export function useWashingTypes(page: number, limit: number, search?: string) {
  return useQuery<{
    washingTypes: WashingType[];
    pagination: PaginationData;
  }>({
    queryKey: systemDataKeys.washingTypes(page, limit, search),
    queryFn: async () => {
      const response = await washingTypeService.getWashingTypes({
        page,
        limit,
        search
      });
      if (!response.success) {
        throw new Error('Failed to fetch washing types');
      }
      return {
        washingTypes: response.data.washingTypes,
        pagination: response.data.pagination
      };
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
}

export function useCreateWashingType() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { name: string; code: string; description?: string }) => {
      const washingType = await washingTypeService.createWashingType(data);
      return washingType;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: systemDataKeys.all });
      toast.success('Washing type created successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create washing type');
    }
  });
}

export function useUpdateWashingType() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: { name: string; code?: string; description?: string } }) => {
      const washingType = await washingTypeService.updateWashingType(id, data);
      return washingType;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: systemDataKeys.all });
      toast.success('Washing type updated successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update washing type');
    }
  });
}

export function useDeleteWashingType() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await washingTypeService.deleteWashingType(id);
      return { id, message: 'Washing type deleted successfully' };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: systemDataKeys.all });
      toast.success('Washing type deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete washing type');
    }
  });
}

// Machines hooks
export function useMachines(page: number, limit: number, search?: string) {
  return useQuery<{
    machines: MachineType[];
    pagination: PaginationData;
  }>({
    queryKey: systemDataKeys.machines(page, limit, search),
    queryFn: async () => {
      const response = await machineTypeService.getMachineTypes({
        page,
        limit,
        search
      });
      if (!response.success) {
        throw new Error('Failed to fetch machines');
      }
      return {
        machines: response.data.machineTypes,
        pagination: response.data.pagination
      };
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
}

export function useCreateMachine() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { name: string; type: string; description?: string }) => {
      const machine = await machineTypeService.createMachineType(data);
      return machine;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: systemDataKeys.all });
      toast.success('Machine type created successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create machine type');
    }
  });
}

export function useUpdateMachine() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: { name: string; description?: string } }) => {
      const machine = await machineTypeService.updateMachineType(id, data);
      return machine;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: systemDataKeys.all });
      toast.success('Machine type updated successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update machine type');
    }
  });
}

export function useDeleteMachine() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await machineTypeService.deleteMachineType(id);
      return { id, message: 'Machine type deleted successfully' };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: systemDataKeys.all });
      toast.success('Machine type deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete machine type');
    }
  });
}

// Process Types hooks
export function useProcessTypes(page: number, limit: number, search?: string) {
  return useQuery<{
    processTypes: ProcessType[];
    pagination: PaginationData;
  }>({
    queryKey: systemDataKeys.processTypes(page, limit, search),
    queryFn: async () => {
      const response = await processTypeService.getProcessTypes({
        page,
        limit,
        search
      });
      if (!response.success) {
        throw new Error('Failed to fetch process types');
      }
      return {
        processTypes: response.data.processTypes,
        pagination: response.data.pagination
      };
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
}

export function useCreateProcessType() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { name: string; code: string; description?: string }) => {
      const processType = await processTypeService.createProcessType(data);
      return processType;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: systemDataKeys.all });
      toast.success('Process type created successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create process type');
    }
  });
}

export function useUpdateProcessType() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: { name: string; description?: string } }) => {
      const processType = await processTypeService.updateProcessType(id, data);
      return processType;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: systemDataKeys.all });
      toast.success('Process type updated successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update process type');
    }
  });
}

export function useDeleteProcessType() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await processTypeService.deleteProcessType(id);
      return { id, message: 'Process type deleted successfully' };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: systemDataKeys.all });
      toast.success('Process type deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete process type');
    }
  });
}
