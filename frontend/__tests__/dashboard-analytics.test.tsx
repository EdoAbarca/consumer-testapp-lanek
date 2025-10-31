/**
 * Dashboard Page Tests with Analytics Integration
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { useRouter, useSearchParams } from 'next/navigation';
import DashboardPage from '../src/app/dashboard/page';
import { useAuth } from '../src/context/AuthContext';
import { consumptionApi } from '../src/lib/api';
import type { AnalyticsResponse } from '../src/types/consumption';

// Mock external dependencies
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  useSearchParams: jest.fn(),
}));

jest.mock('../../src/context/AuthContext', () => ({
  useAuth: jest.fn(),
}));

jest.mock('../../src/lib/api', () => ({
  consumptionApi: {
    analytics: jest.fn(),
  },
}));

jest.mock('../src/components/analytics/AnalyticsCards', () => {
  return function MockAnalyticsCards({ analytics }: { analytics: AnalyticsResponse }) {
    return (
      <div data-testid="analytics-cards">
        <div data-testid="total-consumption">{analytics.analytics.total_consumption}</div>
        <div data-testid="total-records">{analytics.analytics.total_records}</div>
      </div>
    );
  };
});

jest.mock('../src/components/analytics/MonthlyConsumptionChart', () => {
  return function MockMonthlyConsumptionChart({ data, title }: { data: unknown[]; title: string }) {
    return (
      <div data-testid="monthly-chart">
        <div data-testid="chart-title">{title}</div>
        <div data-testid="chart-data-length">{data.length}</div>
      </div>
    );
  };
});

const mockPush = jest.fn();
const mockGet = jest.fn();
const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;
const mockUseRouter = useRouter as jest.MockedFunction<typeof useRouter>;
const mockUseSearchParams = useSearchParams as jest.MockedFunction<typeof useSearchParams>;
const mockAnalyticsApi = consumptionApi.analytics as jest.MockedFunction<typeof consumptionApi.analytics>;

const mockAnalyticsResponse: AnalyticsResponse = {
  analytics: {
    total_consumption: 621.5,
    average_monthly: 207.17,
    current_month_total: 150.0,
    last_month_total: 100.0,
    monthly_data: [
      {
        month: '2023-08',
        total: 120.0,
        electricity: 120.0,
        water: 0.0,
        gas: 0.0,
      },
      {
        month: '2023-09',
        total: 220.0,
        electricity: 140.0,
        water: 80.0,
        gas: 0.0,
      },
      {
        month: '2023-10',
        total: 281.5,
        electricity: 150.75,
        water: 85.5,
        gas: 45.25,
      },
    ],
    total_records: 6,
    consumption_by_type: {
      electricity: 410.75,
      water: 165.5,
      gas: 45.25,
    },
  },
  message: 'Analytics data retrieved successfully',
};

describe('Dashboard Page with Analytics', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup default mocks
    mockUseRouter.mockReturnValue({
      push: mockPush,
    } as unknown as ReturnType<typeof useRouter>);
    
    mockUseSearchParams.mockReturnValue({
      get: mockGet,
    } as unknown as ReturnType<typeof useSearchParams>);

    mockUseAuth.mockReturnValue({
      user: { 
        id: 1, 
        username: 'testuser', 
        email: 'test@example.com',
        is_active: true,
        created_at: '2023-01-01T00:00:00Z'
      },
      accessToken: 'mock-access-token',
      isAuthenticated: true,
      isLoading: false,
      logout: jest.fn(),
    } as unknown as ReturnType<typeof useAuth>);

    mockGet.mockReturnValue(null);
  });

  describe('Analytics loading and success states', () => {
    it('shows loading state initially', async () => {
      mockAnalyticsApi.mockImplementation(() => new Promise(() => {})); // Never resolves
      
      render(<DashboardPage />);
      
      expect(screen.getByText('Loading analytics...')).toBeInTheDocument();
    });

    it('renders analytics components when data loads successfully', async () => {
      mockAnalyticsApi.mockResolvedValue(mockAnalyticsResponse);
      
      render(<DashboardPage />);
      
      await waitFor(() => {
        expect(screen.getByTestId('analytics-cards')).toBeInTheDocument();
        expect(screen.getByTestId('monthly-chart')).toBeInTheDocument();
      });
      
      expect(screen.getByTestId('total-consumption')).toHaveTextContent('621.5');
      expect(screen.getByTestId('total-records')).toHaveTextContent('6');
      expect(screen.getByTestId('chart-title')).toHaveTextContent('Monthly Consumption Trends');
      expect(screen.getByTestId('chart-data-length')).toHaveTextContent('3');
    });

    it('calls analytics API with correct token', async () => {
      mockAnalyticsApi.mockResolvedValue(mockAnalyticsResponse);
      
      render(<DashboardPage />);
      
      await waitFor(() => {
        expect(mockAnalyticsApi).toHaveBeenCalledWith('mock-access-token');
      });
    });

    it('renders analytics overview section title', async () => {
      mockAnalyticsApi.mockResolvedValue(mockAnalyticsResponse);
      
      render(<DashboardPage />);
      
      expect(screen.getByText('Analytics Overview')).toBeInTheDocument();
    });
  });

  describe('Analytics error handling', () => {
    it('displays error message when analytics API fails', async () => {
      const errorMessage = 'Failed to fetch analytics data';
      mockAnalyticsApi.mockRejectedValue(new Error(errorMessage));
      
      render(<DashboardPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Failed to load analytics data')).toBeInTheDocument();
        expect(screen.getByText(errorMessage)).toBeInTheDocument();
      });
    });

    it('handles API error with custom message', async () => {
      const apiError = {
        message: 'Unauthorized access',
        status: 401,
      };
      mockAnalyticsApi.mockRejectedValue(apiError);
      
      render(<DashboardPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Failed to load analytics data')).toBeInTheDocument();
        expect(screen.getByText('Unauthorized access')).toBeInTheDocument();
      });
    });

    it('shows generic error message when error has no message', async () => {
      mockAnalyticsApi.mockRejectedValue(new Error());
      
      render(<DashboardPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Failed to load analytics data')).toBeInTheDocument();
        expect(screen.getByText('Failed to load analytics data')).toBeInTheDocument();
      });
    });
  });

  describe('Empty analytics state', () => {
    it('shows onboarding message when no analytics data available', async () => {
      mockAnalyticsApi.mockResolvedValue({
        analytics: {
          total_consumption: 0,
          average_monthly: 0,
          current_month_total: 0,
          last_month_total: 0,
          monthly_data: [],
          total_records: 0,
          consumption_by_type: {
            electricity: 0,
            water: 0,
            gas: 0,
          },
        },
        message: 'No data available',
      });
      
      render(<DashboardPage />);
      
      await waitFor(() => {
        expect(screen.getByText('No consumption data yet')).toBeInTheDocument();
        expect(screen.getByText('Start tracking your consumption to see analytics and insights.')).toBeInTheDocument();
        expect(screen.getByText('Add Your First Record')).toBeInTheDocument();
      });
    });

    it('renders add first record link correctly', async () => {
      mockAnalyticsApi.mockResolvedValue({
        analytics: {
          total_consumption: 0,
          average_monthly: 0,
          current_month_total: 0,
          last_month_total: 0,
          monthly_data: [],
          total_records: 0,
          consumption_by_type: {
            electricity: 0,
            water: 0,
            gas: 0,
          },
        },
        message: 'No data available',
      });
      
      render(<DashboardPage />);
      
      await waitFor(() => {
        const addRecordLink = screen.getByText('Add Your First Record');
        expect(addRecordLink.closest('a')).toHaveAttribute('href', '/consumption/add');
      });
    });
  });

  describe('Authentication states', () => {
    it('does not fetch analytics when user is not authenticated', () => {
      mockUseAuth.mockReturnValue({
        user: null,
        accessToken: null,
        isAuthenticated: false,
        isLoading: false,
      } as unknown as ReturnType<typeof useAuth>);
      
      render(<DashboardPage />);
      
      expect(mockAnalyticsApi).not.toHaveBeenCalled();
    });

    it('does not fetch analytics when access token is missing', () => {
      mockUseAuth.mockReturnValue({
        user: { id: 1, username: 'testuser', email: 'test@example.com' },
        accessToken: null,
        isAuthenticated: true,
        isLoading: false,
      } as unknown as ReturnType<typeof useAuth>);
      
      render(<DashboardPage />);
      
      expect(mockAnalyticsApi).not.toHaveBeenCalled();
    });

    it('refetches analytics when authentication state changes', async () => {
      const { rerender } = render(<DashboardPage />);
      
      // Initially not authenticated
      expect(mockAnalyticsApi).not.toHaveBeenCalled();
      
      // Become authenticated
      mockUseAuth.mockReturnValue({
        user: { id: 1, username: 'testuser', email: 'test@example.com' },
        accessToken: 'new-token',
        isAuthenticated: true,
        isLoading: false,
        logout: jest.fn(),
      } as unknown as ReturnType<typeof useAuth>);
      
      mockAnalyticsApi.mockResolvedValue(mockAnalyticsResponse);
      
      rerender(<DashboardPage />);
      
      await waitFor(() => {
        expect(mockAnalyticsApi).toHaveBeenCalledWith('new-token');
      });
    });
  });

  describe('Integration with existing dashboard features', () => {
    it('still renders user information section', async () => {
      mockAnalyticsApi.mockResolvedValue(mockAnalyticsResponse);
      
      render(<DashboardPage />);
      
      expect(screen.getByText('User Information')).toBeInTheDocument();
      expect(screen.getByText('testuser')).toBeInTheDocument();
      expect(screen.getByText('test@example.com')).toBeInTheDocument();
    });

    it('still renders quick actions section', async () => {
      mockAnalyticsApi.mockResolvedValue(mockAnalyticsResponse);
      
      render(<DashboardPage />);
      
      expect(screen.getByText('Quick Actions')).toBeInTheDocument();
      expect(screen.getByText('Add Consumption Record')).toBeInTheDocument();
    });

    it('still renders consumption management section', async () => {
      mockAnalyticsApi.mockResolvedValue(mockAnalyticsResponse);
      
      render(<DashboardPage />);
      
      expect(screen.getByText('Consumption Management')).toBeInTheDocument();
      expect(screen.getByText('Track Your Usage')).toBeInTheDocument();
    });

    it('handles success message from URL params', async () => {
      mockGet.mockReturnValue('consumption-created');
      mockAnalyticsApi.mockResolvedValue(mockAnalyticsResponse);
      
      render(<DashboardPage />);
      
      expect(screen.getByText('Consumption record created successfully!')).toBeInTheDocument();
    });
  });
});