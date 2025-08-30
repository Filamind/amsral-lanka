import apiClient from '../config/api';
import Cookies from 'js-cookie';

// User interface
export interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
}

// Login response interface
export interface LoginResponse {
  success: boolean;
  message: string;
  token: string;
  user: User;
}

// Login request interface
export interface LoginRequest {
  email: string;
  password: string;
}

// Authentication service class
export class AuthService {
  // Login user
  static async login(credentials: LoginRequest): Promise<LoginResponse> {
    try {
      const response = await apiClient.post('/users/login', credentials);
      const { token, user } = response.data;
      
      // Store token and user in cookies
      Cookies.set('authToken', token, { 
        expires: 7, // 7 days
        secure: window.location.protocol === 'https:', // Use secure cookies in production
        sameSite: 'lax'
      });
      
      Cookies.set('user', JSON.stringify(user), { 
        expires: 7,
        secure: window.location.protocol === 'https:',
        sameSite: 'lax'
      });
      
      return response.data;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }

  // Logout user
  static logout(): void {
    Cookies.remove('authToken');
    Cookies.remove('user');
    window.location.href = '/login';
  }

  // Get current user from cookies
  static getCurrentUser(): User | null {
    try {
      const userCookie = Cookies.get('user');
      if (userCookie) {
        return JSON.parse(userCookie);
      }
      return null;
    } catch (error) {
      console.error('Error parsing user cookie:', error);
      return null;
    }
  }

  // Check if user is authenticated
  static isAuthenticated(): boolean {
    const token = Cookies.get('authToken');
    const user = Cookies.get('user');
    return !!(token && user);
  }

  // Get auth token
  static getToken(): string | null {
    return Cookies.get('authToken') || null;
  }
}

export default AuthService;
