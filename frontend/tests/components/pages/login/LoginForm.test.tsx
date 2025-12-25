import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import LoginForm from '../../../../src/components/pages/login/LoginForm';
/// <reference types="@testing-library/jest-dom" />

describe('LoginForm', () => {
  const mockOnEmailChange = vi.fn();
  const mockOnPasswordChange = vi.fn();
  const mockOnTogglePassword = vi.fn();
  const mockOnRememberMeChange = vi.fn();
  const mockOnSubmit = vi.fn((e) => e.preventDefault());

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render email and password inputs', () => {
    render(
      <LoginForm
        email=""
        password=""
        showPassword={false}
        rememberMe={false}
        error=""
        loading={false}
        onEmailChange={mockOnEmailChange}
        onPasswordChange={mockOnPasswordChange}
        onTogglePassword={mockOnTogglePassword}
        onRememberMeChange={mockOnRememberMeChange}
        onSubmit={mockOnSubmit}
      />
    );

    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
  });

  it('should display error message when error is provided', () => {
    render(
      <LoginForm
        email=""
        password=""
        showPassword={false}
        rememberMe={false}
        error="Invalid credentials"
        loading={false}
        onEmailChange={mockOnEmailChange}
        onPasswordChange={mockOnPasswordChange}
        onTogglePassword={mockOnTogglePassword}
        onRememberMeChange={mockOnRememberMeChange}
        onSubmit={mockOnSubmit}
      />
    );

    expect(screen.getByText('Invalid credentials')).toBeInTheDocument();
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  it('should not display error when error is empty', () => {
    render(
      <LoginForm
        email=""
        password=""
        showPassword={false}
        rememberMe={false}
        error=""
        loading={false}
        onEmailChange={mockOnEmailChange}
        onPasswordChange={mockOnPasswordChange}
        onTogglePassword={mockOnTogglePassword}
        onRememberMeChange={mockOnRememberMeChange}
        onSubmit={mockOnSubmit}
      />
    );

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('should call onEmailChange when email input changes', async () => {
    const user = userEvent.setup();
    render(
      <LoginForm
        email=""
        password=""
        showPassword={false}
        rememberMe={false}
        error=""
        loading={false}
        onEmailChange={mockOnEmailChange}
        onPasswordChange={mockOnPasswordChange}
        onTogglePassword={mockOnTogglePassword}
        onRememberMeChange={mockOnRememberMeChange}
        onSubmit={mockOnSubmit}
      />
    );

    const emailInput = screen.getByLabelText('Email');
    await user.type(emailInput, 'test@example.com');

    expect(mockOnEmailChange).toHaveBeenCalled();
  });

  it('should call onPasswordChange when password input changes', async () => {
    const user = userEvent.setup();
    render(
      <LoginForm
        email=""
        password=""
        showPassword={false}
        rememberMe={false}
        error=""
        loading={false}
        onEmailChange={mockOnEmailChange}
        onPasswordChange={mockOnPasswordChange}
        onTogglePassword={mockOnTogglePassword}
        onRememberMeChange={mockOnRememberMeChange}
        onSubmit={mockOnSubmit}
      />
    );

    const passwordInput = screen.getByLabelText('Password');
    await user.type(passwordInput, 'password123');

    expect(mockOnPasswordChange).toHaveBeenCalled();
  });

  it('should toggle password visibility', async () => {
    const user = userEvent.setup();
    const { rerender } = render(
      <LoginForm
        email=""
        password=""
        showPassword={false}
        rememberMe={false}
        error=""
        loading={false}
        onEmailChange={mockOnEmailChange}
        onPasswordChange={mockOnPasswordChange}
        onTogglePassword={mockOnTogglePassword}
        onRememberMeChange={mockOnRememberMeChange}
        onSubmit={mockOnSubmit}
      />
    );

    const passwordInput = screen.getByLabelText('Password');
    expect(passwordInput).toHaveAttribute('type', 'password');

    const toggleButton = screen.getByRole('button', { name: 'Show password' });
    await user.click(toggleButton);

    expect(mockOnTogglePassword).toHaveBeenCalled();

    rerender(
      <LoginForm
        email=""
        password=""
        showPassword={true}
        rememberMe={false}
        error=""
        loading={false}
        onEmailChange={mockOnEmailChange}
        onPasswordChange={mockOnPasswordChange}
        onTogglePassword={mockOnTogglePassword}
        onRememberMeChange={mockOnRememberMeChange}
        onSubmit={mockOnSubmit}
      />
    );

    expect(passwordInput).toHaveAttribute('type', 'text');
    expect(screen.getByRole('button', { name: 'Hide password' })).toBeInTheDocument();
  });

  it('should call onRememberMeChange when checkbox is toggled', async () => {
    const user = userEvent.setup();
    render(
      <LoginForm
        email=""
        password=""
        showPassword={false}
        rememberMe={false}
        error=""
        loading={false}
        onEmailChange={mockOnEmailChange}
        onPasswordChange={mockOnPasswordChange}
        onTogglePassword={mockOnTogglePassword}
        onRememberMeChange={mockOnRememberMeChange}
        onSubmit={mockOnSubmit}
      />
    );

    const rememberMeCheckbox = screen.getByLabelText(/Remember Me/i);
    await user.click(rememberMeCheckbox);

    expect(mockOnRememberMeChange).toHaveBeenCalledWith(true);
  });

  it('should call onSubmit when form is submitted', async () => {
    const user = userEvent.setup();
    render(
      <LoginForm
        email="test@example.com"
        password="password123"
        showPassword={false}
        rememberMe={false}
        error=""
        loading={false}
        onEmailChange={mockOnEmailChange}
        onPasswordChange={mockOnPasswordChange}
        onTogglePassword={mockOnTogglePassword}
        onRememberMeChange={mockOnRememberMeChange}
        onSubmit={mockOnSubmit}
      />
    );

    const submitButton = screen.getByRole('button', { name: 'Login' });
    await user.click(submitButton);

    expect(mockOnSubmit).toHaveBeenCalled();
  });

  it('should disable inputs when loading', () => {
    render(
      <LoginForm
        email=""
        password=""
        showPassword={false}
        rememberMe={false}
        error=""
        loading={true}
        onEmailChange={mockOnEmailChange}
        onPasswordChange={mockOnPasswordChange}
        onTogglePassword={mockOnTogglePassword}
        onRememberMeChange={mockOnRememberMeChange}
        onSubmit={mockOnSubmit}
      />
    );

    const emailInput = screen.getByLabelText('Email');
    const passwordInput = screen.getByLabelText('Password');
    const submitButton = screen.getByRole('button', { name: 'Login' });

    expect(emailInput).toBeDisabled();
    expect(passwordInput).toBeDisabled();
    expect(submitButton).toBeDisabled();
  });

  it('should display demo account information', () => {
    render(
      <LoginForm
        email=""
        password=""
        showPassword={false}
        rememberMe={false}
        error=""
        loading={false}
        onEmailChange={mockOnEmailChange}
        onPasswordChange={mockOnPasswordChange}
        onTogglePassword={mockOnTogglePassword}
        onRememberMeChange={mockOnRememberMeChange}
        onSubmit={mockOnSubmit}
      />
    );

    expect(screen.getByText(/Demo accounts:/)).toBeInTheDocument();
    expect(screen.getByText(/cs@demo.com/)).toBeInTheDocument();
  });
});

