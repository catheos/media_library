import { Navigate, Link, useSearchParams } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Loading from "@/components/Loading";
import { characterService, ApiException } from "@/api";
import type { CharacterListResponse } from "@/api";
import { useScrollRestoration } from "@/hooks/useScrollRestoration";

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
  const [imageFail, setImageFail] = useState<boolean>(false);

  useEffect(() => {
    const fetchImage = async () => {
      try {
        const blob = await characterService.getSingleCover(character.id);
        const url = URL.createObjectURL(blob);
        setImageUrl(url);
      } catch (err) {
        setImageFail(true);
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
    <Link to={`/characters/${character.id}`}>
      <Card className="overflow-hidden hover:shadow-lg transition-shadow h-full">
        <div className="aspect-[2/3] bg-muted relative">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={character.name}
              className="w-full h-full object-cover"
            />
          ) : !imageFail ? (
            <div className="w-full h-full flex items-center justify-center">
              <Loading />
            </div>
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground">
              No Image
            </div>
          )}
        </div>
        <CardContent className="p-4 space-y-2">
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

  // Show loading while auth is initializing
  if (is_loading) {
    return <Loading fullScreen />;
  }

  // Not authenticated
  if (!is_authenticated) {
    return <Navigate to="/users/login" replace />;
  }

  // Loading state
  if (loading) {
    return <Loading fullScreen />;
  }

  // Error state
  if (error) {
    return (
      <div className="flex items-center justify-center py-8">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <p className="text-red-600 mb-4">{error}</p>
            <button 
              onClick={() => window.location.reload()} 
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md"
            >
              Try Again
            </button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // No characters data
  if (!data || data.characters.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="flex items-center justify-center py-8">
          <p>No characters found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="space-y-8">
        {/* Characters grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
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