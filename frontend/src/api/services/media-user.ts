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
  page: number;
  page_size: number;
  total_pages: number;
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

export interface AutocompleteSuggestion {
  value: string;
  count?: number;
}

export const mediaUserService = {
  // Get all user's media entries
  getAll: async (
    page: number = 1,
    filters?: Record<string, string>
  ): Promise<UserMediaListResponse> => {
    const params = new URLSearchParams({
      page: page.toString(),
      ...filters
    });

    const response = await api(`/api/media-user?${params.toString()}`);
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

  // Autocomplete search
  autocomplete: async (
    key: string,
    query: string,
    context: string
  ): Promise<AutocompleteSuggestion[]> => {
    const params = new URLSearchParams({
      key,
      query,
      context,
      limit: '5'
    });

    const response = await api(`/api/media-user/autocomplete?${params.toString()}`);
    return response.json();
  },
};