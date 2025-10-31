/**
 * API Client Tests
 */

import axios from 'axios';
import { authApi, consumptionApi } from '../../src/lib/api';
import type { ConsumptionCreateRequest, ConsumptionCreateResponse } from '../../src/types/consumption';

// Mock axios completely
jest.mock('axios', () => ({
  create: jest.fn(() => ({
    post: jest.fn(),
    get: jest.fn(),
    interceptors: {
      request: { use: jest.fn() },
      response: { use: jest.fn() },
    },
  })),
}));

const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('API Client', () => {
  let mockAxiosInstance: {
    post: jest.Mock;
    get: jest.Mock;
    interceptors: {
      request: { use: jest.Mock };
      response: { use: jest.Mock };
    };
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockAxiosInstance = {
      post: jest.fn(),
      get: jest.fn(),
      interceptors: {
        request: { use: jest.fn() },
        response: { use: jest.fn() },
      },
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockedAxios.create.mockReturnValue(mockAxiosInstance as any);
  });

  describe('authApi.register', () => {
    const registrationData = {
      username: 'testuser',
      email: 'test@example.com',
      password: 'TestPass123!',
      confirm_password: 'TestPass123!',
    };

    it('successfully registers a user', async () => {
      const mockResponse = {
        data: {
          id: 1,
          username: 'testuser',
          email: 'test@example.com',
          is_active: true,
          created_at: '2023-01-01T00:00:00Z',
          message: 'User registered successfully',
        },
      };

      mockAxiosInstance.post.mockResolvedValue(mockResponse);

      const result = await authApi.register(registrationData);

      expect(result).toEqual(mockResponse.data);
      expect(mockAxiosInstance.post).toHaveBeenCalledWith('/api/auth/register', registrationData);
    });

    it('handles registration errors', async () => {
      const mockError = {
        response: {
          status: 400,
          data: {
            error: 'username_exists',
            message: 'Username already exists',
          },
        },
      };

      mockAxiosInstance.post.mockRejectedValue(mockError);

      await expect(authApi.register(registrationData)).rejects.toMatchObject({
        status: 400,
        error: 'username_exists',
        message: 'Username already exists',
      });
    });

    it('handles network errors', async () => {
      const mockError = {
        message: 'Network Error',
      };

      mockAxiosInstance.post.mockRejectedValue(mockError);

      await expect(authApi.register(registrationData)).rejects.toMatchObject({
        message: 'Registration failed',
      });
    });
  });

  describe('authApi.health', () => {
    it('successfully checks health', async () => {
      const mockResponse = {
        data: {
          status: 'healthy',
          message: 'API is running',
        },
      };

      mockAxiosInstance.get.mockResolvedValue(mockResponse);

      const result = await authApi.health();

      expect(result).toEqual(mockResponse.data);
      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/api/auth/health');
    });
  });

  describe('consumptionApi.create', () => {
    const consumptionData: ConsumptionCreateRequest = {
      date: '2023-10-15T10:00:00Z',
      value: 150.75,
      type: 'electricity',
      notes: 'Monthly reading',
    };
    const token = 'mock-token';

    it('successfully creates a consumption record', async () => {
      const mockResponse: { data: ConsumptionCreateResponse } = {
        data: {
          consumption: {
            id: 1,
            user_id: 1,
            date: '2023-10-15T10:00:00Z',
            value: 150.75,
            type: 'electricity',
            notes: 'Monthly reading',
            created_at: '2023-10-15T10:00:00Z',
            updated_at: '2023-10-15T10:00:00Z',
          },
          message: 'Consumption record created successfully',
        },
      };

      mockAxiosInstance.post.mockResolvedValue(mockResponse);

      const result = await consumptionApi.create(consumptionData, token);

      expect(result).toEqual(mockResponse.data);
      expect(mockAxiosInstance.post).toHaveBeenCalledWith(
        '/api/consumption',
        consumptionData,
        {
          headers: {
            Authorization: 'Bearer mock-token',
          },
        }
      );
    });

    it('handles validation errors correctly', async () => {
      const validationError = {
        response: {
          status: 400,
          data: {
            error: 'validation_error',
            message: 'Request validation failed',
            details: {
              value: 'Value must be positive',
              type: 'Invalid consumption type',
            },
          },
        },
        message: 'Request failed with status code 400',
      };

      mockAxiosInstance.post.mockRejectedValue(validationError);

      await expect(consumptionApi.create(consumptionData, token)).rejects.toEqual({
        error: 'validation_error',
        message: 'Request validation failed',
        details: {
          value: 'Value must be positive',
          type: 'Invalid consumption type',
        },
      });
    });

    it('handles general API errors correctly', async () => {
      const apiError = {
        response: {
          status: 500,
          data: {
            error: 'internal_error',
            message: 'Internal server error',
          },
        },
        message: 'Request failed with status code 500',
      };

      mockAxiosInstance.post.mockRejectedValue(apiError);

      await expect(consumptionApi.create(consumptionData, token)).rejects.toEqual({
        message: 'Internal server error',
        status: 500,
        error: 'internal_error',
        details: undefined,
      });
    });

    it('handles network errors correctly', async () => {
      const networkError = {
        message: 'Network Error',
      };

      mockAxiosInstance.post.mockRejectedValue(networkError);

      await expect(consumptionApi.create(consumptionData, token)).rejects.toEqual({
        message: 'Failed to create consumption record',
        status: undefined,
        error: undefined,
        details: undefined,
      });
    });
  });

  describe('consumptionApi.health', () => {
    it('successfully checks consumption health', async () => {
      const mockResponse = {
        data: {
          status: 'ok',
          service: 'consumption',
        },
      };

      mockAxiosInstance.get.mockResolvedValue(mockResponse);

      const result = await consumptionApi.health();

      expect(result).toEqual(mockResponse.data);
      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/api/consumption/health');
    });
  });
});