import { useParams, Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Database } from "lucide-react";
import Loading from "@/components/common/Loading";
import ErrorCard from "@/components/common/ErrorCard";
import FormAlerts from "@/components/common/FormAlerts";
import ImageUploadSection from '@/components/common/ImageUploadSection';
import { mediaService, ApiException } from "@/api";
import type { Media, MediaType, MediaStatus } from "@/api";
import BackButton from "../common/BackButton";
import TheTVDBSearchDialog from '@/components/media/TheTVDBSearchDialog';
import { useTabTitle } from "@/hooks/useTabTitle";
import { thetvdbService, type TheTVDBSearchResult } from '@/services/thetvdb';

// Language display names
const LANGUAGE_NAMES: Record<string, string> = {
  'eng': 'English',
  'jpn': 'Japanese',
  'spa': 'Spanish',
  'fra': 'French',
  'deu': 'German',
  'ita': 'Italian',
  'por': 'Portuguese',
  'rus': 'Russian',
  'kor': 'Korean',
  'zho': 'Chinese',
};

// Status mapping from TheTVDB to your system
const STATUS_MAP: Record<string, string> = {
  'continuing': 'ongoing',
  'ended': 'completed',
  'upcoming': 'upcoming',
  'released': 'completed',
  'canceled': 'completed',
  'cancelled': 'completed',
};

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
  const [mediaTypes, setMediaTypes] = useState<MediaType[]>([]);
  const [statusTypes, setStatusTypes] = useState<MediaStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showTheTVDBSearch, setShowTheTVDBSearch] = useState(false);

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

  // Helper function to find the appropriate media type
  const findMediaType = (tvdbType: string): MediaType | undefined => {
    const mediaTypeName = tvdbType === 'series' ? 'tv_series' : 'movie';
    
    return mediaTypes.find(
      (t) => t.name.toLowerCase().replace(/\s+/g, '_') === mediaTypeName
    ) || mediaTypes.find((t) => {
      const normalized = t.name.toLowerCase().replace(/\s+/g, '_');
      return tvdbType === 'series' 
        ? normalized.includes('tv') || normalized.includes('series')
        : normalized === 'movie';
    });
  };

  // Helper function to find the appropriate status
  const findStatus = (tvdbStatus: string): MediaStatus | undefined => {
    const mappedStatusName = STATUS_MAP[tvdbStatus.toLowerCase()] || 'unknown';
    return statusTypes.find(
      (s) => s.name.toLowerCase().replace(/\s+/g, '_') === mappedStatusName
    );
  };

  const getTheTVDBType = (): 'series' | 'movie' | undefined => {
    if (!formData.type_id) return undefined;
    
    const mediaType = mediaTypes.find(t => t.id.toString() === formData.type_id);
    if (!mediaType) return undefined;
    
    const typeName = mediaType.name.toLowerCase().replace(/\s+/g, '_');
    
    if (typeName.includes('tv') || typeName.includes('series')) return 'series';
    if (typeName === 'movie') return 'movie';
    
    return undefined;
  };

  const handleTheTVDBSelect = async (result: TheTVDBSearchResult, language: string) => {
    setError('');
    
    try {
      // Find matching media type and status
      const mediaType = findMediaType(result.type);
      const status = findStatus(result.status);

      // Update form data immediately with the already-translated result
      setFormData({
        title: result.name,
        type_id: mediaType?.id.toString() || '',
        release_year: result.year ? result.year.toString() : '',
        status_id: status?.id.toString() || '',
        description: result.overview || '',
      });

      // Show success message with language info
      const languageName = LANGUAGE_NAMES[language] || language;
      setSuccess(`Data imported from TheTVDB successfully (${languageName})!`);
      window.scrollTo(0, 0);

      // Download image asynchronously in the background
      if (result.image_url) {
        thetvdbService.downloadImage(result.image_url)
          .then(imageBlob => {
            const fileName = `${result.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.jpg`;
            const imageFile = new File([imageBlob], fileName, { type: 'image/jpeg' });
            setImage([imageFile]);
          })
          .catch(imgError => {
            console.error('Failed to download image:', imgError);
            // Update message to indicate image failed but data succeeded
            setSuccess(`Data imported from TheTVDB successfully (${languageName}), but image download failed. You can upload one manually.`);
          });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to import data from TheTVDB');
      window.scrollTo(0, 0);
    }
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
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-3xl">Edit Media</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  Update media information
                </p>
              </div>
              <Button
                variant="outline"
                onClick={() => setShowTheTVDBSearch(true)}
                className="flex items-center gap-2"
              >
                <Database className="h-4 w-4" />
                Import from TheTVDB
              </Button>
            </div>
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
              <ImageUploadSection
                image={image}
                onImageDrop={handleImageDrop}
                onImageError={handleImageError}
                onClear={() => setImage(undefined)}
                label="Cover Image"
                required={false}
              />

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

      <TheTVDBSearchDialog
        open={showTheTVDBSearch}
        onOpenChange={setShowTheTVDBSearch}
        onSelect={handleTheTVDBSelect}
        initialQuery={formData.title}
        initialType={getTheTVDBType()}
        initialYear={formData.release_year ? parseInt(formData.release_year) : undefined}
      />
    </div>
  );
};

export default MediaEdit;