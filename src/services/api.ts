import axios, { AxiosInstance, AxiosResponse, AxiosError } from 'axios';

// API Configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Create axios instance
const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Token management
let accessToken: string | null = localStorage.getItem('accessToken');
let refreshToken: string | null = localStorage.getItem('refreshToken');

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle token refresh
api.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as any;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      if (refreshToken) {
        try {
          const response = await axios.post(`${API_BASE_URL}/auth/refresh-token`, {
            refreshToken,
          });

          const { accessToken: newAccessToken, refreshToken: newRefreshToken } = response.data.data.tokens;
          
          // Update tokens
          accessToken = newAccessToken;
          refreshToken = newRefreshToken;
          localStorage.setItem('accessToken', newAccessToken);
          localStorage.setItem('refreshToken', newRefreshToken);

          // Retry original request
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          return api(originalRequest);
        } catch (refreshError) {
          // Refresh failed, redirect to login
          logout();
          window.location.href = '/login';
          return Promise.reject(refreshError);
        }
      } else {
        // No refresh token, redirect to login
        logout();
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  }
);

// Auth functions
export const setTokens = (tokens: { accessToken: string; refreshToken: string }) => {
  accessToken = tokens.accessToken;
  refreshToken = tokens.refreshToken;
  localStorage.setItem('accessToken', tokens.accessToken);
  localStorage.setItem('refreshToken', tokens.refreshToken);
};

export const logout = () => {
  accessToken = null;
  refreshToken = null;
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('user');
};

export const isAuthenticated = (): boolean => {
  return !!accessToken;
};

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  errors?: Array<{
    field: string;
    message: string;
    value?: any;
  }>;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface PaginationResponse {
  page: number;
  limit: number;
  hasMore: boolean;
}

// Auth API
export const authAPI = {
  register: (data: {
    username: string;
    email: string;
    password: string;
    displayName: string;
  }) => api.post<ApiResponse>('/auth/register', data),

  login: (data: { identifier: string; password: string }) =>
    api.post<ApiResponse>('/auth/login', data),

  logout: (refreshToken?: string) =>
    api.post<ApiResponse>('/auth/logout', { refreshToken }),

  getProfile: () => api.get<ApiResponse>('/auth/profile'),

  updateProfile: (data: {
    displayName?: string;
    bio?: string;
    location?: string;
    website?: string;
    birthDate?: string;
    settings?: {
      isPrivate?: boolean;
      emailNotifications?: boolean;
      pushNotifications?: boolean;
    };
  }) => api.put<ApiResponse>('/auth/profile', data),

  changePassword: (data: { currentPassword: string; newPassword: string }) =>
    api.put<ApiResponse>('/auth/change-password', data),

  deactivateAccount: () => api.delete<ApiResponse>('/auth/deactivate'),
};

// Tweet API
export const tweetAPI = {
  createTweet: (data: {
    content: string;
    replyTo?: string;
    quoteTweet?: string;
    visibility?: 'public' | 'followers' | 'mentioned';
  }) => api.post<ApiResponse>('/tweets', data),

  getTweet: (id: string) => api.get<ApiResponse>(`/tweets/${id}`),

  getFeed: (params?: PaginationParams) =>
    api.get<ApiResponse>('/tweets/feed', { params }),

  getUserTweets: (username: string, params?: PaginationParams & { replies?: boolean }) =>
    api.get<ApiResponse>(`/users/${username}/tweets`, { params }),

  getTweetReplies: (id: string, params?: PaginationParams) =>
    api.get<ApiResponse>(`/tweets/${id}/replies`, { params }),

  likeTweet: (id: string) => api.post<ApiResponse>(`/tweets/${id}/like`),

  retweetTweet: (id: string, comment?: string) =>
    api.post<ApiResponse>(`/tweets/${id}/retweet`, { comment }),

  bookmarkTweet: (id: string, folder?: string, notes?: string) =>
    api.post<ApiResponse>(`/tweets/${id}/bookmark`, { folder, notes }),

  deleteTweet: (id: string) => api.delete<ApiResponse>(`/tweets/${id}`),

  searchTweets: (query: string, params?: PaginationParams) =>
    api.get<ApiResponse>('/tweets/search', { params: { q: query, ...params } }),

  getTrendingHashtags: (params?: { limit?: number; timeframe?: number }) =>
    api.get<ApiResponse>('/tweets/trending', { params }),
};

// User API
export const userAPI = {
  getUserProfile: (username: string) =>
    api.get<ApiResponse>(`/users/${username}`),

  followUser: (username: string) =>
    api.post<ApiResponse>(`/users/${username}/follow`),

  getUserFollowers: (username: string, params?: PaginationParams) =>
    api.get<ApiResponse>(`/users/${username}/followers`, { params }),

  getUserFollowing: (username: string, params?: PaginationParams) =>
    api.get<ApiResponse>(`/users/${username}/following`, { params }),

  getUserLikedTweets: (username: string, params?: PaginationParams) =>
    api.get<ApiResponse>(`/users/${username}/likes`, { params }),

  getUserStats: (username: string) =>
    api.get<ApiResponse>(`/users/${username}/stats`),

  searchUsers: (query: string, params?: PaginationParams) =>
    api.get<ApiResponse>('/users/search', { params: { q: query, ...params } }),

  getFollowSuggestions: (params?: { limit?: number }) =>
    api.get<ApiResponse>('/users/suggestions/follow', { params }),
};

// Error handler utility
export const handleApiError = (error: AxiosError): string => {
  if (error.response?.data) {
    const data = error.response.data as ApiResponse;
    if (data.errors && data.errors.length > 0) {
      return data.errors.map(err => err.message).join(', ');
    }
    return data.message || 'An error occurred';
  }
  
  if (error.code === 'NETWORK_ERROR') {
    return 'Network error. Please check your connection.';
  }
  
  if (error.code === 'ECONNABORTED') {
    return 'Request timeout. Please try again.';
  }
  
  return error.message || 'An unexpected error occurred';
};

export default api;