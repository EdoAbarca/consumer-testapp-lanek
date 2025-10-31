/**
 * Consumption List Page Component Tests
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useRouter } from 'next/navigation';
import ConsumptionListPage from '../../src/app/consumption/list/page';
import { useAuth } from '../../src/context/AuthContext';
import { consumptionApi } from '../../src/lib/api';
import type { ConsumptionListResponse } from '../../src/types/consumption';

// Mock external dependencies
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

jest.mock('../../src/context/AuthContext', () => ({
  useAuth: jest.fn(),
}));

jest.mock('../../src/lib/api', () => ({
  consumptionApi: {
    list: jest.fn(),
  },
}));

const mockPush = jest.fn();
const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;
const mockUseRouter = useRouter as jest.MockedFunction<typeof useRouter>;
const mockConsumptionApiList = consumptionApi.list as jest.MockedFunction<typeof consumptionApi.list>;

describe('ConsumptionListPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseRouter.mockReturnValue({ push: mockPush } as unknown as ReturnType<typeof useRouter>);
  });

  describe('Authentication', () => {
    it('should redirect to login when not authenticated', async () => {
      mockUseAuth.mockReturnValue({
        user: null,
        accessToken: null,
        isAuthenticated: false,
        isLoading: false,
        login: jest.fn(),
        logout: jest.fn(),
        refreshAccessToken: jest.fn(),
        setTokens: jest.fn(),
        refreshToken: null,
      });

      render(<ConsumptionListPage />);

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/login');
      });
    });

    it('should not redirect when authenticated', async () => {
      const mockResponse: ConsumptionListResponse = {
        consumptions: [],
        pagination: {
          page: 1,
          per_page: 20,
          total_items: 0,
          total_pages: 0,
          has_prev: false,
          has_next: false,
        },
        message: 'No consumption records found',
      };

      mockUseAuth.mockReturnValue({
        user: { id: 1, username: 'testuser', email: 'test@example.com', is_active: true, created_at: '2023-01-01T00:00:00Z' },
        accessToken: 'valid-token',
        isAuthenticated: true,
        isLoading: false,
        login: jest.fn(),
        logout: jest.fn(),
        refreshAccessToken: jest.fn(),
        setTokens: jest.fn(),
        refreshToken: 'refresh-token',
      });

      mockConsumptionApiList.mockResolvedValueOnce(mockResponse);

      render(<ConsumptionListPage />);

      await waitFor(() => {
        expect(mockPush).not.toHaveBeenCalledWith('/login');
      });
    });
  });

  describe('Loading State', () => {
    it('should show loading state initially', () => {
      mockUseAuth.mockReturnValue({
        user: { id: 1, username: 'testuser', email: 'test@example.com', is_active: true, created_at: '2023-01-01T00:00:00Z' },
        accessToken: 'valid-token',
        isAuthenticated: true,
        isLoading: false,
        login: jest.fn(),
        logout: jest.fn(),
        refreshAccessToken: jest.fn(),
        setTokens: jest.fn(),
        refreshToken: 'refresh-token',
      });

      // Make the API call hang to test loading state
      mockConsumptionApiList.mockImplementation(() => new Promise(() => {}));

      render(<ConsumptionListPage />);

      expect(screen.getByText('Loading consumption records...')).toBeInTheDocument();
    });
  });

  describe('Empty State', () => {
    it('should show empty state when no records exist', async () => {
      const mockResponse: ConsumptionListResponse = {
        consumptions: [],
        pagination: {
          page: 1,
          per_page: 20,
          total_items: 0,
          total_pages: 0,
          has_prev: false,
          has_next: false,
        },
        message: 'No consumption records found',
      };

      mockUseAuth.mockReturnValue({
        user: { id: 1, username: 'testuser', email: 'test@example.com', is_active: true, created_at: '2023-01-01T00:00:00Z' },
        accessToken: 'valid-token',
        isAuthenticated: true,
        isLoading: false,
        login: jest.fn(),
        logout: jest.fn(),
        refreshAccessToken: jest.fn(),
        setTokens: jest.fn(),
        refreshToken: 'refresh-token',
      });

      mockConsumptionApiList.mockResolvedValueOnce(mockResponse);

      render(<ConsumptionListPage />);

      await waitFor(() => {
        expect(screen.getByText('No consumption records')).toBeInTheDocument();
      });

      expect(screen.getByText('Get started by creating your first consumption record.')).toBeInTheDocument();
      expect(screen.getByText('Add Consumption Record')).toBeInTheDocument();
    });
  });

  describe('Records Display', () => {
    it('should display consumption records in table format', async () => {
      const mockResponse: ConsumptionListResponse = {
        consumptions: [
          {
            id: 1,
            user_id: 1,
            date: '2023-10-31T10:00:00Z',
            value: 150.75,
            type: 'electricity',
            notes: 'High usage month',
            created_at: '2023-10-31T10:00:00Z',
            updated_at: '2023-10-31T10:00:00Z',
          },
          {
            id: 2,
            user_id: 1,
            date: '2023-10-30T10:00:00Z',
            value: 25.5,
            type: 'water',
            notes: undefined,
            created_at: '2023-10-30T10:00:00Z',
            updated_at: '2023-10-30T10:00:00Z',
          },
        ],
        pagination: {
          page: 1,
          per_page: 20,
          total_items: 2,
          total_pages: 1,
          has_prev: false,
          has_next: false,
        },
        message: 'Consumption records retrieved successfully',
      };

      mockUseAuth.mockReturnValue({
        user: { id: 1, username: 'testuser', email: 'test@example.com', is_active: true, created_at: '2023-01-01T00:00:00Z' },
        accessToken: 'valid-token',
        isAuthenticated: true,
        isLoading: false,
        login: jest.fn(),
        logout: jest.fn(),
        refreshAccessToken: jest.fn(),
        setTokens: jest.fn(),
        refreshToken: 'refresh-token',
      });

      mockConsumptionApiList.mockResolvedValueOnce(mockResponse);

      render(<ConsumptionListPage />);

      await waitFor(() => {
        expect(screen.getByText('Consumption Records')).toBeInTheDocument();
      });

      // Check table headers
      expect(screen.getByText('Date')).toBeInTheDocument();
      expect(screen.getByText('Type')).toBeInTheDocument();
      expect(screen.getByText('Value')).toBeInTheDocument();
      expect(screen.getByText('Notes')).toBeInTheDocument();
      expect(screen.getByText('Created')).toBeInTheDocument();

      // Check record data
      expect(screen.getByText('150.75 kWh')).toBeInTheDocument();
      expect(screen.getByText('25.5 L')).toBeInTheDocument();
      expect(screen.getByText('Electricity')).toBeInTheDocument();
      expect(screen.getByText('Water')).toBeInTheDocument();
      expect(screen.getByText('High usage month')).toBeInTheDocument();
      expect(screen.getByText('-')).toBeInTheDocument(); // For null notes
    });

    it('should format dates correctly', async () => {
      const mockResponse: ConsumptionListResponse = {
        consumptions: [
          {
            id: 1,
            user_id: 1,
            date: '2023-10-31T10:00:00Z',
            value: 150.75,
            type: 'electricity',
            notes: 'Test',
            created_at: '2023-10-31T10:00:00Z',
            updated_at: '2023-10-31T10:00:00Z',
          },
        ],
        pagination: {
          page: 1,
          per_page: 20,
          total_items: 1,
          total_pages: 1,
          has_prev: false,
          has_next: false,
        },
        message: 'Consumption records retrieved successfully',
      };

      mockUseAuth.mockReturnValue({
        user: { id: 1, username: 'testuser', email: 'test@example.com', is_active: true, created_at: '2023-01-01T00:00:00Z' },
        accessToken: 'valid-token',
        isAuthenticated: true,
        isLoading: false,
        login: jest.fn(),
        logout: jest.fn(),
        refreshAccessToken: jest.fn(),
        setTokens: jest.fn(),
        refreshToken: 'refresh-token',
      });

      mockConsumptionApiList.mockResolvedValueOnce(mockResponse);

      render(<ConsumptionListPage />);

      await waitFor(() => {
        // Date should be formatted as 'Oct 31, 2023'
        const dateElements = screen.getAllByText('Oct 31, 2023');
        expect(dateElements.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Pagination', () => {
    it('should show pagination controls when multiple pages exist', async () => {
      const mockResponse: ConsumptionListResponse = {
        consumptions: Array.from({ length: 20 }, (_, i) => ({
          id: i + 1,
          user_id: 1,
          date: '2023-10-31T10:00:00Z',
          value: 100 + i,
          type: 'electricity',
          notes: `Record ${i + 1}`,
          created_at: '2023-10-31T10:00:00Z',
          updated_at: '2023-10-31T10:00:00Z',
        })),
        pagination: {
          page: 1,
          per_page: 20,
          total_items: 50,
          total_pages: 3,
          has_prev: false,
          has_next: true,
        },
        message: 'Consumption records retrieved successfully',
      };

      mockUseAuth.mockReturnValue({
        user: { id: 1, username: 'testuser', email: 'test@example.com', is_active: true, created_at: '2023-01-01T00:00:00Z' },
        accessToken: 'valid-token',
        isAuthenticated: true,
        isLoading: false,
        login: jest.fn(),
        logout: jest.fn(),
        refreshAccessToken: jest.fn(),
        setTokens: jest.fn(),
        refreshToken: 'refresh-token',
      });

      mockConsumptionApiList.mockResolvedValueOnce(mockResponse);

      render(<ConsumptionListPage />);

      await waitFor(() => {
        // Check pagination is visible by looking for unique pagination elements
        const ones = screen.getAllByText('1');
        expect(ones.length).toBeGreaterThan(0); // Should have at least one "1"
        expect(screen.getByText('20')).toBeInTheDocument(); // End of range
        expect(screen.getByText('50')).toBeInTheDocument(); // Total items
      });

      // Check pagination buttons
      const previousButtons = screen.getAllByRole('button', { name: /previous/i });
      const nextButtons = screen.getAllByRole('button', { name: /next/i });
      expect(previousButtons[0]).toBeDisabled();
      expect(nextButtons[0]).toBeEnabled();
    });

    it('should handle page navigation', async () => {
      const mockResponse: ConsumptionListResponse = {
        consumptions: Array.from({ length: 20 }, (_, i) => ({
          id: i + 1,
          user_id: 1,
          date: '2023-10-31T10:00:00Z',
          value: 100 + i,
          type: 'electricity',
          notes: `Record ${i + 1}`,
          created_at: '2023-10-31T10:00:00Z',
          updated_at: '2023-10-31T10:00:00Z',
        })),
        pagination: {
          page: 1,
          per_page: 20,
          total_items: 50,
          total_pages: 3,
          has_prev: false,
          has_next: true,
        },
        message: 'Consumption records retrieved successfully',
      };

      mockUseAuth.mockReturnValue({
        user: { id: 1, username: 'testuser', email: 'test@example.com', is_active: true, created_at: '2023-01-01T00:00:00Z' },
        accessToken: 'valid-token',
        isAuthenticated: true,
        isLoading: false,
        login: jest.fn(),
        logout: jest.fn(),
        refreshAccessToken: jest.fn(),
        setTokens: jest.fn(),
        refreshToken: 'refresh-token',
      });

      mockConsumptionApiList.mockResolvedValueOnce(mockResponse);

      const user = userEvent.setup();
      render(<ConsumptionListPage />);

      await waitFor(() => {
        const nextButtons = screen.getAllByRole('button', { name: /next/i });
        expect(nextButtons.length).toBeGreaterThan(0);
      });

      // Mock the second page response
      const secondPageResponse: ConsumptionListResponse = {
        ...mockResponse,
        pagination: {
          page: 2,
          per_page: 20,
          total_items: 50,
          total_pages: 3,
          has_prev: true,
          has_next: true,
        },
      };

      mockConsumptionApiList.mockResolvedValueOnce(secondPageResponse);

      // Click next button (target the desktop version which should be visible)
      const nextButtons = screen.getAllByRole('button', { name: /next/i });
      await user.click(nextButtons[nextButtons.length - 1]); // Use the last one (desktop version)

      await waitFor(() => {
        expect(mockConsumptionApiList).toHaveBeenCalledWith(
          { page: 2, per_page: 20 },
          'valid-token'
        );
      });
    });
  });

  describe('Error Handling', () => {
    it('should show error state when API call fails', async () => {
      mockUseAuth.mockReturnValue({
        user: { id: 1, username: 'testuser', email: 'test@example.com', is_active: true, created_at: '2023-01-01T00:00:00Z' },
        accessToken: 'valid-token',
        isAuthenticated: true,
        isLoading: false,
        login: jest.fn(),
        logout: jest.fn(),
        refreshAccessToken: jest.fn(),
        setTokens: jest.fn(),
        refreshToken: 'refresh-token',
      });

      mockConsumptionApiList.mockRejectedValueOnce(new Error('Failed to fetch records'));

      render(<ConsumptionListPage />);

      await waitFor(() => {
        expect(screen.getByText('Error Loading Data')).toBeInTheDocument();
      }, { timeout: 3000 });

      expect(screen.getByText('Failed to fetch records')).toBeInTheDocument();
      expect(screen.getByText('Try Again')).toBeInTheDocument();
    });

    it('should retry loading when try again is clicked', async () => {
      mockUseAuth.mockReturnValue({
        user: { id: 1, username: 'testuser', email: 'test@example.com', is_active: true, created_at: '2023-01-01T00:00:00Z' },
        accessToken: 'valid-token',
        isAuthenticated: true,
        isLoading: false,
        login: jest.fn(),
        logout: jest.fn(),
        refreshAccessToken: jest.fn(),
        setTokens: jest.fn(),
        refreshToken: 'refresh-token',
      });

      mockConsumptionApiList.mockRejectedValueOnce(new Error('Failed to fetch records'));

      const user = userEvent.setup();
      render(<ConsumptionListPage />);

      await waitFor(() => {
        expect(screen.getByText('Try Again')).toBeInTheDocument();
      });

      // Mock successful retry
      const mockResponse: ConsumptionListResponse = {
        consumptions: [],
        pagination: {
          page: 1,
          per_page: 20,
          total_items: 0,
          total_pages: 0,
          has_prev: false,
          has_next: false,
        },
        message: 'No consumption records found',
      };

      mockConsumptionApiList.mockResolvedValueOnce(mockResponse);

      await user.click(screen.getByText('Try Again'));

      await waitFor(() => {
        expect(mockConsumptionApiList).toHaveBeenCalledTimes(2);
      });
    });
  });

  describe('Navigation', () => {
    it('should navigate to add consumption page when add button is clicked', async () => {
      const mockResponse: ConsumptionListResponse = {
        consumptions: [],
        pagination: {
          page: 1,
          per_page: 20,
          total_items: 0,
          total_pages: 0,
          has_prev: false,
          has_next: false,
        },
        message: 'No consumption records found',
      };

      mockUseAuth.mockReturnValue({
        user: { id: 1, username: 'testuser', email: 'test@example.com', is_active: true, created_at: '2023-01-01T00:00:00Z' },
        accessToken: 'valid-token',
        isAuthenticated: true,
        isLoading: false,
        login: jest.fn(),
        logout: jest.fn(),
        refreshAccessToken: jest.fn(),
        setTokens: jest.fn(),
        refreshToken: 'refresh-token',
      });

      mockConsumptionApiList.mockResolvedValueOnce(mockResponse);

      const user = userEvent.setup();
      render(<ConsumptionListPage />);

      await waitFor(() => {
        expect(screen.getByText('Add New Record')).toBeInTheDocument();
      });

      await user.click(screen.getByText('Add New Record'));

      expect(mockPush).toHaveBeenCalledWith('/consumption/add');
    });

    it('should navigate to dashboard when back button is clicked', async () => {
      const mockResponse: ConsumptionListResponse = {
        consumptions: [],
        pagination: {
          page: 1,
          per_page: 20,
          total_items: 0,
          total_pages: 0,
          has_prev: false,
          has_next: false,
        },
        message: 'No consumption records found',
      };

      mockUseAuth.mockReturnValue({
        user: { id: 1, username: 'testuser', email: 'test@example.com', is_active: true, created_at: '2023-01-01T00:00:00Z' },
        accessToken: 'valid-token',
        isAuthenticated: true,
        isLoading: false,
        login: jest.fn(),
        logout: jest.fn(),
        refreshAccessToken: jest.fn(),
        setTokens: jest.fn(),
        refreshToken: 'refresh-token',
      });

      mockConsumptionApiList.mockResolvedValueOnce(mockResponse);

      const user = userEvent.setup();
      render(<ConsumptionListPage />);

      await waitFor(() => {
        expect(screen.getByText('Back to Dashboard')).toBeInTheDocument();
      });

      await user.click(screen.getByText('Back to Dashboard'));

      expect(mockPush).toHaveBeenCalledWith('/dashboard');
    });
  });
});