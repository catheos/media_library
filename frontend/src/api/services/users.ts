import { api } from '../client';

export interface User {
  id: number;
  username: string;
  created_at: string;
}

export interface LoginResponse {
  token: string;
  user: User;
}

export interface RegisterResponse {
  token: string;
  user: User;
}

export interface UpdateProfileRequest {
  username?: string;
  currentPassword?: string;
  newPassword?: string;
}

export interface UpdateProfileResponse {
  message: string;
  user: User;
}

export const userService = {
  // User register
  register: async (username: string, password: string): Promise<RegisterResponse> => {
    const response = await api('/api/users/register', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
    return response.json();
  },

  // User login
  login: async (username: string, password: string): Promise<LoginResponse> => {
    const response = await api('/api/users/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
    return response.json();
  },

  // Get current user profile
  getProfile: async (): Promise<User> => {
    const response = await api('/api/users/profile');
    return response.json();
  },

  // Get other user profile
  getUser: async (id: number): Promise<User> => {
    const response = await api(`/api/users/${id}`);
    return response.json();
  },

  // Update current user profile
  updateProfile: async (data: UpdateProfileRequest): Promise<UpdateProfileResponse> => {
    const response = await api('/api/users/profile', {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
    return response.json();
  },
};