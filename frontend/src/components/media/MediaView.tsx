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
import Loading from "@/components/Loading";
import { mediaService, mediaCharacterService, ApiException } from "@/api";
import type { Media, MediaCharacter } from "@/api";
import { User } from "lucide-react";

const MediaView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { current_user, is_authenticated, is_loading } = useAuth();
  const [media, setMedia] = useState<Media | null>(null);
  const [characters, setCharacters] = useState<MediaCharacter[]>([]);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imageFailed, setImageFailed] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);
  const [charactersLoading, setCharactersLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleting, setDeleting] = useState(false);

  const isOwner = current_user?.id === media?.created_by.id;

  useEffect(() => {
    const fetchMedia = async () => {
      setLoading(true);
      setError('');
      
      try {
        const data = await mediaService.getSingle(parseInt(id!));
        setMedia(data);
      } catch (err) {
        if (err instanceof ApiException) {
          setError(err.message);
        } else {
          setError('An error occurred while loading the media');
        }
      } finally {
        setLoading(false);
      }
    };

    if (is_authenticated && id) {
      fetchMedia();
    }
  }, [id, is_authenticated]);

  useEffect(() => {
    const fetchCharacters = async () => {
      setCharactersLoading(true);
      
      try {
        const data = await mediaCharacterService.getAll(parseInt(id!));
        setCharacters(data.characters);
      } catch (err) {
        console.error('Failed to load characters:', err);
      } finally {
        setCharactersLoading(false);
      }
    };

    if (is_authenticated && id) {
      fetchCharacters();
    }
  }, [id, is_authenticated]);

  useEffect(() => {
    const fetchImage = async () => {
      if (!id) return;

      try {
        const blob = await mediaService.getSingleCover(parseInt(id));
        const url = URL.createObjectURL(blob);
        setImageUrl(url);
      } catch (err) {
        setImageFailed(true);
      }
    };

    if (is_authenticated && id) {
      fetchImage();
    }

    return () => {
      if (imageUrl) {
        URL.revokeObjectURL(imageUrl);
      }
    };
  }, [id, is_authenticated]);

  const handleDelete = async () => {
    setDeleting(true);
    
    try {
      await mediaService.deleteMedia(parseInt(id!));
      navigate('/media');
    } catch (err) {
      if (err instanceof ApiException) {
        setError(err.message);
      } else {
        setError('An error occurred while deleting the media');
      }
      setDeleting(false);
    }
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

  if (!media) {
    return (
      <div className="flex items-center justify-center py-8">
        <p>Media not found</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row gap-6">
            <div className="w-full md:w-64 flex-shrink-0 aspect-[2/3]">
              {imageUrl ? (
                <img
                  src={`${imageUrl}`}
                  alt={media.title}
                  className="w-full rounded-lg object-cover aspect-[2/3]"
                />
              ) : !imageFailed ? (
                <div className="w-full h-full flex items-center justify-center">
                  <Loading />
                </div>
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  Failed
                </div>
              )}
            </div>

            <div className="flex-1 space-y-4">
              <div>
                <div className="flex items-start justify-between gap-4">
                  <CardTitle className="text-3xl">{media.title}</CardTitle>
                  {isOwner && (
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" asChild>
                        <Link to={`/media/${id}/edit`}>Edit</Link>
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
                              This will permanently delete "{media.title}". This action cannot be undone.
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
                {media.release_year && (
                  <p className="text-muted-foreground text-lg mt-1">
                    {media.release_year}
                  </p>
                )}
              </div>

              <div className="flex gap-2">
                <Badge variant="secondary">{media.type.name}</Badge>
                <Badge variant="outline">{media.status.name}</Badge>
              </div>

              {media.description && (
                <div>
                  <h3 className="text-lg font-semibold mb-2">Description</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {media.description}
                  </p>
                </div>
              )}

              <div className="pt-4 border-t">
                <p className="text-sm text-muted-foreground">
                  Added by{' '}
                  <Link 
                    to={`/users/${media.created_by.id}`}
                    className="text-primary hover:underline font-medium"
                  >
                    {media.created_by.username}
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Characters Section */}
      <Card className="mt-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Characters</CardTitle>
            {isOwner && (
              <Button size="sm" asChild>
                <Link to={`/media-character/upload?media=${id}`}>Add Character</Link>
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {charactersLoading ? (
            <div className="flex justify-center py-8">
              <Loading />
            </div>
          ) : characters.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              No characters added yet
              {isOwner && '. Click "Add Character" to get started.'}
            </p>
          ) : (
            <div className="relative">
              <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent">
                {characters.map((mc) => (
                  <Link
                    key={mc.id}
                    to={`/media-character/${mc.id}`}
                    className="flex-shrink-0 group"
                  >
                    <div className="w-32 space-y-2">
                      <div className="w-32 h-32 rounded-lg bg-muted flex items-center justify-center overflow-hidden transition-transform group-hover:scale-105">
                        <User className="w-12 h-12 text-muted-foreground" />
                      </div>
                      <div className="space-y-1">
                        <p className="font-medium text-sm line-clamp-2 group-hover:text-primary transition-colors">
                          {mc.character.name}
                        </p>
                        <Badge variant="secondary" className="text-xs">
                          {mc.role.name}
                        </Badge>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default MediaView;