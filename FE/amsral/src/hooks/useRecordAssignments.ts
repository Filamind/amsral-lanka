/* eslint-disable @typescript-eslint/no-explicit-any */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import recordService, { type ProcessRecord, type MachineAssignment, type CreateAssignmentRequest } from '../services/recordService';
import machineService from '../services/machineService';
import EmployeeService from '../services/employeeService';
import toast from 'react-hot-toast';

// Query Keys
export const recordAssignmentsKeys = {
  all: ['recordAssignments'] as const,
  record: (recordId: string) => [...recordAssignmentsKeys.all, 'record', recordId] as const,
  assignments: (recordId: string, filters: { page: number; limit: number }) => 
    [...recordAssignmentsKeys.all, 'assignments', recordId, filters] as const,
  employees: ['employees'] as const,
  machines: ['machines'] as const,
};

// Types
export type DropdownOption = {
  value: string;
  label: string;
};

// Custom hook for fetching record details
export function useRecord(recordId: string) {
  return useQuery<ProcessRecord>({
    queryKey: recordAssignmentsKeys.record(recordId),
    queryFn: async () => {
      const response = await recordService.getRecord(recordId);
      if (!response.success) {
        throw new Error('Failed to fetch record');
      }
      return response.data;
    },
    staleTime: 2 * 60 * 1000, // 2 minutes - record data changes frequently
    gcTime: 5 * 60 * 1000, // 5 minutes
    enabled: !!recordId, // Only run if recordId is provided
  });
}

// Custom hook for fetching record assignments
export function useRecordAssignments(recordId: string, filters: {
  page: number;
  limit: number;
}) {
  return useQuery<{
    assignments: MachineAssignment[];
    pagination: {
      currentPage: number;
      totalPages: number;
      totalRecords: number;
      limit: number;
    };
  }>({
    queryKey: recordAssignmentsKeys.assignments(recordId, filters),
    queryFn: async () => {
      const response = await recordService.getRecordAssignments(recordId, {
        page: filters.page,
        limit: filters.limit
      });
      if (!response.success) {
        throw new Error('Failed to fetch record assignments');
      }
      return {
        assignments: response.data.assignments || [],
        pagination: response.data.pagination || {
          currentPage: 1,
          totalPages: 1,
          totalRecords: 0,
          limit: filters.limit,
        }
      };
    },
    staleTime: 2 * 60 * 1000, // 2 minutes - assignments data changes frequently
    gcTime: 5 * 60 * 1000, // 5 minutes
    enabled: !!recordId, // Only run if recordId is provided
  });
}

// Custom hook for fetching employees
export function useEmployees() {
  return useQuery<DropdownOption[]>({
    queryKey: recordAssignmentsKeys.employees,
    queryFn: async () => {
      const response = await EmployeeService.getAllEmployees({
        limit: 100,
        isActive: true
      });
      return response.employees.map(employee => ({
        value: employee.id!.toString(),
        label: `${employee.firstName} ${employee.lastName}`
      }));
    },
    staleTime: 10 * 60 * 1000, // 10 minutes - employee data changes less frequently
  });
}

// Custom hook for fetching machines
export function useMachines() {
  return useQuery<{
    washing: DropdownOption[];
    drying: DropdownOption[];
  }>({
    queryKey: recordAssignmentsKeys.machines,
    queryFn: async () => {
      const machines = await machineService.getAllMachines();

      const washingMachines = machines
        .filter(machine => machine.type === 'washing')
        .map(machine => ({
          value: machine.id.toString(),
          label: `${machine.name} (${machine.code})`
        }));

      const dryingMachines = machines
        .filter((machine: any) => machine.type === 'drying')
        .map((machine: any) => ({
          value: machine.id.toString(),
          label: `${machine.name} (${machine.code})`
        }));

      return {
        washing: washingMachines,
        drying: dryingMachines
      };
    },
    staleTime: 10 * 60 * 1000, // 10 minutes - machine data changes less frequently
    gcTime: 30 * 60 * 1000, // 30 minutes
  });
}

// Mutation hook for creating machine assignment
export function useCreateMachineAssignment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      recordId, 
      assignmentData 
    }: { 
      recordId: string; 
      assignmentData: CreateAssignmentRequest 
    }) => {
      const response = await recordService.createAssignment(recordId, assignmentData);
      return response;
    },
    onSuccess: (_data, variables) => {
      // Invalidate and refetch assignments
      queryClient.invalidateQueries({ 
        queryKey: [...recordAssignmentsKeys.all, 'assignments', variables.recordId],
        exact: false 
      });
      toast.success('Machine assignment created successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to create assignment. Please try again.');
    },
  });
}

// Mutation hook for updating machine assignment
export function useUpdateMachineAssignment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      recordId, 
      assignmentId, 
      assignmentData 
    }: { 
      recordId: string; 
      assignmentId: string; 
      assignmentData: Partial<MachineAssignment> 
    }) => {
      const response = await recordService.updateAssignment(recordId, assignmentId, assignmentData);
      return response;
    },
    onSuccess: (_data, variables) => {
      // Invalidate and refetch assignments
      queryClient.invalidateQueries({ 
        queryKey: [...recordAssignmentsKeys.all, 'assignments', variables.recordId],
        exact: false 
      });
      toast.success('Machine assignment updated successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update assignment. Please try again.');
    },
  });
}

// Mutation hook for deleting machine assignment
export function useDeleteMachineAssignment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      recordId, 
      assignmentId 
    }: { 
      recordId: string; 
      assignmentId: string 
    }) => {
      await recordService.deleteAssignment(recordId, assignmentId);
      return { recordId, assignmentId, message: 'Assignment deleted successfully' };
    },
    onSuccess: (data) => {
      // Invalidate and refetch assignments
      queryClient.invalidateQueries({ 
        queryKey: [...recordAssignmentsKeys.all, 'assignments', data.recordId],
        exact: false 
      });
      toast.success('Machine assignment deleted successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to delete assignment. Please try again.');
    },
  });
}

// Custom hook for updating assignment completion status
export function useUpdateAssignmentCompletion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      recordId, 
      assignmentId, 
      isCompleted, 
      returnQuantity 
    }: { 
      recordId: string; 
      assignmentId: string; 
      isCompleted: boolean; 
      returnQuantity?: number 
    }) => {
      const response = await recordService.updateAssignmentCompletion(recordId, assignmentId, isCompleted, returnQuantity);
      return response;
    },
    onSuccess: (_data, variables) => {
      // Invalidate and refetch record assignments - use a more general approach
      queryClient.invalidateQueries({ 
        queryKey: [...recordAssignmentsKeys.all, 'assignments', variables.recordId],
        exact: false 
      });
      queryClient.invalidateQueries({ queryKey: recordAssignmentsKeys.record(variables.recordId) });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update completion status');
    }
  });
}
