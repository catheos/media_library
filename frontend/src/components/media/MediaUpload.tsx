import { useState, useEffect } from 'react';
import { useNavigate, Navigate, Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { mediaService, ApiException } from '@/api';
import type { MediaType, MediaStatus } from '@/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Database, BookOpen } from 'lucide-react';
import Loading from '@/components/common/Loading';
import ImageUploadSection from '@/components/common/ImageUploadSection';
import FormAlerts from '@/components/common/FormAlerts';
import BackButton from '../common/BackButton';
import TheTVDBSearchDialog from '@/components/media/TheTVDBSearchDialog';
import OpenLibrarySearchDialog from '@/components/media/OpenLibrarySearchDialog';
import { useTabTitle } from '@/hooks/useTabTitle';
import { thetvdbService, type TheTVDBSearchResult } from '@/services/thetvdb';
import { openLibraryService, type OpenLibrarySearchResult } from '@/services/openlibrary';
import { type AniListSearchResult } from '@/services/anilist';
import AniListSearchDialog from './AniListSearchDialog';

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

// Status mapping from TheTVDB to my system
const STATUS_MAP: Record<string, string> = {
  'continuing': 'ongoing',
  'ended': 'completed',
  'upcoming': 'upcoming',
  'released': 'completed',
  'canceled': 'completed',
  'cancelled': 'completed',
};

// Status mapping from anilist to my system
const ANILIST_STATUS_MAP: Record<string, string> = {
  'FINISHED': 'completed',
  'RELEASING': 'ongoing',
  'NOT_YET_RELEASED': 'upcoming',
  'CANCELLED': 'completed',
  'HIATUS': 'ongoing',
};

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
  const [mediaTypes, setMediaTypes] = useState<MediaType[]>([]);
  const [statusTypes, setStatusTypes] = useState<MediaStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showTheTVDBSearch, setShowTheTVDBSearch] = useState(false);
  const [showOpenLibrarySearch, setShowOpenLibrarySearch] = useState(false);
  const [showAniListSearch, setShowAniListSearch] = useState(false);

  useTabTitle('Upload | Media');

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

  // Helper function to find novel media type
  const findNovelMediaType = (): MediaType | undefined => {
    return mediaTypes.find(
      (t) => t.name.toLowerCase().replace(/\s+/g, '_') === 'novel'
    ) || mediaTypes.find((t) => {
      const normalized = t.name.toLowerCase();
      return normalized.includes('novel');
    });
  };

  // Helper function to find the appropriate status
  const findStatus = (tvdbStatus: string): MediaStatus | undefined => {
    const mappedStatusName = STATUS_MAP[tvdbStatus.toLowerCase()] || 'unknown';
    return statusTypes.find(
      (s) => s.name.toLowerCase().replace(/\s+/g, '_') === mappedStatusName
    );
  };

  // Helper function to find completed status for books
  const findCompletedStatus = (): MediaStatus | undefined => {
    return statusTypes.find(
      (s) => s.name.toLowerCase().replace(/\s+/g, '_') === 'completed'
    ) || statusTypes.find((s) => {
      const normalized = s.name.toLowerCase();
      return normalized.includes('complete') || normalized.includes('finished');
    });
  };

  // Helper functions for anime/manga
  const findAnimeMediaType = (): MediaType | undefined => {
    return mediaTypes.find(
      (t) => t.name.toLowerCase().replace(/\s+/g, '_') === 'anime'
    ) || mediaTypes.find((t) => {
      const normalized = t.name.toLowerCase();
      return normalized.includes('anime');
    });
  };
  const findMangaMediaType = (): MediaType | undefined => {
    return mediaTypes.find(
      (t) => t.name.toLowerCase().replace(/\s+/g, '_') === 'manga'
    ) || mediaTypes.find((t) => {
      const normalized = t.name.toLowerCase();
      return normalized.includes('manga') || normalized.includes('comic');
    });
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

  const handleOpenLibrarySelect = async (result: OpenLibrarySearchResult) => {
    setError('');
    
    try {
      // Find matching media type and status
      const mediaType = findNovelMediaType();
      const status = findCompletedStatus();

      // Fetch full work details to get complete description
      let description = '';
      try {
        const workDetails = await openLibraryService.getWorkDetails(result.id);
        description = workDetails.description || '';
      } catch (detailsError) {
        console.error('Failed to fetch work details:', detailsError);
      }

      // Update form data
      setFormData({
        title: result.title,
        type_id: mediaType?.id.toString() || '',
        release_year: result.first_publish_year ? result.first_publish_year.toString() : '',
        status_id: status?.id.toString() || '',
        description: description,
      });

      setSuccess('Data imported from OpenLibrary successfully! Note: You will need to upload a cover image manually.');
      window.scrollTo(0, 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to import data from OpenLibrary');
      window.scrollTo(0, 0);
    }
  };

  const handleAniListSelect = async (result: AniListSearchResult) => {
    setError('');
    
    try {
      let mediaType: MediaType | undefined;

      // Determine media type based on format, with fallbacks
      switch (result.format) {
        case 'NOVEL':
          mediaType = findNovelMediaType();
          break;
        case 'MANGA':
        case 'ONE_SHOT':
          mediaType = findMangaMediaType();
          break;
        case 'TV':
        case 'MOVIE':
        case 'OVA':
        case 'ONA':
        case 'SPECIAL':
        case 'MUSIC':
          mediaType = findAnimeMediaType();
          break;
        default:
          // Fallback to type if format is unknown
          mediaType = result.type === 'ANIME' ? findAnimeMediaType() : findMangaMediaType();
      }

      const mappedStatusName = ANILIST_STATUS_MAP[result.status || ''] || 'unknown';
      const status = statusTypes.find(
        (s) => s.name.toLowerCase().replace(/\s+/g, '_') === mappedStatusName
      );

      const title = result.title.english || result.title.romaji || result.title.native;
      const description = result.description 
        ? result.description.replace(/<br>/g, '\n').replace(/<[^>]*>/g, '')
        : '';

      setFormData({
        title: title,
        type_id: mediaType?.id.toString() || '',
        release_year: result.startDate?.year ? result.startDate.year.toString() : '',
        status_id: status?.id.toString() || '',
        description: description,
      });

      setSuccess(`Data imported from AniList successfully (${result.format || result.type})!`);
      window.scrollTo(0, 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to import data from AniList');
      window.scrollTo(0, 0);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!formData.title || !formData.type_id || !formData.status_id) {
      setError('Title, type, and status are required');
      window.scrollTo(0, 0);
      return;
    }

    if (!image || !image[0]) {
      setError('Cover image is required');
      window.scrollTo(0, 0);
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
      window.scrollTo(0, 0);
      
      setTimeout(() => {
        navigate(`/media/${response.media.id}`);
      }, 1000);
    } catch (err) {
      if (err instanceof ApiException) {
        setError(err.message);
        window.scrollTo(0, 0);
      } else {
        setError('An error occurred. Please try again.');
        window.scrollTo(0, 0);
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
    <div className="container mx-auto p-4 max-w-4xl">
      <BackButton to="/media" label="Back to Media" />

      <div className="flex gap-2">
        <Button 
          variant="default"
          disabled
          className="flex-1 rounded-bl-none rounded-br-none border-b-0"
        >
          Media
        </Button>
        <Button 
          variant="outline" 
          asChild
          className="flex-1 rounded-bl-none rounded-br-none border-b-0"
        >
          <Link to="/characters/upload">Character</Link>
        </Button>
      </div>
      
      <div className="space-y-4">
        <Card className="rounded-tl-none rounded-tr-none">
          <CardHeader>
            <CardTitle className="text-3xl">Upload Media</CardTitle>
            <CardDescription>
              Add a new movie, TV show, book, or other media to your collection
            </CardDescription>
            <div className="flex flex-col sm:flex-row gap-2 pt-2">
              {/* TheTVDB */}
              <Button
                variant="outline"
                onClick={() => setShowTheTVDBSearch(true)}
                className="flex items-center justify-center gap-2"
              >
                <Database className="h-4 w-4" />
                Import from TheTVDB
              </Button>
              {/* AniList */}
              <Button
                variant="outline"
                onClick={() => setShowAniListSearch(true)}
                className="flex items-center justify-center gap-2"
              >
                <Database className="h-4 w-4" />
                Import from AniList
              </Button>
              {/* Open Library */}
              <Button
                variant="outline"
                onClick={() => setShowOpenLibrarySearch(true)}
                className="flex items-center justify-center gap-2"
              >
                <BookOpen className="h-4 w-4" />
                Import from OpenLibrary
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <FormAlerts error={error} success={success} />

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

              <ImageUploadSection
                image={image}
                onImageDrop={handleImageDrop}
                onImageError={handleImageError}
                onClear={() => setImage(undefined)}
                label="Cover Image"
                required
              />

              <div className="flex gap-4 pt-2">
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

      <TheTVDBSearchDialog
        open={showTheTVDBSearch}
        onOpenChange={setShowTheTVDBSearch}
        onSelect={handleTheTVDBSelect}
      />

      <OpenLibrarySearchDialog
        open={showOpenLibrarySearch}
        onOpenChange={setShowOpenLibrarySearch}
        onSelect={handleOpenLibrarySelect}
      />

      <AniListSearchDialog
        open={showAniListSearch}
        onOpenChange={setShowAniListSearch}
        onSelect={handleAniListSelect}
      />
    </div>
  );
};

export default MediaUpload;