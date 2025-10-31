/**
 * Consumption Form Component Tests
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useRouter } from 'next/navigation';
import ConsumptionForm from '../../src/components/ConsumptionForm';
import { useAuth } from '../../src/context/AuthContext';
import { consumptionApi } from '../../src/lib/api';
import type { ConsumptionCreateResponse } from '../../src/types/consumption';

// Mock external dependencies
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

jest.mock('../../src/context/AuthContext', () => ({
  useAuth: jest.fn(),
}));

jest.mock('../../src/lib/api', () => ({
  consumptionApi: {
    create: jest.fn(),
  },
}));

const mockPush = jest.fn();
const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;
const mockUseRouter = useRouter as jest.MockedFunction<typeof useRouter>;
const mockConsumptionApiCreate = consumptionApi.create as jest.MockedFunction<typeof consumptionApi.create>;

describe('ConsumptionForm Component', () => {
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Setup default mocks
    mockUseRouter.mockReturnValue({
      push: mockPush,
    } as any);
    
    mockUseAuth.mockReturnValue({
      user: { id: 1, username: 'testuser', email: 'test@example.com' },
      accessToken: 'mock-token',
      isAuthenticated: true,
      isLoading: false,
    } as any);
  });

  it('renders form with all required fields', () => {
    render(<ConsumptionForm />);
    
    expect(screen.getByLabelText(/date/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/consumption value/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/type/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/notes/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /create record/i })).toBeInTheDocument();
  });

  it('shows validation errors for required fields', async () => {
    const user = userEvent.setup();
    render(<ConsumptionForm />);
    
    const submitButton = screen.getByRole('button', { name: /create record/i });
    
    // Clear the default date value and try to submit
    const dateInput = screen.getByLabelText(/date/i);
    await user.clear(dateInput);
    await user.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText(/date is required/i)).toBeInTheDocument();
    });
  });

  it('validates consumption value is positive', async () => {
    const user = userEvent.setup();
    render(<ConsumptionForm />);
    
    const valueInput = screen.getByLabelText(/consumption value/i);
    const submitButton = screen.getByRole('button', { name: /create record/i });
    
    // Test negative value
    await user.type(valueInput, '-10');
    await user.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText(/value must be a positive number/i)).toBeInTheDocument();
    });
    
    // Clear and test zero value
    await user.clear(valueInput);
    await user.type(valueInput, '0');
    await user.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText(/value must be a positive number/i)).toBeInTheDocument();
    });
  });

  it('validates future dates are not allowed', async () => {
    const user = userEvent.setup();
    render(<ConsumptionForm />);
    
    const dateInput = screen.getByLabelText(/date/i);
    const submitButton = screen.getByRole('button', { name: /create record/i });
    
    // Set future date
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 1);
    const futureDateString = futureDate.toISOString().split('T')[0];
    
    await user.clear(dateInput);
    await user.type(dateInput, futureDateString);
    await user.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText(/consumption date cannot be in the future/i)).toBeInTheDocument();
    });
  });

  it('validates notes length limit', async () => {
    const user = userEvent.setup();
    render(<ConsumptionForm />);
    
    const notesInput = screen.getByLabelText(/notes/i);
    const submitButton = screen.getByRole('button', { name: /create record/i });
    
    // Type more than 500 characters
    const longNotes = 'x'.repeat(501);
    await user.type(notesInput, longNotes);
    await user.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText(/notes cannot exceed 500 characters/i)).toBeInTheDocument();
    });
  });

  it('renders consumption type options correctly', () => {
    render(<ConsumptionForm />);
    
    const typeSelect = screen.getByLabelText(/type/i);
    expect(typeSelect).toBeInTheDocument();
    
    // Check that all consumption types are available
    expect(screen.getByRole('option', { name: /electricity/i })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: /water/i })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: /gas/i })).toBeInTheDocument();
  });

  it('submits form with valid data successfully', async () => {
    const user = userEvent.setup();
    const mockResponse: ConsumptionCreateResponse = {
      consumption: {
        id: 1,
        user_id: 1,
        date: '2023-10-15T10:00:00Z',
        value: 150.75,
        type: 'electricity',
        notes: 'Test consumption',
        created_at: '2023-10-15T10:00:00Z',
        updated_at: '2023-10-15T10:00:00Z',
      },
      message: 'Consumption record created successfully',
    };
    
    mockConsumptionApiCreate.mockResolvedValueOnce(mockResponse);
    
    render(<ConsumptionForm />);
    
    // Fill in the form
    const dateInput = screen.getByLabelText(/date/i);
    const valueInput = screen.getByLabelText(/consumption value/i);
    const typeSelect = screen.getByLabelText(/type/i);
    const notesInput = screen.getByLabelText(/notes/i);
    const submitButton = screen.getByRole('button', { name: /create record/i });
    
    await user.clear(dateInput);
    await user.type(dateInput, '2023-10-15');
    await user.type(valueInput, '150.75');
    await user.selectOptions(typeSelect, 'electricity');
    await user.type(notesInput, 'Test consumption');
    
    await user.click(submitButton);
    
    // Verify API was called with correct data
    await waitFor(() => {
      expect(mockConsumptionApiCreate).toHaveBeenCalledWith(
        {
          date: expect.stringContaining('2023-10-15'),
          value: 150.75,
          type: 'electricity',
          notes: 'Test consumption',
        },
        'mock-token'
      );
    });
    
    // Verify success state
    await waitFor(() => {
      expect(screen.getByText(/consumption record created!/i)).toBeInTheDocument();
    });
  });

  it('handles API validation errors correctly', async () => {
    const user = userEvent.setup();
    const validationError = {
      error: 'validation_error',
      message: 'Request validation failed',
      details: {
        value: 'Value must be positive',
        type: 'Invalid consumption type',
      },
    };
    
    mockConsumptionApiCreate.mockRejectedValueOnce(validationError);
    
    render(<ConsumptionForm />);
    
    // Fill and submit form
    const valueInput = screen.getByLabelText(/consumption value/i);
    const submitButton = screen.getByRole('button', { name: /create record/i });
    
    await user.type(valueInput, '100');
    await user.click(submitButton);
    
    // Verify error messages are displayed
    await waitFor(() => {
      expect(screen.getByText(/invalid consumption type/i)).toBeInTheDocument();
    });
  });

  it('handles general API errors correctly', async () => {
    const user = userEvent.setup();
    const apiError = {
      message: 'Failed to create consumption record',
      status: 500,
    };
    
    mockConsumptionApiCreate.mockRejectedValueOnce(apiError);
    
    render(<ConsumptionForm />);
    
    // Fill and submit form
    const valueInput = screen.getByLabelText(/consumption value/i);
    const typeSelect = screen.getByLabelText(/type/i);
    const submitButton = screen.getByRole('button', { name: /create record/i });
    
    await user.type(valueInput, '100');
    await user.selectOptions(typeSelect, 'electricity');
    await user.click(submitButton);
    
    // Verify error message is displayed
    await waitFor(() => {
      expect(screen.getByText(/failed to create consumption record/i)).toBeInTheDocument();
    });
  });

  it('shows error when user is not authenticated', async () => {
    const user = userEvent.setup();
    
    // Mock unauthenticated state
    mockUseAuth.mockReturnValue({
      user: null,
      accessToken: null,
      isAuthenticated: false,
      isLoading: false,
    } as any);
    
    render(<ConsumptionForm />);
    
    const submitButton = screen.getByRole('button', { name: /create record/i });
    await user.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText(/you must be logged in to create consumption records/i)).toBeInTheDocument();
    });
  });

  it('calls onSuccess callback when provided', async () => {
    const user = userEvent.setup();
    const onSuccess = jest.fn();
    const mockResponse: ConsumptionCreateResponse = {
      consumption: {
        id: 1,
        user_id: 1,
        date: '2023-10-15T10:00:00Z',
        value: 150.75,
        type: 'electricity',
        notes: undefined,
        created_at: '2023-10-15T10:00:00Z',
        updated_at: '2023-10-15T10:00:00Z',
      },
      message: 'Consumption record created successfully',
    };
    
    mockConsumptionApiCreate.mockResolvedValueOnce(mockResponse);
    
    render(<ConsumptionForm onSuccess={onSuccess} />);
    
    // Fill and submit form
    const valueInput = screen.getByLabelText(/consumption value/i);
    const typeSelect = screen.getByLabelText(/type/i);
    const submitButton = screen.getByRole('button', { name: /create record/i });
    
    await user.type(valueInput, '100');
    await user.selectOptions(typeSelect, 'water');
    await user.click(submitButton);
    
    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalled();
    });
  });

  it('calls onCancel callback when cancel button is clicked', async () => {
    const user = userEvent.setup();
    const onCancel = jest.fn();
    
    render(<ConsumptionForm onCancel={onCancel} />);
    
    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    await user.click(cancelButton);
    
    expect(onCancel).toHaveBeenCalled();
  });

  it('disables form during submission', async () => {
    const user = userEvent.setup();
    
    // Make API call hang
    mockConsumptionApiCreate.mockImplementation(() => new Promise(() => {}));
    
    render(<ConsumptionForm />);
    
    const valueInput = screen.getByLabelText(/consumption value/i);
    const typeSelect = screen.getByLabelText(/type/i);
    const submitButton = screen.getByRole('button', { name: /create record/i });
    
    await user.type(valueInput, '100');
    await user.selectOptions(typeSelect, 'gas');
    await user.click(submitButton);
    
    // Verify form is disabled during submission
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /creating/i })).toBeDisabled();
    });
  });
});