import { useParams, Navigate, Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Loading from "@/components/Loading";
import { mediaService, ApiException } from "@/api";
import type { Media } from "@/api";

const MediaView = () => {
  const { id } = useParams();
  const { current_user, is_authenticated, is_loading } = useAuth();
  const [media, setMedia] = useState<Media | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imageFailed, setImageFailed] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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

    // Cleanup blob URL
    return () => {
      if (imageUrl) {
        URL.revokeObjectURL(imageUrl);
      }
    };
  }, [id, is_authenticated]);

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

  // No media data
  if (!media) {
    return (
      <div className="flex items-center justify-center py-8">
        <p>Media not found</p>
      </div>
    );
  }

  // Render media
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row gap-6">
            {/* Cover Image */}
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

            {/* Media Info */}
            <div className="flex-1 space-y-4">
              <div>
                <div className="flex items-start justify-between gap-4">
                  <CardTitle className="text-3xl">{media.title}</CardTitle>
                  {isOwner && (
                    <Button variant="outline" size="sm" asChild>
                      <Link to={`/media/${id}/edit`}>Edit</Link>
                    </Button>
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
    </div>
  );
};

export default MediaView;