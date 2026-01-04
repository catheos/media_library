// src/services/thetvdb.ts
const THETVDB_API_KEY = import.meta.env.VITE_THETVDB_API_KEY;
const THETVDB_BASE_URL = 'https://api4.thetvdb.com/v4';

interface TheTVDBAuth {
  token: string;
  expiresAt: number;
}

interface TheTVDBSearchResult {
  id: string;
  name: string;
  year: string;
  image_url: string;
  overview: string;
  type: 'movie' | 'series';
  status: string;
}

interface TheTVDBDetails {
  id: string;
  name: string;
  year: number;
  overview: string;
  image_url: string;
  status: string;
  type: 'movie' | 'series';
}

class TheTVDBService {
  private auth: TheTVDBAuth | null = null;

  private async getToken(): Promise<string> {
    // Check if we have a valid token
    if (this.auth && this.auth.expiresAt > Date.now()) {
      return this.auth.token;
    }

    // Get new token
    const response = await fetch(`${THETVDB_BASE_URL}/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        apikey: THETVDB_API_KEY,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to authenticate with TheTVDB');
    }

    const data = await response.json();
    
    // Token expires in 30 days, but we'll refresh earlier
    this.auth = {
      token: data.data.token,
      expiresAt: Date.now() + (29 * 24 * 60 * 60 * 1000), // 29 days
    };

    return this.auth.token;
  }

  async search(
    query: string,
    type?: 'movie' | 'series',
    language: string = 'eng',
    year?: string,
    country?: string
  ): Promise<TheTVDBSearchResult[]> {
    const token = await this.getToken();
    
    const params = new URLSearchParams({
      query,
      ...(type && { type }),
      ...(year && { year }),
      ...(country && { country })
    });

    const response = await fetch(`${THETVDB_BASE_URL}/search?${params}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to search TheTVDB');
    }

    const data = await response.json();
    
    return data.data.map((item: any) => {
      // Try to get the name in the requested language from translations
      let displayName = item.name;
      if (item.translations && item.translations[language]) {
        displayName = item.translations[language];
      } else if (item.name_translated) {
        displayName = item.name_translated;
      }

      // Try to get overview in the requested language
      let displayOverview = item.overview;
      if (item.overviews && item.overviews[language]) {
        displayOverview = item.overviews[language];
      } else if (item.overview_translated && item.overview_translated.length > 0) {
        displayOverview = item.overview_translated[0];
      }

      return {
        id: item.tvdb_id || item.id,
        name: displayName,
        year: item.year,
        image_url: item.image_url || item.poster || item.thumbnail,
        overview: displayOverview,
        type: item.type,
        status: item.status,
      };
    });
  }

  async getDetails(
    id: string,
    type: 'movie' | 'series',
    language: string = 'eng'
  ): Promise<TheTVDBDetails> {
    const token = await this.getToken();
    
    const endpoint = type === 'movie' ? 'movies' : 'series';
    const response = await fetch(`${THETVDB_BASE_URL}/${endpoint}/${id}/extended`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch details from TheTVDB');
    }

    const data = await response.json();
    const item = data.data;

    // Try to get the name in the requested language from translations
    let displayName = item.name;
    if (item.translations && item.translations[language]) {
      displayName = item.translations[language];
    } else if (item.nameTranslations && item.nameTranslations.length > 0) {
      const translation = item.nameTranslations.find((t: any) => t.language === language);
      if (translation) displayName = translation.name;
    }

    // Try to get overview in the requested language
    let displayOverview = item.overview;
    if (item.overviews && item.overviews[language]) {
      displayOverview = item.overviews[language];
    } else if (item.overviewTranslations && item.overviewTranslations.length > 0) {
      const translation = item.overviewTranslations.find((t: any) => t.language === language);
      if (translation) displayOverview = translation.overview;
    }

    return {
      id: item.id,
      name: displayName,
      year: item.year || (item.first_air_time ? new Date(item.first_air_time).getFullYear() : 0),
      overview: displayOverview,
      image_url: item.image,
      status: item.status?.name || 'Unknown',
      type,
    };
  }


  async downloadImage(imageUrl: string): Promise<Blob> {
    const response = await fetch(imageUrl);
    
    if (!response.ok) {
      throw new Error('Failed to download image');
    }

    return response.blob();
  }
}

export const thetvdbService = new TheTVDBService();
export type { TheTVDBSearchResult, TheTVDBDetails };