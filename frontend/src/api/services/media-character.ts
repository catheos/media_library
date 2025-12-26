import { api } from '../client';
import type { Character } from './characters';
import type { Media } from './media';

export interface MediaCharacterRole {
  id: number;
  name: string;
  created_by: {
    id: number;
    username: string;
  }
}

export interface MediaCharacterRoles {
  roles: MediaCharacterRole[];
  total: number;
}

export interface CreateRoleResponse {
  message: string;
  role: MediaCharacterRole;
}

export interface DeleteRoleResponse {
  error?: string;
}

export interface MediaCharacter {
  id: number;
  media: Media;
  character: Character;
  role: MediaCharacterRole;
  created_by: {
    id: number;
    username: string;
  }
}

export interface MediaCharactersResponse {
  characters: MediaCharacter[];
}

export interface CreateMediaCharacterResponse {
  message: string;
  media_character: MediaCharacter;
}

export interface UpdateMediaCharacterResponse {
  message: string;
  media_character: MediaCharacter;
}

export interface DeleteMediaCharacterResponse {
  error?: string;
}

export const mediaCharacterService = {
  // Get all characters for a media
  getAll: async (
    media_id: number
  ): Promise<MediaCharactersResponse> => {
    const response = await api(`/api/media-characters/media/${media_id}/characters`);
    return response.json();
  },

  // Get single media-character relationship
  getSingle: async (
    media_character_id: number
  ): Promise<MediaCharacter> => {
    const response = await api(`/api/media-characters/${media_character_id}`);
    return response.json();
  },

  // Add character to media
  create: async (
    media_id: number,
    character_id: number,
    role_id: number
  ): Promise<CreateMediaCharacterResponse> => {
    const response = await api(`/api/media-characters/media/${media_id}/characters`, {
      method: 'POST',
      body: JSON.stringify({
        character_id: character_id,
        role_id: role_id
      }),
    });
    return response.json();
  },

  // Update character role
  updateMediaCharacter: async (
    media_id: number,
    character_id: number,
    role_id: number
  ): Promise<UpdateMediaCharacterResponse> => {
    const response = await api(`/api/media/${media_id}/characters/${character_id}`, {
      method: 'PATCH',
      body: JSON.stringify({ role_id: role_id }),
    });
    return response.json();
  },

  // Remove character from media
  delete: async (media_character_id: number): Promise<DeleteMediaCharacterResponse> => {
    const response = await api(`/api/media-characters/${media_character_id}`, {
      method: 'DELETE',
    });

    // Handle error
    if (response.status === 204) {
      return {};
    }

    const data: DeleteMediaCharacterResponse = await response.json();
    if (data.error) {
      throw new Error(data.error);
    };

    return data;
  },

  // Get all character roles
  getAllRoles: async (): Promise<MediaCharacterRoles> => {
    const response = await api('/api/media-characters/roles');
    return response.json();
  },

  // Get single role
  getSingleRole: async (
    id: number,
  ): Promise<MediaCharacterRole> => {
    const response = await api(`/api/media-characters/${id}`);
    return response.json();
  },

  createRole: async (name: string ): Promise<CreateRoleResponse> => {
    const response = await api('/api/media-characters/roles', {
      method: 'POST',
      body: JSON.stringify({ name }),
    });
    return response.json();
  },

  // Delete role
  deleteRole: async (
    id: number,
  ): Promise<DeleteRoleResponse> => {
    const response = await api(`/api/media-characters/roles/${id}`, {
      method: 'DELETE',
    });

    // Handle error
    if (response.status === 204) {
      return {};
    }

    const data: DeleteRoleResponse = await response.json();
    if (data.error) {
      throw new Error(data.error);
    };

    return data;
  },
};