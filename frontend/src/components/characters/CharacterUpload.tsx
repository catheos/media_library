import { useState } from 'react';
import { useNavigate, Navigate, Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { characterService, ApiException } from '@/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Dropzone, DropzoneContent, DropzoneEmptyState } from '@/components/ui/shadcn-io/dropzone';
import { Loader2 } from 'lucide-react';
import Loading from '@/components/Loading';

const CharacterUpload = () => {
  const { is_authenticated, is_loading } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const media_id = searchParams.get('media_id');
  const [formData, setFormData] = useState({
    name: '',
    wiki_url: '',
    details: '',
  });
  const [image, setImage] = useState<File[] | undefined>();
  const [showPreview, setShowPreview] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
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

    if (!formData.name.trim()) {
      setError('Character name is required');
      return;
    }

    setSubmitting(true);

    try {
      // Parse details as JSON if provided
      let parsedDetails = null;
      if (formData.details.trim()) {
        try {
          parsedDetails = JSON.parse(formData.details);
        } catch {
          setError('Details must be valid JSON');
          setSubmitting(false);
          return;
        }
      }

      const response = await characterService.create(
        {
          name: formData.name.trim(),
          details: parsedDetails,
          wiki_url: formData.wiki_url.trim() || undefined,
        },
        image?.[0]
      );

      setSuccess('Character created successfully!');
      
      setTimeout(() => {
        if (media_id) {
          navigate(`/media-character/upload?media=${media_id}&character_id=${response.character.id}`);
        } else {
          navigate(`/characters/${response.character.id}`);
        }
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

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Navigation between upload types */}
      <div className="flex gap-2 pt-4">
        <Button 
          variant="outline" 
          asChild
          className="flex-1 rounded-bl-none rounded-br-none border-b-0"
        >
          <Link to="/media/upload">Media</Link>
        </Button>
        <Button 
          variant="default"
          disabled
          className="flex-1 rounded-bl-none rounded-br-none border-b-0"
        >
          Character
        </Button>
      </div>
      <Card className="rounded-tl-none rounded-tr-none">
        <CardHeader>
          <CardTitle className="text-3xl">Create Character</CardTitle>
          <CardDescription>
            Add a new character to the database
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

            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="name">Character Name *</Label>
              <Input
                id="name"
                name="name"
                type="text"
                placeholder="Enter character name"
                value={formData.name}
                onChange={handleChange}
                required
                autoFocus
              />
              <p className="text-sm text-muted-foreground">
                Note: Multiple characters can have the same name if they're from different series
              </p>
            </div>

            {/* Wiki URL */}
            <div className="space-y-2">
              <Label htmlFor="wiki_url">Wiki URL</Label>
              <Input
                id="wiki_url"
                name="wiki_url"
                type="url"
                placeholder="https://example.fandom.com/wiki/Character_Name"
                value={formData.wiki_url}
                onChange={handleChange}
              />
              <p className="text-sm text-muted-foreground">
                Optional link to character's wiki page
              </p>
            </div>

            {/* Details */}
            <div className="space-y-2">
              <Label htmlFor="details">Details (JSON)</Label>
              <Textarea
                id="details"
                name="details"
                placeholder='{"age": 25, "species": "Human", "occupation": "Detective"}'
                rows={6}
                value={formData.details}
                onChange={handleChange}
                className="font-mono text-sm"
              />
              <p className="text-sm text-muted-foreground">
                Optional character details as JSON. Example: {`{"age": 25, "species": "Human"}`}
              </p>
            </div>

            {/* Image Upload */}
            <div className="space-y-2">
              <Label>Character Image *</Label>
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
                {submitting ? 'Creating...' : 'Create Character'}
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => navigate('/characters')}
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

export default CharacterUpload;