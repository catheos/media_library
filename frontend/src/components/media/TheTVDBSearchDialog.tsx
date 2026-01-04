import { useState, useEffect } from 'react';
import { Search, Loader2, Film, Tv, ChevronDown, ChevronUp } from 'lucide-react';
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
import { thetvdbService, type TheTVDBSearchResult } from '@/services/thetvdb';

interface TheTVDBSearchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (result: TheTVDBSearchResult, langauge: string) => void;
  initialQuery?: string;
  initialType?: 'series' | 'movie';
  initialYear?: number;
}

const TheTVDBSearchDialog = ({
  open,
  onOpenChange,
  onSelect,
  initialQuery,
  initialType,
  initialYear
}: TheTVDBSearchDialogProps) => {
  const [query, setQuery] = useState('');
  const [type, setType] = useState<'any' | 'movie' | 'series'>('any');
  const [language, setLanguage] = useState('eng');
  const [year, setYear] = useState('');
  const [country, setCountry] = useState('any');
  const [showFilters, setShowFilters] = useState(false);
  const [results, setResults] = useState<TheTVDBSearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) {
      setQuery(initialQuery || '');
      setType(initialType || 'any');
      setYear(initialYear ? initialYear.toString() : '');
    }
  }, [open, initialQuery, initialType, initialYear]);

  // Reset when dialog closes
  useEffect(() => {
    if (!open) {
      setQuery('');
      setType('any');
      setLanguage('eng');
      setYear('');
      setCountry('any');
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
      const searchResults = await thetvdbService.search(
        query,
        type !== 'any' ? type : undefined,
        language,
        year || undefined,
        country !== 'any' ? country : undefined
      );
      setResults(searchResults);
      
      if (searchResults.length === 0) {
        setError('No results found. Try a different search term.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to search TheTVDB');
    } finally {
      setSearching(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleSelectResult = async (result: TheTVDBSearchResult, language: string) => {
    onSelect(result, language);
    onOpenChange(false);
    // Reset state
    setQuery('');
    setType('any');
    setLanguage('eng');
    setYear('');
    setCountry('any');
    setResults([]);
    setError('');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto data-[state=open]:animate-none data-[state=closed]:animate-none">
        <DialogHeader>
          <DialogTitle>Search TheTVDB</DialogTitle>
          <DialogDescription>
            Search for movies or TV shows to auto-fill your form
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search Input */}
          <div className="flex gap-2">
            <Input
              placeholder="Search for a movie or TV show..."
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
              {/* Type */}
              <div className="space-y-2">
                <Label htmlFor="type">Type (optional)</Label>
                <Select value={type} onValueChange={(value) => setType(value as 'any' | 'movie' | 'series')}>
                  <SelectTrigger id="type">
                    <SelectValue placeholder="Any" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="any">Any</SelectItem>
                    <SelectItem value="movie">Movies</SelectItem>
                    <SelectItem value="series">Series</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Language Filter */}
              <div className="space-y-2">
                <Label htmlFor="language">Language</Label>
                <Select value={language} onValueChange={setLanguage}>
                  <SelectTrigger id="language">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="eng">English</SelectItem>
                    <SelectItem value="jpn">Japanese</SelectItem>
                    <SelectItem value="spa">Spanish</SelectItem>
                    <SelectItem value="fra">French</SelectItem>
                    <SelectItem value="deu">German</SelectItem>
                    <SelectItem value="ita">Italian</SelectItem>
                    <SelectItem value="por">Portuguese</SelectItem>
                    <SelectItem value="rus">Russian</SelectItem>
                    <SelectItem value="kor">Korean</SelectItem>
                    <SelectItem value="zho">Chinese</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Year Filter */}
              <div className="space-y-2">
                <Label htmlFor="year">Year (optional)</Label>
                <Input
                  id="year"
                  type="number"
                  placeholder="2024"
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                  min="1800"
                  max="2100"
                />
              </div>

              {/* Country Filter */}
              <div className="space-y-2">
                <Label htmlFor="country">Country (optional)</Label>
                <Select value={country} onValueChange={setCountry}>
                  <SelectTrigger id="country">
                    <SelectValue placeholder="Any" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="any">Any</SelectItem>
                    <SelectItem value="usa">United States</SelectItem>
                    <SelectItem value="gbr">United Kingdom</SelectItem>
                    <SelectItem value="jpn">Japan</SelectItem>
                    <SelectItem value="kor">South Korea</SelectItem>
                    <SelectItem value="can">Canada</SelectItem>
                    <SelectItem value="fra">France</SelectItem>
                    <SelectItem value="deu">Germany</SelectItem>
                    <SelectItem value="esp">Spain</SelectItem>
                    <SelectItem value="ita">Italy</SelectItem>
                    <SelectItem value="aus">Australia</SelectItem>
                    <SelectItem value="mex">Mexico</SelectItem>
                    <SelectItem value="bra">Brazil</SelectItem>
                    <SelectItem value="ind">India</SelectItem>
                    <SelectItem value="chn">China</SelectItem>
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
                    onClick={() => handleSelectResult(result, language)}
                    className="w-full flex gap-3 p-3 border rounded-lg hover:bg-gray-50 transition-colors text-left"
                  >
                    {result.image_url ? (
                      <img
                        src={result.image_url}
                        alt={result.name}
                        className="w-16 h-24 object-cover rounded"
                      />
                    ) : (
                      <div className="w-16 h-24 bg-gray-200 rounded flex items-center justify-center">
                        {result.type === 'movie' ? (
                          <Film className="h-8 w-8 text-gray-400" />
                        ) : (
                          <Tv className="h-8 w-8 text-gray-400" />
                        )}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold truncate">
                        {result.name}
                        {result.year && ` (${result.year})`}
                      </div>
                      <div className="text-sm text-gray-600 capitalize">
                        {result.type}
                        {result.status && ` • ${result.status}`}
                      </div>
                      {result.overview && (
                        <div className="text-sm text-gray-500 line-clamp-2 mt-1">
                          {result.overview}
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

export default TheTVDBSearchDialog;