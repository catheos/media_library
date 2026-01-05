import { useState, useEffect, useRef } from 'react';
import { Search, Loader2, Film, Book, ChevronDown, ChevronUp } from 'lucide-react';
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
import { anilistService, type AniListSearchResult } from '@/services/anilist';

interface AniListSearchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (result: AniListSearchResult, type: 'ANIME' | 'MANGA' | 'any') => void;
  initialQuery?: string;
  initialType?: 'ANIME' | 'MANGA' | 'NOVEL';
  initialYear?: number;
}

const AniListSearchDialog = ({
  open,
  onOpenChange,
  onSelect,
  initialQuery,
  initialType,
  initialYear
}: AniListSearchDialogProps) => {
  const [query, setQuery] = useState('');
  const [type, setType] = useState<'ANIME' | 'MANGA' | 'any'>('any');
  const [format, setFormat] = useState<string>('any');
  const [year, setYear] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [results, setResults] = useState<AniListSearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState('');
  const prevTypeRef = useRef<'ANIME' | 'MANGA' | 'any'>(undefined);

  useEffect(() => {
    if (open) {
      setQuery(initialQuery || '');
      if (initialType === 'NOVEL') {
        const newType = 'MANGA';
        setType(newType);
        setFormat('NOVEL');
        setYear(initialYear ? initialYear.toString() : '');
        prevTypeRef.current = newType;
      } else if (initialType) {
        setType(initialType);
        prevTypeRef.current = initialType;
      } else {
        setType('any');
        prevTypeRef.current = 'any';
      }
    }
  }, [open, initialQuery, initialType, initialYear]);


  // when type changes, reset format
  useEffect(() => {
    if (prevTypeRef.current !== undefined && prevTypeRef.current !== type) {
      setFormat('any');
    }
    prevTypeRef.current = type;
  }, [type]);

  // Reset when dialog closes
  useEffect(() => {
    if (!open) {
      setQuery('');
      setType('any');
      setFormat('any')
      setYear('');
      setResults([]);
      setError('');
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
      const searchResults = await anilistService.search(
        query,
        type === 'any' ? undefined: type,
        format === 'any' ? undefined: format,
        year && parseInt(year) ? parseInt(year) : undefined
      );

      setResults(searchResults);
      
      if (searchResults.length === 0) {
        setError('No results found. Try a different search term.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to search AniList');
    } finally {
      setSearching(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleSelectResult = (result: AniListSearchResult) => {
    onSelect(result, result.type);
    onOpenChange(false);
    // Reset state
    setQuery('');
    setType('any');
    setFormat('any');
    setYear('');
    setResults([]);
    setError('');
  };

  const getDisplayTitle = (result: AniListSearchResult) => {
    return result.title.english || result.title.romaji || result.title.native;
  };

  const stripHtml = (html: string | null) => {
    if (!html) return '';
    return html.replace(/<br>/g, '\n').replace(/<[^>]*>/g, '');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto data-[state=open]:animate-none data-[state=closed]:animate-none">
        <DialogHeader>
          <DialogTitle>Search AniList</DialogTitle>
          <DialogDescription>
            Search for anime or manga to auto-fill your form
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search Input */}
          <div className="flex gap-2">
            <Input
              placeholder="Search for anime or manga..."
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
              {/* Type Filter */}
              <div className="space-y-2">
                <Label htmlFor="type">Type</Label>
                <Select value={type} onValueChange={(value) => setType(value as 'ANIME' | 'MANGA' | 'any')}>
                  <SelectTrigger id="type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="any">Any</SelectItem>
                    <SelectItem value="ANIME">Anime</SelectItem>
                    <SelectItem value="MANGA">Manga</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {/* Format Filter */}
              <div className="space-y-2">
                <Label htmlFor="format">Format</Label>
                <Select value={format} onValueChange={setFormat}>
                  <SelectTrigger id="format">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="any">Any</SelectItem>
                    {/* Anime formats - only show if ANIME or ANY */}
                    {(type === 'any' || type === 'ANIME') && (
                      <>
                        <SelectItem value="TV">TV</SelectItem>
                        <SelectItem value="MOVIE">Movie</SelectItem>
                        <SelectItem value="OVA">OVA</SelectItem>
                        <SelectItem value="ONA">ONA</SelectItem>
                        <SelectItem value="SPECIAL">Special</SelectItem>
                        <SelectItem value="MUSIC">Music</SelectItem>
                      </>
                    )}
                    {/* Manga formats - only show if MANGA or ANY */}
                    {(type === 'any' || type === 'MANGA') && (
                      <>
                        <SelectItem value="MANGA">Manga</SelectItem>
                        <SelectItem value="NOVEL">Novel</SelectItem>
                        <SelectItem value="ONE_SHOT">One Shot</SelectItem>
                      </>
                    )}
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
                  min="1900"
                  max="2100"
                />
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
                    {result.coverImage ? (
                      <img
                        src={result.coverImage.medium || result.coverImage.large}
                        alt={getDisplayTitle(result)}
                        className="w-16 h-24 object-cover rounded"
                      />
                    ) : (
                      <div className="w-16 h-24 bg-gray-200 rounded flex items-center justify-center">
                        {type === 'ANIME' ? (
                          <Film className="h-8 w-8 text-gray-400" />
                        ) : (
                          <Book className="h-8 w-8 text-gray-400" />
                        )}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold truncate">
                        {getDisplayTitle(result)}
                        {result.startDate?.year && ` (${result.startDate.year})`}
                      </div>
                      <div className="text-sm text-gray-600">
                        {result.format}
                        {result.status && ` • ${result.status}`}
                        {type === 'ANIME' && result.episodes && ` • ${result.episodes} eps`}
                        {type === 'MANGA' && result.chapters && ` • ${result.chapters} chapters`}
                      </div>
                      {result.genres && result.genres.length > 0 && (
                        <div className="text-sm text-gray-500 mt-1">
                          {result.genres.slice(0, 3).join(', ')}
                        </div>
                      )}
                      {result.description && (
                        <div className="text-sm text-gray-500 line-clamp-2 mt-1">
                          {stripHtml(result.description)}
                        </div>
                      )}
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

export default AniListSearchDialog;