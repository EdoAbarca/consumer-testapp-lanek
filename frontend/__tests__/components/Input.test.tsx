/**
 * Input Component Tests
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Input } from '../../src/components/ui/Input';

describe('Input Component', () => {
  it('renders basic input with label', () => {
    render(<Input label="Test Label" placeholder="Test placeholder" />);
    
    expect(screen.getByLabelText(/test label/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/test placeholder/i)).toBeInTheDocument();
  });

  it('shows required indicator when required', () => {
    render(<Input label="Required Field" required />);
    
    expect(screen.getByText('*')).toBeInTheDocument();
  });

  it('displays error message', () => {
    render(<Input label="Test Field" error="This field is required" />);
    
    expect(screen.getByText(/this field is required/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/test field/i)).toHaveClass('border-red-300');
  });

  it('displays description when no error', () => {
    render(<Input label="Test Field" description="Helper text" />);
    
    expect(screen.getByText(/helper text/i)).toBeInTheDocument();
  });

  it('shows loading indicator when isLoading is true', () => {
    render(<Input label="Test Field" isLoading />);
    
    expect(screen.getByLabelText(/test field/i)).toBeDisabled();
  });

  it('handles user input correctly', async () => {
    const user = userEvent.setup();
    render(<Input label="Test Field" />);
    
    const input = screen.getByLabelText(/test field/i);
    await user.type(input, 'test value');
    
    expect(input).toHaveValue('test value');
  });
});