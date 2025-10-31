/**
 * Analytics Cards Component Tests
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import AnalyticsCards from '../../src/components/analytics/AnalyticsCards';
import type { ConsumptionAnalytics } from '../../src/types/consumption';

// Mock data for testing
const mockAnalyticsData: ConsumptionAnalytics = {
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
};

const mockEmptyAnalyticsData: ConsumptionAnalytics = {
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
};

describe('AnalyticsCards Component', () => {
  describe('with analytics data', () => {
    beforeEach(() => {
      render(<AnalyticsCards analytics={mockAnalyticsData} />);
    });

    it('renders all analytics cards', () => {
      expect(screen.getByText('Total Consumption')).toBeInTheDocument();
      expect(screen.getByText('Average Monthly')).toBeInTheDocument();
      expect(screen.getByText('Current Month')).toBeInTheDocument();
      expect(screen.getByText('Total Records')).toBeInTheDocument();
    });

    it('displays total consumption correctly', () => {
      expect(screen.getByText('621.50')).toBeInTheDocument();
      expect(screen.getByText('Across all records')).toBeInTheDocument();
    });

    it('displays average monthly consumption correctly', () => {
      expect(screen.getByText('207.17')).toBeInTheDocument();
      expect(screen.getByText('Per month')).toBeInTheDocument();
    });

    it('displays current month consumption correctly', () => {
      expect(screen.getByText('150.00')).toBeInTheDocument();
    });

    it('displays total records correctly', () => {
      expect(screen.getByText('6')).toBeInTheDocument();
      expect(screen.getByText('Consumption entries')).toBeInTheDocument();
    });

    it('calculates and displays percentage change correctly', () => {
      // Current month (150) vs last month (100) = 50% increase
      expect(screen.getByText('50.0%')).toBeInTheDocument();
    });

    it('shows increase indicator when current month is higher', () => {
      // Should show red arrow for increase
      const increaseElements = screen.getAllByRole('presentation', { hidden: true });
      const hasIncreaseArrow = increaseElements.some(element => 
        element.getAttribute('d')?.includes('M7 17l9.2-9.2M17 17V7m0 10H7')
      );
      expect(hasIncreaseArrow).toBe(true);
    });

    it('renders consumption by type section', () => {
      expect(screen.getByText('Consumption by Type')).toBeInTheDocument();
      expect(screen.getByText('Electricity')).toBeInTheDocument();
      expect(screen.getByText('Water')).toBeInTheDocument();
      expect(screen.getByText('Gas')).toBeInTheDocument();
    });

    it('displays consumption by type values correctly', () => {
      expect(screen.getByText('410.75')).toBeInTheDocument(); // Electricity
      expect(screen.getByText('165.50')).toBeInTheDocument(); // Water
      expect(screen.getByText('45.25')).toBeInTheDocument(); // Gas
    });
  });

  describe('with empty analytics data', () => {
    beforeEach(() => {
      render(<AnalyticsCards analytics={mockEmptyAnalyticsData} />);
    });

    it('displays zero values correctly', () => {
      expect(screen.getByText('0.00')).toBeInTheDocument(); // Total consumption
      expect(screen.getAllByText('0.00')).toHaveLength(6); // Total, average, current month, and 3 consumption types
    });

    it('displays zero records correctly', () => {
      expect(screen.getByText('0')).toBeInTheDocument(); // Total records
    });

    it('shows no change indicator when both months are zero', () => {
      expect(screen.getByText('No change')).toBeInTheDocument();
    });
  });

  describe('with decreasing consumption', () => {
    const decreasingData: ConsumptionAnalytics = {
      ...mockAnalyticsData,
      current_month_total: 50.0,
      last_month_total: 100.0,
    };

    beforeEach(() => {
      render(<AnalyticsCards analytics={decreasingData} />);
    });

    it('shows decrease indicator when current month is lower', () => {
      // Should show green arrow for decrease (good for consumption)
      expect(screen.getByText('50.0%')).toBeInTheDocument();
      
      const decreaseElements = screen.getAllByRole('presentation', { hidden: true });
      const hasDecreaseArrow = decreaseElements.some(element => 
        element.getAttribute('d')?.includes('M17 7l-9.2 9.2M7 7v10m0-10h10')
      );
      expect(hasDecreaseArrow).toBe(true);
    });
  });

  describe('edge cases', () => {
    it('handles division by zero for percentage calculation', () => {
      const edgeData: ConsumptionAnalytics = {
        ...mockAnalyticsData,
        current_month_total: 100.0,
        last_month_total: 0.0,
      };

      render(<AnalyticsCards analytics={edgeData} />);
      expect(screen.getByText('100.0%')).toBeInTheDocument();
    });

    it('handles very large numbers correctly', () => {
      const largeNumbersData: ConsumptionAnalytics = {
        ...mockAnalyticsData,
        total_consumption: 999999.99,
      };

      render(<AnalyticsCards analytics={largeNumbersData} />);
      expect(screen.getByText('999999.99')).toBeInTheDocument();
    });

    it('handles decimal precision correctly', () => {
      const preciseData: ConsumptionAnalytics = {
        ...mockAnalyticsData,
        total_consumption: 123.456789,
      };

      render(<AnalyticsCards analytics={preciseData} />);
      expect(screen.getByText('123.46')).toBeInTheDocument();
    });
  });
});