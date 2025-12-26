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
import { mediaCharacterService, ApiException } from "@/api";
import type { MediaCharacter } from "@/api";
import { ExternalLink } from "lucide-react";

const MediaCharacterView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { current_user, is_authenticated, is_loading } = useAuth();
  const [mediaCharacter, setMediaCharacter] = useState<MediaCharacter | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');

  const isOwner = current_user?.id === mediaCharacter?.media.created_by.id;

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
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <CardTitle className="text-3xl">{mediaCharacter.character.name}</CardTitle>
              <p className="text-muted-foreground mt-1">
                in <Link to={`/media/${mediaCharacter.media.id}`} className="text-primary hover:underline">{mediaCharacter.media.title}</Link>
              </p>
              <div className="flex items-center gap-2 mt-2">
                <Badge variant="secondary" className="text-base">
                  {mediaCharacter.role.name}
                </Badge>
              </div>
            </div>
            {isOwner && (
              <div className="flex gap-2">
                <Button variant="outline" size="sm" asChild>
                  <Link to={`/media-character/${id}/edit`}>Edit</Link>
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
                        This will delete "{mediaCharacter.character.name}" from "{mediaCharacter.media.title}". 
                        The character itself will not be deleted.
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
        <CardContent className="space-y-6">
          {/* Media Info */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Media Information</h3>
            <div className="space-y-2">
              <div className="flex gap-2">
                <span className="font-medium">Title:</span>
                <Link to={`/media/${mediaCharacter.media.id}`} className="text-primary hover:underline">
                  {mediaCharacter.media.title}
                </Link>
              </div>
              <div className="flex gap-2">
                <span className="font-medium">Type:</span>
                <span className="text-muted-foreground">{mediaCharacter.media.type.name}</span>
              </div>
              <div className="flex gap-2">
                <span className="font-medium">Status:</span>
                <span className="text-muted-foreground">{mediaCharacter.media.status.name}</span>
              </div>
              {mediaCharacter.media.release_year && (
                <div className="flex gap-2">
                  <span className="font-medium">Release Year:</span>
                  <span className="text-muted-foreground">{mediaCharacter.media.release_year}</span>
                </div>
              )}
            </div>
          </div>

          {/* Creator Info */}
          <div className="pt-4 border-t">
            <p className="text-sm text-muted-foreground">
              Media created by{' '}
              <Link 
                to={`/users/${mediaCharacter.media.created_by.id}`}
                className="text-primary hover:underline font-medium"
              >
                {mediaCharacter.media.created_by.username}
              </Link>
            </p>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <Button asChild className="flex-1">
              <Link to={`/characters/${mediaCharacter.character.id}`}>
                <ExternalLink className="w-4 h-4 mr-2" />
                View Full Character Profile
              </Link>
            </Button>
            <Button variant="outline" asChild className="flex-1">
              <Link to={`/media/${mediaCharacter.media.id}`}>
                Back to Media
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default MediaCharacterView;