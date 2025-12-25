import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import Login from '../../src/pages/Login';
import { useAuth } from '../../src/contexts/AuthContext';
import * as authApi from '../../src/api/auth';

const mockLogin = vi.mocked(authApi.login);

// Mock dependencies
vi.mock('../../src/contexts/AuthContext');
vi.mock('../../src/api/auth');

const mockUseAuth = vi.mocked(useAuth);
const mockNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('Login', () => {
  const mockLoginFn = vi.fn();

  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    mockNavigate.mockClear();

    mockUseAuth.mockReturnValue({
      user: null,
      token: null,
      login: mockLoginFn,
      logout: vi.fn(),
      isCS: false,
      isTechnician: false,
      isLeader: false,
    });
  });

  it('should render login form', () => {
    render(
      <BrowserRouter>
        <Login />
      </BrowserRouter>
    );

    expect(screen.getByText('FurniCare')).toBeInTheDocument();
    expect(screen.getByText('Warranty Management System')).toBeInTheDocument();
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
  });

  it('should load remembered email from localStorage', () => {
    localStorage.setItem('remembered_email', 'test@example.com');
    localStorage.setItem('remember_me', 'true');

    render(
      <BrowserRouter>
        <Login />
      </BrowserRouter>
    );

    const emailInput = screen.getByLabelText('Email') as HTMLInputElement;
    expect(emailInput.value).toBe('test@example.com');
  });

  it('should handle successful login', async () => {
    const user = userEvent.setup();
    const mockResponse = {
      data: {
        token: 'test-token',
        user: { id: 1, email: 'test@example.com', name: 'Test User', role: 'cs' },
      },
      status: 200,
      statusText: 'OK',
      headers: {},
      config: {} as any,
    };

    mockLogin.mockResolvedValue(mockResponse as any);

    render(
      <BrowserRouter>
        <Login />
      </BrowserRouter>
    );

    const emailInput = screen.getByLabelText('Email');
    const passwordInput = screen.getByLabelText('Password');
    const submitButton = screen.getByRole('button', { name: 'Login' });

    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'password123');
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('test@example.com', 'password123', false);
      expect(mockLoginFn).toHaveBeenCalled();
    });
  });

  it('should save email when rememberMe is checked', async () => {
    const user = userEvent.setup();
    const mockResponse = {
      data: {
        token: 'test-token',
        user: { id: 1, email: 'test@example.com', name: 'Test User', role: 'cs' },
      },
      status: 200,
      statusText: 'OK',
      headers: {},
      config: {} as any,
    };

    mockLogin.mockResolvedValue(mockResponse as any);

    render(
      <BrowserRouter>
        <Login />
      </BrowserRouter>
    );

    const emailInput = screen.getByLabelText('Email');
    const passwordInput = screen.getByLabelText('Password');
    const rememberMeCheckbox = screen.getByLabelText(/Remember Me/i);
    const submitButton = screen.getByRole('button', { name: 'Login' });

    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'password123');
    await user.click(rememberMeCheckbox);
    await user.click(submitButton);

    await waitFor(() => {
      expect(localStorage.getItem('remembered_email')).toBe('test@example.com');
      expect(localStorage.getItem('remember_me')).toBe('true');
    });
  });

  it('should display error on login failure', async () => {
    const user = userEvent.setup();
    mockLogin.mockRejectedValue(new Error('Invalid credentials'));

    render(
      <BrowserRouter>
        <Login />
      </BrowserRouter>
    );

    const emailInput = screen.getByLabelText('Email');
    const passwordInput = screen.getByLabelText('Password');
    const submitButton = screen.getByRole('button', { name: 'Login' });

    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'wrongpassword');
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Invalid email or password')).toBeInTheDocument();
    });
  });

  it('should not render when already authenticated', () => {
    mockUseAuth.mockReturnValue({
      user: { id: 1, email: 'test@example.com', name: 'Test User', role: 'cs' },
      token: 'test-token',
      login: mockLoginFn,
      logout: vi.fn(),
      isCS: true,
      isTechnician: false,
      isLeader: false,
    });

    const { container } = render(
      <BrowserRouter>
        <Login />
      </BrowserRouter>
    );

    expect(container.firstChild).toBeNull();
  });
});

