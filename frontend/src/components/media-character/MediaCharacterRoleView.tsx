import { useParams, Navigate, Link, useNavigate } from "react-router-dom";
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
import Loading from "@/components/Loading";
import { mediaCharacterService, ApiException } from "@/api";
import type { MediaCharacterRole } from "@/api";

const MediaCharacterRoleView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { current_user, is_authenticated, is_loading } = useAuth();
  const [role, setRole] = useState<MediaCharacterRole | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleting, setDeleting] = useState(false);

  const isOwner = current_user?.id === role?.created_by.id;

  useEffect(() => {
    const fetchRole = async () => {
      setLoading(true);
      setError('');
      
      try {
        const data = await mediaCharacterService.getSingleRole(parseInt(id!));
        setRole(data);
      } catch (err) {
        if (err instanceof ApiException) {
          setError(err.message);
        } else {
          setError('An error occurred while loading the role');
        }
      } finally {
        setLoading(false);
      }
    };

    if (is_authenticated && id) {
      fetchRole();
    }
  }, [id, is_authenticated]);

  const handleDelete = async () => {
    setDeleting(true);
    
    try {
      await mediaCharacterService.deleteRole(parseInt(id!));
      navigate('/media-characters/roles');
    } catch (err) {
      if (err instanceof ApiException) {
        setError(err.message);
      } else {
        setError('An error occurred while deleting the role');
      }
      setDeleting(false);
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

  if (!role) {
    return (
      <div className="flex items-center justify-center py-8">
        <p>Role not found</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <CardTitle className="text-3xl capitalize">{role.name}</CardTitle>
            {isOwner && (
              <div className="flex gap-2">
                <Button variant="outline" size="sm" asChild>
                  <Link to={`/media-characters/roles/${id}/edit`}>Edit</Link>
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button 
                      variant="destructive" 
                      size="sm"
                      disabled={deleting}
                    >
                      {deleting ? 'Deleting...' : 'Delete'}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will permanently delete the "{role.name}" role. This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleDelete}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold mb-2">Role Information</h3>
            <div className="space-y-2">
              <div className="flex gap-2">
                <span className="font-medium">ID:</span>
                <span className="text-muted-foreground">{role.id}</span>
              </div>
              <div className="flex gap-2">
                <span className="font-medium">Name:</span>
                <span className="text-muted-foreground capitalize">{role.name}</span>
              </div>
            </div>
          </div>

          {role.created_by && (
            <div className="pt-4 border-t">
              <p className="text-sm text-muted-foreground">
                Created by{' '}
                <Link 
                  to={`/users/${role.created_by.id}`}
                  className="text-primary hover:underline font-medium"
                >
                  {role.created_by.username}
                </Link>
              </p>
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <Button variant="outline" asChild className="flex-1">
              <Link to="/media-characters/roles">
                Back to Roles List
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default MediaCharacterRoleView;