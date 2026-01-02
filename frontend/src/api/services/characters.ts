import { api } from '../client';

export interface Character {
  id: number;
  name: string;
  details: string | null; 
  wiki_url: string | null;
  created_at: string;
  updated_at: string;
  created_by: {
    id: number;
    username: string;
  };
  media_count?: number;
}

export interface CharacterListResponse {
  characters: Character[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface CharacterMedia {
  id: number;
  media: {
    id: number;
    title: string;
    release_year: number | null;
    type: {
      id: number;
      name: string;
    };
  };
  role: {
    id: number;
    name: string;
  };
}

export interface CharacterMediaListResponse {
  media: CharacterMedia[];
}

export interface CreateCharacterRequest {
  name: string;
  details?: string;
  wiki_url?: string;
}

export interface CreateCharacterResponse {
  message: string;
  character: Character;
}

export interface UpdateCharacterRequest {
  name?: string;
  details?: string;
  wiki_url?: string;
}

export interface UpdateCharacterResponse {
  message: string;
  character: Character;
}

export interface AutocompleteSuggestion {
  value: string;
  count?: number;
}

export const characterService = {
  // Get all characters with pagination and search
  getAll: async (
    page: number = 1,
    filters?: Record<string, string>
  ): Promise<CharacterListResponse> => {
    const params = new URLSearchParams({
      page: page.toString(),
      ...filters
    });
    
    const response = await api(`/api/characters?${params.toString()}`);
    return response.json();
  },

  // Create new character
  create: async (data: CreateCharacterRequest, image?: File): Promise<CreateCharacterResponse> => {
    const body = image
      ? (() => {
          const formData = new FormData();
          formData.append('name', data.name);
          if (data.details) formData.append('details', data.details);
          if (data.wiki_url) formData.append('wiki_url', data.wiki_url);
          formData.append('image', image);
          return formData;
        })()
      : JSON.stringify(data);

    const response = await api('/api/characters', {
      method: 'POST',
      body,
    });
    return response.json();
  },

  // Get single character by ID
  getSingle: async (id: number): Promise<Character> => {
    const response = await api(`/api/characters/${id}`);
    return response.json();
  },

  getSingleCover: async (id: number, thumb?: boolean): Promise<Blob> => {
    const response = await api(`/api/characters/${id}/cover${(thumb) ? '?thumb=true' : ''}`);
    return response.blob();
  },

  // Update character
  update: async (id: number, data: UpdateCharacterRequest): Promise<UpdateCharacterResponse> => {
    const response = await api(`/api/characters/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
    return response.json();
  },

  // Update character cover by id
  updateCover: async (id: number, image: File): Promise<void> => {
    const formData = new FormData();
    formData.append('image', image);

    await api(`/api/characters/${id}/cover`, {
      method: 'PATCH',
      body: formData,
    });
  },

  // Delete character
  delete: async (id: number): Promise<void> => {
    await api(`/api/characters/${id}`, {
      method: 'DELETE',
    });
  },

  // Get all media for a character
  getMedia: async (characterId: number): Promise<CharacterMediaListResponse> => {
    const response = await api(`/api/characters/${characterId}/media`);
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

    const response = await api(`/api/characters/autocomplete?${params.toString()}`);
    return response.json();
  },
};