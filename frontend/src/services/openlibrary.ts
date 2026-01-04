// src/services/openlibrary.ts
const OPENLIBRARY_BASE_URL = 'https://openlibrary.org';
const OPENLIBRARY_COVERS_URL = 'https://covers.openlibrary.org';
const SEARCH_LIMIT = 10;

interface OpenLibrarySearchResult {
  id: string; // work key
  title: string;
  author_name?: string[];
  first_publish_year?: number;
  cover_id?: number;
  cover_url?: string;
  isbn?: string[];
  language?: string[];
  publisher?: string[];
  number_of_pages_median?: number;
}

interface OpenLibraryWorkDetails {
  id: string;
  title: string;
  description?: string;
  authors?: Array<{
    author: {
      key: string;
    };
    name?: string;
  }>;
  covers?: number[];
  cover_url?: string;
  first_publish_date?: string;
  subjects?: string[];
}

interface OpenLibraryEditionDetails {
  key: string;
  title: string;
  authors?: Array<{
    key: string;
    name?: string;
  }>;
  publish_date?: string;
  publishers?: string[];
  isbn_10?: string[];
  isbn_13?: string[];
  number_of_pages?: number;
  covers?: number[];
  cover_url?: string;
  languages?: Array<{
    key: string;
  }>;
}

class OpenLibraryService {
  async search(
    query: string,
    options?: {
      title?: string;
      author?: string;
      sort?: 'new' | 'old' | 'random' | 'key';
      lang?: string;
      year?: number;
      limit?: number;
      page?: number;
    }
  ): Promise<OpenLibrarySearchResult[]> {
    const params = new URLSearchParams();
    
    // Build the query - when using title/author filters with language,
    // we need to use the 'q' parameter with the appropriate field syntax
    if (options?.title) {
      let searchQuery = `title:${options.title}`;
      if (options?.lang && options.lang !== 'any') {
        searchQuery += ` language:${options.lang}`;
      }
      if (options?.year) {
        searchQuery += ` first_publish_year:${options.year}`;
      }
      params.append('q', searchQuery);
    } else if (options?.author) {
      let searchQuery = `author:${options.author}`;
      if (options?.lang && options.lang !== 'any') {
        searchQuery += ` language:${options.lang}`;
      }
      if (options?.year) {
        searchQuery += ` first_publish_year:${options.year}`;
      }
      params.append('q', searchQuery);
    } else {
      let searchQuery = query;
      if (options?.lang && options.lang !== 'any') {
        searchQuery += ` language:${options.lang}`;
      }
      if (options?.year) {
        searchQuery += ` first_publish_year:${options.year}`;
      }
      params.append('q', searchQuery);
    }

    if (options?.sort) {
      params.append('sort', options.sort);
    }

    const limit = options?.limit || SEARCH_LIMIT;
    params.append('limit', limit.toString());

    if (options?.page) {
      params.append('page', options.page.toString());
    }

    // Request specific fields to optimize response
    params.append('fields', 'key,title,author_name,first_publish_year,cover_i,isbn,language,publisher,number_of_pages_median,first_sentence');

    const response = await fetch(`${OPENLIBRARY_BASE_URL}/search.json?${params}`);

    if (!response.ok) {
      throw new Error('Failed to search OpenLibrary');
    }

    const data = await response.json();
    
    return data.docs.map((item: any) => ({
      id: item.key,
      title: item.title,
      author_name: item.author_name,
      first_publish_year: item.first_publish_year,
      cover_id: item.cover_i,
      cover_url: item.cover_i 
        ? `${OPENLIBRARY_COVERS_URL}/b/id/${item.cover_i}-M.jpg`
        : undefined,
      isbn: item.isbn,
      language: item.language,
      publisher: item.publisher,
      number_of_pages_median: item.number_of_pages_median,
      description: item.first_sentence && item.first_sentence.length > 0
        ? item.first_sentence.join(' ')
        : undefined,
    }));
  }

  async getWorkDetails(workId: string): Promise<OpenLibraryWorkDetails> {
    // workId should be in format "/works/OL45804W" or just "OL45804W"
    const cleanId = workId.startsWith('/works/') ? workId : `/works/${workId}`;
    
    const response = await fetch(`${OPENLIBRARY_BASE_URL}${cleanId}.json`);

    if (!response.ok) {
      throw new Error('Failed to fetch work details from OpenLibrary');
    }

    const data = await response.json();

    // Get author names if available
    let authorsWithNames = data.authors;
    if (data.authors && data.authors.length > 0) {
      authorsWithNames = await Promise.all(
        data.authors.map(async (author: any) => {
          try {
            const authorResponse = await fetch(`${OPENLIBRARY_BASE_URL}${author.author.key}.json`);
            if (authorResponse.ok) {
              const authorData = await authorResponse.json();
              return {
                ...author,
                name: authorData.name,
              };
            }
          } catch (e) {
            // If author fetch fails, continue without name
          }
          return author;
        })
      );
    }

    return {
      id: data.key,
      title: data.title,
      description: typeof data.description === 'string' 
        ? data.description 
        : data.description?.value,
      authors: authorsWithNames,
      covers: data.covers,
      cover_url: data.covers && data.covers.length > 0
        ? `${OPENLIBRARY_COVERS_URL}/b/id/${data.covers[0]}-L.jpg`
        : undefined,
      first_publish_date: data.first_publish_date,
      subjects: data.subjects,
    };
  }

  async getEditionDetails(editionId: string): Promise<OpenLibraryEditionDetails> {
    // editionId should be in format "/books/OL7353617M" or just "OL7353617M"
    const cleanId = editionId.startsWith('/books/') ? editionId : `/books/${editionId}`;
    
    const response = await fetch(`${OPENLIBRARY_BASE_URL}${cleanId}.json`);

    if (!response.ok) {
      throw new Error('Failed to fetch edition details from OpenLibrary');
    }

    const data = await response.json();

    return {
      key: data.key,
      title: data.title,
      authors: data.authors,
      publish_date: data.publish_date,
      publishers: data.publishers,
      isbn_10: data.isbn_10,
      isbn_13: data.isbn_13,
      number_of_pages: data.number_of_pages,
      covers: data.covers,
      cover_url: data.covers && data.covers.length > 0
        ? `${OPENLIBRARY_COVERS_URL}/b/id/${data.covers[0]}-L.jpg`
        : undefined,
      languages: data.languages,
    };
  }

  getCoverUrl(
    coverId: number | string,
    size: 'S' | 'M' | 'L' = 'M',
    type: 'id' | 'isbn' | 'olid' = 'id'
  ): string {
    return `${OPENLIBRARY_COVERS_URL}/b/${type}/${coverId}-${size}.jpg`;
  }

  getAuthorPhotoUrl(authorOlid: string, size: 'S' | 'M' | 'L' = 'M'): string {
    return `${OPENLIBRARY_COVERS_URL}/a/olid/${authorOlid}-${size}.jpg`;
  }

  async downloadImage(imageUrl: string): Promise<Blob> {
    const response = await fetch(imageUrl);
    
    if (!response.ok) {
      throw new Error('Failed to download image');
    }

    return response.blob();
  }

  async searchAuthors(query: string, limit: number = SEARCH_LIMIT): Promise<any[]> {
    const params = new URLSearchParams({
      q: query,
      limit: limit.toString(),
    });

    const response = await fetch(`${OPENLIBRARY_BASE_URL}/search/authors.json?${params}`);

    if (!response.ok) {
      throw new Error('Failed to search authors on OpenLibrary');
    }

    const data = await response.json();
    
    return data.docs.map((author: any) => ({
      key: author.key,
      name: author.name,
      birth_date: author.birth_date,
      top_work: author.top_work,
      work_count: author.work_count,
      photo_url: author.key 
        ? this.getAuthorPhotoUrl(author.key.replace('/authors/', ''), 'M')
        : undefined,
    }));
  }
}

export const openLibraryService = new OpenLibraryService();
export type { 
  OpenLibrarySearchResult, 
  OpenLibraryWorkDetails, 
  OpenLibraryEditionDetails 
};