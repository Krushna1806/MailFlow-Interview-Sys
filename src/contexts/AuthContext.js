import React, { createContext, useContext, useReducer, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';

// Initial state
const initialState = {
  user: null,
  token: null,
  refreshToken: null,
  loading: true,
  error: null,
};

// Action types
const ActionTypes = {
  AUTH_START: 'AUTH_START',
  AUTH_SUCCESS: 'AUTH_SUCCESS',
  AUTH_FAILURE: 'AUTH_FAILURE',
  LOGOUT: 'LOGOUT',
  CLEAR_ERROR: 'CLEAR_ERROR',
  UPDATE_USER: 'UPDATE_USER',
  SET_LOADING: 'SET_LOADING',
};

// Reducer function
const authReducer = (state, action) => {
  switch (action.type) {
    case ActionTypes.AUTH_START:
      return {
        ...state,
        loading: true,
        error: null,
      };
    case ActionTypes.AUTH_SUCCESS:
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        refreshToken: action.payload.refreshToken,
        loading: false,
        error: null,
      };
    case ActionTypes.AUTH_FAILURE:
      return {
        ...state,
        user: null,
        token: null,
        refreshToken: null,
        loading: false,
        error: action.payload,
      };
    case ActionTypes.LOGOUT:
      return {
        ...state,
        user: null,
        token: null,
        refreshToken: null,
        loading: false,
        error: null,
      };
    case ActionTypes.UPDATE_USER:
      return {
        ...state,
        user: action.payload,
      };
    case ActionTypes.CLEAR_ERROR:
      return {
        ...state,
        error: null,
      };
    case ActionTypes.SET_LOADING:
      return {
        ...state,
        loading: action.payload,
      };
    default:
      return state;
  }
};

// Create context
const AuthContext = createContext();

// API base URL
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

// Axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Auth Provider Component
export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Setup axios interceptors
  useEffect(() => {
    // Request interceptor to add auth token
    const requestInterceptor = api.interceptors.request.use(
      (config) => {
        if (state.token) {
          config.headers.Authorization = `Bearer ${state.token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor to handle token refresh
    const responseInterceptor = api.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          if (state.refreshToken) {
            try {
              const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
                refreshToken: state.refreshToken,
              });

              const { token, refreshToken } = response.data.data;
              
              // Update tokens in state
              dispatch({
                type: ActionTypes.AUTH_SUCCESS,
                payload: {
                  user: state.user,
                  token,
                  refreshToken,
                },
              });

              // Store tokens in localStorage
              localStorage.setItem('token', token);
              localStorage.setItem('refreshToken', refreshToken);

              // Retry original request
              originalRequest.headers.Authorization = `Bearer ${token}`;
              return api(originalRequest);
            } catch (refreshError) {
              // Refresh failed, logout user
              logout();
              return Promise.reject(refreshError);
            }
          } else {
            // No refresh token, logout user
            logout();
          }
        }

        return Promise.reject(error);
      }
    );

    // Cleanup interceptors
    return () => {
      api.interceptors.request.eject(requestInterceptor);
      api.interceptors.response.eject(responseInterceptor);
    };
  }, [state.token, state.refreshToken, state.user]);

  // Initialize auth state from localStorage
  useEffect(() => {
    const initializeAuth = async () => {
      const token = localStorage.getItem('token');
      const refreshToken = localStorage.getItem('refreshToken');

      if (token) {
        try {
          // Verify token and get user data
          const response = await axios.get(`${API_BASE_URL}/auth/me`, {
            headers: { Authorization: `Bearer ${token}` },
          });

          dispatch({
            type: ActionTypes.AUTH_SUCCESS,
            payload: {
              user: response.data.data.user,
              token,
              refreshToken,
            },
          });
        } catch (error) {
          // Token is invalid, clear it
          localStorage.removeItem('token');
          localStorage.removeItem('refreshToken');
          dispatch({ type: ActionTypes.SET_LOADING, payload: false });
        }
      } else {
        dispatch({ type: ActionTypes.SET_LOADING, payload: false });
      }
    };

    initializeAuth();
  }, []);

  // Authentication functions
  const login = async (email, password) => {
    try {
      dispatch({ type: ActionTypes.AUTH_START });

      const response = await api.post('/auth/login', { email, password });
      const { user, token, refreshToken } = response.data.data;

      // Store tokens in localStorage
      localStorage.setItem('token', token);
      localStorage.setItem('refreshToken', refreshToken);

      dispatch({
        type: ActionTypes.AUTH_SUCCESS,
        payload: { user, token, refreshToken },
      });

      toast.success('Welcome back!');
      return { success: true, data: { user } };
    } catch (error) {
      const message = error.response?.data?.message || 'Login failed';
      dispatch({ type: ActionTypes.AUTH_FAILURE, payload: message });
      toast.error(message);
      return { success: false, error: message };
    }
  };

  const register = async (userData) => {
    try {
      dispatch({ type: ActionTypes.AUTH_START });

      const response = await api.post('/auth/register', userData);
      const { user, token, refreshToken } = response.data.data;

      // Store tokens in localStorage
      localStorage.setItem('token', token);
      localStorage.setItem('refreshToken', refreshToken);

      dispatch({
        type: ActionTypes.AUTH_SUCCESS,
        payload: { user, token, refreshToken },
      });

      toast.success('Account created successfully!');
      return { success: true, data: { user } };
    } catch (error) {
      const message = error.response?.data?.message || 'Registration failed';
      dispatch({ type: ActionTypes.AUTH_FAILURE, payload: message });
      toast.error(message);
      return { success: false, error: message };
    }
  };

  const logout = async () => {
    try {
      // Call logout endpoint if token exists
      if (state.token) {
        await api.post('/auth/logout');
      }
    } catch (error) {
      // Continue with logout even if API call fails
      console.error('Logout API call failed:', error);
    } finally {
      // Clear localStorage
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');

      // Update state
      dispatch({ type: ActionTypes.LOGOUT });
      
      toast.success('Logged out successfully');
    }
  };

  const forgotPassword = async (email) => {
    try {
      dispatch({ type: ActionTypes.AUTH_START });

      await api.post('/auth/forgot-password', { email });
      
      dispatch({ type: ActionTypes.SET_LOADING, payload: false });
      toast.success('Password reset instructions sent to your email');
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to send reset email';
      dispatch({ type: ActionTypes.AUTH_FAILURE, payload: message });
      toast.error(message);
      return { success: false, error: message };
    }
  };

  const resetPassword = async (token, password) => {
    try {
      dispatch({ type: ActionTypes.AUTH_START });

      const response = await api.post('/auth/reset-password', { token, password });
      const { token: authToken, refreshToken } = response.data.data;

      // Store tokens in localStorage
      localStorage.setItem('token', authToken);
      localStorage.setItem('refreshToken', refreshToken);

      // Get user data
      const userResponse = await api.get('/auth/me', {
        headers: { Authorization: `Bearer ${authToken}` },
      });

      dispatch({
        type: ActionTypes.AUTH_SUCCESS,
        payload: {
          user: userResponse.data.data.user,
          token: authToken,
          refreshToken,
        },
      });

      toast.success('Password reset successfully!');
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Password reset failed';
      dispatch({ type: ActionTypes.AUTH_FAILURE, payload: message });
      toast.error(message);
      return { success: false, error: message };
    }
  };

  const verifyEmail = async (token) => {
    try {
      dispatch({ type: ActionTypes.AUTH_START });

      await api.post('/auth/verify-email', { token });
      
      // Refresh user data
      if (state.token) {
        const response = await api.get('/auth/me');
        dispatch({
          type: ActionTypes.UPDATE_USER,
          payload: response.data.data.user,
        });
      }

      dispatch({ type: ActionTypes.SET_LOADING, payload: false });
      toast.success('Email verified successfully!');
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Email verification failed';
      dispatch({ type: ActionTypes.AUTH_FAILURE, payload: message });
      toast.error(message);
      return { success: false, error: message };
    }
  };

  const updateProfile = async (userData) => {
    try {
      const response = await api.put('/auth/me', userData);
      
      dispatch({
        type: ActionTypes.UPDATE_USER,
        payload: response.data.data.user,
      });

      toast.success('Profile updated successfully!');
      return { success: true, data: response.data.data.user };
    } catch (error) {
      const message = error.response?.data?.message || 'Profile update failed';
      toast.error(message);
      return { success: false, error: message };
    }
  };

  const changePassword = async (currentPassword, newPassword) => {
    try {
      await api.post('/auth/change-password', { currentPassword, newPassword });
      
      toast.success('Password changed successfully!');
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Password change failed';
      toast.error(message);
      return { success: false, error: message };
    }
  };

  const clearError = () => {
    dispatch({ type: ActionTypes.CLEAR_ERROR });
  };

  // Context value
  const value = {
    // State
    user: state.user,
    token: state.token,
    loading: state.loading,
    error: state.error,
    
    // Actions
    login,
    register,
    logout,
    forgotPassword,
    resetPassword,
    verifyEmail,
    updateProfile,
    changePassword,
    clearError,
    
    // Utilities
    isAuthenticated: !!state.user,
    api, // Expose configured axios instance
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;