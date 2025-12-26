import { useParams, Navigate, Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { ExternalLink } from "lucide-react";
import Loading from "@/components/Loading";
import { characterService, ApiException } from "@/api";
import type { Character } from "@/api";

const CharacterView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { current_user, is_authenticated, is_loading } = useAuth();
  const [character, setCharacter] = useState<Character | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imageFailed, setImageFailed] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleting, setDeleting] = useState(false);

  const isOwner = current_user?.id === character?.created_by?.id;

  useEffect(() => {
    const fetchCharacter = async () => {
      setLoading(true);
      setError('');
      
      try {
        const data = await characterService.getSingle(parseInt(id!));
        setCharacter(data);
      } catch (err) {
        if (err instanceof ApiException) {
          setError(err.message);
        } else {
          setError('An error occurred while loading the character');
        }
      } finally {
        setLoading(false);
      }
    };

    if (is_authenticated && id) {
      fetchCharacter();
    }
  }, [id, is_authenticated]);

  useEffect(() => {
    const fetchImage = async () => {
      if (!id) return;

      try {
        const blob = await characterService.getSingleCover(parseInt(id));
        const url = URL.createObjectURL(blob);
        setImageUrl(url);
      } catch (err) {
        setImageFailed(true);
      }
    };

    if (is_authenticated && id) {
      fetchImage();
    }

    // Cleanup blob URL
    return () => {
      if (imageUrl) {
        URL.revokeObjectURL(imageUrl);
      }
    };
  }, [id, is_authenticated]);

  const handleDelete = async () => {
    setDeleting(true);
    
    try {
      await characterService.delete(parseInt(id!));
      navigate('/characters');
    } catch (err) {
      if (err instanceof ApiException) {
        setError(err.message);
      } else {
        setError('An error occurred while deleting the character');
      }
      setDeleting(false);
    }
  };

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
          <CardHeader>
            <CardTitle className="text-red-600">Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p>{error}</p>
            <Button onClick={() => window.location.reload()} className="mt-4">
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // No character data
  if (!character) {
    return (
      <div className="flex items-center justify-center py-8">
        <p>Character not found</p>
      </div>
    );
  }

  // Render character
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row gap-6">
            {/* Character Image */}
            {(imageUrl || !imageFailed) && (
              <div className="w-full md:w-64 flex-shrink-0 aspect-[2/3]">
                {imageUrl ? (
                  <img
                    src={imageUrl}
                    alt={character.name}
                    className="w-full rounded-lg object-cover aspect-[2/3]"
                  />
                ) : !imageFailed ? (
                  <div className="w-full h-full flex items-center justify-center bg-muted rounded-lg">
                    <Loading />
                  </div>
                ) : null}
              </div>
            )}

            {/* Character Info */}
            <div className="flex-1 space-y-4">
              <div>
                <div className="flex items-start justify-between gap-4">
                  <CardTitle className="text-3xl">{character.name}</CardTitle>
                  {isOwner && (
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" asChild>
                        <Link to={`/characters/${id}/edit`}>Edit</Link>
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button 
                            variant="destructive" 
                            size="sm"
                            disabled={deleting}
                          >
                            {deleting ? 'Deleting...' : 'Delete'}
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will permanently delete "{character.name}". This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={handleDelete}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  )}
                </div>
              </div>

              {character.wiki_url && (
                <div>
                  <Button variant="outline" size="sm" asChild>
                    <a 
                      href={character.wiki_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2"
                    >
                      View Wiki
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </Button>
                </div>
              )}

              {character.details && Object.keys(character.details).length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-2">Details</h3>
                  <div className="space-y-1">
                    {Object.entries(character.details).map(([key, value]) => (
                      <div key={key} className="flex gap-2">
                        <span className="font-medium capitalize">{key}:</span>
                        <span className="text-muted-foreground">{String(value)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {character.created_by && (
                <div className="pt-4 border-t">
                  <p className="text-sm text-muted-foreground">
                    Added by{' '}
                    <Link 
                      to={`/users/${character.created_by.id}`}
                      className="text-primary hover:underline font-medium"
                    >
                      {character.created_by.username}
                    </Link>
                  </p>
                </div>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>
    </div>
  );
};

export default CharacterView;