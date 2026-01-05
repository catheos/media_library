const ANILIST_API_URL = 'https://graphql.anilist.co';
const SEARCH_LIMIT = 10;

interface AniListSearchResult {
  id: number;
  type: 'ANIME' | 'MANGA';
  title: {
    romaji: string;
    english: string | null;
    native: string;
  };
  description: string | null;
  coverImage: {
    large: string;
    medium: string;
  } | null;
  startDate: {
    year: number | null;
    month: number | null;
    day: number | null;
  } | null;
  format: string | null;
  status: string | null;
  episodes: number | null;
  chapters: number | null;
  volumes: number | null;
  genres: string[];
}

interface AniListDetails {
  id: number;
  title: string;
  description: string;
  coverImage: string;
  startYear: number | null;
  format: string | null;
  status: string | null;
  episodes: number | null;
  chapters: number | null;
  volumes: number | null;
  genres: string[];
  characters: Array<{
    id: number;
    name: string;
    image: string;
  }>;
}

const SEARCH_QUERY = `
query ($search: String, $type: MediaType, $format: MediaFormat, $year: String, $page: Int, $perPage: Int) {
  Page(page: $page, perPage: $perPage) {
    pageInfo {
      total
      currentPage
      hasNextPage
    }
    media(search: $search, type: $type, format: $format, startDate_like: $year, sort: SEARCH_MATCH) {
      id
      type
      format
      title {
        romaji
        english
        native
      }
      description
      coverImage {
        large
        medium
      }
      startDate {
        year
        month
        day
      }
      status
      episodes
      chapters
      volumes
      genres
    }
  }
}
`;

const GET_DETAILS_QUERY = `
query ($id: Int) {
  Media(id: $id) {
    id
    title {
      romaji
      english
      native
    }
    description
    coverImage {
      large
      medium
    }
    startDate {
      year
      month
      day
    }
    format
    status
    episodes
    chapters
    volumes
    genres
    characters(page: 1, perPage: 25) {
      nodes {
        id
        name {
          full
          native
        }
        image {
          large
          medium
        }
      }
    }
  }
}
`;

class AniListService {
  private async query(query: string, variables: any): Promise<any> {
    const response = await fetch(ANILIST_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        query,
        variables
      })
    });

    if (!response.ok) {
      throw new Error('Failed to fetch from AniList');
    }

    const data = await response.json();

    if (data.errors) {
      throw new Error(`AniList API error: ${data.errors[0].message}`);
    }

    return data.data;
  }

  async search(
    query: string,
    type?: 'ANIME' | 'MANGA',
    format?: string,
    year?: number,
    page: number = 1
  ): Promise<AniListSearchResult[]> {
    const variables: any = {
      search: query,
      page: page,
      perPage: SEARCH_LIMIT
    }

    // only add if specified
    if (type) variables.type = type;
    if (format) variables.format = format;
    if (year) variables.year = `${year}%`;

    const data = await this.query(SEARCH_QUERY, variables);

    return data.Page.media;
  }

  async getDetails(id: number): Promise<AniListDetails> {
    const data = await this.query(GET_DETAILS_QUERY, { id });
    const media = data.Media;

    // Prefer English title, fallback to Romaji, then Native
    const title = media.title.english || media.title.romaji || media.title.native;

    // Clean HTML from description
    const description = media.description 
      ? media.description.replace(/<br>/g, '\n').replace(/<[^>]*>/g, '')
      : '';

    return {
      id: media.id,
      title: title,
      description: description,
      coverImage: media.coverImage?.large || media.coverImage?.medium || '',
      startYear: media.startDate?.year || null,
      format: media.format,
      status: media.status,
      episodes: media.episodes,
      chapters: media.chapters,
      volumes: media.volumes,
      genres: media.genres || [],
      characters: (media.characters?.nodes || []).map((char: any) => ({
        id: char.id,
        name: char.name.full || char.name.native,
        image: char.image?.large || char.image?.medium || ''
      }))
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

export const anilistService = new AniListService();
export type { AniListSearchResult, AniListDetails };