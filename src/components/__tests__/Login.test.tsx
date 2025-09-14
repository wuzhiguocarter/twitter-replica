import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../../context/AuthContext';
import { Login } from '../Login';

// Mock the useAuth hook
const mockLogin = jest.fn();
const mockClearError = jest.fn();

jest.mock('../../context/AuthContext', () => ({
  ...jest.requireActual('../../context/AuthContext'),
  useAuth: () => ({
    login: mockLogin,
    isAuthenticated: false,
    isLoading: false,
    error: null,
    clearError: mockClearError,
  }),
}));

// Mock react-router-dom
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

const LoginWrapper = ({ children }: { children: React.ReactNode }) => (
  <BrowserRouter>
    <AuthProvider>
      {children}
    </AuthProvider>
  </BrowserRouter>
);

describe('Login Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders login form correctly', () => {
    render(
      <LoginWrapper>
        <Login />
      </LoginWrapper>
    );

    expect(screen.getByText('Sign in to Twitter')).toBeInTheDocument();
    expect(screen.getByLabelText('Username or Email')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Sign in' })).toBeInTheDocument();
    expect(screen.getByText("Don't have an account?")).toBeInTheDocument();
  });

  it('shows demo account information', () => {
    render(
      <LoginWrapper>
        <Login />
      </LoginWrapper>
    );

    expect(screen.getByText('Demo Account')).toBeInTheDocument();
    expect(screen.getByText('Username:')).toBeInTheDocument();
    expect(screen.getByText('demo')).toBeInTheDocument();
    expect(screen.getByText('Password:')).toBeInTheDocument();
    expect(screen.getByText('demo123')).toBeInTheDocument();
  });

  it('handles form input changes', () => {
    render(
      <LoginWrapper>
        <Login />
      </LoginWrapper>
    );

    const usernameInput = screen.getByLabelText('Username or Email');
    const passwordInput = screen.getByLabelText('Password');

    fireEvent.change(usernameInput, { target: { value: 'testuser' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });

    expect(usernameInput).toHaveValue('testuser');
    expect(passwordInput).toHaveValue('password123');
  });

  it('toggles password visibility', () => {
    render(
      <LoginWrapper>
        <Login />
      </LoginWrapper>
    );

    const passwordInput = screen.getByLabelText('Password');
    const toggleButton = screen.getByRole('button', { name: '' }); // Eye icon button

    expect(passwordInput).toHaveAttribute('type', 'password');

    fireEvent.click(toggleButton);
    expect(passwordInput).toHaveAttribute('type', 'text');

    fireEvent.click(toggleButton);
    expect(passwordInput).toHaveAttribute('type', 'password');
  });

  it('disables submit button when form is invalid', () => {
    render(
      <LoginWrapper>
        <Login />
      </LoginWrapper>
    );

    const submitButton = screen.getByRole('button', { name: 'Sign in' });
    expect(submitButton).toBeDisabled();

    // Fill only username
    const usernameInput = screen.getByLabelText('Username or Email');
    fireEvent.change(usernameInput, { target: { value: 'testuser' } });
    expect(submitButton).toBeDisabled();

    // Fill both fields
    const passwordInput = screen.getByLabelText('Password');
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    expect(submitButton).not.toBeDisabled();
  });

  it('calls login function on form submission', async () => {
    mockLogin.mockResolvedValue(undefined);

    render(
      <LoginWrapper>
        <Login />
      </LoginWrapper>
    );

    const usernameInput = screen.getByLabelText('Username or Email');
    const passwordInput = screen.getByLabelText('Password');
    const submitButton = screen.getByRole('button', { name: 'Sign in' });

    fireEvent.change(usernameInput, { target: { value: 'testuser' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('testuser', 'password123');
    });
  });

  it('shows loading state during submission', async () => {
    mockLogin.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 1000)));

    render(
      <LoginWrapper>
        <Login />
      </LoginWrapper>
    );

    const usernameInput = screen.getByLabelText('Username or Email');
    const passwordInput = screen.getByLabelText('Password');
    const submitButton = screen.getByRole('button', { name: 'Sign in' });

    fireEvent.change(usernameInput, { target: { value: 'testuser' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.click(submitButton);

    expect(screen.getByText('Signing in...')).toBeInTheDocument();
    expect(submitButton).toBeDisabled();
  });

  it('clears error when user starts typing', () => {
    const mockUseAuth = jest.fn(() => ({
      login: mockLogin,
      isAuthenticated: false,
      isLoading: false,
      error: 'Login failed',
      clearError: mockClearError,
    }));

    jest.doMock('../../context/AuthContext', () => ({
      ...jest.requireActual('../../context/AuthContext'),
      useAuth: mockUseAuth,
    }));

    render(
      <LoginWrapper>
        <Login />
      </LoginWrapper>
    );

    const usernameInput = screen.getByLabelText('Username or Email');
    fireEvent.change(usernameInput, { target: { value: 'test' } });

    expect(mockClearError).toHaveBeenCalled();
  });

  it('prevents multiple submissions', async () => {
    mockLogin.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 1000)));

    render(
      <LoginWrapper>
        <Login />
      </LoginWrapper>
    );

    const usernameInput = screen.getByLabelText('Username or Email');
    const passwordInput = screen.getByLabelText('Password');
    const submitButton = screen.getByRole('button', { name: 'Sign in' });

    fireEvent.change(usernameInput, { target: { value: 'testuser' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    
    // Click multiple times
    fireEvent.click(submitButton);
    fireEvent.click(submitButton);
    fireEvent.click(submitButton);

    // Should only call login once
    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledTimes(1);
    });
  });

  it('has proper accessibility attributes', () => {
    render(
      <LoginWrapper>
        <Login />
      </LoginWrapper>
    );

    const usernameInput = screen.getByLabelText('Username or Email');
    const passwordInput = screen.getByLabelText('Password');
    const form = screen.getByRole('form');

    expect(usernameInput).toHaveAttribute('required');
    expect(passwordInput).toHaveAttribute('required');
    expect(usernameInput).toHaveAttribute('type', 'text');
    expect(passwordInput).toHaveAttribute('type', 'password');
    expect(form).toBeInTheDocument();
  });

  it('shows link to registration page', () => {
    render(
      <LoginWrapper>
        <Login />
      </LoginWrapper>
    );

    const signUpLink = screen.getByRole('link', { name: 'Sign up' });
    expect(signUpLink).toBeInTheDocument();
    expect(signUpLink).toHaveAttribute('href', '/register');
  });
});