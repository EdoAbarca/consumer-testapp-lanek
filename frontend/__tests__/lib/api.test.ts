/**
 * API Client Tests
 */

import axios from 'axios';
import { authApi } from '../../src/lib/api';

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
  let mockAxiosInstance: any;

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
    mockedAxios.create.mockReturnValue(mockAxiosInstance);
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
});