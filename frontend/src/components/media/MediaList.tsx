import { Navigate, Link, useSearchParams } from "react-router-dom";
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

import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

// Component to handle individual media card with image fetching
const MediaCard = ({ media }: { media: any }) => {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imageFailed, setImageFailed] = useState<boolean>(false);

  useEffect(() => {
    const fetchImage = async () => {
      try {
        const blob = await mediaService.getSingleCover(media.id);
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
  const [searchParams, setSearchParams] = useSearchParams();
  const page = parseInt(searchParams.get('page') || '1');
  
  const [data, setData] = useState<PaginatedResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // scroll restoration
  const contentReady = !loading && !error && data !== null;
  useScrollRestoration(contentReady);

  useEffect(() => {
    const fetchMedia = async () => {
      setLoading(true);
      setError('');
      
      try {
        const response = await mediaService.getAll(page);
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
  }, [page, is_authenticated]);

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
        <div className="flex items-center justify-center py-8">
          <p>No media found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <div className="space-y-4">
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
                  to={`?page=${page - 1}`}
                  className={page === 1 ? 'pointer-events-none opacity-50' : ''}
                />
              </PaginationItem>
              
              {Array.from({ length: data.total_pages }, (_, i) => i + 1).map((pageNum) => (
                <PaginationItem key={pageNum}>
                  <PaginationLink
                    to={`?page=${pageNum}`}
                    isActive={pageNum === page}
                  >
                    {pageNum}
                  </PaginationLink>
                </PaginationItem>
              ))}
              
              <PaginationItem>
                <PaginationNext
                  to={`?page=${page + 1}`}
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