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
import Loading from "@/components/common/Loading";
import ImageContainer from "@/components/common/ImageContainer";
import ErrorCard from "@/components/common/ErrorCard";
import { mediaService, mediaCharacterService, characterService, mediaUserService, ApiException } from "@/api";
import type { Media, MediaCharacter } from "@/api";
import { User, Film, BookmarkPlus, BookmarkCheck, Loader2 } from "lucide-react";
import BackButton from "../common/BackButton";
import { useTabTitle } from "@/hooks/useTabTitle";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

interface CharacterWithImage extends MediaCharacter {
  imageUrl?: string;
  imageFailed?: boolean;
}

const MediaView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { current_user, is_authenticated, is_loading } = useAuth();
  const [media, setMedia] = useState<Media | null>(null);
  const [characters, setCharacters] = useState<CharacterWithImage[]>([]);
  const [characterFilter, setCharacterFilter] = useState('');
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imageFailed, setImageFailed] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);
  const [charactersLoading, setCharactersLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleting, setDeleting] = useState(false);
  
  // Library state
  const [checkingLibrary, setCheckingLibrary] = useState(true);
  const [libraryActionLoading, setLibraryActionLoading] = useState(false);
  const [isInLibrary, setIsInLibrary] = useState<{id: number} | false>(false);

  const isOwner = current_user?.id === media?.created_by.id;

  // Set title
  useTabTitle((media?.title)
    ? `${media?.title} | Media`
    : 'Loading...'
  );

  const filteredCharacters = characters.filter((mc: MediaCharacter) => 
    mc.character.name.toLowerCase().includes(characterFilter.toLowerCase()) ||
    mc.role.name.toLowerCase().includes(characterFilter.toLowerCase())
  );

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

  // Check if media is in user's library
  useEffect(() => {
    const checkLibrary = async () => {
      if (!id) return;
      
      setCheckingLibrary(true);
      try {
        const response = await mediaService.checkInLibrary(parseInt(id));
        setIsInLibrary(response);
      } catch (err) {
        console.error('Failed to check library:', err);
        setIsInLibrary(false);
      } finally {
        setCheckingLibrary(false);
      }
    };

    if (is_authenticated && id) {
      checkLibrary();
    }
  }, [id, is_authenticated]);

  useEffect(() => {
    const fetchCharacters = async () => {
      setCharactersLoading(true);
      
      try {
        const data = await mediaCharacterService.getAll(parseInt(id!));
        const charactersWithImages = await Promise.all(
          data.characters.map(async (char) => {
            try {
              const blob = await characterService.getSingleCover(char.character.id, true);
              const url = URL.createObjectURL(blob);
              return { ...char, imageUrl: url, imageFailed: false };
            } catch (err) {
              return { ...char, imageFailed: true };
            }
          })
        );
        setCharacters(charactersWithImages);
      } catch (err) {
        console.error('Failed to load characters:', err);
      } finally {
        setCharactersLoading(false);
      }
    };

    if (is_authenticated && id) {
      fetchCharacters();
    }

    return () => {
      setCharacters((prevCharacters) => {
        prevCharacters.forEach((char) => {
          if (char.imageUrl) {
            URL.revokeObjectURL(char.imageUrl);
          }
        });
        return prevCharacters;
      });
    };
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

  const toggleAddToLibrary = async () => {
    if(!id) return;

    setLibraryActionLoading(true);
    try {
      if (!isInLibrary) {
        const response = await mediaUserService.create({
          media_id: parseInt(id)
        });
        setIsInLibrary({
          id: response.user_media.id
        });
      } else {
        await mediaUserService.delete(isInLibrary.id);
        setIsInLibrary(false);
      }
    } catch (err) {
      if (err instanceof ApiException) {
        setError(err.message);
      } else {
        if (!isInLibrary) {
          setError('Failed to add to library');
        } else {
          setError('Failed to remove from library');
        }
      }
    } finally {
      setLibraryActionLoading(false);
    }
  }

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
    return <ErrorCard message={error} onRetry={() => window.location.reload()} />;
  }

  if (!media) {
    return (
      <div className="flex items-center justify-center">
        <p>Media not found</p>
      </div>
    );
  }

  return (
    <div className="mx-auto p-4 max-w-4xl">
      <div className="space-y-4">
        <BackButton
          to="/media"
          label="Back to Media"
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Media Image */}
          <Card className="md:col-span-1 md:self-start">
            <CardContent className="p-2">
              <ImageContainer
                imageUrl={imageUrl}
                imageFailed={imageFailed}
                alt={media.title}
                FallbackIcon={Film}
                aspectRatio="portrait"
              />
            </CardContent>
          </Card>

          {/* Media Info */}
          <div className="md:col-span-2 space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between gap-4">
                  <CardTitle className="text-3xl">{media.title}</CardTitle>
                  <div className="flex gap-2">
                    {/* Library Button */}
                    {checkingLibrary ? (
                      <Button size="sm" disabled>
                        <Loader2 className="w-4 h-4 animate-spin" />
                      </Button>
                    ) : isInLibrary ? (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button 
                            size="sm" 
                            variant="secondary"
                            disabled={libraryActionLoading}
                          >
                            {libraryActionLoading ? (
                              <Loader2 className="animate-spin" />
                            ) : (
                              <BookmarkCheck />
                            )}
                            In Library
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Remove from Library?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will remove "{media.title}" from your library. Your progress and ratings will be deleted.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={toggleAddToLibrary}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Remove
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    ) : (
                      <Button 
                        size="sm"
                        onClick={toggleAddToLibrary}
                        disabled={libraryActionLoading}
                      >
                        {libraryActionLoading ? (
                          <Loader2 className="animate-spin" />
                        ) : (
                          <BookmarkPlus />
                        )}
                        Add to Library
                      </Button>
                    )}

                    {/* Owner Actions */}
                    {isOwner && (
                      <>
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
                      </>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                {media.release_year && (
                  <div>
                    <p className="text-muted-foreground text-lg">
                      {media.release_year}
                    </p>
                  </div>
                )}

                <div className="flex gap-2">
                  <Badge variant="secondary">{media.type.name}</Badge>
                  <Badge variant="outline">{media.status.name}</Badge>
                </div>

                {media.description && (
                  <div>
                    <h3 className="text-lg font-semibold">Description</h3>
                    <p className="text-muted-foreground leading-relaxed">
                      {media.description}
                    </p>
                  </div>
                )}

                <div className="pt-2 border-t">
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
              </CardContent>
            </Card>

            {/* Characters Section */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Characters</CardTitle>
                  {isOwner && (
                    <Button size="sm" asChild>
                      <Link to={`/media-character/upload?media=${id}`}>Add Character</Link>
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {charactersLoading ? (
                  <div className="flex justify-center py-2">
                    <Loading />
                  </div>
                ) : characters.length === 0 ? (
                  <p className="text-muted-foreground text-center py-2">
                    No characters added yet.
                    {isOwner && (
                      <>
                        <br/>
                        Click "Add Character" to get started.
                      </>
                    )}
                  </p>
                ) : (
                  <div className="space-y-2">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        value={characterFilter}
                        onChange={(e) => setCharacterFilter(e.target.value)}
                        placeholder="Filter characters..."
                        className="pl-9"
                      />
                    </div>
                    <div className="flex gap-2 overflow-x-auto overflow-y-hidden scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent">
                      {filteredCharacters.map((mc) => (
                        <Link
                          key={mc.id}
                          to={`/media-character/${mc.id}`}
                          className="flex-shrink-0 group block"
                        >
                          <div className="w-32 rounded-lg bg-muted/50 p-2 transition-transform group-hover:scale-105">
                            <div className="space-y-2">
                              <ImageContainer
                                imageUrl={mc.imageUrl ?? null}
                                imageFailed={mc.imageFailed ?? false}
                                alt={mc.character.name}
                                FallbackIcon={User}
                                aspectRatio="character"
                                className="rounded-md"
                                iconSize="md"
                              />
                              <div>
                                <p className="font-medium text-sm truncate" title={mc.character.name}>
                                  {mc.character.name}
                                </p>
                                <Badge variant="secondary" className="text-xs">
                                  {mc.role.name}
                                </Badge>
                              </div>
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
        </div>
      </div>
    </div>
  );
};

export default MediaView;