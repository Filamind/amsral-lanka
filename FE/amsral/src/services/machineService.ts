import apiClient from '../config/api';
// ErrorResponse is defined locally in this file

// Types
export interface Machine {
  code: any;
  id: string;
  name: string;
  type: 'washing' | 'drying';
  status: 'available' | 'in_use' | 'maintenance';
  capacity: number;
}

export interface MachinesResponse {
  success: boolean;
  data: {
    machines: Machine[];
  };
}

class MachineService {
  // Get all machines
  async getAllMachines(type?: 'washing' | 'drying'): Promise<Machine[]> {
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
    return this.getAllMachines('washing');
  }

  // Get drying machines
  async getDryingMachines(): Promise<Machine[]> {
    return this.getAllMachines('drying');
  }
}

export default new MachineService();
