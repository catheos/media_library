import { Navigate, Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import Loading from "@/components/common/Loading";
import ErrorCard from "@/components/common/ErrorCard";
import ImageContainer from "@/components/common/ImageContainer";
import SearchBar from "../common/Searchbar";
import { characterService, ApiException } from "@/api";
import type { CharacterListResponse } from "@/api";
import { useScrollRestoration } from "@/hooks/useScrollRestoration";
import { User } from "lucide-react";
import { parseSearchQuery, filtersToQueryParams, queryParamsToSearchQuery } from "@/lib/utils";

import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { useSearchNavigation } from "@/hooks/useSearchNavigation";
import { useTabTitle } from "@/hooks/useTabTitle";

// Component to handle individual character card with image fetching
const CharacterCard = ({ character }: { character: any }) => {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imageFailed, setImageFailed] = useState<boolean>(false);

  useEffect(() => {
    const fetchImage = async () => {
      try {
        const blob = await characterService.getSingleCover(character.id);
        const url = URL.createObjectURL(blob);
        setImageUrl(url);
      } catch (err) {
        setImageFailed(true);
      }
    };

    fetchImage();

    return () => {
      if (imageUrl) {
        URL.revokeObjectURL(imageUrl);
      }
    };
  }, [character.id]);

  return (
    <Link to={`/characters/${character.id}`} className="block group">
      <Card className="p-2 overflow-hidden transition-transform h-full group-hover:scale-105">
        <ImageContainer
          imageUrl={imageUrl}
          imageFailed={imageFailed}
          alt={character.name}
          FallbackIcon={User}
          aspectRatio="portrait"
          iconSize="md"
        />
        <CardContent className="p-2 space-y-1">
          <h3 className="font-semibold truncate">{character.name}</h3>
          {character.media_count !== undefined && (
            <p className="text-sm text-muted-foreground">
              {character.media_count} {character.media_count === 1 ? 'appearance' : 'appearances'}
            </p>
          )}
        </CardContent>
      </Card>
    </Link>
  );
};

const CharacterList = () => {
  const { is_authenticated, is_loading } = useAuth();
  const { handleSearch, searchParams } = useSearchNavigation();
  const page = parseInt(searchParams.get('page') || '1');
  const searchQuery = queryParamsToSearchQuery(searchParams);
  
  const [data, setData] = useState<CharacterListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Read from localStorage with defaults
  const [searchSettings, setSearchSettings] = useState<{ sort?: string; order?: 'asc' | 'desc' }>(() => {
    const saved = localStorage.getItem('characterSearchSettings');
    return saved ? JSON.parse(saved) : { sort: 'created_at', order: 'desc' };
  });

  // Save to localStorage when settings change
  const handleSettingsChange = (newSettings: { sort?: string; order?: 'asc' | 'desc' }) => {
    setSearchSettings(newSettings);
    localStorage.setItem('characterSearchSettings', JSON.stringify(newSettings));
  };

  // Set title
  useTabTitle('Characters')

  // scroll restoration
  useScrollRestoration(!loading && !error && data !== null);

  // for pagination
  const getPaginationUrl = (newPage: number) => {
    const params = new URLSearchParams(searchParams);
    params.set('page', newPage.toString());
    return `?${params.toString()}`;
  };

  useEffect(() => {
    const fetchCharacters = async () => {
      setLoading(true);
      setError('');
      
      try {
        let filterParams: Record<string, string> = {};
        
        if (searchQuery) {
          const filters = parseSearchQuery(searchQuery, 'character'); // Add context here
          filterParams = filtersToQueryParams(filters, searchSettings);
        } else {
          // Even without search query, include sort/order
          filterParams = filtersToQueryParams({}, searchSettings);
        }
        
        const response = await characterService.getAll(page, filterParams);
        setData(response);
      } catch (err) {
        if (err instanceof ApiException) {
          setError(err.message);
        } else {
          setError('An error occurred while loading characters');
        }
      } finally {
        setLoading(false);
      }
    };

    if (is_authenticated) {
      fetchCharacters();
    }
  }, [page, searchQuery, is_authenticated, searchSettings]);

  if (is_loading) {
    return <Loading fullScreen />;
  }

  if (!is_authenticated) {
    return <Navigate to="/users/login" replace />;
  }

  if (loading) {
    return <Loading fullScreen />;
  }

  if (error) {
    return <ErrorCard message={error} onRetry={() => window.location.reload()} />;
  }

  if (!data || data.characters.length === 0) {
    return (
      <div className="container mx-auto p-4 max-w-4xl">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h1 className="text-1xl font-bold">/characters</h1>
            <p className="text-muted-foreground">
              0 items
            </p>
          </div>
          
          <SearchBar
            value={searchQuery}
            onChange={handleSearch}
            placeholder='Search characters (e.g. name:"Naruto" tag:Protagonist)'
            context="character"
            onAutocomplete={characterService.autocomplete}
            settings={searchSettings}
            onSettingsChange={handleSettingsChange}
          />

          <div className="flex flex-col items-center justify-center py-12 space-y-4">
            <p className="text-muted-foreground">No characters found</p>
            <Link 
              to="/characters/upload"
              className="text-primary hover:underline font-medium"
            >
              Upload character to add to here
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-1xl font-bold">/characters</h1>
          <p className="text-muted-foreground">
            {data.total} {data.total === 1 ? 'item' : 'items'}
          </p>
        </div>
        
        {/* Search Bar */}
        <SearchBar
          value={searchQuery}
          onChange={handleSearch}
          placeholder='Search (e.g. "Dexter" or name:"Dexter Morgan" media:Dexter)'
          context="character"
          onAutocomplete={characterService.autocomplete}
          settings={searchSettings}
          onSettingsChange={handleSettingsChange}
        />

        {/* Characters grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {data.characters.map((character) => (
            <CharacterCard key={character.id} character={character} />
          ))}
        </div>

        {/* Pagination */}
        {data.total_pages > 1 && (
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  to={getPaginationUrl(page-1)}
                  className={page === 1 ? 'pointer-events-none opacity-50' : ''}
                />
              </PaginationItem>
              
              {Array.from({ length: data.total_pages }, (_, i) => i + 1).map((pageNum) => (
                <PaginationItem key={pageNum}>
                  <PaginationLink
                    to={getPaginationUrl(pageNum)}
                    isActive={pageNum === page}
                  >
                    {pageNum}
                  </PaginationLink>
                </PaginationItem>
              ))}
              
              <PaginationItem>
                <PaginationNext
                  to={getPaginationUrl(page+1)}
                  className={page === data.total_pages ? 'pointer-events-none opacity-50' : ''}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        )}
      </div>
    </div>
  );
};

export default CharacterList;