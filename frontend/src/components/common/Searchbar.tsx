import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { X, Search, HelpCircle, Loader2, ArrowUp, ArrowDown } from "lucide-react";
import { parseSearchQuery, filtersToChips, type SearchFilters } from "@/lib/utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface SearchBarProps {
  value: string;
  onChange: (filters: SearchFilters) => void;
  placeholder?: string;
  showHelp?: boolean;
  context?: 'media' | 'character' | 'library';
  onAutocomplete?: (key: string, query: string, context: string) => Promise<AutocompleteSuggestion[]>;
  settings?: {
    sort?: string;
    order?: 'asc' | 'desc';
  }
  onSettingsChange?: (settings: { sort?: string; order?: 'asc' | 'desc' }) => void;
}

interface AutocompleteSuggestion {
  value: string;
  count?: number;
}

interface LastToken {
  key: string;
  partial: string;
  isNegated: boolean;
  startPos: number;
}

const SearchBar = ({ 
  value, 
  onChange, 
  placeholder,
  showHelp = true,
  context = 'media',
  onAutocomplete,
  settings,
  onSettingsChange
}: SearchBarProps) => {
  const [inputValue, setInputValue] = useState(value);
  const [showHelpCard, setShowHelpCard] = useState(false);
  const [suggestions, setSuggestions] = useState<AutocompleteSuggestion[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);
  const [showSuggestions, setShowSuggestions] = useState(false);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const debounceTimerRef = useRef<number>(null);
  
  useEffect(() => {
    setInputValue(value);
  }, [value]);
  
  const filters = parseSearchQuery(inputValue, context);
  const chips = filtersToChips(filters);

  // Extract the last token being typed
  const extractLastToken = (input: string): LastToken | null => {
    const tokens = input.split(/\s+/);
    const lastToken = tokens[tokens.length - 1];
    const match = lastToken.match(/^(-)?(\w+):(.*)$/);
    
    if (!match) return null;
    
    const [, negation, key, partial] = match;
    const startPos = input.lastIndexOf(lastToken);
    
    return {
      key,
      partial,
      isNegated: negation === '-',
      startPos
    };
  };

  // Fetch autocomplete suggestions from API
  const fetchSuggestions = async (key: string, partial: string) => {
    if (!onAutocomplete) return;
    
    // Don't autocomplete numeric fields or if partial is empty
    if (['year', 'score', 'user_score', 'appearances'].includes(key.toLowerCase())) {
      setSuggestions([]);
      return;
    }
    
    if (!partial.trim()) {
      setSuggestions([]);
      return;
    }
    
    setLoadingSuggestions(true);
    
    try {
      const data = await onAutocomplete(key.toLowerCase(), partial, context);
      setSuggestions(data);
      setShowSuggestions(data.length > 0);
    } catch (error) {
      console.error('Autocomplete error:', error);
      setSuggestions([]);
    } finally {
      setLoadingSuggestions(false);
    }
  };

  // Debounced autocomplete
  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    
    const lastToken = extractLastToken(inputValue);
    
    if (lastToken && lastToken.partial) {
      debounceTimerRef.current = setTimeout(() => {
        fetchSuggestions(lastToken.key, lastToken.partial);
      }, 200);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
    
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [inputValue, context]);

  // Apply selected suggestion
  const applySuggestion = (suggestionValue: string) => {
    const lastToken = extractLastToken(inputValue);
    
    if (!lastToken) return;
    
    // Replace the partial value with the selected suggestion
    const beforeToken = inputValue.slice(0, lastToken.startPos);
    const prefix = lastToken.isNegated ? '-' : '';
    
    // Add quotes if value contains spaces or colons
    const needsQuotes = suggestionValue.includes(' ') || suggestionValue.includes(':');
    const formattedValue = needsQuotes ? `"${suggestionValue}"` : suggestionValue;
    
    const newValue = `${beforeToken}${prefix}${lastToken.key}:${formattedValue} `;
    
    setInputValue(newValue);
    setSuggestions([]);
    setShowSuggestions(false);
    setSelectedSuggestionIndex(-1);
    
    // Focus back on input
    inputRef.current?.focus();
  };

  const handleSearch = () => {
    onChange(filters);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    setSelectedSuggestionIndex(-1);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Handle suggestion navigation
    if (showSuggestions && suggestions.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedSuggestionIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : prev
        );
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedSuggestionIndex(prev => prev > 0 ? prev - 1 : -1);
      } else if (e.key === 'Tab' || e.key === 'Enter') {
        if (selectedSuggestionIndex >= 0) {
          e.preventDefault();
          applySuggestion(suggestions[selectedSuggestionIndex].value);
          return;
        }
      } else if (e.key === 'Escape') {
        setShowSuggestions(false);
        setSuggestions([]);
        setSelectedSuggestionIndex(-1);
        return;
      }
    }
    
    if (e.key === 'Enter' && selectedSuggestionIndex === -1) {
      handleSearch();
    }
  };

  const removeChip = (chipKey: string, chipValue: string) => {
    let newQuery = inputValue;
    
    const escapeRegex = (str: string) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const escapedValue = escapeRegex(chipValue);
    
    if (chipKey.startsWith('exclude')) {
      const baseKey = chipKey.replace(/^exclude/, '').toLowerCase();
      newQuery = newQuery.replace(
        new RegExp(`\\s*-${baseKey}:"${escapedValue}"\\s*`, 'gi'), 
        ' '
      );
      newQuery = newQuery.replace(
        new RegExp(`\\s*-${baseKey}:${escapedValue}\\s*`, 'gi'), 
        ' '
      );
    } else {
      const key = chipKey.toLowerCase();
      newQuery = newQuery.replace(
        new RegExp(`\\s*${key}:"${escapedValue}"\\s*`, 'gi'), 
        ' '
      );
      newQuery = newQuery.replace(
        new RegExp(`\\s*${key}:${escapedValue}\\s*`, 'gi'), 
        ' '
      );
      
      if ((key === 'title' || key === 'name') && !inputValue.includes(`${key}:`)) {
        newQuery = newQuery.replace(chipValue, '');
      }
    }
    
    newQuery = newQuery.replace(/\s+/g, ' ').trim();
    
    setInputValue(newQuery);
    onChange(parseSearchQuery(newQuery, context));
  };

  const clearAll = () => {
    setInputValue('');
    onChange({});
    setSuggestions([]);
    setShowSuggestions(false);
  };

  const getHelpContent = () => {
    if (context === 'media') {
      return {
        title: 'Media Search Operators:',
        operators: [
          { code: 'title:"Movie Name"', desc: 'Search by title (use quotes for colons/spaces)' },
          { code: 'tag:Action', desc: 'Filter by tag' },
          { code: '-tag:Romance', desc: 'Exclude tag' },
          { code: '-title:"Movie Name"', desc: 'Exclude by title' },
          { code: '-type:movie', desc: 'Exclude media type' },
          { code: 'year:2020', desc: 'Exact year' },
          { code: 'year:>2020', desc: 'After year' },
          { code: 'year:<2020', desc: 'Before year' },
          { code: 'type:movie', desc: 'Filter by type (multiple = OR)' },
          { code: 'status:completed', desc: 'Filter by status' },
        ],
        hint: '💡 Plain text searches titles by default. Multiple values of the same filter use OR logic.'
      };
    } else if (context === 'character') {
      return {
        title: 'Character Search Operators:',
        operators: [
          { code: 'name:"Character Name"', desc: 'Search by name (use quotes for colons/spaces)' },
          { code: '-name:"Character Name"', desc: 'Exclude by name' },
          { code: 'media:"Media Title"', desc: 'Characters appearing in specific media' },
          { code: '-media:"Media Title"', desc: 'Exclude characters from media' },
          { code: 'appearances:>5', desc: 'Characters with more than N appearances' },
          { code: 'appearances:<2', desc: 'Characters with fewer than N appearances' },
          { code: 'tag:Protagonist', desc: 'Filter by tag' },
          { code: '-tag:Villain', desc: 'Exclude tag' },
        ],
        hint: '💡 Plain text searches character names by default. Multiple values use OR logic.'
      };
    } else {
      return {
        title: 'Library Search Operators:',
        operators: [
          { code: 'title:"Movie Name"', desc: 'Search by media title' },
          { code: '-title:"Movie Name"', desc: 'Exclude by title' },
          { code: 'user_status:watching', desc: 'Filter by your watch status' },
          { code: '-user_status:completed', desc: 'Exclude by watch status' },
          { code: 'user_score:5', desc: 'Filter by your rating (exact)' },
          { code: 'user_score:>8', desc: 'Filter by your rating (greater than)' },
          { code: 'user_score:<5', desc: 'Filter by your rating (less than)' },
          { code: 'type:movie', desc: 'Filter by media type' },
          { code: 'year:>2020', desc: 'Filter by release year' },
        ],
        hint: '💡 Plain text searches titles by default. Multiple values use OR logic.'
      };
    }
  };

  const helpContent = getHelpContent();

  const handleSortChange = (newSort: string) => {
    if (onSettingsChange && settings) {
      onSettingsChange({ ...settings, sort: newSort });
    }
  };

  const handleOrderToggle = () => {
    if (onSettingsChange && settings) {
      onSettingsChange({ 
        ...settings, 
        order: settings.order === 'asc' ? 'desc' : 'asc' 
      });
    }
  };

  return (
    <div className="space-y-2">
      <div className="relative flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            ref={inputRef}
            value={inputValue}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onFocus={() => {
              if (suggestions.length > 0) {
                setShowSuggestions(true);
              }
            }}
            onBlur={() => {
              // Delay to allow click on suggestion
              setTimeout(() => setShowSuggestions(false), 200);
            }}
            placeholder={placeholder || (context === 'media' ? 'Search media...' : context === 'character' ? 'Search characters...' : 'Search library...')}
            className="pl-9 pr-10"
          />
          {showHelp && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
              onMouseEnter={() => setShowHelpCard(true)}
              onMouseLeave={() => setShowHelpCard(false)}
            >
              <HelpCircle className="w-4 h-4 text-muted-foreground" />
            </Button>
          )}
          
          {/* Autocomplete Dropdown */}
          {showSuggestions && suggestions.length > 0 && (
            <div 
              ref={suggestionsRef}
              className="absolute z-20 w-full mt-1 bg-background border rounded-md shadow-lg max-h-60 overflow-auto"
            >
              {suggestions.map((suggestion, index) => (
                <button
                  key={index}
                  type="button"
                  className={`w-full px-4 py-2 text-left hover:bg-accent transition-colors flex justify-between items-center ${
                    index === selectedSuggestionIndex ? 'bg-accent' : ''
                  }`}
                  onClick={() => applySuggestion(suggestion.value)}
                  onMouseEnter={() => setSelectedSuggestionIndex(index)}
                >
                  <span className="truncate">{suggestion.value}</span>
                  {suggestion.count !== undefined && (
                    <span className="text-sm text-muted-foreground ml-2 flex-shrink-0">
                      ({suggestion.count})
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}
          
          {/* Loading indicator */}
          {loadingSuggestions && (
            <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-muted-foreground" />
          )}
        </div>
        <Button onClick={handleSearch}>Search</Button>

        {/* Sort controls */}
        {settings && onSettingsChange && (
          <>
            <Select value={settings.sort || 'created_at'} onValueChange={handleSortChange}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Sort by..." />
              </SelectTrigger>
              <SelectContent>
                {context === 'media' && (
                  <>
                    <SelectItem value="title">Title</SelectItem>
                    <SelectItem value="release_year">Year</SelectItem>
                    <SelectItem value="created_at">Date Added</SelectItem>
                  </>
                )}
                {context === 'character' && (
                  <>
                    <SelectItem value="name">Name</SelectItem>
                    <SelectItem value="created_at">Date Added</SelectItem>
                  </>
                )}
                {context === 'library' && (
                  <>
                    <SelectItem value="title">Title</SelectItem>
                    <SelectItem value="release_year">Year</SelectItem>
                    <SelectItem value="user_score">Your Score</SelectItem>
                    <SelectItem value="progress_updated">Last Updated</SelectItem>
                    <SelectItem value="created_at">Date Added</SelectItem>
                  </>
                )}
              </SelectContent>
            </Select>
            
            <Button 
              variant="outline" 
              size="icon"
              onClick={handleOrderToggle}
              title={settings.order === 'asc' ? 'Ascending' : 'Descending'}
            >
              {settings.order === 'asc' ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />}
            </Button>
          </>
        )}
      </div>

      {/* Help Card */}
      {showHelpCard && (
        <Card className="absolute z-10 p-4 mt-1 text-sm space-y-2 max-w-md">
          <p className="font-semibold">{helpContent.title}</p>
          <div className="space-y-1 text-muted-foreground">
            {helpContent.operators.map((op, index) => (
              <p key={index}>
                <code className="bg-muted px-1 rounded">{op.code}</code> - {op.desc}
              </p>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">
            {helpContent.hint}
          </p>
        </Card>
      )}

      {/* Active Filters Chips */}
      {chips.length > 0 && (
        <div className="flex gap-2 flex-wrap items-center">
          <span className="text-sm text-muted-foreground">Filters:</span>
          {chips.map((chip, index) => (
            <Badge 
              key={`${chip.key}-${chip.value}-${index}`} 
              variant="secondary"
              className="gap-1"
            >
              <span className="font-medium">{chip.label}:</span>
              <span>{chip.value}</span>
              <X 
                className="w-3 h-3 cursor-pointer hover:text-destructive" 
                onClick={() => removeChip(chip.key, chip.value)}
              />
            </Badge>
          ))}
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={clearAll}
            className="h-6 text-xs"
          >
            Clear all
          </Button>
        </div>
      )}
    </div>
  );
};

export default SearchBar;