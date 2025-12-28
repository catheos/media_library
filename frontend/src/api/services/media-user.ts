import { api } from '../client';
import type { Media } from './media';

export interface UserMediaStatus {
  id: number;
  name: string;
}

export interface UserMedia {
  id: number;
  user_id: number;
  media: Media;
  current_progress: string | null;
  status: UserMediaStatus | null;
  progress_updated: string | null;
  score: number | null;
  review: string | null;
  rating_created: string | null;
  created_at: string;
}

export interface UserMediaListResponse {
  user_media: UserMedia[];
  total: number;
}

export interface CreateUserMediaResponse {
  message: string;
  user_media: UserMedia;
}

export interface UpdateUserMediaResponse {
  message: string;
  user_media: UserMedia;
}

export interface DeleteUserMediaResponse {
  error?: string;
}

export interface CreateUserMediaRequest {
  media_id: number;
  current_progress?: string;
  status_id?: number;
  score?: number;
  review?: string;
}

export interface UpdateUserMediaRequest {
  current_progress?: string;
  status_id?: number;
  score?: number;
  review?: string;
}

export const mediaUserService = {
  // Get all user's media entries
  getAll: async (params?: Record<string, string | number>): Promise<UserMediaListResponse> => {
    const queryParams = new URLSearchParams();
    
    // Convert all params to query string
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        queryParams.append(key, value.toString());
      });
    }

    const url = `/api/media-user${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    const response = await api(url);
    return response.json();
  },

  // Get single user-media entry
  getSingle: async (id: number): Promise<UserMedia> => {
    const response = await api(`/api/media-user/${id}`);
    return response.json();
  },

  // Add media to user's library
  create: async (data: CreateUserMediaRequest): Promise<CreateUserMediaResponse> => {
    const response = await api('/api/media-user', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return response.json();
  },

  // Update user-media entry
  update: async (
    id: number,
    data: UpdateUserMediaRequest
  ): Promise<UpdateUserMediaResponse> => {
    const response = await api(`/api/media-user/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
    return response.json();
  },

  // Remove media from user's library
  delete: async (id: number): Promise<DeleteUserMediaResponse> => {
    const response = await api(`/api/media-user/${id}`, {
      method: 'DELETE',
    });

    // Handle success with no content
    if (response.status === 204) {
      return {};
    }

    const data: DeleteUserMediaResponse = await response.json();
    if (data.error) {
      throw new Error(data.error);
    }

    return data;
  },

  // Helper: Check if media is in user's library
  checkInLibrary: async (media_id: number): Promise<UserMedia | null> => {
    try {
      const response = await mediaUserService.getAll({ limit: 100 });
      const entry = response.user_media.find(um => um.media.id === media_id);
      return entry || null;
    } catch (error) {
      return null;
    }
  },

  // Get all user media statuses
  getStatuses: async (): Promise<UserMediaStatus[]> => {
    const response = await api('/api/media-user/statuses');
    return response.json();
  },

  // Get single user media status
  getSingleStatus: async (id: number): Promise<UserMediaStatus> => {
    const response = await api(`/api/media-user/statuses/${id}`);
    return response.json();
  },
};