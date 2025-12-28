import { useParams, Navigate, useNavigate, Link } from "react-router-dom";
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
import ErrorCard from "@/components/common/ErrorCard";
import ImageContainer from "@/components/common/ImageContainer";
import BackButton from "@/components/common/BackButton";
import { mediaService, mediaUserService, ApiException } from "@/api";
import type { UserMedia } from "@/api";
import { Film, Star, ExternalLink, Calendar, TrendingUp, Award } from "lucide-react";

const MediaUserView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { is_authenticated, is_loading } = useAuth();
  
  const [userMedia, setUserMedia] = useState<UserMedia | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imageFailed, setImageFailed] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');

  // Fetch user media entry
  useEffect(() => {
    const fetchUserMedia = async () => {
      setLoading(true);
      setError('');
      
      try {
        const data = await mediaUserService.getSingle(parseInt(id!));
        setUserMedia(data);
      } catch (err) {
        if (err instanceof ApiException) {
          setError(err.message);
        } else {
          setError('An error occurred while loading your library entry');
        }
      } finally {
        setLoading(false);
      }
    };

    if (is_authenticated && id) {
      fetchUserMedia();
    }
  }, [id, is_authenticated]);

  // Fetch media cover image
  useEffect(() => {
    const fetchImage = async () => {
      if (!userMedia?.media.id) return;

      try {
        const blob = await mediaService.getSingleCover(userMedia.media.id);
        const url = URL.createObjectURL(blob);
        setImageUrl(url);
      } catch (err) {
        setImageFailed(true);
      }
    };

    if (userMedia) {
      fetchImage();
    }

    return () => {
      if (imageUrl) {
        URL.revokeObjectURL(imageUrl);
      }
    };
  }, [userMedia]);

  const handleDelete = async () => {
    setDeleting(true);
    
    try {
      await mediaUserService.delete(parseInt(id!));
      navigate('/media-user');
    } catch (err) {
      if (err instanceof ApiException) {
        setError(err.message);
      } else {
        setError('An error occurred while removing from library');
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

  if (error && !userMedia) {
    return <ErrorCard message={error} onRetry={() => window.location.reload()} />;
  }

  if (!userMedia) {
    return <ErrorCard message="Library entry not found" />;
  }

  return (
    <div className="mx-auto p-4 max-w-4xl">
      <div className="space-y-4">
        <BackButton to="/media-user" label="Back to Library" />

        {/* Your Progress Card */}
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between gap-4">
              <CardTitle className="text-2xl">Your Progress</CardTitle>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" asChild>
                  <Link to={`/media-user/${id}/edit`}>Edit</Link>
                </Button>
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
                      <AlertDialogTitle>Remove from Library?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will remove "{userMedia.media.title}" from your library. 
                        Your progress, score, and review will be deleted.
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
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Status, Progress, Score Grid */}
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-6 bg-muted/50 rounded-lg border">
                <div className="flex justify-center mb-2">
                  <TrendingUp className="w-5 h-5 text-muted-foreground" />
                </div>
                <p className="text-xs font-medium text-muted-foreground mb-2">STATUS</p>
                {userMedia.status ? (
                  <Badge variant="default" className="text-sm font-medium">
                    {userMedia.status.name}
                  </Badge>
                ) : (
                  <p className="text-sm text-muted-foreground">Not Set</p>
                )}
              </div>

              <div className="text-center p-6 bg-muted/50 rounded-lg border">
                <div className="flex justify-center mb-2">
                  <Calendar className="w-5 h-5 text-muted-foreground" />
                </div>
                <p className="text-xs font-medium text-muted-foreground mb-2">PROGRESS</p>
                {userMedia.current_progress ? (
                  <p className="font-semibold text-sm">{userMedia.current_progress}</p>
                ) : (
                  <p className="text-sm text-muted-foreground">Not Set</p>
                )}
              </div>

              <div className="text-center p-6 bg-muted/50 rounded-lg border">
                <div className="flex justify-center mb-2">
                  <Award className="w-5 h-5 text-muted-foreground" />
                </div>
                <p className="text-xs font-medium text-muted-foreground mb-2">YOUR SCORE</p>
                {userMedia.score ? (
                  <div className="flex items-center justify-center gap-1">
                    <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                    <span className="font-bold text-lg">{userMedia.score}</span>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Not Rated</p>
                )}
              </div>
            </div>

            {/* Review */}
            {userMedia.review && (
              <div className="pt-4 border-t space-y-2">
                <h4 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">Your Review</h4>
                <div className="bg-muted/30 rounded-lg p-4 border">
                  <p className="text-foreground leading-relaxed whitespace-pre-wrap">
                    {userMedia.review}
                  </p>
                </div>
              </div>
            )}

            {/* Activity Timeline */}
            <div className="pt-4 border-t space-y-2">
              <h4 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">Activity</h4>
              <div className="space-y-2">
                <div className="flex items-center gap-3 text-sm">
                  <div className="w-2 h-2 rounded-full bg-primary" />
                  <span className="text-muted-foreground">Added to library</span>
                  <span className="text-foreground font-medium ml-auto">
                    {new Date(userMedia.created_at).toLocaleDateString('en-US', { 
                      month: 'short', 
                      day: 'numeric', 
                      year: 'numeric' 
                    })}
                  </span>
                </div>
                
                {userMedia.progress_updated && (
                  <div className="flex items-center gap-3 text-sm">
                    <div className="w-2 h-2 rounded-full bg-blue-500" />
                    <span className="text-muted-foreground">Progress updated</span>
                    <span className="text-foreground font-medium ml-auto">
                      {new Date(userMedia.progress_updated).toLocaleDateString('en-US', { 
                        month: 'short', 
                        day: 'numeric', 
                        year: 'numeric' 
                      })}
                    </span>
                  </div>
                )}
                
                {userMedia.rating_created && (
                  <div className="flex items-center gap-3 text-sm">
                    <div className="w-2 h-2 rounded-full bg-yellow-500" />
                    <span className="text-muted-foreground">Rated</span>
                    <span className="text-foreground font-medium ml-auto">
                      {new Date(userMedia.rating_created).toLocaleDateString('en-US', { 
                        month: 'short', 
                        day: 'numeric', 
                        year: 'numeric' 
                      })}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Media Info Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Media Cover */}
          <Card className="md:col-span-1 md:self-start">
            <CardContent className="p-2">
              <ImageContainer
                imageUrl={imageUrl}
                imageFailed={imageFailed}
                alt={userMedia.media.title}
                FallbackIcon={Film}
                aspectRatio="portrait"
              />
            </CardContent>
          </Card>

          {/* Media Details */}
          <div className="md:col-span-2 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-3xl">{userMedia.media.title}</CardTitle>
                <div className="flex gap-2 items-center flex-wrap mt-2">
                  {userMedia.media.release_year && (
                    <span className="text-muted-foreground font-medium">
                      {userMedia.media.release_year}
                    </span>
                  )}
                  {userMedia.media.release_year && <span className="text-muted-foreground">•</span>}
                  <Badge variant="secondary">{userMedia.media.type.name}</Badge>
                  <Badge variant="outline">{userMedia.media.status.name}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {userMedia.media.description && (
                  <div>
                    <h3 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground mb-2">Description</h3>
                    <p className="text-muted-foreground leading-relaxed">
                      {userMedia.media.description}
                    </p>
                  </div>
                )}

                <div className="pt-4 border-t">
                  <Button variant="link" className="px-0 h-auto" asChild>
                    <Link to={`/media/${userMedia.media.id}`} className="flex items-center gap-2">
                      <ExternalLink className="w-4 h-4" />
                      View Full Media Page
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MediaUserView;