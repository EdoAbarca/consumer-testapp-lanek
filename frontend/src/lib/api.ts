/**
 * API Client Configuration
 * 
 * This module provides a configured axios instance and API endpoints
 * for communicating with the backend server.
 */

import axios, { AxiosInstance, AxiosResponse, AxiosError } from 'axios';
import type { 
  ConsumptionCreateRequest, 
  ConsumptionCreateResponse, 
  ConsumptionValidationError,
  ConsumptionListResponse,
  ConsumptionListParams
} from '@/types/consumption';

// API Base URL - defaults to localhost:5000 for development
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

/**
 * Configured axios instance with interceptors for error handling
 */
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000, // 10 seconds timeout
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for logging (development only)
apiClient.interceptors.request.use(
  (config) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`API Response: ${response.status} ${response.config.url}`);
    }
    return response;
  },
  (error: AxiosError) => {
    if (process.env.NODE_ENV === 'development') {
      console.error('API Error:', error.response?.status, error.message);
    }
    
    // Transform error for better client handling
    const apiError = {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
    };
    
    return Promise.reject(apiError);
  }
);

/**
 * User Registration Request Interface
 */
export interface UserRegistrationRequest {
  username: string;
  email: string;
  password: string;
  confirm_password: string;
}

/**
 * User Registration Response Interface
 */
export interface UserRegistrationResponse {
  id: number;
  username: string;
  email: string;
  is_active: boolean;
  created_at: string;
  message: string;
}

/**
 * User Login Request Interface
 */
export interface UserLoginRequest {
  email: string;
  password: string;
}

/**
 * User Login Response Interface
 */
export interface UserLoginResponse {
  access_token: string;
  refresh_token: string;
  user: UserRegistrationResponse;
  message: string;
}

/**
 * User Information Interface (for authenticated user data)
 */
export interface UserInfo {
  id: number;
  username: string;
  email: string;
  is_active: boolean;
  created_at: string;
}

/**
 * API Error Response Interface
 */
export interface ApiErrorResponse {
  error: string;
  message: string;
  details?: Record<string, any>;
}

/**
 * Authentication API endpoints
 */
export const authApi = {
  /**
   * Register a new user
   * @param userData User registration data
   * @returns Promise with user registration response
   */
  register: async (userData: UserRegistrationRequest): Promise<UserRegistrationResponse> => {
    try {
      const response = await apiClient.post<UserRegistrationResponse>(
        '/api/auth/register',
        userData
      );
      return response.data;
    } catch (error: any) {
      // Re-throw with typed error for better handling in components
      throw {
        message: error.data?.message || error.message || 'Registration failed',
        status: error.status,
        error: error.data?.error,
        details: error.data?.details,
      } as ApiErrorResponse & { status?: number };
    }
  },

  /**
   * Login user with email and password
   * @param loginData User login credentials
   * @returns Promise with login response containing JWT tokens
   */
  login: async (loginData: UserLoginRequest): Promise<UserLoginResponse> => {
    try {
      const response = await apiClient.post<UserLoginResponse>(
        '/api/auth/login',
        loginData
      );
      return response.data;
    } catch (error: any) {
      // Re-throw with typed error for better handling in components
      throw {
        message: error.data?.message || error.message || 'Login failed',
        status: error.status,
        error: error.data?.error,
        details: error.data?.details,
      } as ApiErrorResponse & { status?: number };
    }
  },

  /**
   * Health check endpoint
   * @returns Promise with health status
   */
  health: async (): Promise<{ status: string; message: string }> => {
    const response = await apiClient.get('/api/auth/health');
    return response.data;
  },
};

/**
 * General API utilities
 */
export const api = {
  /**
   * Test API connectivity
   * @returns Promise<boolean> indicating if API is reachable
   */
  testConnection: async (): Promise<boolean> => {
    try {
      await authApi.health();
      return true;
    } catch {
      return false;
    }
  },
};

/**
 * Consumption API endpoints
 */
export const consumptionApi = {
  /**
   * Create a new consumption record
   * @param consumptionData Consumption record data
   * @param token JWT access token for authentication
   * @returns Promise with consumption creation response
   */
  create: async (
    consumptionData: ConsumptionCreateRequest, 
    token: string
  ): Promise<ConsumptionCreateResponse> => {
    try {
      const response = await apiClient.post<ConsumptionCreateResponse>(
        '/api/consumption',
        consumptionData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      return response.data;
    } catch (error: any) {
      // Handle validation errors specifically
      if (error.status === 400 && error.data?.error === 'validation_error') {
        throw {
          error: error.data.error,
          message: error.data.message,
          details: error.data.details,
        } as ConsumptionValidationError;
      }
      
      // Re-throw with typed error for better handling in components
      throw {
        message: error.data?.message || error.message || 'Failed to create consumption record',
        status: error.status,
        error: error.data?.error,
        details: error.data?.details,
      } as ApiErrorResponse & { status?: number };
    }
  },

  /**
   * Health check endpoint for consumption service
   * @returns Promise with health status
   */
  health: async (): Promise<{ status: string; service: string }> => {
    const response = await apiClient.get('/api/consumption/health');
    return response.data;
  },

  /**
   * Get consumption records list with pagination
   * @param params Query parameters for pagination
   * @param token JWT access token for authentication
   * @returns Promise with consumption list response
   */
  list: async (
    params: ConsumptionListParams = {},
    token: string
  ): Promise<ConsumptionListResponse> => {
    try {
      const queryParams = new URLSearchParams();
      if (params.page) queryParams.append('page', params.page.toString());
      if (params.per_page) queryParams.append('per_page', params.per_page.toString());
      
      const response = await apiClient.get<ConsumptionListResponse>(
        `/api/consumption?${queryParams.toString()}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      return response.data;
    } catch (error: any) {
      // Re-throw with typed error for better handling in components
      throw {
        message: error.data?.message || error.message || 'Failed to fetch consumption records',
        status: error.status,
        error: error.data?.error,
        details: error.data?.details,
      } as ApiErrorResponse & { status?: number };
    }
  },
};

export default apiClient;
