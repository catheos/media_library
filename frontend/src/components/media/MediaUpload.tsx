import { useState, useEffect } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { mediaService, ApiException } from '@/api';
import type { MediaType, MediaStatus } from '@/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dropzone, DropzoneContent, DropzoneEmptyState } from '@/components/ui/shadcn-io/dropzone';
import { Loader2 } from 'lucide-react';
import Loading from '@/components/Loading';

const MediaUpload = () => {
  const { is_authenticated, is_loading } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: '',
    type_id: '',
    release_year: '',
    status_id: '',
    description: '',
  });
  const [image, setImage] = useState<File[] | undefined>();
  const [showPreview, setShowPreview] = useState(false);
  const [mediaTypes, setMediaTypes] = useState<MediaType[]>([]);
  const [statusTypes, setStatusTypes] = useState<MediaStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Fetch media types and status types on mount
  useEffect(() => {
    const fetchOptions = async () => {
      setLoading(true);
      try {
        const [types, statuses] = await Promise.all([
          mediaService.getTypes(),
          mediaService.getStatuses(),
        ]);
        
        setMediaTypes(types);
        setStatusTypes(statuses);
      } catch (err) {
        if (err instanceof ApiException) {
          setError(err.message);
        } else {
          setError('An error occurred while loading options');
        }
      } finally {
        setLoading(false);
      }
    };

    if (is_authenticated) {
      fetchOptions();
    }
  }, [is_authenticated]);

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
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!formData.title || !formData.type_id || !formData.status_id) {
      setError('Title, type, and status are required');
      return;
    }

    if (!image || !image[0]) {
      setError('Cover image is required');
      return;
    }

    setSubmitting(true);

    try {
      const response = await mediaService.create(
        {
          title: formData.title,
          type_id: parseInt(formData.type_id),
          release_year: formData.release_year ? parseInt(formData.release_year) : undefined,
          status_id: parseInt(formData.status_id),
          description: formData.description || undefined,
        },
        image[0]
      );

      setSuccess('Media created successfully!');
      
      setTimeout(() => {
        navigate(`/media/${response.media.id}`);
      }, 2000);
    } catch (err) {
      if (err instanceof ApiException) {
        setError(err.message);
      } else {
        setError('An error occurred. Please try again.');
      }
    } finally {
      setSubmitting(false);
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

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle className="text-3xl">Upload Media</CardTitle>
          <CardDescription>
            Add a new movie, TV show, or other media to your collection
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded">
                {error}
              </div>
            )}

            {success && (
              <div className="p-3 text-sm text-green-600 bg-green-50 border border-green-200 rounded">
                {success}
              </div>
            )}

            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                name="title"
                type="text"
                placeholder="Enter media title"
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

            {/* Image Upload */}
            <div className="space-y-2">
              <Label>Cover Image *</Label>
              <Dropzone
                accept={{
                  'image/jpeg': ['.jpg', '.jpeg'],
                  'image/png': ['.png'],
                  'image/webp': ['.webp']
                }}
                onDrop={handleImageDrop}
                onError={handleImageError}
                src={image}
                maxSize={5 * 1024 * 1024} // 5MB
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
            <div className="flex gap-3 pt-4">
              <Button type="submit" disabled={submitting} className="flex-1">
                {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {submitting ? 'Creating...' : 'Create Media'}
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => navigate('/media')}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default MediaUpload;