import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export interface SearchFilters {
  title?: string[];
  excludeTitle?: string[];

  name?: string[];
  excludeName?: string[];

  year?: number | { gt?: number; lt?: number };
  excludeYear?: number | { gt?: number; lt?: number };

  type?: string[];
  excludeType?: string[];

  status?: string[];
  excludeStatus?: string[];

  tag?: string[];
  excludeTag?: string[];

  score?: number | { gt?: number; lt?: number };

  media?: string[];
  excludeMedia?: string[];

  appearances?: { gt?: number; lt?: number };

  user_status?: string[];
  excludeUserStatus?: string[];

  user_score?: number | { gt?: number; lt?: number };
}

const VALID_KEYS = [
  'title',
  'name',
  'year',
  'type',
  'status',
  'tag',
  'score',
  'media',
  'appearances',
  'user_status',
  'user_score'
];

function handleFilter(filters: SearchFilters, key: string, value: string) {
  switch (key.toLowerCase()) {
    case 'title':
      if (!filters.title) filters.title = [];
      filters.title.push(value);
      break;
    
    case 'name':
      if (!filters.name) filters.name = [];
      filters.name.push(value);
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
      if (!filters.type) filters.type = [];
      filters.type.push(value);
      break;
    
    case 'status':
      if (!filters.status) filters.status = [];
      filters.status.push(value);
      break;
    
    case 'tag':
      if (!filters.tag) filters.tag = [];
      filters.tag.push(value);
      break;

    case 'score':
      const scoreMatch = value.match(/^(>|<)?(\d{1,2})$/);
      if (scoreMatch) {
        const [, operator, scoreStr] = scoreMatch;
        const score = parseInt(scoreStr);

        // Only allow scores between 1 and 10
        if (score >= 1 && score <= 10) {
          if (operator === '>') {
            filters.score = { gt: score };
          } else if (operator === '<') {
            filters.score = { lt: score };
          } else {
            filters.score = score;
          }
        }
      }
      break;
    
    case 'media':
      if (!filters.media) filters.media = [];
      filters.media.push(value);
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
      if (!filters.user_status) filters.user_status = [];
      filters.user_status.push(value);
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

function handleExclusion(filters: SearchFilters, key: string, value: string) {
  switch (key.toLowerCase()) {
    case 'title':
      if (!filters.excludeTitle) filters.excludeTitle = []
      filters.excludeTitle.push(value);
      break;
    
    case 'name':
      if (!filters.excludeName) filters.excludeName = []
      filters.excludeName.push(value);
      break;
    
    case 'year':
      const yearMatch = value.match(/^(>|<)?(\d{4})$/);
      if (yearMatch) {
        const [, operator, year] = yearMatch;
        if (operator === '>') {
          filters.excludeYear = { gt: parseInt(year) };
        } else if (operator === '<') {
          filters.excludeYear = { lt: parseInt(year) };
        } else {
          filters.excludeYear = parseInt(year);
        }
      }
      break;
    
    case 'type':
      if (!filters.excludeType) filters.excludeType = [];
      filters.excludeType.push(value);
      break;
    
    case 'status':
      if (!filters.excludeStatus) filters.excludeStatus = [];
      filters.excludeStatus.push(value);
      break;
    
    case 'tag':
      if (!filters.excludeTag) filters.excludeTag = [];
      filters.excludeTag.push(value);
      break;
    
    case 'media':
      if (!filters.excludeMedia) filters.excludeMedia = []
      filters.excludeMedia.push(value);
      break;
    
    case 'user_status':
      if (!filters.excludeUserStatus) filters.excludeUserStatus = [];
      filters.excludeUserStatus.push(value);
      break;
  }
}

export function parseSearchQuery(
  query: string,
  context: 'media' | 'character' | 'library' = 'media'
): SearchFilters {
  const filters: SearchFilters = {};
  
  if (!query.trim()) return filters;

  // Track which parts of the query have been consumed by valid filters
  const tokens: Array<{ start: number; end: number }> = [];

  // Collect all potential matches from both patterns
  const quotedMatches = Array.from(query.matchAll(/(-)?(\w+):"([^"]+)"/g));
  const unquotedMatches = Array.from(query.matchAll(/(-)?(\w+):([^\s]+)/g));
  
  // Combine and sort by position in the string
  const allMatches = [...quotedMatches, ...unquotedMatches]
    .sort((a, b) => a.index! - b.index!);
  
  // Process matches in order
  for (const match of allMatches) {
    const [fullMatch, negation, key, value] = match;
    const matchStart = match.index!;
    const matchEnd = matchStart + fullMatch.length;
    
    // Skip if this match overlaps with a previously processed token
    const overlaps = tokens.some(token => 
      matchStart < token.end && matchEnd > token.start
    );
    
    if (overlaps) {
      continue;
    }
    
    // Only process if it's a valid key
    if (VALID_KEYS.includes(key.toLowerCase())) {
      // Mark this section as consumed
      tokens.push({ start: matchStart, end: matchEnd });
      
      // Apply the filter
      if (negation === '-') {
        handleExclusion(filters, key, value);
      } else {
        handleFilter(filters, key, value);
      }
    }
  }
  
  // Sort tokens by position for plain text extraction
  tokens.sort((a, b) => a.start - b.start);
  
  // Extract plain text (everything not consumed by filters)
  let plainText = '';
  let lastEnd = 0;
  
  for (const token of tokens) {
    plainText += query.slice(lastEnd, token.start) + ' ';
    lastEnd = token.end;
  }
  plainText += query.slice(lastEnd);
  plainText = plainText.trim();
  
  // Context-aware plain text search
  if (plainText) {
    if (context === 'media' || context === 'library') {
      if (!filters.title) filters.title = [];
      filters.title.push(plainText);
    } else if (context === 'character') {
      if (!filters.name) filters.name = [];
      filters.name.push(plainText);
    }
  }
  
  return filters;
}

// Convert filters back to query params for API
export function filtersToQueryParams(
  filters: SearchFilters,
  settings?: {
    sort?: string;
    order?: 'asc' | 'desc';
  }
): Record<string, string> {
  const params: Record<string, string> = {};
  
  // ----- Title ----- //
  // include
  if (filters.title && filters.title.length>0) {
    params.title = filters.title.join(','); // or
  };
  // exclude
  if (filters.excludeTitle && filters.excludeTitle.length>0) {
    params.exclude_title = filters.excludeTitle.join(','); // and
  };

  // ----- Name ----- //
  // include
  if (filters.name && filters.name.length>0) {
    params.name = filters.name.join(','); // or
  };
  // exclude
  if (filters.excludeName && filters.excludeName.length>0) {
    params.exclude_name = filters.excludeName.join(','); // and
  };

  // ----- Year ----- //
  // include
  if (filters.year) {
    if (typeof filters.year === 'number') {
      params.year = filters.year.toString();
    } else if (filters.year.gt) {
      params.year_gt = filters.year.gt.toString();
    } else if (filters.year.lt) {
      params.year_lt = filters.year.lt.toString();
    }
  };
  // exclude
  if (filters.excludeYear) {
    if (typeof filters.excludeYear === 'number') {
      params.exclude_year = filters.excludeYear.toString();
    } else if (filters.excludeYear.gt) {
      params.exclude_year_gt = filters.excludeYear.gt.toString();
    } else if (filters.excludeYear.lt) {
      params.exclude_year_lt = filters.excludeYear.lt.toString();
    }
  };

  // ----- Type ----- //
  // include
  if (filters.type && filters.type.length>0) {
    params.type = filters.type.join(','); // or
  };
  // exclude
  if (filters.excludeType && filters.excludeType.length>0) {
    params.exclude_type = filters.excludeType.join(','); // and
  };

  // ----- Status ----- //
  // include
  if (filters.status && filters.status.length>0) {
    params.status = filters.status.join(','); // or
  };
  // exclude
  if (filters.excludeStatus && filters.excludeStatus.length>0) {
    params.exclude_status = filters.excludeStatus.join(','); // and
  };

  // ----- Tags ----- //
  // include
  if (filters.tag && filters.tag.length>0) {
    params.tag = filters.tag.join(','); // or
  };
  // exclude
  if (filters.excludeTag && filters.excludeTag.length>0) {
    params.exclude_tag = filters.excludeTag.join(','); // and
  };

  // ----- Score ----- //
  if (filters.score) {
    if (typeof filters.score === 'number') {
      params.score = filters.score.toString();
    } else if (filters.score.gt) {
      params.score_gt = filters.score.gt.toString();
    } else if (filters.score.lt) {
      params.score_lt = filters.score.lt.toString();
    }
  };

  // ----- Media ----- //
  // include
  if (filters.media && filters.media.length>0) {
    params.media = filters.media.join(','); // or
  };
  // exclude
  if (filters.excludeMedia && filters.excludeMedia.length>0) {
    params.exclude_media = filters.excludeMedia.join(','); // and
  };

  // ----- User Status ----- //
  // include
  if (filters.user_status && filters.user_status.length>0) {
    params.user_status = filters.user_status.join(','); // or
  };
  // exclude
  if (filters.excludeUserStatus && filters.excludeUserStatus.length>0) {
    params.exclude_user_status = filters.excludeUserStatus.join(','); // and
  };
  
  // ----- User Score ----- //
  if (filters.user_score) {
    if (typeof filters.user_score === 'number') {
      params.user_score = filters.user_score.toString();
    } else if (filters.user_score.gt) {
      params.user_score_gt = filters.user_score.gt.toString();
    } else if (filters.user_score.lt) {
      params.user_score_lt = filters.user_score.lt.toString();
    }
  };

  // ----- Sort/Order ----- //
  if (settings?.sort) {
    params.sort = settings.sort;
  }
  if (settings?.order) {
    params.order = settings.order;
  }
  
  return params;
}

// Convert filters to display chips
export function filtersToChips(filters: SearchFilters): Array<{ key: string; label: string; value: string }> {
  const chips: Array<{ key: string; label: string; value: string }> = [];

  // ----- Title ----- //
  // include
  filters.title?.forEach(title => {
    chips.push({
      key: 'title',
      label: 'title',
      value: title
    });
  });
  // exclude
  filters.excludeTitle?.forEach(title => {
    chips.push({
      key: 'excludeTitle',
      label: '-title',
      value: title
    });
  });

  // ----- Name ----- //
  // include
  filters.name?.forEach(name => {
    chips.push({
      key: 'name',
      label: 'name',
      value: name
    });
  });
  // exclude
  filters.excludeName?.forEach(name => {
    chips.push({
      key: 'excludeName',
      label: '-name',
      value: name
    });
  });

  // ----- Year ----- //
  if (filters.year) {
    if (typeof filters.year === 'number') {
      chips.push({
        key: 'year',
        label: 'year',
        value: filters.year.toString()
      });
    } else if (filters.year.gt) {
      chips.push({
        key: 'year',
        label: 'year',
        value: `>${filters.year.gt}`
      });
    } else if (filters.year.lt) {
      chips.push({
        key: 'year',
        label: 'year',
        value: `<${filters.year.lt}`
      });
    }
  }

  // ----- Type ----- //
  // include
  filters.type?.forEach(type => {
    chips.push({
      key: 'type',
      label: 'type',
      value: type
    });
  });
  // exclude
  filters.excludeType?.forEach(type => {
    chips.push({
      key: 'excludeType',
      label: '-type',
      value: type
    });
  });

  // ----- Status ----- //
  // include
  filters.status?.forEach(status => {
    chips.push({
      key: 'status',
      label: 'status',
      value: status
    });
  });
  // exclude
  filters.excludeStatus?.forEach(status => {
    chips.push({
      key: 'excludeStatus',
      label: '-status',
      value: status
    });
  });

  // ----- Tags ----- //
  // include
  filters.tag?.forEach(tag => {
    chips.push({
      key: 'tag',
      label: 'tag',
      value: tag
    });
  });
  // exclude
  filters.excludeTag?.forEach(tag => {
    chips.push({
      key: 'excludeTag',
      label: '-tag',
      value: tag
    });
  });

  // ----- Score ----- //
  if (filters.score) {
    if (typeof filters.score === 'number') {
      chips.push({ key: 'score', label: 'score', value: filters.score.toString() });
    } else if (filters.score.gt) {
      chips.push({ key: 'score', label: 'score', value: `>${filters.score.gt}` });
    } else if (filters.score.lt) {
      chips.push({ key: 'score', label: 'score', value: `<${filters.score.lt}` });
    }
  };

  // ----- Media ----- //
  // include
  filters.media?.forEach(media => {
    chips.push({
      key: 'media',
      label: 'media',
      value: media
    });
  });
  // exclude
  filters.excludeMedia?.forEach(media => {
    chips.push({
      key: 'excludeMedia',
      label: '-media',
      value: media
    });
  });

  // ----- Appearances ----- //
  if (filters.appearances) {
    if (filters.appearances.gt) {
      chips.push({ key: 'appearances', label: 'appearances', value: `>${filters.appearances.gt}` });
    } else if (filters.appearances.lt) {
      chips.push({ key: 'appearances', label: 'appearances', value: `<${filters.appearances.lt}` });
    }
  };

  // ----- User Status ----- //
  // include
  filters.user_status?.forEach(user_status => {
    chips.push({
      key: 'user_status',
      label: 'user_status',
      value: user_status
    });
  });
  // exclude
  filters.excludeUserStatus?.forEach(user_status => {
    chips.push({
      key: 'excludeUserStatus',
      label: '-user_status',
      value: user_status
    });
  });
  
  // ----- User Score ----- //
  if (filters.user_score) {
    if (typeof filters.user_score === 'number') {
      chips.push({ key: 'user_score', label: 'user_score', value: filters.user_score.toString() });
    } else if (filters.user_score.gt) {
      chips.push({ key: 'user_score', label: 'user_score', value: `>${filters.user_score.gt}` });
    } else if (filters.user_score.lt) {
      chips.push({ key: 'user_score', label: 'user_score', value: `<${filters.user_score.lt}` });
    }
  };
  
  return chips;
}

// Convert query params back to search query string
export function queryParamsToSearchQuery(searchParams: URLSearchParams): string {
  const parts: string[] = [];
  
  // Helper to format values that might need quotes
  const formatValue = (value: string) => {
    return value.includes(' ') || value.includes(':') ? `"${value}"` : value;
  };

  // Skips these in foreach
  const skipParams = [
    'page',
    'sort',
    'order'
  ];

  searchParams.forEach((value, key) => {
    // Skip page param
    if (skipParams.includes(key)) return;
    
    // Handle exclude_ prefixed params
    if (key.startsWith('exclude_')) {
      const baseKey = key.replace('exclude_', '').replace('_gt', '').replace('_lt', '');
      const prefix = '-';
      
      if (key.endsWith('_gt')) {
        parts.push(`${prefix}${baseKey}:>${value}`);
      } else if (key.endsWith('_lt')) {
        parts.push(`${prefix}${baseKey}:<${value}`);
      } else {
        value.split(',').forEach(val => {
          parts.push(`${prefix}${baseKey}:${formatValue(val)}`);
        });
      }
    }
    // Handle regular params
    else {
      const baseKey = key.replace('_gt', '').replace('_lt', '');
      
      if (key.endsWith('_gt')) {
        parts.push(`${baseKey}:>${value}`);
      } else if (key.endsWith('_lt')) {
        parts.push(`${baseKey}:<${value}`);
      } else {
        value.split(',').forEach(val => {
          parts.push(`${baseKey}:${formatValue(val)}`);
        });
      }
    }
  });

  let searchQuery = parts.join(' ');
  searchQuery = (searchQuery.length) ? searchQuery + ' ' : searchQuery;

  return searchQuery;
}