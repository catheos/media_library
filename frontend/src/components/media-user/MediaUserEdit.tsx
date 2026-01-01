import { useParams, Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import Loading from "@/components/common/Loading";
import ErrorCard from "@/components/common/ErrorCard";
import FormAlerts from "@/components/common/FormAlerts";
import BackButton from "@/components/common/BackButton";
import { mediaUserService, ApiException } from "@/api";
import type { UserMedia, UserMediaStatus } from "@/api";
import { useTabTitle } from "@/hooks/useTabTitle";

const MediaUserEdit = () => {
  const { id } = useParams();
  const { is_authenticated, is_loading } = useAuth();
  const navigate = useNavigate();
  const [userMedia, setUserMedia] = useState<UserMedia | null>(null);
  const [formData, setFormData] = useState({
    status_id: '',
    current_progress: '',
    score: '',
    review: '',
  });
  const [statusTypes, setStatusTypes] = useState<UserMediaStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Set title
  useTabTitle((userMedia?.media.title)
    ? `Edit | ${userMedia?.media.title} | Library`
    : 'Loading...'
  );

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError('');
      
      try {
        const [userMediaData, statusesData] = await Promise.all([
          mediaUserService.getSingle(parseInt(id!)),
          mediaUserService.getStatuses()
        ]);
        
        setUserMedia(userMediaData);
        setStatusTypes(statusesData);
        setFormData({
          status_id: userMediaData.status?.id.toString() || '',
          current_progress: userMediaData.current_progress || '',
          score: userMediaData.score?.toString() || '',
          review: userMediaData.review || '',
        });
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
      fetchData();
    }
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    setSaving(true);

    try {
      const body: any = {};
      
      // Compare and include only changed fields
      if (formData.status_id !== (userMedia?.status?.id.toString() || '')) {
        body.status_id = formData.status_id ? parseInt(formData.status_id) : null;
      }
      
      if (formData.current_progress !== (userMedia?.current_progress || '')) {
        body.current_progress = formData.current_progress || null;
      }
      
      if (formData.score !== (userMedia?.score?.toString() || '')) {
        const scoreValue = formData.score ? parseFloat(formData.score) : null;
        if (scoreValue !== null && (scoreValue < 0 || scoreValue > 10)) {
          setError('Score must be between 0 and 10');
          setSaving(false);
          return;
        }
        body.score = scoreValue;
      }
      
      if (formData.review !== (userMedia?.review || '')) {
        body.review = formData.review || null;
      }

      if (Object.keys(body).length === 0) {
        setError('No changes to save');
        setSaving(false);
        return;
      }

      await mediaUserService.update(parseInt(id!), body);

      setSuccess('Progress updated successfully!');
      
      setTimeout(() => {
        navigate(`/media-user/${id}`);
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

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <div className="space-y-4">
        <BackButton
          to={`/media-user/${id}`}
          label="Back to Library View"
        />

        <Card>
          <CardHeader>
            <CardTitle className="text-3xl">Edit Your Progress</CardTitle>
            {userMedia && (
              <p className="text-sm text-muted-foreground mt-1">
                Editing: {userMedia.media.title}
              </p>
            )}
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <FormAlerts error={error} success={success} />

              {/* Status */}
              <div className="space-y-2">
                <Label htmlFor="status_id">Watch Status</Label>
                <Select
                  value={formData.status_id}
                  onValueChange={(value: string) => handleSelectChange('status_id', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select your status" />
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

              {/* Current Progress */}
              <div className="space-y-2">
                <Label htmlFor="current_progress">Current Progress</Label>
                <Input
                  id="current_progress"
                  name="current_progress"
                  type="text"
                  placeholder="e.g., Episode 5, Chapter 12"
                  value={formData.current_progress}
                  onChange={handleChange}
                />
                <p className="text-sm text-muted-foreground">
                  Track where you left off
                </p>
              </div>

              {/* Score */}
              <div className="space-y-2">
                <Label htmlFor="score">Your Score (1-10)</Label>
                <Input
                  id="score"
                  name="score"
                  type="number"
                  min="1"
                  max="10"
                  step="1"
                  placeholder="Rate from 1 to 10"
                  value={formData.score}
                  onChange={handleChange}
                />
                <p className="text-sm text-muted-foreground">
                  Rate in increments of 1
                </p>
              </div>

              {/* Review */}
              <div className="space-y-2">
                <Label htmlFor="review">Your Review</Label>
                <Textarea
                  id="review"
                  name="review"
                  placeholder="Share your thoughts about this media..."
                  rows={8}
                  value={formData.review}
                  onChange={handleChange}
                />
              </div>

              {/* Buttons */}
              <div className="flex gap-4 pt-2">
                <Button type="submit" disabled={saving} className="flex-1">
                  {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {saving ? 'Saving...' : 'Save Changes'}
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => navigate(`/media-user/${id}`)}
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

export default MediaUserEdit;