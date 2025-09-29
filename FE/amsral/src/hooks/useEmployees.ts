import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import EmployeeService, { type Employee, type PaginationInfo, type EmployeeFetchOptions } from '../services/employeeService';
import toast from 'react-hot-toast';

// Re-export types for convenience
export type { EmployeeFetchOptions, PaginationInfo } from '../services/employeeService';

// Query Keys
export const employeesKeys = {
  all: ['employees'] as const,
  employees: (filters: EmployeeFetchOptions) => [...employeesKeys.all, 'list', filters] as const,
};

// Custom hook for fetching employees
export function useEmployees(filters: EmployeeFetchOptions) {
  return useQuery<{
    employees: Employee[];
    pagination: PaginationInfo;
  }>({
    queryKey: employeesKeys.employees(filters),
    queryFn: async () => {
      const response = await EmployeeService.getAllEmployees(filters);
      return {
        employees: response.employees,
        pagination: response.pagination
      };
    },
    staleTime: 2 * 60 * 1000, // 2 minutes - employee data changes frequently
    gcTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Custom hook for creating employees
export function useCreateEmployee() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Omit<Employee, 'id' | 'employeeId' | 'createdAt' | 'updatedAt'>) => {
      const employee = await EmployeeService.createEmployee(data);
      return employee;
    },
    onSuccess: () => {
      // Invalidate and refetch employees
      queryClient.invalidateQueries({ queryKey: employeesKeys.all });
      toast.success('Employee created successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create employee');
    }
  });
}

// Custom hook for updating employees
export function useUpdateEmployee() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<Employee> }) => {
      const employee = await EmployeeService.updateEmployee(id, data);
      return employee;
    },
    onSuccess: () => {
      // Invalidate and refetch employees
      queryClient.invalidateQueries({ queryKey: employeesKeys.all });
      toast.success('Employee updated successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update employee');
    }
  });
}

// Custom hook for deleting employees
export function useDeleteEmployee() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      await EmployeeService.deleteEmployee(id);
      return { id, message: 'Employee deleted successfully' };
    },
    onSuccess: () => {
      // Invalidate and refetch employees
      queryClient.invalidateQueries({ queryKey: employeesKeys.all });
      toast.success('Employee deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete employee');
    }
  });
}
