import { Navigate, Link, useSearchParams } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import Loading from "@/components/common/Loading";
import ErrorCard from "@/components/common/ErrorCard";
import ImageContainer from "@/components/common/ImageContainer";
import { characterService, ApiException } from "@/api";
import type { CharacterListResponse } from "@/api";
import { useScrollRestoration } from "@/hooks/useScrollRestoration";
import { User } from "lucide-react";

import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

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
  const [searchParams, setSearchParams] = useSearchParams();
  const page = parseInt(searchParams.get('page') || '1');
  
  const [data, setData] = useState<CharacterListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // scroll restoration
  const contentReady = !loading && !error && data !== null;
  useScrollRestoration(contentReady);

  useEffect(() => {
    const fetchCharacters = async () => {
      setLoading(true);
      setError('');
      
      try {
        const response = await characterService.getAll(page);
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

  if (!data || data.characters.length === 0) {
    return (
      <div className="container mx-auto p-4 max-w-4xl">
        <div className="flex items-center justify-center py-8">
          <p>No characters found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <div className="space-y-4">
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

export default CharacterList;