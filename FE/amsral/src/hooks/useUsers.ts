import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import UserService, { type User, type PaginationInfo, type UserFetchOptions, type CreateUserRequest, type UpdateUserRequest } from '../services/userService';
import RoleService, { type RoleOption } from '../services/roleService';
import toast from 'react-hot-toast';

// Query Keys
export const usersKeys = {
  all: ['users'] as const,
  users: (filters: UserFetchOptions) => [...usersKeys.all, 'list', filters] as const,
  roles: ['roles'] as const,
};

// Custom hook for fetching users
export function useUsers(filters: UserFetchOptions) {
  return useQuery<{
    users: User[];
    pagination: PaginationInfo;
  }>({
    queryKey: usersKeys.users(filters),
    queryFn: async () => {
      const response = await UserService.getAllUsers(filters);
      return {
        users: response.users,
        pagination: response.pagination
      };
    },
    staleTime: 2 * 60 * 1000, // 2 minutes - user data changes frequently
    gcTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Custom hook for fetching roles
export function useRoles() {
  return useQuery<RoleOption[]>({
    queryKey: usersKeys.roles,
    queryFn: async () => {
      const roles = await RoleService.getRoleMap();
      return roles;
    },
    staleTime: 10 * 60 * 1000, // 10 minutes - roles change less frequently
    gcTime: 15 * 60 * 1000, // 15 minutes
    retry: 1 // Only retry once on failure
  });
}

// Custom hook for creating users
export function useCreateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateUserRequest) => {
      const user = await UserService.createUser(data);
      return user;
    },
    onSuccess: () => {
      // Invalidate and refetch users
      queryClient.invalidateQueries({ queryKey: usersKeys.all });
      toast.success('User created successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create user');
    }
  });
}

// Custom hook for updating users
export function useUpdateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: UpdateUserRequest }) => {
      const user = await UserService.updateUser(id, data);
      return user;
    },
    onSuccess: () => {
      // Invalidate and refetch users
      queryClient.invalidateQueries({ queryKey: usersKeys.all });
      toast.success('User updated successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update user');
    }
  });
}

// Custom hook for deleting users
export function useDeleteUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      await UserService.deleteUser(id);
      return { id, message: 'User deleted successfully' };
    },
    onSuccess: () => {
      // Invalidate and refetch users
      queryClient.invalidateQueries({ queryKey: usersKeys.all });
      toast.success('User deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete user');
    }
  });
}

// Custom hook for changing username
export function useChangeUsername() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, usernameData }: { id: number; usernameData: { newUsername: string } }) => {
      await UserService.changeUsername(id, usernameData);
      return { id, message: 'Username changed successfully' };
    },
    onSuccess: () => {
      // Invalidate and refetch users
      queryClient.invalidateQueries({ queryKey: usersKeys.all });
      toast.success('Username changed successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to change username');
    }
  });
}

// Custom hook for updating profile
export function useUpdateProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, profileData }: { id: number; profileData: UpdateUserRequest }) => {
      const user = await UserService.updateProfile(id, profileData);
      return user;
    },
    onSuccess: () => {
      // Invalidate and refetch users
      queryClient.invalidateQueries({ queryKey: usersKeys.all });
      toast.success('Profile updated successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update profile');
    }
  });
}
