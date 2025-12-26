import { api } from '../client';

export interface MediaType {
  id: number;
  name: string;
}

export interface MediaStatus {
  id: number;
  name: string;
}

export interface Media {
  id: number;
  title: string;
  type: MediaType;
  release_year: number;
  status: MediaStatus;
  description: string;
  created_by: {
    id: number;
    username: string;
  };
}

export interface PaginatedResponse {
  media: Media[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface CreateMediaRequest {
  title: string;
  type_id: number;
  release_year?: number;
  status_id: number;
  description?: string;
}

export interface CreateMediaResponse {
  message: string;
  media: Media;
}

export interface UpdateMediaRequest {
  title?: string;
  type_id?: number;
  release_year?: number;
  status_id?: number;
  description?: string;
}

export interface UpdateMediaResponse {
  message: string;
  media: Media;
}

export interface DeleteMediaResponse {
  error?: string;
}

export const mediaService = {
  // Get all media
  getAll: async (page?: number): Promise<PaginatedResponse> => {
    const response = await api(`/api/media${(page) ? `?page=${page}` : ''}`);
    return response.json();
  },

  // Get media by id
  getSingle: async (id: number): Promise<Media> => {
    const response = await api(`/api/media/${id}`);
    return response.json();
  },

  getSingleCover: async (id: number): Promise<Blob> => {
    const response = await api(`/api/media/${id}/cover`);
    return response.blob();
  },

  // Create new media
  create: async (data: CreateMediaRequest, image?: File): Promise<CreateMediaResponse> => {
    const body = image
      ? (() => {
          const formData = new FormData();
          formData.append('title', data.title);
          formData.append('type_id', data.type_id.toString());
          if (data.release_year) formData.append('release_year', data.release_year.toString());
          formData.append('status_id', data.status_id.toString());
          if (data.description) formData.append('description', data.description);
          formData.append('image', image);
          return formData;
        })()
      : JSON.stringify(data);

    const response = await api('/api/media', {
      method: 'POST',
      body,
    });
    return response.json();
  },

  // Update media by id
  updateMedia: async (
    id: number,
    data: UpdateMediaRequest
  ): Promise<UpdateMediaResponse> => {
    const response = await api(`/api/media/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
    return response.json();
  },

  // Update media cover by id
  updateCover: async (id: number, image: File): Promise<void> => {
    const formData = new FormData();
    formData.append('image', image);

    await api(`/api/media/${id}/cover`, {
      method: 'PATCH',
      body: formData,
    });
  },

  deleteMedia: async (id: number): Promise<DeleteMediaResponse> => {
    const response = await api(`/api/media/${id}`, {
      method: 'DELETE',
    });
    
    // Handle error
    if (response.status === 204) {
      return {};
    };

    const data: DeleteMediaResponse = await response.json();
    if (data.error) {
      throw new Error(data.error)
    };

    return data;
  },

  // Get all media types
  getTypes: async (): Promise<MediaType[]> => {
    const response = await api('/api/media/types');
    return response.json();
  },

  // Get all media status types
  getStatuses: async (): Promise<MediaStatus[]> => {
    const response = await api('/api/media/statuses');
    return response.json();
  },
};