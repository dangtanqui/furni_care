import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from '../../src/components/Layout';
import { useAuth } from '../../src/contexts/AuthContext';

// Mock dependencies
vi.mock('../../src/contexts/AuthContext');

const mockUseAuth = vi.mocked(useAuth);
const mockLogout = vi.fn();
const mockNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('Layout', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render logo and brand name', () => {
    mockUseAuth.mockReturnValue({
      user: { id: 1, email: 'test@example.com', name: 'Test User', role: 'cs' },
      token: 'test-token',
      login: vi.fn(),
      logout: mockLogout,
      isCS: true,
      isTechnician: false,
      isLeader: false,
    });

    render(
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<div>Home</div>} />
          </Route>
        </Routes>
      </BrowserRouter>
    );

    expect(screen.getByText('FurniCare')).toBeInTheDocument();
    const logoLink = screen.getByRole('link', { name: /FurniCare/i });
    expect(logoLink).toHaveAttribute('href', '/');
  });

  it('should display user name and role', () => {
    mockUseAuth.mockReturnValue({
      user: { id: 1, email: 'test@example.com', name: 'Test User', role: 'cs' },
      token: 'test-token',
      login: vi.fn(),
      logout: mockLogout,
      isCS: true,
      isTechnician: false,
      isLeader: false,
    });

    render(
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<div>Home</div>} />
          </Route>
        </Routes>
      </BrowserRouter>
    );

    expect(screen.getByText('Test User')).toBeInTheDocument();
    expect(screen.getByText('cs')).toBeInTheDocument();
  });

  it('should handle logout when logout button is clicked', async () => {
    const user = userEvent.setup();
    mockUseAuth.mockReturnValue({
      user: { id: 1, email: 'test@example.com', name: 'Test User', role: 'cs' },
      token: 'test-token',
      login: vi.fn(),
      logout: mockLogout,
      isCS: true,
      isTechnician: false,
      isLeader: false,
    });

    render(
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<div>Home</div>} />
          </Route>
        </Routes>
      </BrowserRouter>
    );

    const logoutButton = screen.getByRole('button');
    await user.click(logoutButton);

    expect(mockLogout).toHaveBeenCalledTimes(1);
    expect(mockNavigate).toHaveBeenCalledWith('/login');
  });

  it('should render outlet content', () => {
    mockUseAuth.mockReturnValue({
      user: { id: 1, email: 'test@example.com', name: 'Test User', role: 'cs' },
      token: 'test-token',
      login: vi.fn(),
      logout: mockLogout,
      isCS: true,
      isTechnician: false,
      isLeader: false,
    });

    render(
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<div>Home Content</div>} />
          </Route>
        </Routes>
      </BrowserRouter>
    );

    expect(screen.getByText('Home Content')).toBeInTheDocument();
  });

  it('should handle null user', () => {
    mockUseAuth.mockReturnValue({
      user: null,
      token: null,
      login: vi.fn(),
      logout: mockLogout,
      isCS: false,
      isTechnician: false,
      isLeader: false,
    });

    render(
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<div>Home</div>} />
          </Route>
        </Routes>
      </BrowserRouter>
    );

    // Should still render layout without crashing
    expect(screen.getByText('FurniCare')).toBeInTheDocument();
  });
});

