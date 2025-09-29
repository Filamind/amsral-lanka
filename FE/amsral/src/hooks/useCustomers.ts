import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import CustomerService, { type Customer, type PaginationInfo, type CustomerFetchOptions } from '../services/customerService';
import toast from 'react-hot-toast';

// Query Keys
export const customersKeys = {
  all: ['customers'] as const,
  customers: (filters: CustomerFetchOptions) => [...customersKeys.all, 'list', filters] as const,
};

// Re-export types for convenience
export type { CustomerFetchOptions, PaginationInfo } from '../services/customerService';

// Define request types locally since they're not exported from the service
export type CreateCustomerRequest = Omit<Customer, 'id' | 'customerCode' | 'createdAt' | 'updatedAt'>;
export type UpdateCustomerRequest = Partial<Customer>;

// Custom hook for fetching customers
export function useCustomers(filters: CustomerFetchOptions) {
  return useQuery<{
    customers: Customer[];
    pagination: PaginationInfo;
  }>({
    queryKey: customersKeys.customers(filters),
    queryFn: async () => {
      const response = await CustomerService.getAllCustomers(filters);
      return {
        customers: response.customers,
        pagination: response.pagination
      };
    },
    staleTime: 2 * 60 * 1000, // 2 minutes - customer data changes frequently
    gcTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Custom hook for creating customers
export function useCreateCustomer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateCustomerRequest) => {
      const customer = await CustomerService.createCustomer(data);
      return customer;
    },
    onSuccess: () => {
      // Invalidate and refetch customers
      queryClient.invalidateQueries({ queryKey: customersKeys.all });
      toast.success('Customer created successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create customer');
    }
  });
}

// Custom hook for updating customers
export function useUpdateCustomer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: UpdateCustomerRequest }) => {
      const customer = await CustomerService.updateCustomer(id, data);
      return customer;
    },
    onSuccess: () => {
      // Invalidate and refetch customers
      queryClient.invalidateQueries({ queryKey: customersKeys.all });
      toast.success('Customer updated successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update customer');
    }
  });
}

// Custom hook for deleting customers
export function useDeleteCustomer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      await CustomerService.deleteCustomer(id);
      return { id, message: 'Customer deleted successfully' };
    },
    onSuccess: () => {
      // Invalidate and refetch customers
      queryClient.invalidateQueries({ queryKey: customersKeys.all });
      toast.success('Customer deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete customer');
    }
  });
}
