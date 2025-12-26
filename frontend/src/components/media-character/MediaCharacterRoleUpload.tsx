import { useState } from 'react';
import { useSearchParams, useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { mediaCharacterService, ApiException } from '@/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import Loading from '@/components/Loading';

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
      return;
    }

    setSubmitting(true);

    try {
      const response = await mediaCharacterService.createRole(
        formData.name.trim(),
      );

      setSuccess('Role created successfully!');
      
      setTimeout(() => {
        if (mediaId) {
          navigate(`/media-character/upload?media=${mediaId}&role_id=${response.role.id}`);
        } else {
          navigate(`/media-characters/roles/${response.role.id}`);
        }
      }, 1500);
    } catch (err) {
      if (err instanceof ApiException) {
        setError(err.message);
      } else {
        setError('An error occurred. Please try again.');
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
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle className="text-3xl">Create Character Role</CardTitle>
          <CardDescription>
            Add a new role for media characters
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

            <div className="flex gap-3 pt-4">
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
  );
};

export default MediaCharacterRoleUpload;