import { useParams, Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dropzone, DropzoneContent, DropzoneEmptyState } from '@/components/ui/shadcn-io/dropzone';
import { Loader2 } from "lucide-react";
import Loading from "@/components/Loading";
import { characterService, ApiException } from "@/api";
import type { CharacterWithMedia } from "@/api";

const CharacterEdit = () => {
  const { id } = useParams();
  const { current_user, is_authenticated, is_loading } = useAuth();
  const navigate = useNavigate();
  const [character, setCharacter] = useState<CharacterWithMedia | null>(null);
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
          details: characterData.details ? JSON.stringify(characterData.details, null, 2) : '',
        });

        // Fetch current character image
        try {
          const blob = await characterService.getSingleCover(parseInt(id!));
          const url = URL.createObjectURL(blob);
          setCurrentImageUrl(url);
          
          // Create a File object from the blob to show in dropzone
          const file = new File([blob], `${characterData.id}.webp`, { type: 'image/webp' });
          setImage([file]);
          setOriginalImage([file]); // Track original
        } catch (err) {
          console.error('Failed to load current image');
        }
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
      fetchData();
    }

    // Cleanup
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
      // Parse details if provided
      let parsedDetails = null;
      if (formData.details.trim()) {
        try {
          parsedDetails = JSON.parse(formData.details);
        } catch {
          setError('Details must be valid JSON');
          setSaving(false);
          return;
        }
      }

      // Build body with ONLY changed fields
      const body: any = {};
      
      // Compare formData to original character data
      if (formData.name !== character?.name) {
        body.name = formData.name;
      }
      if (formData.wiki_url !== (character?.wiki_url || '')) {
        body.wiki_url = formData.wiki_url || null;
      }
      if (JSON.stringify(parsedDetails) !== JSON.stringify(character?.details)) {
        body.details = parsedDetails;
      }

      // Check if anything changed
      const hasDataChanges = Object.keys(body).length > 0;
      const hasImageChange = image && image[0] && image[0] !== originalImage?.[0];

      if (!hasDataChanges && !hasImageChange) {
        setError('No changes to save');
        setSaving(false);
        return;
      }

      // Update character data if changed
      if (hasDataChanges) {
        await characterService.update(parseInt(id!), body);
      }

      // Update character image if changed
      if (hasImageChange) {
        await characterService.updateCover(parseInt(id!), image[0]);
      }

      setSuccess('Character updated successfully!');
      
      // Redirect after 2 seconds
      setTimeout(() => {
        navigate(`/characters/${id}`);
      }, 2000);
    } catch (err) {
      if (err instanceof ApiException) {
        setError(err.message);
      } else {
        setError('An error occurred. Please try again.');
      }
    } finally {
      setSaving(false);
    }
  };

  // Show loading while auth is initializing
  if (is_loading) {
    return <Loading fullScreen />;
  }

  // Not authenticated
  if (!is_authenticated) {
    return <Navigate to="/users/login" replace />;
  }

  // Loading character data
  if (loading) {
    return <Loading fullScreen />;
  }

  // Not owner
  if (!isOwner) {
    return <Navigate to={`/characters/${id}`} replace />;
  }

  // Error state
  if (error && !character) {
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

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle className="text-3xl">Edit Character</CardTitle>
          <p className="text-sm text-muted-foreground mt-1">
            Update character information
          </p>
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
                value={formData.name}
                onChange={handleChange}
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
                onChange={handleChange}
              />
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
            <div className="flex gap-3 pt-4">
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
  );
};

export default CharacterEdit;