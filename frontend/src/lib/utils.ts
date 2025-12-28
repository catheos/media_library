import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export interface SearchFilters {
  title?: string;
  name?: string;
  year?: number | { gt?: number; lt?: number };
  type?: string;
  status?: string;
  tags?: string[];
  excludeTags?: string[];
  score?: { gt?: number; lt?: number };
  media?: string;
  appearances?: { gt?: number; lt?: number };
  user_status?: string;
  user_score?: number | { gt?: number; lt?: number };
}

const VALID_KEYS = ['title', 'name', 'year', 'tag', 'type', 'status', 'score', 'media', 'appearances', 'user_status', 'user_score'];

function handleFilter(filters: SearchFilters, key: string, value: string) {
  switch (key.toLowerCase()) {
    case 'title':
      filters.title = value;
      break;
    
    case 'name':
      filters.name = value;
      break;
    
    case 'media':
      filters.media = value;
      break;
    
    case 'year':
      const yearMatch = value.match(/^(>|<)?(\d{4})$/);
      if (yearMatch) {
        const [, operator, year] = yearMatch;
        if (operator === '>') {
          filters.year = { gt: parseInt(year) };
        } else if (operator === '<') {
          filters.year = { lt: parseInt(year) };
        } else {
          filters.year = parseInt(year);
        }
      }
      break;
    
    case 'type':
      filters.type = value;
      break;
    
    case 'status':
      filters.status = value;
      break;
    
    case 'tag':
      if (!filters.tags) filters.tags = [];
      filters.tags.push(value);
      break;
    
    case 'score':
      const scoreMatch = value.match(/^(>|<)?(\d+(?:\.\d+)?)$/);
      if (scoreMatch) {
        const [, operator, score] = scoreMatch;
        if (operator === '>') {
          filters.score = { gt: parseFloat(score) };
        } else if (operator === '<') {
          filters.score = { lt: parseFloat(score) };
        }
      }
      break;
    
    case 'appearances':
      const appearancesMatch = value.match(/^(>|<)?(\d+)$/);
      if (appearancesMatch) {
        const [, operator, count] = appearancesMatch;
        if (operator === '>') {
          filters.appearances = { gt: parseInt(count) };
        } else if (operator === '<') {
          filters.appearances = { lt: parseInt(count) };
        }
      }
      break;
    
    case 'user_status':
      filters.user_status = value;
      break;
    
    case 'user_score':
      const userScoreMatch = value.match(/^(>|<)?(\d{1,2})$/);
      if (userScoreMatch) {
        const [, operator, scoreStr] = userScoreMatch;
        const score = parseInt(scoreStr);

        // Only allow scores between 1 and 10
        if (score >= 1 && score <= 10) {
          if (operator === '>') {
            filters.user_score = { gt: score };
          } else if (operator === '<') {
            filters.user_score = { lt: score };
          } else {
            filters.user_score = score;
          }
        }
      }
      break;
  }
}

export function parseSearchQuery(
  query: string,
  context: 'media' | 'character' | 'library' = 'media'
): SearchFilters {
  const filters: SearchFilters = { tags: [], excludeTags: [] };
  
  if (!query.trim()) return filters;
  
  let workingQuery = query;
  
  // 1. Extract quoted patterns: key:"value with spaces"
  const quotedPattern = /(\w+):"([^"]+)"/g;
  let match;
  
  while ((match = quotedPattern.exec(query)) !== null) {
    const [fullMatch, key, value] = match;
    if (VALID_KEYS.includes(key.toLowerCase())) {
      handleFilter(filters, key, value);
      workingQuery = workingQuery.replace(fullMatch, '');
    }
  }
  
  // 2. Extract excluded tags: -tag:value
  const excludeTagPattern = /-tag:([^\s]+)/g;
  while ((match = excludeTagPattern.exec(workingQuery)) !== null) {
    const [fullMatch, value] = match;
    if (!filters.excludeTags) filters.excludeTags = [];
    filters.excludeTags.push(value);
    workingQuery = workingQuery.replace(fullMatch, '');
  }
  
  // 3. Extract unquoted operators: key:value (only if valid key)
  const unquotedPattern = /(\w+):([^\s]+)/g;
  
  while ((match = unquotedPattern.exec(workingQuery)) !== null) {
    const [fullMatch, key, value] = match;
    if (VALID_KEYS.includes(key.toLowerCase())) {
      handleFilter(filters, key, value);
      workingQuery = workingQuery.replace(fullMatch, '');
    }
    // If invalid key, leave it in the query as plain text
  }
  
  // 4. Context-aware plain text search
  const plainText = workingQuery.trim();
  if (plainText) {
    if (context === 'media' || context === 'library') {
      if (!filters.title) {
        filters.title = plainText;
      }
    } else if (context === 'character') {
      if (!filters.name) {
        filters.name = plainText;
      }
    }
  }
  
  return filters;
}

// Convert filters back to query params for API
export function filtersToQueryParams(filters: SearchFilters): Record<string, string> {
  const params: Record<string, string> = {};
  
  if (filters.title) {
    params.title = filters.title;
  }
  
  if (filters.name) {
    params.name = filters.name;
  }
  
  if (filters.media) {
    params.media = filters.media;
  }
  
  if (filters.year) {
    if (typeof filters.year === 'number') {
      params.year = filters.year.toString();
    } else if (filters.year.gt) {
      params.year_gt = filters.year.gt.toString();
    } else if (filters.year.lt) {
      params.year_lt = filters.year.lt.toString();
    }
  }
  
  if (filters.type) {
    params.type = filters.type;
  }
  
  if (filters.status) {
    params.status = filters.status;
  }
  
  if (filters.tags && filters.tags.length > 0) {
    params.tags = filters.tags.join(',');
  }
  
  if (filters.excludeTags && filters.excludeTags.length > 0) {
    params.exclude_tags = filters.excludeTags.join(',');
  }
  
  if (filters.score) {
    if (filters.score.gt) {
      params.score_gt = filters.score.gt.toString();
    } else if (filters.score.lt) {
      params.score_lt = filters.score.lt.toString();
    }
  }
  
  if (filters.appearances) {
    if (filters.appearances.gt) {
      params.appearances_gt = filters.appearances.gt.toString();
    } else if (filters.appearances.lt) {
      params.appearances_lt = filters.appearances.lt.toString();
    }
  }
  
  if (filters.user_status) {
    params.user_status = filters.user_status;
  }
  
  if (filters.user_score) {
    if (typeof filters.user_score === 'number') {
      params.user_score = filters.user_score.toString();
    } else if (filters.user_score.gt) {
      params.user_score_gt = filters.user_score.gt.toString();
    } else if (filters.user_score.lt) {
      params.user_score_lt = filters.user_score.lt.toString();
    }
  }
  
  return params;
}

// Convert filters to display chips
export function filtersToChips(filters: SearchFilters): Array<{ key: string; label: string; value: string }> {
  const chips: Array<{ key: string; label: string; value: string }> = [];
  
  if (filters.title) {
    chips.push({ key: 'title', label: 'title', value: filters.title });
  }
  
  if (filters.name) {
    chips.push({ key: 'name', label: 'name', value: filters.name });
  }
  
  if (filters.media) {
    chips.push({ key: 'media', label: 'media', value: filters.media });
  }
  
  if (filters.year) {
    if (typeof filters.year === 'number') {
      chips.push({ key: 'year', label: 'year', value: filters.year.toString() });
    } else if (filters.year.gt) {
      chips.push({ key: 'year', label: 'year', value: `>${filters.year.gt}` });
    } else if (filters.year.lt) {
      chips.push({ key: 'year', label: 'year', value: `<${filters.year.lt}` });
    }
  }
  
  if (filters.type) {
    chips.push({ key: 'type', label: 'type', value: filters.type });
  }
  
  if (filters.status) {
    chips.push({ key: 'status', label: 'status', value: filters.status });
  }
  
  filters.tags?.forEach(tag => {
    chips.push({ key: 'tag', label: 'tag', value: tag });
  });
  
  filters.excludeTags?.forEach(tag => {
    chips.push({ key: 'excludeTag', label: '-tag', value: tag });
  });
  
  if (filters.score) {
    if (filters.score.gt) {
      chips.push({ key: 'score', label: 'score', value: `>${filters.score.gt}` });
    } else if (filters.score.lt) {
      chips.push({ key: 'score', label: 'score', value: `<${filters.score.lt}` });
    }
  }
  
  if (filters.appearances) {
    if (filters.appearances.gt) {
      chips.push({ key: 'appearances', label: 'appearances', value: `>${filters.appearances.gt}` });
    } else if (filters.appearances.lt) {
      chips.push({ key: 'appearances', label: 'appearances', value: `<${filters.appearances.lt}` });
    }
  }
  
  if (filters.user_status) {
    chips.push({ key: 'user_status', label: 'user_status', value: filters.user_status });
  }
  
  if (filters.user_score) {
    if (typeof filters.user_score === 'number') {
      chips.push({ key: 'user_score', label: 'user_score', value: filters.user_score.toString() });
    } else if (filters.user_score.gt) {
      chips.push({ key: 'user_score', label: 'user_score', value: `>${filters.user_score.gt}` });
    } else if (filters.user_score.lt) {
      chips.push({ key: 'user_score', label: 'user_score', value: `<${filters.user_score.lt}` });
    }
  }
  
  return chips;
}