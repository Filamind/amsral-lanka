import apiClient from '../config/api';

// Role interface
export interface Role {
  id: number;
  name: string;
  description?: string;
}

// Role option interface for dropdowns
export interface RoleOption {
  value: string;
  label: string;
}

// Role service class
export class RoleService {
  static async getRoleMap(): Promise<RoleOption[]> {
    try {
      const response = await apiClient.get('/roles/map');
      console.log('Role Map API Response:', response.data); // Debug log
      
      // Handle different response structures
      let roles: Role[] = [];
      
      if (response.data && response.data.data && response.data.data.roles && Array.isArray(response.data.data.roles)) {
        // Handle structure: {success: true, data: {roles: [...]}}
        roles = response.data.data.roles;
      } else if (response.data && response.data.data && Array.isArray(response.data.data)) {
        // If response is wrapped in data property
        roles = response.data.data;
      } else if (response.data && Array.isArray(response.data)) {
        // If response is direct array of roles
        roles = response.data;
      } else {
        console.warn('Unexpected API response structure:', response.data);
        // Return default roles as fallback
        return [
          { value: '1', label: 'Admin' },
          { value: '2', label: 'Manager' },
          { value: '3', label: 'User' },
        ];
      }

      // Convert Role objects to RoleOption format
      return roles.map(role => ({
        value: role.id.toString(), // Use ID as value for form submission
        label: role.name.charAt(0).toUpperCase() + role.name.slice(1) // Capitalize first letter
      }));
      
    } catch (error) {
      console.error('Error fetching role map:', error);
      // Return default roles as fallback
      return [
        { value: 'admin', label: 'Admin' },
        { value: 'manager', label: 'Manager' },
        { value: 'user', label: 'User' },
      ];
    }
  }

  static async getAllRoles(): Promise<Role[]> {
    try {
      const response = await apiClient.get('/roles');
      console.log('Roles API Response:', response.data); // Debug log
      
      // Handle different response structures
      if (response.data && response.data.data && response.data.data.roles && Array.isArray(response.data.data.roles)) {
        // Handle structure: {success: true, data: {roles: [...]}}
        return response.data.data.roles;
      } else if (response.data && response.data.data && Array.isArray(response.data.data)) {
        return response.data.data;
      } else if (Array.isArray(response.data)) {
        return response.data;
      } else {
        console.warn('Unexpected API response structure:', response.data);
        return [];
      }
    } catch (error) {
      console.error('Error fetching roles:', error);
      throw error;
    }
  }
}

export default RoleService;
