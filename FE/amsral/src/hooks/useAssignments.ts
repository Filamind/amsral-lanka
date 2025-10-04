import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import recordService from '../services/recordService';
import toast from 'react-hot-toast';

// Query Keys
export const assignmentKeys = {
  all: ['assignments'] as const,
  list: (filters: { page: number; limit: number; search?: string }) => 
    [...assignmentKeys.all, 'list', filters] as const,
  record: (recordId: string) => [...assignmentKeys.all, 'record', recordId] as const,
};

// Types
export type AssignmentRow = {
  id: string;
  recordId: string;
  orderId: number;
  orderRef: string;
  trackingNumber: string;
  customerName: string;
  itemName: string;
  assignedTo: string;
  quantity: number;
  washingMachine: string;
  dryingMachine: string;
  status: string;
  assignedAt: string;
  createdAt: string;
  updatedAt: string;
  complete: boolean;
};

// Custom hook for fetching all assignments
export function useAssignments(filters: {
  page: number;
  limit: number;
  search?: string;
}) {
  return useQuery<{
    assignments: AssignmentRow[];
    pagination: {
      currentPage: number;
      totalPages: number;
      totalRecords: number;
      limit: number;
    };
  }>({
    queryKey: assignmentKeys.list(filters),
    queryFn: async () => {
      const response = await recordService.getAllAssignments({
        page: filters.page,
        limit: filters.limit,
        search: filters.search || undefined
      });

      if (!response.success) {
        throw new Error('Failed to fetch assignments');
      }

      // Transform assignments into AssignmentRow format
      const assignmentRows: AssignmentRow[] = response.data.assignments.map(assignment => ({
        id: assignment.id.toString(),
        recordId: assignment.recordId.toString(),
        orderId: assignment.orderId,
        orderRef: `${assignment.orderId}`,
        trackingNumber: assignment.trackingNumber || 'N/A',
        customerName: assignment.customerName || 'Unknown Customer',
        itemName: assignment.item || 'Unknown Item',
        assignedTo: assignment.assignedTo,
        quantity: assignment.quantity,
        washingMachine: assignment.washingMachine,
        dryingMachine: assignment.dryingMachine,
        status: assignment.status,
        assignedAt: assignment.assignedAt,
        createdAt: assignment.createdAt,
        updatedAt: assignment.updatedAt,
        complete: assignment.status === 'completed'
      }));

      return {
        assignments: assignmentRows,
        pagination: response.data.pagination,
      };
    },
    staleTime: 2 * 60 * 1000, // 2 minutes - assignments data changes frequently
    gcTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Mutation hook for updating assignment completion
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
    onSuccess: () => {
      // Invalidate and refetch assignments data
      queryClient.invalidateQueries({ queryKey: assignmentKeys.all });
      toast.success('Assignment status updated successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update assignment status');
    },
  });
}

// Mutation hook for deleting assignment
export function useDeleteAssignment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ recordId, assignmentId }: { recordId: string; assignmentId: string }) => {
      await recordService.deleteAssignment(recordId, assignmentId);
    },
    onSuccess: () => {
      // Invalidate and refetch assignments data
      queryClient.invalidateQueries({ queryKey: assignmentKeys.all });
      toast.success('Assignment deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete assignment');
    },
  });
}
