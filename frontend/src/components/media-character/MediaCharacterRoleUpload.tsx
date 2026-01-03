import { useState } from 'react';
import { useSearchParams, useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { mediaCharacterService, ApiException } from '@/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import Loading from '@/components/common/Loading';
import FormAlerts from '@/components/common/FormAlerts';
import BackButton from '../common/BackButton';
import { useTabTitle } from '@/hooks/useTabTitle';

const MediaCharacterRoleUpload = () => {
  const { is_authenticated, is_loading } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const mediaId = searchParams.get('media_id');
  
  const [formData, setFormData] = useState({
    name: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Set title
  useTabTitle('Upload | Roles | Characters');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!formData.name.trim()) {
      setError('Role name is required');
      window.scrollTo(0, 0)
      return;
    }

    setSubmitting(true);

    try {
      const response = await mediaCharacterService.createRole(
        formData.name.trim(),
      );

      setSuccess('Role created successfully!');
      window.scrollTo(0, 0)
      
      setTimeout(() => {
        if (mediaId) {
          navigate(`/media-character/upload?media=${mediaId}&role_id=${response.role.id}`);
        } else {
          navigate(`/media-characters/roles/${response.role.id}`);
        }
      }, 1000);
    } catch (err) {
      if (err instanceof ApiException) {
        setError(err.message);
        window.scrollTo(0, 0)
      } else {
        setError('An error occurred. Please try again.');
        window.scrollTo(0, 0)
      }
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
      <div className="space-y-4">
        <BackButton
          to={mediaId ? `/media-character/upload?media=${mediaId}` : '/media-characters/roles'}
          label={mediaId ? 'Back to Add Character' : 'Back to Roles'}
        />

        <Card>
          <CardHeader>
            <CardTitle className="text-3xl">Create Character Role</CardTitle>
            <CardDescription>
              Add a new role for media characters
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <FormAlerts error={error} success={success} />

              <div className="space-y-2">
                <Label htmlFor="name">Role Name *</Label>
                <Input
                  id="name"
                  name="name"
                  type="text"
                  placeholder="e.g., Protagonist, Antagonist, Supporting"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  autoFocus
                />
                <p className="text-sm text-muted-foreground">
                  Enter a descriptive name for this character role
                </p>
              </div>

              <div className="flex gap-4 pt-2">
                <Button type="submit" disabled={submitting} className="flex-1">
                  {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {submitting ? 'Creating...' : 'Create Role'}
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => {
                    if (mediaId) {
                      navigate(`/media-character/upload?media=${mediaId}`);
                    } else {
                      navigate('/media-characters/roles');
                    }
                  }}
                  disabled={submitting}
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

export default MediaCharacterRoleUpload;