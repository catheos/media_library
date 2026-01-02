import { Navigate, Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Loading from "@/components/common/Loading";
import ImageContainer from "@/components/common/ImageContainer";
import ErrorCard from "@/components/common/ErrorCard";
import { mediaService, ApiException } from "@/api";
import type { PaginatedResponse } from "@/api";
import { useScrollRestoration } from "@/hooks/useScrollRestoration";
import { Film } from "lucide-react";
import SearchBar from "../common/Searchbar";
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

// Component to handle individual media card with image fetching
const MediaCard = ({ media }: { media: any }) => {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imageFailed, setImageFailed] = useState<boolean>(false);

  useEffect(() => {
    const fetchImage = async () => {
      try {
        const blob = await mediaService.getSingleCover(media.id, true);
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
  }, [media.id]);

  return (
    <Link to={`/media/${media.id}`} className="block group">
      <Card className="p-2 overflow-hidden transition-transform h-full group-hover:scale-101">
        <ImageContainer
          imageUrl={imageUrl}
          imageFailed={imageFailed}
          alt={media.title}
          FallbackIcon={Film}
          aspectRatio="portrait"
          iconSize="md"
        />
        <CardContent className="space-y-1">
          <h3 className="mt-1 font-semibold truncate">{media.title}</h3>
          {media.release_year && (
            <p className="text-sm text-muted-foreground">
              {media.release_year}
            </p>
          )}
          <div className="flex gap-2 flex-wrap">
            <Badge variant="secondary" className="text-xs">
              {media.type.name}
            </Badge>
            <Badge variant="outline" className="text-xs">
              {media.status.name}
            </Badge>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
};

const MediaList = () => {
  const { is_authenticated, is_loading } = useAuth();
  const { handleSearch, searchParams } = useSearchNavigation();
  const page = parseInt(searchParams.get('page') || '1');
  const searchQuery = queryParamsToSearchQuery(searchParams);
  
  const [data, setData] = useState<PaginatedResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Read from localStorage with defaults
  const [searchSettings, setSearchSettings] = useState<{ sort?: string; order?: 'asc' | 'desc' }>(() => {
    const saved = localStorage.getItem('mediaSearchSettings');
    return saved ? JSON.parse(saved) : { sort: 'created_at', order: 'desc' };
  });

  // Save to localStorage when settings change
  const handleSettingsChange = (newSettings: { sort?: string; order?: 'asc' | 'desc' }) => {
    setSearchSettings(newSettings);
    localStorage.setItem('mediaSearchSettings', JSON.stringify(newSettings));
  };

  // Set title
  useTabTitle('Media');

  // scroll restoration
  useScrollRestoration(!loading && !error && data !== null);

  // for pagination
  const getPaginationUrl = (newPage: number) => {
    const params = new URLSearchParams(searchParams);
    params.set('page', newPage.toString());
    return `?${params.toString()}`;
  };

  useEffect(() => {
    const fetchMedia = async () => {
      setLoading(true);
      setError('');
      
      try {
        let filterParams: Record<string, string> = {};
        
        if (searchQuery) {
          const filters = parseSearchQuery(searchQuery);
          filterParams = filtersToQueryParams(filters, searchSettings);
        } else {
          // Even without search query, include sort/order
          filterParams = filtersToQueryParams({}, searchSettings);
        }
        
        const response = await mediaService.getAll(page, filterParams);
        setData(response);
      } catch (err) {
        if (err instanceof ApiException) {
          setError(err.message);
        } else {
          setError('An error occurred while loading media');
        }
      } finally {
        setLoading(false);
      }
    };

    if (is_authenticated) {
      fetchMedia();
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

  if (!data || data.media.length === 0) {
    return (
      <div className="container mx-auto p-4 max-w-4xl">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h1 className="text-1xl font-bold">/media</h1>
            <p className="text-muted-foreground">
              0 items
            </p>
          </div>
          
          <SearchBar
            value={searchQuery}
            onChange={handleSearch}
            placeholder='Search media (e.g. title:"Star Wars" tag:Action year:>2020)'
            context='media'
            onAutocomplete={mediaService.autocomplete}
            settings={searchSettings}
            onSettingsChange={handleSettingsChange}
          />
          <div className="flex flex-col items-center justify-center py-12 space-y-4">
            <p className="text-muted-foreground">No media found</p>
            <Link 
              to="/media/upload"
              className="text-primary hover:underline font-medium"
            >
              Upload media to add to here
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
          <h1 className="text-1xl font-bold">/media</h1>
          <p className="text-muted-foreground">
            {data.total} {data.total === 1 ? 'item' : 'items'}
          </p>
        </div>
        
        {/* Search Bar */}
        <SearchBar
          value={searchQuery}
          onChange={handleSearch}
          placeholder='Search media (e.g. title:"Star Wars" tag:Action year:>2020)'
          context='media'
          onAutocomplete={mediaService.autocomplete}
          settings={searchSettings}
          onSettingsChange={handleSettingsChange}
        />

        {/* Media grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {data.media.map((media) => (
            <MediaCard key={media.id} media={media} />
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

export default MediaList;