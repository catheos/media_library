import { useParams, Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Dropzone, DropzoneContent, DropzoneEmptyState } from '@/components/ui/shadcn-io/dropzone';
import { Loader2 } from "lucide-react";
import Loading from "@/components/common/Loading";
import ErrorCard from "@/components/common/ErrorCard";
import FormAlerts from "@/components/common/FormAlerts";
import { characterService, ApiException } from "@/api";
import type { Character } from "@/api";
import MDEditor from '@uiw/react-md-editor';
import BackButton from "../common/BackButton";
import { useTabTitle } from "@/hooks/useTabTitle";

const CharacterEdit = () => {
  const { id } = useParams();
  const { current_user, is_authenticated, is_loading } = useAuth();
  const navigate = useNavigate();
  const [character, setCharacter] = useState<Character | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    wiki_url: '',
    details: '',
  });
  const [image, setImage] = useState<File[] | undefined>();
  const [originalImage, setOriginalImage] = useState<File[] | undefined>();
  const [currentImageUrl, setCurrentImageUrl] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const isOwner = current_user?.id === character?.created_by?.id;

  // Set title
  useTabTitle((character?.name)
    ? `Edit | ${character?.name} | Characters`
    : 'Loading...'
  );

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError('');
      
      try {
        const characterData = await characterService.getSingle(parseInt(id!));
        
        setCharacter(characterData);
        setFormData({
          name: characterData.name,
          wiki_url: characterData.wiki_url || '',
          details: characterData.details || '',
        });

        try {
          const blob = await characterService.getSingleCover(parseInt(id!));
          const url = URL.createObjectURL(blob);
          setCurrentImageUrl(url);
          
          const file = new File([blob], `${characterData.id}.webp`, { type: 'image/webp' });
          setImage([file]);
          setOriginalImage([file]);
        } catch (err) {
          console.error('Failed to load current cover');
        }
      } catch (err) {
        if (err instanceof ApiException) {
          setError(err.message);
        } else {
          setError('An error occurred while loading the character');
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

    setSaving(true);

    try {
      const body: any = {};
      
      if (formData.name !== character?.name) {
        body.name = formData.name;
      }
      if (formData.wiki_url !== (character?.wiki_url || '')) {
        body.wiki_url = formData.wiki_url || null;
      }
      if (formData.details !== (character?.details || '')) {
        body.details = formData.details || null;
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
        await characterService.update(parseInt(id!), body);
      }

      if (hasImageChange) {
        await characterService.updateCover(parseInt(id!), image[0]);
      }

      setSuccess('Character updated successfully!');
      window.scrollTo(0, 0)
      
      setTimeout(() => {
        navigate(`/characters/${id}`);
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
    return <Navigate to={`/characters/${id}`} replace />;
  }

  if (error && !character) {
    return <ErrorCard message={error} onRetry={() => window.location.reload()} />;
  }

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <div className="space-y-4">
        <BackButton
          to={`/characters/${id}`}
          label="Back to Character View"
        />

        <Card>
          <CardHeader>
            <CardTitle className="text-3xl">Edit Character</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Update character information
            </p>
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
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  autoFocus
                />
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

              {/* Character Image Update */}
              <div className="space-y-2">
                <Label>Character Image</Label>
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
                    Upload a new image to replace the current character image
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
                  onClick={() => navigate(`/characters/${id}`)}
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

export default CharacterEdit;