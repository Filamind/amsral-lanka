import apiClient from '../config/api';
// ErrorResponse is defined locally in this file

// Types
export interface Machine {
  id: number;
  name: string;
  type: 'Washing' | 'Drying';
  description: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface MachinesResponse {
  success: boolean;
  data: {
    machines: Machine[];
  };
}

class MachineService {
  // Get all machines
  async getAllMachines(type?: 'Washing' | 'Drying'): Promise<Machine[]> {
    try {
      const queryParams = new URLSearchParams();
      if (type) queryParams.append('type', type);
      
      const response = await apiClient.get(`/machines?${queryParams.toString()}`);
      return response.data.data.machines;
    } catch (error: unknown) {
      const apiError = error as { response?: { data?: { success: false; message: string } } };
      throw apiError.response?.data || { success: false, message: 'Failed to fetch machines' };
    }
  }

  // Get washing machines
  async getWashingMachines(): Promise<Machine[]> {
    return this.getAllMachines('Washing');
  }

  // Get drying machines
  async getDryingMachines(): Promise<Machine[]> {
    return this.getAllMachines('Drying');
  }
}

export default new MachineService();
