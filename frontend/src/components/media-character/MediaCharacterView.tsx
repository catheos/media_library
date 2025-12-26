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
import { mediaCharacterService, characterService, mediaService, ApiException } from "@/api";
import type { MediaCharacter } from "@/api";
import { User, Film, Calendar, Info, ArrowLeft } from "lucide-react";

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
      <div className="flex items-center justify-center py-8">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-red-600">Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p>{error}</p>
            <Button onClick={() => navigate('/media')} className="mt-4">
              Back to Media List
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!mediaCharacter) {
    return (
      <div className="flex items-center justify-center py-8">
        <p>Character relationship not found</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <Button 
        variant="ghost" 
        size="sm" 
        onClick={() => navigate(`/media/${mediaCharacter.media.id}`)}
        className="mb-4"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to {mediaCharacter.media.title}
      </Button>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Character Card */}
        <Card className="md:col-span-1 md:self-start">
          <CardHeader>
            <CardTitle className="text-md flex items-center gap-2">
              <User className="w-5 h-5" />
              Character
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Link 
              to={`/characters/${mediaCharacter.character.id}`}
              className="block group"
            >
              <div className="aspect-[3/4] rounded-md bg-muted mb-4 overflow-hidden">
                {characterImageUrl ? (
                  <img
                    src={characterImageUrl}
                    alt={mediaCharacter.character.name}
                    className="w-full h-full object-cover transition-transform group-hover:scale-105"
                  />
                ) : !characterImageFailed ? (
                  <div className="w-full h-full flex items-center justify-center">
                    <Loading />
                  </div>
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <User className="w-16 h-16 text-muted-foreground" />
                  </div>
                )}
              </div>
              <h2 className="text-2xl font-bold mb-2 group-hover:text-primary transition-colors">
                {mediaCharacter.character.name}
              </h2>
            </Link>
            <Badge variant="secondary" className="text-sm">
              {mediaCharacter.role.name}
            </Badge>
            
            <Button asChild className="w-full mt-6">
              <Link to={`/characters/${mediaCharacter.character.id}`}>
                View Full Character Profile
              </Link>
            </Button>
          </CardContent>
        </Card>

        {/* Main Content */}
        <div className="md:col-span-2 space-y-6">
          {/* Media Info Card */}
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between gap-4">
                <CardTitle className="text-md flex items-center gap-2">
                  <Film className="w-5 h-5" />
                  Featured In
                </CardTitle>
                {isOwner && (
                  <div className="flex gap-2">
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
                            This will remove "{mediaCharacter.character.name}" from "{mediaCharacter.media.title}". 
                            The character itself will not be deleted, only this relationship.
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
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <Link 
                to={`/media/${mediaCharacter.media.id}`}
                className="block group"
              >
                <div className="flex gap-4">
                  <div className="w-24 flex-shrink-0 aspect-[2/3] rounded-md bg-muted overflow-hidden">
                    {mediaImageUrl ? (
                      <img
                        src={mediaImageUrl}
                        alt={mediaCharacter.media.title}
                        className="w-full h-full object-cover transition-transform group-hover:scale-105"
                      />
                    ) : !mediaImageFailed ? (
                      <div className="w-full h-full flex items-center justify-center">
                        <Loading />
                      </div>
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Film className="w-8 h-8 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  
                  <div className="flex-1 space-y-3">
                    <div>
                      <h3 className="text-xl font-bold group-hover:text-primary transition-colors">
                        {mediaCharacter.media.title}
                      </h3>
                      <div className="flex gap-2 mt-2">
                        <Badge variant="secondary">{mediaCharacter.media.type.name}</Badge>
                        <Badge variant="outline">{mediaCharacter.media.status.name}</Badge>
                      </div>
                    </div>

                    {mediaCharacter.media.release_year && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="w-4 h-4" />
                        <span>{mediaCharacter.media.release_year}</span>
                      </div>
                    )}

                    {mediaCharacter.media.description && (
                      <p className="text-sm text-muted-foreground line-clamp-3">
                        {mediaCharacter.media.description}
                      </p>
                    )}
                  </div>
                </div>
              </Link>
            </CardContent>
          </Card>

          {/* Metadata Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-md flex items-center gap-2">
                <Info className="w-5 h-5" />
                Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Character Role</p>
                  <Badge variant="secondary" className="text-sm">
                    {mediaCharacter.role.name}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Media Type</p>
                  <Badge variant="secondary" className="text-sm">
                    {mediaCharacter.media.type.name}
                  </Badge>
                </div>
              </div>

              <div className="pt-3 border-t space-y-2">
                <div className="text-sm">
                  <span className="text-muted-foreground">Relationship added by </span>
                  <Link 
                    to={`/users/${mediaCharacter.created_by.id}`}
                    className="text-primary hover:underline font-medium"
                  >
                    {mediaCharacter.created_by.username}
                  </Link>
                </div>
                <div className="text-sm">
                  <span className="text-muted-foreground">Media created by </span>
                  <Link 
                    to={`/users/${mediaCharacter.media.created_by.id}`}
                    className="text-primary hover:underline font-medium"
                  >
                    {mediaCharacter.media.created_by.username}
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default MediaCharacterView;