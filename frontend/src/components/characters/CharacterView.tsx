import { useParams, Navigate, Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
import { ExternalLink, User } from "lucide-react";
import Loading from "@/components/common/Loading";
import ImageContainer from "@/components/common/ImageContainer";
import ErrorCard from "@/components/common/ErrorCard";
import { characterService, ApiException } from "@/api";
import type { Character } from "@/api";
import MDEditor from '@uiw/react-md-editor';
import BackButton from "../common/BackButton";

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

  if (!character) {
    return (
      <div className="flex items-center justify-center">
        <p>Character not found</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <div className="space-y-4">
        <BackButton
          to="/characters"
          label="Back to Characters"
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Character Image */}
          <Card className="md:col-span-1 md:self-start">
            <CardContent className="p-2">
              <ImageContainer
                imageUrl={imageUrl}
                imageFailed={imageFailed}
                alt={character.name}
                FallbackIcon={User}
                aspectRatio="portrait"
              />
            </CardContent>
          </Card>

          {/* Character Info */}
          <div className="md:col-span-2 space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
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
              </CardHeader>
              <CardContent className="space-y-2">
                {character.wiki_url && (
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
                )}

                {character.created_by && (
                  <div className="pt-2 border-t">
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
              </CardContent>
            </Card>

            {/* Details Section - Markdown Display */}
            {character.details && character.details.trim() && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Details</CardTitle>
                </CardHeader>
                <CardContent>
                  <div data-color-mode="light">
                    <MDEditor.Markdown 
                      source={character.details} 
                      style={{ 
                        padding: '1rem',
                        backgroundColor: 'transparent'
                      }}
                    />
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CharacterView;