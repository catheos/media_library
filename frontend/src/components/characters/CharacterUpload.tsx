import { useState } from 'react';
import { useNavigate, Navigate, Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { characterService, ApiException } from '@/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import Loading from '@/components/common/Loading';
import ImageUploadSection from '@/components/common/ImageUploadSection';
import MDEditor from '@uiw/react-md-editor';
import FormAlerts from '../common/FormAlerts';
import BackButton from '../common/BackButton';

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
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleDetailsChange = (value?: string) => {
    setFormData({
      ...formData,
      details: value || '',
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
      const response = await characterService.create(
        {
          name: formData.name.trim(),
          details: formData.details.trim() || undefined,
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
    <div className="container mx-auto p-4 max-w-4xl">
      <BackButton
        to="/characters"
        label="Back to Characters"
      />

      {/* Navigation between upload types */}
      <div className="flex gap-2">
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

      <div className="space-y-4">
        <Card className="rounded-tl-none rounded-tr-none">
          <CardHeader>
            <CardTitle className="text-3xl">Create Character</CardTitle>
            <CardDescription>
              Add a new character to the database
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <FormAlerts error={error} success={success} />

              {/* Name */}
              <div className="space-y-2">
                <Label htmlFor="name">Character Name *</Label>
                <Input
                  id="name"
                  name="name"
                  type="text"
                  placeholder="Enter character name"
                  value={formData.name}
                  onChange={handleInputChange}
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
                  onChange={handleInputChange}
                />
                <p className="text-sm text-muted-foreground">
                  Optional link to character's wiki page
                </p>
              </div>

              {/* Details - Markdown Editor */}
              <div className="space-y-2">
                <Label htmlFor="details">Details (Markdown)</Label>
                <div data-color-mode="light">
                  <MDEditor
                    value={formData.details}
                    onChange={handleDetailsChange}
                    height={200}
                    preview="live"
                    hideToolbar={false}
                    enableScroll={true}
                    visibleDragbar={true}
                  />
                </div>
                <p className="text-sm text-muted-foreground">
                  Character details in markdown format. The editor shows live preview as you type.
                </p>
              </div>

              {/* Image Upload */}
              <ImageUploadSection
                image={image}
                onImageDrop={handleImageDrop}
                onImageError={handleImageError}
                onClear={() => setImage(undefined)}
                label="Character Image"
                required
              />

              {/* Buttons */}
              <div className="flex gap-4 pt-2">
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
    </div>
  );
};

export default CharacterUpload;