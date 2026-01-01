import { useParams, Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import Loading from "@/components/common/Loading";
import ErrorCard from "@/components/common/ErrorCard";
import FormAlerts from "@/components/common/FormAlerts";
import { userService, ApiException } from "@/api";
import type { User } from "@/api";
import BackButton from "../common/BackButton";
import { useTabTitle } from "@/hooks/useTabTitle";

const UserEdit = () => {
  const { id } = useParams();
  const { current_user, is_authenticated, is_loading, login } = useAuth();
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [formData, setFormData] = useState({
    username: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const isOwnProfile = current_user?.id === parseInt(id || '0');

  // Set title
  useTabTitle((user?.username)
    ? `Edit | ${user?.username} | Users`
    : 'Loading...'
  );

  useEffect(() => {
    const fetchUser = async () => {
      setLoading(true);
      setError('');
      
      try {
        const data = await userService.getProfile();
        setUser(data);
        setFormData(prev => ({ ...prev, username: data.username }));
      } catch (err) {
        if (err instanceof ApiException) {
          setError(err.message);
        } else {
          setError('An error occurred while loading the profile');
        }
      } finally {
        setLoading(false);
      }
    };

    if (is_authenticated && id && isOwnProfile) {
      fetchUser();
    }
  }, [id, isOwnProfile, is_authenticated]);

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

    // Validate passwords if trying to change password
    if (formData.newPassword) {
      if (formData.newPassword !== formData.confirmPassword) {
        setError('New passwords do not match');
        return;
      }
      if (!formData.currentPassword) {
        setError('Current password is required to change password');
        return;
      }
    }

    setSaving(true);

    try {
      // Build body with ONLY changed fields
      const body: any = {};
      
      // Compare formData to original user data
      Object.keys(formData).forEach(key => {
        const formValue = formData[key as keyof typeof formData];
        const originalValue = user?.[key as keyof User];
        
        // Only include if value changed and not empty password fields
        if (key === 'currentPassword' || key === 'newPassword' || key === 'confirmPassword') {
          // Handle password fields separately (only if changing password)
          if (formData.newPassword && formData.currentPassword) {
            if (key !== 'confirmPassword') {
              body[key] = formValue;
            }
          }
        } else if (formValue !== originalValue) {
          body[key] = formValue;
        }
      });

      // Don't send request if nothing changed
      if (Object.keys(body).length === 0) {
        setError('No changes to save');
        return;
      }

      const data = await userService.updateProfile(body);

      // Update auth context if username changed
      if (data.user) {
        login(localStorage.getItem('token') || '', data.user);
      }

      setSuccess(data.message);
      
      // Clear password fields
      setFormData(prev => ({
        ...prev,
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      }));

      // Redirect after 2 seconds
      setTimeout(() => {
        navigate(`/users/${id}`);
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

  // Not own profile
  if (!isOwnProfile) {
    return <Navigate to={`/users/${id}`} replace />;
  }

  // Loading user data
  if (loading) {
    return <Loading fullScreen />;
  }

  // Error state
  if (error && !user) {
    return (
      <ErrorCard 
        message={error}
        onRetry={() => window.location.reload()}
        retryText="Try Again"
      />
    );
  }

  return (
    <div className="container mx-auto px-4 py-4 max-w-4xl">
      <BackButton
        to={`/users/${id}`}
        label="Back to User View"
      />
      
      <Card>
        <CardHeader>
          <CardTitle className="text-3xl">Edit Profile</CardTitle>
          <p className="text-sm text-muted-foreground mt-1">
            Update your account information
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <FormAlerts error={error} success={success} />

            {/* Username */}
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                name="username"
                type="text"
                value={formData.username}
                onChange={handleChange}
                required
                autoFocus
              />
            </div>

            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold mb-4">Change Password</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Leave blank to keep current password
              </p>

              <div className="space-y-4">
                {/* Current Password */}
                <div className="space-y-2">
                  <Label htmlFor="currentPassword">Current Password</Label>
                  <Input
                    id="currentPassword"
                    name="currentPassword"
                    type="password"
                    placeholder="••••••••"
                    value={formData.currentPassword}
                    onChange={handleChange}
                  />
                </div>

                {/* New Password */}
                <div className="space-y-2">
                  <Label htmlFor="newPassword">New Password</Label>
                  <Input
                    id="newPassword"
                    name="newPassword"
                    type="password"
                    placeholder="••••••••"
                    value={formData.newPassword}
                    onChange={handleChange}
                  />
                </div>

                {/* Confirm New Password */}
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm New Password</Label>
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    placeholder="••••••••"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                  />
                </div>
              </div>
            </div>

            {/* Buttons */}
            <div className="flex gap-3 pt-4">
              <Button type="submit" disabled={saving} className="flex-1">
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => navigate(`/users/${id}`)}
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

export default UserEdit;