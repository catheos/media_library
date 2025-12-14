import { useParams, Navigate, Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Loading from "@/components/Loading";

interface UserData {
  id: number;
  username: string;
  created_at: string;
}

const UserView = () => {
  const { id } = useParams();
  const { current_user, is_authenticated, is_loading, logout } = useAuth();
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const isOwnProfile = current_user?.id === parseInt(id || '0');

  useEffect(() => {
    const fetchUser = async () => {
      setLoading(true);
      setError('');
      
      try {
        const endpoint = isOwnProfile 
          ? '/api/users/profile'
          : `/api/users/${id}`;
        
        const response = await fetch(import.meta.env.VITE_API_HOST + endpoint, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
        });

        const data = await response.json();

        if (!response.ok) {
          setError(data.error || 'Failed to load user');
          return;
        }

        setUser(data);
      } catch (err) {
        setError('An error occurred while loading the profile');
      } finally {
        setLoading(false);
      }
    };

    if (is_authenticated && id) {
      fetchUser();
    }
  }, [id, isOwnProfile, is_authenticated]);

  // Show loading while auth is initializing
  if (is_loading) {
    return <Loading fullScreen />;
  }

  // Not authenticated
  if (!is_authenticated) {
    return <Navigate to="/users/login" replace />;
  }

  // Loading state
  if (loading) {
    return <Loading fullScreen />;
  }

  // Error state
  if (error) {
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

  // No user data
  if (!user) {
    return (
      <div className="flex items-center justify-center py-8">
        <p>User not found</p>
      </div>
    );
  }

  // Render profile
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-3xl">{user.username}</CardTitle>
            {isOwnProfile && (
              <p className="text-sm text-muted-foreground mt-1">Your Profile</p>
            )}
          </div>
          {isOwnProfile && (
            <div className="flex gap-2">
              <Button variant="outline" asChild>
                <Link to={`/users/${id}/edit`}>Edit Profile</Link>
              </Button>
              <Button className="text-white" variant="destructive" onClick={logout}>
                Logout
              </Button>
            </div>
          )}
        </CardHeader>
        <CardContent className="space-y-6">
          {/* User Info Section */}
          <div>
            <h3 className="text-lg font-semibold mb-2">Profile Information</h3>
            <div className="space-y-2">
              <div className="flex justify-between py-2 border-b">
                <span className="text-muted-foreground">User ID:</span>
                <span className="font-medium">{user.id}</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-muted-foreground">Username:</span>
                <span className="font-medium">{user.username}</span>
              </div>
              {user.created_at && (
                <div className="flex justify-between py-2 border-b">
                  <span className="text-muted-foreground">Member Since:</span>
                  <span className="font-medium">
                    {new Date(user.created_at).toLocaleDateString()}
                  </span>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default UserView;