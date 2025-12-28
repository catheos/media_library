import { Navigate, Link, useSearchParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Loading from "@/components/common/Loading";
import ImageContainer from "@/components/common/ImageContainer";
import ErrorCard from "@/components/common/ErrorCard";
import SearchBar from "../common/Searchbar";
import { mediaService, mediaUserService, ApiException } from "@/api";
import type { UserMediaListResponse } from "@/api";
import { useScrollRestoration } from "@/hooks/useScrollRestoration";
import { Film, Star } from "lucide-react";
import { parseSearchQuery, filtersToQueryParams } from "@/lib/utils";
import type { SearchFilters } from "@/lib/utils";

import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

// Component to handle individual media card with image fetching
const MediaUserCard = ({ userMedia }: { userMedia: any }) => {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imageFailed, setImageFailed] = useState<boolean>(false);

  useEffect(() => {
    const fetchImage = async () => {
      try {
        const blob = await mediaService.getSingleCover(userMedia.media.id);
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
  }, [userMedia.media.id]);

  return (
    <Link to={`/media-user/${userMedia.id}`} className="block group">
      <Card className="p-2 overflow-hidden transition-transform h-full group-hover:scale-101">
        <ImageContainer
          imageUrl={imageUrl}
          imageFailed={imageFailed}
          alt={userMedia.media.title}
          FallbackIcon={Film}
          aspectRatio="portrait"
          iconSize="md"
        />
        <CardContent className="space-y-1">
          <h3 className="mt-1 font-semibold truncate">{userMedia.media.title}</h3>
          {userMedia.media.release_year && (
            <p className="text-sm text-muted-foreground">
              {userMedia.media.release_year}
            </p>
          )}
          
          {/* User's score */}
          {userMedia.score && (
            <div className="flex items-center gap-1">
              <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
              <span className="text-sm font-medium">{userMedia.score}</span>
            </div>
          )}

          <div className="flex gap-2 flex-wrap">
            <Badge variant="secondary" className="text-xs">
              {userMedia.media.type.name}
            </Badge>
            {userMedia.status && (
              <Badge variant="outline" className="text-xs">
                {userMedia.status.name}
              </Badge>
            )}
          </div>

          {/* Current progress */}
          {userMedia.current_progress && (
            <p className="text-xs text-muted-foreground truncate">
              {userMedia.current_progress}
            </p>
          )}
        </CardContent>
      </Card>
    </Link>
  );
};

const MediaUserList = () => {
  const { is_authenticated, is_loading } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const limit = 20;
  const page = parseInt(searchParams.get('page') || '1');
  const searchQuery = searchParams.get('q') || '';
  
  const [data, setData] = useState<UserMediaListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Calculate total pages
  const totalPages = data ? Math.ceil(data.total / limit) : 0;

  // scroll restoration
  const contentReady = !loading && !error && data !== null;
  useScrollRestoration(contentReady);

  useEffect(() => {
    const fetchUserMedia = async () => {
      setLoading(true);
      setError('');
      
      try {
        let filterParams: Record<string, string> = {};
        
        if (searchQuery) {
          const filters = parseSearchQuery(searchQuery, 'media');
          filterParams = filtersToQueryParams(filters);
        }
        
        const response = await mediaUserService.getAll({
          limit: limit,
          ...filterParams
        });
        setData(response);
      } catch (err) {
        if (err instanceof ApiException) {
          setError(err.message);
        } else {
          setError('An error occurred while loading your library');
        }
      } finally {
        setLoading(false);
      }
    };

    if (is_authenticated) {
      fetchUserMedia();
    }
  }, [page, searchQuery, is_authenticated]);

  const handleSearch = (query: string, filters: SearchFilters) => {
    const params = new URLSearchParams();
    
    if (query) {
      params.set('q', query);
    }
    
    // Reset to page 1 when searching
    params.set('page', '1');
    
    // Use navigate instead of setSearchParams to avoid full refresh
    navigate(`?${params.toString()}`, { replace: true });
  };

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

  if (!data || data.user_media.length === 0) {
    return (
      <div className="container mx-auto p-4 max-w-4xl">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h1 className="text-1xl font-bold">/library</h1>
            <p className="text-muted-foreground">
              0 items
            </p>
          </div>
          <SearchBar
            value={searchQuery}
            onChange={handleSearch}
            placeholder='Search your library (e.g. "Dexter" or title:"Breaking Bad" status:watching)'
            context="library"
          />
          <div className="flex flex-col items-center justify-center py-12 space-y-4">
            <p className="text-muted-foreground">Your library is empty</p>
            <Link 
              to="/media"
              className="text-primary hover:underline font-medium"
            >
              Browse media to add to your library
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
          <h1 className="text-1xl font-bold">/library</h1>
          <p className="text-muted-foreground">
            {data.total} {data.total === 1 ? 'item' : 'items'}
          </p>
        </div>

        {/* Search Bar */}
        <SearchBar
          value={searchQuery}
          onChange={handleSearch}
          placeholder='Search your library (e.g. "Dexter" or title:"Breaking Bad" status:watching)'
          context="library"
        />

        {/* Media grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {data.user_media.map((userMedia) => (
            <MediaUserCard key={userMedia.id} userMedia={userMedia} />
          ))}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  to={`?page=${page - 1}${searchQuery ? `&q=${searchQuery}` : ''}`}
                  className={page === 1 ? 'pointer-events-none opacity-50' : ''}
                />
              </PaginationItem>
              
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                <PaginationItem key={pageNum}>
                  <PaginationLink
                    to={`?page=${pageNum}${searchQuery ? `&q=${searchQuery}` : ''}`}
                    isActive={pageNum === page}
                  >
                    {pageNum}
                  </PaginationLink>
                </PaginationItem>
              ))}
              
              <PaginationItem>
                <PaginationNext
                  to={`?page=${page + 1}${searchQuery ? `&q=${searchQuery}` : ''}`}
                  className={page === totalPages ? 'pointer-events-none opacity-50' : ''}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        )}
      </div>
    </div>
  );
};

export default MediaUserList;