import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { X, Search, HelpCircle } from "lucide-react";
import { parseSearchQuery, filtersToChips, type SearchFilters } from "@/lib/utils";

interface SearchBarProps {
  value: string;
  onChange: (query: string, filters: SearchFilters) => void;
  placeholder?: string;
  showHelp?: boolean;
  autoSearch?: boolean;
  context?: 'media' | 'character' | 'library'; // New prop for context
}

const SearchBar = ({ 
  value, 
  onChange, 
  placeholder,
  showHelp = true,
  autoSearch = false,
  context = 'media'
}: SearchBarProps) => {
  const [inputValue, setInputValue] = useState(value);
  const [showHelpCard, setShowHelpCard] = useState(false);
  
  // Sync with external value changes
  useEffect(() => {
    setInputValue(value);
  }, [value]);
  
  const filters = parseSearchQuery(inputValue, context);
  const chips = filtersToChips(filters);

  const handleSearch = () => {
    onChange(inputValue, filters);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    
    if (autoSearch) {
      onChange(newValue, parseSearchQuery(newValue, context));
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const removeChip = (chipKey: string, chipValue: string) => {
    let newQuery = inputValue;
    
    // Remove the specific filter from the query
    if (chipKey === 'tag') {
      newQuery = newQuery.replace(new RegExp(`\\s*tag:${chipValue}\\s*`, 'g'), ' ');
    } else if (chipKey === 'excludeTag') {
      newQuery = newQuery.replace(new RegExp(`\\s*-tag:${chipValue}\\s*`, 'g'), ' ');
    } else if (chipKey === 'title') {
      // Remove title: or quoted title:
      newQuery = newQuery.replace(new RegExp(`\\s*title:"${chipValue}"\\s*`, 'g'), ' ');
      newQuery = newQuery.replace(new RegExp(`\\s*title:${chipValue}\\s*`, 'g'), ' ');
      // If title was plain text, remove it
      newQuery = newQuery.replace(chipValue, '');
    } else if (chipKey === 'name') {
      // Remove name: or quoted name:
      newQuery = newQuery.replace(new RegExp(`\\s*name:"${chipValue}"\\s*`, 'g'), ' ');
      newQuery = newQuery.replace(new RegExp(`\\s*name:${chipValue}\\s*`, 'g'), ' ');
      // If name was plain text, remove it
      newQuery = newQuery.replace(chipValue, '');
    } else {
      // Generic removal for other filters
      newQuery = newQuery.replace(new RegExp(`\\s*${chipKey}:[^\\s]+\\s*`, 'g'), ' ');
    }
    
    newQuery = newQuery.trim();
    setInputValue(newQuery);
    onChange(newQuery, parseSearchQuery(newQuery, context));
  };

  const clearAll = () => {
    setInputValue('');
    onChange('', {});
  };

  // Context-specific help text
  const getHelpContent = () => {
    if (context === 'media') {
      return {
        title: 'Media Search Operators:',
        operators: [
          { code: 'title:"Movie Name"', desc: 'Search by title (use quotes for colons/spaces)' },
          { code: 'tag:Action', desc: 'Filter by tag' },
          { code: '-tag:Romance', desc: 'Exclude tag' },
          { code: 'year:2020', desc: 'Exact year' },
          { code: 'year:>2020', desc: 'After year' },
          { code: 'year:<2020', desc: 'Before year' },
          { code: 'type:movie', desc: 'Filter by type (movie, tv_series, etc.)' },
          { code: 'status:completed', desc: 'Filter by status' },
        ],
        hint: '💡 Plain text searches titles by default'
      };
    } else if (context === 'character') {
      return {
        title: 'Character Search Operators:',
        operators: [
          { code: 'name:"Character Name"', desc: 'Search by name (use quotes for colons/spaces)' },
          { code: 'media:"Media Title"', desc: 'Characters appearing in specific media' },
          { code: 'appearances:>5', desc: 'Characters with more than N appearances' },
          { code: 'appearances:<2', desc: 'Characters with fewer than N appearances' },
          { code: 'tag:Protagonist', desc: 'Filter by tag' },
          { code: '-tag:Villain', desc: 'Exclude tag' },
        ],
        hint: '💡 Plain text searches character names by default'
      };
    } else {
      return {
        title: 'Library Search Operators:',
        operators: [
          { code: 'title:"Movie Name"', desc: 'Search by media title' },
          { code: 'user_status:watching', desc: 'Filter by your watch status' },
          { code: 'user_score:5', desc: 'Filter by your rating (exact)' },
          { code: 'user_score:>8', desc: 'Filter by your rating (greater than)' },
          { code: 'user_score:<5', desc: 'Filter by your rating (less than)' },
          { code: 'type:movie', desc: 'Filter by media type' },
          { code: 'year:>2020', desc: 'Filter by release year' },
        ],
        hint: '💡 Plain text searches titles by default'
      };
    }
  };

  const helpContent = getHelpContent();

  return (
    <div className="space-y-2">
      <div className="relative flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={inputValue}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder={placeholder || (context === 'media' ? 'Search media...' : 'Search characters...')}
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
        </div>
        {!autoSearch && <Button onClick={handleSearch}>Search</Button>}
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