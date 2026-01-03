import { useParams, Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dropzone, DropzoneContent, DropzoneEmptyState } from '@/components/ui/shadcn-io/dropzone';
import { Loader2 } from "lucide-react";
import Loading from "@/components/common/Loading";
import ErrorCard from "@/components/common/ErrorCard";
import FormAlerts from "@/components/common/FormAlerts";
import { mediaService, ApiException } from "@/api";
import type { Media, MediaType, MediaStatus } from "@/api";
import BackButton from "../common/BackButton";
import { useTabTitle } from "@/hooks/useTabTitle";

const MediaEdit = () => {
  const { id } = useParams();
  const { current_user, is_authenticated, is_loading } = useAuth();
  const navigate = useNavigate();
  const [media, setMedia] = useState<Media | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    type_id: '',
    release_year: '',
    status_id: '',
    description: '',
  });
  const [image, setImage] = useState<File[] | undefined>();
  const [originalImage, setOriginalImage] = useState<File[] | undefined>();
  const [currentImageUrl, setCurrentImageUrl] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [mediaTypes, setMediaTypes] = useState<MediaType[]>([]);
  const [statusTypes, setStatusTypes] = useState<MediaStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const isOwner = current_user?.id === media?.created_by.id;

  // Set title
  useTabTitle((media?.title)
    ? `Edit | ${media?.title} | Media`
    : 'Loading...'
  );

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError('');
      
      try {
        const [mediaData, types, statuses] = await Promise.all([
          mediaService.getSingle(parseInt(id!)),
          mediaService.getTypes(),
          mediaService.getStatuses(),
        ]);
        
        setMedia(mediaData);
        setMediaTypes(types);
        setStatusTypes(statuses);
        setFormData({
          title: mediaData.title,
          type_id: mediaData.type.id.toString(),
          release_year: mediaData.release_year?.toString() || '',
          status_id: mediaData.status.id.toString(),
          description: mediaData.description || '',
        });

        try {
          const blob = await mediaService.getSingleCover(parseInt(id!), true);
          const url = URL.createObjectURL(blob);
          setCurrentImageUrl(url);
          
          const file = new File([blob], `${mediaData.id}.webp`, { type: 'image/webp' });
          setImage([file]);
          setOriginalImage([file]);
        } catch (err) {
          console.error('Failed to load current cover');
        }
      } catch (err) {
        if (err instanceof ApiException) {
          setError(err.message);
          window.scrollTo(0, 0)
        } else {
          setError('An error occurred while loading the media');
          window.scrollTo(0, 0)
        }
      } finally {
        setLoading(false);
      }
    };

    if (is_authenticated && id) {
      fetchData();
    }

    return () => {
      if (currentImageUrl) {
        URL.revokeObjectURL(currentImageUrl);
      }
    };
  }, [id, is_authenticated]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleImageDrop = (files: File[]) => {
    setImage(files);
    setError('');
  };

  const handleImageError = (error: Error) => {
    setError(error.message || 'Failed to upload image');
    window.scrollTo(0, 0)
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    setSaving(true);

    try {
      const body: any = {};
      
      if (formData.title !== media?.title) {
        body.title = formData.title;
      }
      if (parseInt(formData.type_id) !== media?.type.id) {
        body.type_id = parseInt(formData.type_id);
      }
      if (formData.release_year !== (media?.release_year?.toString() || '')) {
        body.release_year = formData.release_year ? parseInt(formData.release_year) : null;
      }
      if (parseInt(formData.status_id) !== media?.status.id) {
        body.status_id = parseInt(formData.status_id);
      }
      if (formData.description !== (media?.description || '')) {
        body.description = formData.description || null;
      }

      const hasDataChanges = Object.keys(body).length > 0;
      const hasImageChange = image && image[0] && image[0] !== originalImage?.[0];

      if (!hasDataChanges && !hasImageChange) {
        setError('No changes to save');
        setSaving(false);
        window.scrollTo(0, 0)
        return;
      }

      if (hasDataChanges) {
        await mediaService.updateMedia(parseInt(id!), body);
      }

      if (hasImageChange) {
        await mediaService.updateCover(parseInt(id!), image[0]);
      }

      setSuccess('Media updated successfully!');
      window.scrollTo(0, 0)
      
      setTimeout(() => {
        navigate(`/media/${id}`);
      }, 1000);
    } catch (err) {
      if (err instanceof ApiException) {
        setError(err.message);
        window.scrollTo(0, 0)
      } else {
        setError('An error occurred. Please try again.');
        window.scrollTo(0, 0)
      }
    } finally {
      setSaving(false);
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

  if (!isOwner) {
    return <Navigate to={`/media/${id}`} replace />;
  }

  if (error && !media) {
    return <ErrorCard message={error} onRetry={() => window.location.reload()} />;
  }

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <div className="space-y-4">
        <BackButton
          to={`/media/${id}`}
          label="Back to Media View"
        />

        <Card>
          <CardHeader>
            <CardTitle className="text-3xl">Edit Media</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Update media information
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <FormAlerts error={error} success={success} />

              {/* Title */}
              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  name="title"
                  type="text"
                  value={formData.title}
                  onChange={handleChange}
                  required
                  autoFocus
                />
              </div>

              {/* Type */}
              <div className="space-y-2">
                <Label htmlFor="type_id">Type *</Label>
                <Select
                  value={formData.type_id}
                  onValueChange={(value: string) => handleSelectChange('type_id', value)}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select media type" />
                  </SelectTrigger>
                  <SelectContent>
                    {mediaTypes.map((type) => (
                      <SelectItem key={type.id} value={type.id.toString()}>
                        {type.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Release Year */}
              <div className="space-y-2">
                <Label htmlFor="release_year">Release Year</Label>
                <Input
                  id="release_year"
                  name="release_year"
                  type="number"
                  placeholder="2024"
                  min="1800"
                  max="2100"
                  value={formData.release_year}
                  onChange={handleChange}
                />
              </div>

              {/* Status */}
              <div className="space-y-2">
                <Label htmlFor="status_id">Status *</Label>
                <Select
                  value={formData.status_id}
                  onValueChange={(value: string) => handleSelectChange('status_id', value)}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    {statusTypes.map((status) => (
                      <SelectItem key={status.id} value={status.id.toString()}>
                        {status.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  name="description"
                  placeholder="Enter a description (optional)"
                  rows={4}
                  value={formData.description}
                  onChange={handleChange}
                />
              </div>

              {/* Cover Image Update */}
              <div className="space-y-2">
                <Label>Cover Image</Label>
                <Dropzone
                  accept={{
                    'image/jpeg': ['.jpg', '.jpeg'],
                    'image/png': ['.png'],
                    'image/webp': ['.webp']
                  }}
                  onDrop={handleImageDrop}
                  onError={handleImageError}
                  src={image}
                  maxSize={5 * 1024 * 1024}
                >
                  <DropzoneEmptyState />
                  <DropzoneContent />
                </Dropzone>
                {image && image[0] && (
                  <div className="flex flex-col gap-2 mt-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setShowPreview(true)}
                      className="w-full"
                    >
                      Preview Image
                    </Button>
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={() => setImage(undefined)}
                      className="w-full"
                    >
                      Clear Image
                    </Button>
                  </div>
                )}
                {!image && (
                  <p className="text-xs text-muted-foreground mt-2">
                    Upload a new image to replace the current cover
                  </p>
                )}
              </div>

              {/* Image Preview Modal */}
              {showPreview && image && image[0] && (
                <div 
                  className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
                  onClick={() => setShowPreview(false)}
                >
                  <div className="relative max-w-4xl max-h-[90vh]">
                    <img
                      src={URL.createObjectURL(image[0])}
                      alt="Preview"
                      className="max-w-full max-h-[90vh] object-contain rounded-lg"
                    />
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setShowPreview(false)}
                      className="absolute top-4 right-4"
                    >
                      Close
                    </Button>
                  </div>
                </div>
              )}

              {/* Buttons */}
              <div className="flex gap-4 pt-2">
                <Button type="submit" disabled={saving} className="flex-1">
                  {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {saving ? 'Saving...' : 'Save Changes'}
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => navigate(`/media/${id}`)}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default MediaEdit;