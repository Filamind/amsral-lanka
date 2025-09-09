import apiClient from '../config/api';

// Role interface
export interface Role {
  id: number;
  name: string;
  description?: string;
}

// User interface
export interface User {
  id?: number;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  dateOfBirth?: string;
  roleId: number;
  role: Role;
  isActive?: boolean;
  isDeleted?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

// Pagination interface
export interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

// User fetch options
export interface UserFetchOptions {
  page?: number;
  limit?: number;
  isActive?: boolean | null;
  isDeleted?: boolean;
  search?: string;
  role?: string;
}

// User response interface
export interface UserResponse {
  users: User[];
  pagination: PaginationInfo;
}

// Create user request interface
export interface CreateUserRequest {
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  dateOfBirth?: string;
  roleId: number;
  isActive?: boolean;
  passwordHash: string;
}

// Update user request interface
export interface UpdateUserRequest {
  username?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  dateOfBirth?: string;
  roleId?: number;
  isActive?: boolean;
  password?: string; // Optional for updates
}

// User service class
export class UserService {
  static async getAllUsers(options: UserFetchOptions = {}): Promise<UserResponse> {
    try {
      const params = new URLSearchParams();
      
      if (options.page) params.append('page', options.page.toString());
      if (options.limit) params.append('limit', options.limit.toString());
      if (options.isActive !== null && options.isActive !== undefined) {
        params.append('isActive', options.isActive.toString());
      }
      if (options.isDeleted !== undefined) params.append('isDeleted', options.isDeleted.toString());
      if (options.search) params.append('search', options.search);
      if (options.role) params.append('role', options.role);

      const response = await apiClient.get(`/users?${params.toString()}`);
      console.log('User API Response:', response.data); // Debug log
      
      // Handle different response structures
      if (response.data && response.data.data && response.data.data.users && Array.isArray(response.data.data.users)) {
        return {
          users: response.data.data.users,
          pagination: response.data.data.pagination || {
            currentPage: 1,
            totalPages: 1,
            totalItems: response.data.data.users.length,
            itemsPerPage: options.limit || 10,
            hasNextPage: false,
            hasPrevPage: false
          }
        };
      } else if (Array.isArray(response.data)) {
        return {
          users: response.data,
          pagination: {
            currentPage: 1,
            totalPages: 1,
            totalItems: response.data.length,
            itemsPerPage: options.limit || 10,
            hasNextPage: false,
            hasPrevPage: false
          }
        };
      } else {
        console.warn('Unexpected API response structure:', response.data);
        return {
          users: [],
          pagination: {
            currentPage: 1,
            totalPages: 1,
            totalItems: 0,
            itemsPerPage: options.limit || 10,
            hasNextPage: false,
            hasPrevPage: false
          }
        };
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      throw error;
    }
  }

  static async createUser(user: CreateUserRequest): Promise<User> {
    try {
      console.log('UserService.createUser called with:', user); // Debug log
      console.log('RoleId type and value:', typeof user.roleId, user.roleId); // Debug roleId specifically
      const response = await apiClient.post('/users', user);
      console.log('Create User API Response:', response.data); // Debug log
      
      // Handle different response structures
      if (response.data && response.data.data) {
        return response.data.data;
      } else if (response.data && response.data.id) {
        return response.data;
      } else {
        console.warn('Unexpected API response structure:', response.data);
        throw new Error('Unexpected response format');
      }
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }

  static async updateUser(id: number, user: UpdateUserRequest): Promise<User> {
    try {
      console.log('UserService.updateUser called with ID:', id, 'and data:', user); // Debug log
      console.log('RoleId type and value:', typeof user.roleId, user.roleId); // Debug roleId specifically
      const response = await apiClient.put(`/users/${id}`, user);
      console.log('Update User API Response:', response.data); // Debug log
      
      // Handle different response structures
      if (response.data && response.data.data) {
        return response.data.data;
      } else if (response.data && response.data.id) {
        return response.data;
      } else {
        console.warn('Unexpected API response structure:', response.data);
        throw new Error('Unexpected response format');
      }
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  }

  static async deleteUser(id: number): Promise<void> {
    try {
      await apiClient.delete(`/users/${id}`);
    } catch (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
  }
}

export default UserService;
