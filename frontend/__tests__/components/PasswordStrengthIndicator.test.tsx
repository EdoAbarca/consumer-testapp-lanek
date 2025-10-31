/**
 * Password Strength Indicator Tests
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { PasswordStrengthIndicator } from '../../src/components/ui/PasswordStrengthIndicator';

describe('PasswordStrengthIndicator', () => {
  it('does not render when show is false', () => {
    render(<PasswordStrengthIndicator password="test" show={false} />);
    
    expect(screen.queryByText(/password strength/i)).not.toBeInTheDocument();
  });

  it('does not render when password is empty', () => {
    render(<PasswordStrengthIndicator password="" show={true} />);
    
    expect(screen.queryByText(/password strength/i)).not.toBeInTheDocument();
  });

  it('shows weak password strength for simple password', () => {
    render(<PasswordStrengthIndicator password="weak" show={true} />);
    
    expect(screen.getByText(/password strength/i)).toBeInTheDocument();
    expect(screen.getByText(/weak/i)).toBeInTheDocument();
    expect(screen.getByText(/missing requirements/i)).toBeInTheDocument();
  });

  it('shows strong password strength for complex password', () => {
    render(<PasswordStrengthIndicator password="StrongPass123!" show={true} />);
    
    expect(screen.getAllByText(/strong/i)).toHaveLength(2); // Label and success message
    expect(screen.getByText(/all requirements met/i)).toBeInTheDocument();
  });

  it('lists missing requirements for weak passwords', () => {
    render(<PasswordStrengthIndicator password="weak" show={true} />);
    
    expect(screen.getByText(/uppercase letter/i)).toBeInTheDocument();
    expect(screen.getByText(/number/i)).toBeInTheDocument();
    expect(screen.getByText(/special character/i)).toBeInTheDocument();
  });

  it('shows appropriate strength levels', () => {
    const { rerender } = render(<PasswordStrengthIndicator password="ab" show={true} />);
    expect(screen.getByText(/weak/i)).toBeInTheDocument();

    rerender(<PasswordStrengthIndicator password="Abc12" show={true} />);
    expect(screen.getByText(/fair/i)).toBeInTheDocument();

    rerender(<PasswordStrengthIndicator password="Abc123!" show={true} />);
    expect(screen.getByText(/good/i)).toBeInTheDocument();

    rerender(<PasswordStrengthIndicator password="StrongPass123!" show={true} />);
    expect(screen.getAllByText(/strong/i)).toHaveLength(2);
  });
});