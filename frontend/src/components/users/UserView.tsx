import { useParams, Navigate, Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import Loading from "@/components/common/Loading";
import ErrorCard from "@/components/common/ErrorCard";
import { userService, ApiException } from "@/api";
import type { User } from "@/api";
import { useTabTitle } from "@/hooks/useTabTitle";

const UserView = () => {
  const { id } = useParams();
  const { current_user, is_authenticated, is_loading, logout } = useAuth();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const isOwnProfile = current_user?.id === parseInt(id || '0');

  // Set title
  useTabTitle((user?.username)
    ? `${user?.username} | Users`
    : 'Loading...'
  );

  useEffect(() => {
    const fetchUser = async () => {
      setLoading(true);
      setError('');
      
      try {
        const data = isOwnProfile 
          ? await userService.getProfile()
          : await userService.getUser(parseInt(id!));
        
        setUser(data);
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
      <ErrorCard 
        message={error}
        onRetry={() => window.location.reload()}
        retryText="Try Again"
      />
    );
  }

  // No user data
  if (!user) {
    return (
      <ErrorCard 
        message="User not found"
      />
    );
  }

  // Render profile
  return (
    <div className="container mx-auto px-4 py-4 max-w-4xl">
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
                <Link to={`/users/${id}/edit`}>Edit</Link>
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive">
                    Logout
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                      You will be logged out and redirected to the login page.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={logout}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      Logout
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
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