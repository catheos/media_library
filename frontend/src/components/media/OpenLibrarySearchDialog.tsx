import { useState, useEffect } from 'react';
import { Search, Loader2, Book, ChevronDown, ChevronUp } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { openLibraryService, type OpenLibrarySearchResult } from '@/services/openlibrary';

interface OpenLibrarySearchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (result: OpenLibrarySearchResult) => void;
  initialQuery?: string;
  initialAuthor?: string;
  initialYear?: number;
}

const OpenLibrarySearchDialog = ({
  open,
  onOpenChange,
  onSelect,
  initialQuery,
  initialAuthor,
  initialYear
}: OpenLibrarySearchDialogProps) => {
  const [query, setQuery] = useState('');
  const [searchType, setSearchType] = useState<'general' | 'title' | 'author'>('title');
  const [sort, setSort] = useState<'relevance' | 'new' | 'old' | 'random'>('relevance');
  const [language, setLanguage] = useState('eng');
  const [year, setYear] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [results, setResults] = useState<OpenLibrarySearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) {
      setQuery(initialQuery || initialAuthor || '');
      setSearchType(initialAuthor ? 'author' : 'title');
      setYear(initialYear ? initialYear.toString() : '');
    }
  }, [open, initialQuery, initialAuthor, initialYear]);

  // Reset when dialog closes
  useEffect(() => {
    if (!open) {
      setQuery('');
      setSearchType('title');
      setSort('relevance');
      setLanguage('eng');
      setYear('');
      setResults([]);
      setError('');
      setShowFilters(false);
    }
  }, [open]);

  const handleSearch = async () => {
    if (!query.trim()) {
      setError('Please enter a search term');
      return;
    }

    setSearching(true);
    setError('');
    setResults([]);

    try {
      const searchOptions: any = {};

      if (searchType === 'title') {
        searchOptions.title = query;
      } else if (searchType === 'author') {
        searchOptions.author = query;
      }

      if (sort !== 'relevance') {
        searchOptions.sort = sort;
      }

      if (language && language !== 'any') {
        searchOptions.lang = language;
      }

      if (year && parseInt(year)) {
        searchOptions.year = parseInt(year);
      }

      const searchResults = await openLibraryService.search(
        searchType === 'general' ? query : '',
        searchOptions
      );
      
      setResults(searchResults);
      
      if (searchResults.length === 0) {
        setError('No results found. Try a different search term.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to search OpenLibrary');
    } finally {
      setSearching(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleSelectResult = (result: OpenLibrarySearchResult) => {
    onSelect(result);
    onOpenChange(false);
    // Reset state
    setQuery('');
    setSearchType('title');
    setSort('relevance');
    setLanguage('eng');
    setYear('');
    setResults([]);
    setError('');
    setShowFilters(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto data-[state=open]:animate-none data-[state=closed]:animate-none">
        <DialogHeader>
          <DialogTitle>Search OpenLibrary</DialogTitle>
          <DialogDescription>
            Search for books to auto-fill your form
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search Input */}
          <div className="flex gap-2">
            <Input
              placeholder="Search for a book, author, or ISBN..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyPress={handleKeyPress}
              autoFocus
            />
            <Button onClick={handleSearch} disabled={searching}>
              {searching ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Search className="h-4 w-4" />
              )}
            </Button>
          </div>

          {/* Filters Toggle */}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className="w-full justify-between"
          >
            <span>Advanced Filters</span>
            {showFilters ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </Button>
          
          {/* Collapsible Filters */}
          {showFilters && (
            <div className="space-y-4 pt-2 border-t">
              {/* Search Type */}
              <div className="space-y-2">
                <Label htmlFor="searchType">Search Type</Label>
                <Select value={searchType} onValueChange={(value) => setSearchType(value as 'general' | 'title' | 'author')}>
                  <SelectTrigger id="searchType">
                    <SelectValue placeholder="General" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general">Any</SelectItem>
                    <SelectItem value="title">Title</SelectItem>
                    <SelectItem value="author">Author</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Language Filter - Using ISO 639-3 codes */}
              <div className="space-y-2">
                <Label htmlFor="language">Language</Label>
                <Select value={language} onValueChange={setLanguage}>
                  <SelectTrigger id="language">
                    <SelectValue placeholder="Any" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="any">Any</SelectItem>
                    <SelectItem value="eng">English</SelectItem>
                    <SelectItem value="spa">Spanish</SelectItem>
                    <SelectItem value="fre">French</SelectItem>
                    <SelectItem value="ger">German</SelectItem>
                    <SelectItem value="ita">Italian</SelectItem>
                    <SelectItem value="por">Portuguese</SelectItem>
                    <SelectItem value="rus">Russian</SelectItem>
                    <SelectItem value="jpn">Japanese</SelectItem>
                    <SelectItem value="kor">Korean</SelectItem>
                    <SelectItem value="chi">Chinese</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Year Filter */}
              <div className="space-y-2">
                <Label htmlFor="year">Year (optional)</Label>
                <Input
                  id="year"
                  type="number"
                  placeholder="e.g. 2020"
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                  min="1000"
                  max="2100"
                />
              </div>

              {/* Sort Filter */}
              <div className="space-y-2">
                <Label htmlFor="sort">Sort By</Label>
                <Select value={sort} onValueChange={(value) => setSort(value as 'relevance' | 'new' | 'old' | 'random')}>
                  <SelectTrigger id="sort">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="relevance">Relevance</SelectItem>
                    <SelectItem value="new">Newest First</SelectItem>
                    <SelectItem value="old">Oldest First</SelectItem>
                    <SelectItem value="random">Random</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="text-sm text-red-600 bg-red-50 p-3 rounded">
              {error}
            </div>
          )}

          {/* Results */}
          {results.length > 0 && (
            <div className="space-y-2">
              <Label>Results ({results.length})</Label>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {results.map((result) => (
                  <button
                    key={result.id}
                    onClick={() => handleSelectResult(result)}
                    className="w-full flex gap-3 p-3 border rounded-lg hover:bg-gray-50 transition-colors text-left"
                  >
                    {result.cover_url ? (
                      <img
                        src={result.cover_url}
                        alt={result.title}
                        className="w-16 h-24 object-cover rounded"
                      />
                    ) : (
                      <div className="w-16 h-24 bg-gray-200 rounded flex items-center justify-center">
                        <Book className="h-8 w-8 text-gray-400" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold truncate">
                        {result.title}
                        {result.first_publish_year && ` (${result.first_publish_year})`}
                      </div>
                      {result.author_name && result.author_name.length > 0 && (
                        <div className="text-sm text-gray-600">
                          by {result.author_name.join(', ')}
                        </div>
                      )}
                      <div className="text-xs text-gray-500 mt-1">
                        {result.publisher && result.publisher.length > 0 && (
                          <span>{result.publisher[0]}</span>
                        )}
                        {result.number_of_pages_median && (
                          <span> • {result.number_of_pages_median} pages</span>
                        )}
                        {result.language && result.language.length > 0 && (
                          <span> • {result.language[0]}</span>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default OpenLibrarySearchDialog;