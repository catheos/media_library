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
import { mediaCharacterService, characterService, mediaService, ApiException } from "@/api";
import type { MediaCharacter } from "@/api";
import { User, Film } from "lucide-react";
import BackButton from "../common/BackButton";
import { useTabTitle } from "@/hooks/useTabTitle";

const MediaCharacterView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { current_user, is_authenticated, is_loading } = useAuth();
  const [mediaCharacter, setMediaCharacter] = useState<MediaCharacter | null>(null);
  const [characterImageUrl, setCharacterImageUrl] = useState<string | null>(null);
  const [mediaImageUrl, setMediaImageUrl] = useState<string | null>(null);
  const [characterImageFailed, setCharacterImageFailed] = useState(false);
  const [mediaImageFailed, setMediaImageFailed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');

  const isOwner = current_user?.id === mediaCharacter?.created_by.id;

  // Set title
  useTabTitle((mediaCharacter?.media.title)
    ? `${mediaCharacter?.media.title} | Character | Library`
    : 'Loading...'
  );

  useEffect(() => {
    const fetchMediaCharacter = async () => {
      setLoading(true);
      setError('');
      
      try {
        const data = await mediaCharacterService.getSingle(parseInt(id!));
        setMediaCharacter(data);
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
      fetchMediaCharacter();
    }
  }, [id, is_authenticated]);

  useEffect(() => {
    const fetchImages = async () => {
      if (!mediaCharacter) return;

      try {
        const charBlob = await characterService.getSingleCover(mediaCharacter.character.id);
        const charUrl = URL.createObjectURL(charBlob);
        setCharacterImageUrl(charUrl);
      } catch (err) {
        setCharacterImageFailed(true);
      }

      try {
        const mediaBlob = await mediaService.getSingleCover(mediaCharacter.media.id);
        const mediaUrl = URL.createObjectURL(mediaBlob);
        setMediaImageUrl(mediaUrl);
      } catch (err) {
        setMediaImageFailed(true);
      }
    };

    if (is_authenticated && mediaCharacter) {
      fetchImages();
    }

    return () => {
      if (characterImageUrl) URL.revokeObjectURL(characterImageUrl);
      if (mediaImageUrl) URL.revokeObjectURL(mediaImageUrl);
    };
  }, [mediaCharacter, is_authenticated]);

  const handleDelete = async () => {
    setDeleting(true);
    
    try {
      await mediaCharacterService.delete(parseInt(id!));
      navigate(`/media/${mediaCharacter!.media.id}`);
    } catch (err) {
      if (err instanceof ApiException) {
        setError(err.message);
      } else {
        setError('An error occurred while deleting the media-character relationship');
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
      <ErrorCard 
        message={error} 
        onRetry={() => navigate('/media')}
        retryText="Back to Media List"
      />
    );
  }

  if (!mediaCharacter) {
    return (
      <div className="flex items-center justify-center">
        <p>Character relationship not found</p>
      </div>
    );
  }

  return (
    <div className="mx-auto p-4 max-w-4xl">
      <div className="space-y-4">
        <BackButton
          to={`/media/${mediaCharacter.media.id}`}
          label="Back to Media View"
        />

        {/* Relationship Information Card */}
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between gap-2">
              <CardTitle className="text-lg">Relationship Information</CardTitle>

              {/* Remove */}
              {isOwner && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button 
                      variant="destructive" 
                      size="sm"
                      disabled={deleting}
                    >
                      {deleting ? 'Removing...' : 'Remove'}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Remove Character from Media?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will remove the relationship between "{mediaCharacter.character.name}" and "{mediaCharacter.media.title}". 
                        Neither the character nor the media will be deleted, only this relationship.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleDelete}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        Remove
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </div>
          </CardHeader>
          
          <CardContent className="space-y-2">
            <div className="w-full">
              <p className="text-sm text-muted-foreground">Role</p>
              <Badge variant="secondary" className="text-base w-full">
                <span className="truncate">{mediaCharacter.role.name}</span>
              </Badge>
            </div>

            <div className="pt-2 border-t space-y-2">
              <div className="text-sm">
                <span className="text-muted-foreground">Relationship added by </span>
                <Link 
                  to={`/users/${mediaCharacter.created_by.id}`}
                  className="text-primary hover:underline font-medium"
                >
                  {mediaCharacter.created_by.username}
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Side by Side Layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Character Card */}
          <Card title={mediaCharacter.character.name}>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <User className="w-5 h-5" />
                Character
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Link 
                to={`/characters/${mediaCharacter.character.id}`}
                className="block group"
              >
                <ImageContainer
                  imageUrl={characterImageUrl}
                  imageFailed={characterImageFailed}
                  alt={mediaCharacter.character.name}
                  FallbackIcon={User}
                  aspectRatio="portrait"
                  className="break-words break-all mb-2 group-hover:scale-101 transition-transform"
                  iconSize="md"
                />
              </Link>
              <h2 className="text-2xl font-bold truncate">
                {mediaCharacter.character.name}
              </h2>
              <Button asChild className="w-full mt-2">
                <Link to={`/characters/${mediaCharacter.character.id}`}>
                  View Character
                </Link>
              </Button>
            </CardContent>
          </Card>

          {/* Media Card */}
          <Card title={mediaCharacter.media.title}>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Film className="w-5 h-5" />
                Media
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Link 
                to={`/media/${mediaCharacter.media.id}`}
                className="block group"
              >
                <ImageContainer
                  imageUrl={mediaImageUrl}
                  imageFailed={mediaImageFailed}
                  alt={mediaCharacter.media.title}
                  FallbackIcon={Film}
                  aspectRatio="portrait"
                  className="break-words break-all mb-2 group-hover:scale-101 transition-transform"
                  iconSize="md"
                />
              </Link>
              <h2 className="text-2xl font-bold truncate">
                {mediaCharacter.media.title}
              </h2>
              <Button asChild className="w-full mt-2">
                <Link to={`/media/${mediaCharacter.media.id}`}>
                  View Media
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default MediaCharacterView;