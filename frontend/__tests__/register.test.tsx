/**
 * Registration Page Tests
 * 
 * Simplified tests for the user registration form and functionality.
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useRouter } from 'next/navigation';
import RegisterPage from '../src/app/register/page';
import { authApi } from '@/lib/api';

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

// Mock API module
jest.mock('@/lib/api', () => ({
  authApi: {
    register: jest.fn(),
  },
}));

describe('RegisterPage', () => {
  const mockPush = jest.fn();
  const mockAuthRegister = authApi.register as jest.MockedFunction<typeof authApi.register>;

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
    });
  });

  describe('Form Rendering', () => {
    it('renders all form fields', () => {
      render(<RegisterPage />);

      expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Enter your password')).toBeInTheDocument();
      expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
    });

    it('renders navigation link to login page', () => {
      render(<RegisterPage />);

      const loginLink = screen.getByRole('link', { name: /sign in here/i });
      expect(loginLink).toBeInTheDocument();
      expect(loginLink).toHaveAttribute('href', '/login');
    });
  });

  describe('Form Validation', () => {
    it('shows validation errors for empty fields', async () => {
      const user = userEvent.setup();
      render(<RegisterPage />);

      // Focus and blur the username field to trigger validation
      const usernameInput = screen.getByLabelText(/username/i);
      await user.click(usernameInput);
      await user.tab(); // Tab away to trigger blur

      await waitFor(() => {
        // Check for any validation error text that contains "required"
        expect(screen.getByText(/required/i)).toBeInTheDocument();
      });
    });

    it('validates username format', async () => {
      const user = userEvent.setup();
      render(<RegisterPage />);

      const usernameInput = screen.getByLabelText(/username/i);
      await user.type(usernameInput, 'ab');
      await user.tab(); // Trigger onBlur validation

      await waitFor(() => {
        expect(screen.getByText(/username must be at least 3 characters long/i)).toBeInTheDocument();
      });
    });

    it('validates email format', async () => {
      const user = userEvent.setup();
      render(<RegisterPage />);

      const emailInput = screen.getByLabelText(/email address/i);
      await user.type(emailInput, 'invalid-email');
      await user.tab();

      await waitFor(() => {
        expect(screen.getByText(/please enter a valid email address/i)).toBeInTheDocument();
      });
    });
  });

  describe('Password Strength Indicator', () => {
    it('shows password strength indicator when password field is focused', async () => {
      const user = userEvent.setup();
      render(<RegisterPage />);

      const passwordInput = screen.getByPlaceholderText('Enter your password');
      await user.click(passwordInput);
      await user.type(passwordInput, 'test'); // Type some text to trigger the indicator

      expect(screen.getByText(/Password Strength/i)).toBeInTheDocument();
    });
  });

  describe('Form Submission', () => {
    const validFormData = {
      username: 'testuser',
      email: 'test@example.com',
      password: 'ValidPass123!',
      confirm_password: 'ValidPass123!',
    };

    it('submits form with valid data and shows success state', async () => {
      const user = userEvent.setup();
      mockAuthRegister.mockResolvedValueOnce({
        id: 1,
        username: 'testuser',
        email: 'test@example.com',
        is_active: true,
        created_at: '2023-01-01T00:00:00Z',
        message: 'User registered successfully',
      });

      render(<RegisterPage />);

      // Fill form
      await user.type(screen.getByLabelText(/username/i), validFormData.username);
      await user.type(screen.getByLabelText(/email address/i), validFormData.email);
      await user.type(screen.getByPlaceholderText('Enter your password'), validFormData.password);
      await user.type(screen.getByLabelText(/confirm password/i), validFormData.confirm_password);

      // Submit form
      await user.click(screen.getByRole('button', { name: /create account/i }));

      // Wait for success state
      await waitFor(() => {
        expect(screen.getByText(/registration successful/i)).toBeInTheDocument();
      });

      expect(mockAuthRegister).toHaveBeenCalledWith(validFormData);
    });

    it('shows loading state during submission', async () => {
      const user = userEvent.setup();
      mockAuthRegister.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));

      render(<RegisterPage />);

      // Fill form
      await user.type(screen.getByLabelText(/username/i), validFormData.username);
      await user.type(screen.getByLabelText(/email address/i), validFormData.email);
      await user.type(screen.getByPlaceholderText('Enter your password'), validFormData.password);
      await user.type(screen.getByLabelText(/confirm password/i), validFormData.confirm_password);

      // Submit form
      await user.click(screen.getByRole('button', { name: /create account/i }));

      expect(screen.getByText(/creating account/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /creating account/i })).toBeDisabled();
    });

    it('handles duplicate username error', async () => {
      const user = userEvent.setup();
      mockAuthRegister.mockRejectedValueOnce({
        status: 400,
        error: 'username_exists',
        message: 'Username already exists',
      });

      render(<RegisterPage />);

      // Fill and submit form
      await user.type(screen.getByLabelText(/username/i), validFormData.username);
      await user.type(screen.getByLabelText(/email address/i), validFormData.email);
      await user.type(screen.getByPlaceholderText('Enter your password'), validFormData.password);
      await user.type(screen.getByLabelText(/confirm password/i), validFormData.confirm_password);
      await user.click(screen.getByRole('button', { name: /create account/i }));

      await waitFor(() => {
        expect(screen.getByText(/this username is already taken/i)).toBeInTheDocument();
      });
    });

    it('handles general API errors', async () => {
      const user = userEvent.setup();
      mockAuthRegister.mockRejectedValueOnce({
        status: 500,
        message: 'Internal server error',
      });

      render(<RegisterPage />);

      // Fill and submit form
      await user.type(screen.getByLabelText(/username/i), validFormData.username);
      await user.type(screen.getByLabelText(/email address/i), validFormData.email);
      await user.type(screen.getByPlaceholderText('Enter your password'), validFormData.password);
      await user.type(screen.getByLabelText(/confirm password/i), validFormData.confirm_password);
      await user.click(screen.getByRole('button', { name: /create account/i }));

      await waitFor(() => {
        expect(screen.getByText(/internal server error/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('has proper form labels and ARIA attributes', () => {
      render(<RegisterPage />);

      const usernameInput = screen.getByLabelText(/username/i);
      const emailInput = screen.getByLabelText(/email address/i);
      const passwordInput = screen.getByPlaceholderText('Enter your password');
      const confirmPasswordInput = screen.getByLabelText(/confirm password/i);

      expect(usernameInput).toHaveAttribute('required');
      expect(emailInput).toHaveAttribute('required');
      expect(passwordInput).toHaveAttribute('required');
      expect(confirmPasswordInput).toHaveAttribute('required');
    });
  });
});