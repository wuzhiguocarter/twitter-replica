import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { authAPI, setTokens, logout as apiLogout, isAuthenticated } from '../services/api';
import { User } from '../types';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

interface AuthContextType extends AuthState {
  login: (identifier: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
  updateProfile: (data: Partial<User>) => Promise<void>;
  clearError: () => void;
}

interface RegisterData {
  username: string;
  email: string;
  password: string;
  displayName: string;
}

type AuthAction =
  | { type: 'AUTH_START' }
  | { type: 'AUTH_SUCCESS'; payload: User }
  | { type: 'AUTH_FAILURE'; payload: string }
  | { type: 'LOGOUT' }
  | { type: 'UPDATE_PROFILE'; payload: User }
  | { type: 'CLEAR_ERROR' };

const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,
};

const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case 'AUTH_START':
      return {
        ...state,
        isLoading: true,
        error: null,
      };
    case 'AUTH_SUCCESS':
      return {
        ...state,
        user: action.payload,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      };
    case 'AUTH_FAILURE':
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: action.payload,
      };
    case 'LOGOUT':
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      };
    case 'UPDATE_PROFILE':
      return {
        ...state,
        user: action.payload,
        error: null,
      };
    case 'CLEAR_ERROR':
      return {
        ...state,
        error: null,
      };
    default:
      return state;
  }
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Check for existing authentication on mount
  useEffect(() => {
    const checkAuth = async () => {
      if (isAuthenticated()) {
        try {
          const response = await authAPI.getProfile();
          if (response.data.success) {
            dispatch({ type: 'AUTH_SUCCESS', payload: response.data.data.user });
          } else {
            // Token is invalid, clear it
            apiLogout();
            dispatch({ type: 'LOGOUT' });
          }
        } catch (error) {
          // Token is invalid, clear it
          apiLogout();
          dispatch({ type: 'LOGOUT' });
        }
      } else {
        dispatch({ type: 'LOGOUT' });
      }
    };

    checkAuth();
  }, []);

  const login = async (identifier: string, password: string): Promise<void> => {
    try {
      dispatch({ type: 'AUTH_START' });
      
      const response = await authAPI.login({ identifier, password });
      
      if (response.data.success) {
        const { user, tokens } = response.data.data;
        
        // Store tokens
        setTokens(tokens);
        
        // Store user in localStorage for persistence
        localStorage.setItem('user', JSON.stringify(user));
        
        dispatch({ type: 'AUTH_SUCCESS', payload: user });
      } else {
        dispatch({ type: 'AUTH_FAILURE', payload: response.data.message });
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Login failed';
      dispatch({ type: 'AUTH_FAILURE', payload: errorMessage });
    }
  };

  const register = async (data: RegisterData): Promise<void> => {
    try {
      dispatch({ type: 'AUTH_START' });
      
      const response = await authAPI.register(data);
      
      if (response.data.success) {
        const { user, tokens } = response.data.data;
        
        // Store tokens
        setTokens(tokens);
        
        // Store user in localStorage for persistence
        localStorage.setItem('user', JSON.stringify(user));
        
        dispatch({ type: 'AUTH_SUCCESS', payload: user });
      } else {
        dispatch({ type: 'AUTH_FAILURE', payload: response.data.message });
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Registration failed';
      dispatch({ type: 'AUTH_FAILURE', payload: errorMessage });
    }
  };

  const logout = (): void => {
    try {
      // Call API logout (optional, for token cleanup)
      const refreshToken = localStorage.getItem('refreshToken');
      if (refreshToken) {
        authAPI.logout(refreshToken).catch(() => {
          // Ignore errors on logout
        });
      }
    } catch (error) {
      // Ignore errors on logout
    } finally {
      // Clear local storage and state
      apiLogout();
      dispatch({ type: 'LOGOUT' });
    }
  };

  const updateProfile = async (data: Partial<User>): Promise<void> => {
    try {
      const response = await authAPI.updateProfile(data);
      
      if (response.data.success) {
        const updatedUser = response.data.data.user;
        
        // Update localStorage
        localStorage.setItem('user', JSON.stringify(updatedUser));
        
        dispatch({ type: 'UPDATE_PROFILE', payload: updatedUser });
      } else {
        dispatch({ type: 'AUTH_FAILURE', payload: response.data.message });
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Profile update failed';
      dispatch({ type: 'AUTH_FAILURE', payload: errorMessage });
    }
  };

  const clearError = (): void => {
    dispatch({ type: 'CLEAR_ERROR' });
  };

  const value: AuthContextType = {
    ...state,
    login,
    register,
    logout,
    updateProfile,
    clearError,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;