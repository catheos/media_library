import { useSearchParams, Navigate, useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import Loading from "@/components/common/Loading";
import ErrorCard from "@/components/common/ErrorCard";
import FormAlerts from "@/components/common/FormAlerts";
import { characterService, mediaCharacterService, ApiException } from "@/api";
import type { Character, MediaCharacterRole } from "@/api";
import { Check, ChevronsUpDown, Loader2, User } from "lucide-react";
import { cn } from "@/lib/utils";
import BackButton from "../common/BackButton";
import { useTabTitle } from "@/hooks/useTabTitle";

const MediaCharacterUpload = () => {
  const [searchParams] = useSearchParams();
  const mediaId = searchParams.get('media');
  const navigate = useNavigate();
  const { is_authenticated, is_loading } = useAuth();
  
  const [characters, setCharacters] = useState<Character[]>([]);
  const [roles, setRoles] = useState<MediaCharacterRole[]>([]);
  const [characterImages, setCharacterImages] = useState<Map<number, string>>(new Map());
  const [imagesFailed, setImagesFailed] = useState<Set<number>>(new Set());
  const [openCharacterCombobox, setOpenCharacterCombobox] = useState(false);
  const [selectedCharacterId, setSelectedCharacterId] = useState<string>("");
  const [openRoleCombobox, setOpenRoleCombobox] = useState(false);
  const [selectedRoleId, setSelectedRoleId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Set title
  useTabTitle('Upload | Characters');

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError('');
      
      try {
        const [charactersData, rolesData] = await Promise.all([
          characterService.getAll(),
          mediaCharacterService.getAllRoles()
        ]);
        
        setCharacters(charactersData.characters);
        setRoles(rolesData.roles);
      } catch (err) {
        if (err instanceof ApiException) {
          setError(err.message);
        } else {
          setError('An error occurred while loading data');
        }
      } finally {
        setLoading(false);
      }
    };

    if (is_authenticated) {
      fetchData();
    }
  }, [is_authenticated]);

  useEffect(() => {
    const fetchImages = async () => {
      for (const character of characters) {
        if (characterImages.has(character.id) || imagesFailed.has(character.id)) {
          continue;
        }

        try {
          const blob = await characterService.getSingleCover(character.id, true);
          const url = URL.createObjectURL(blob);
          setCharacterImages(prev => new Map(prev).set(character.id, url));
        } catch (err) {
          setImagesFailed(prev => new Set(prev).add(character.id));
        }
      }
    };

    if (characters.length > 0) {
      fetchImages();
    }

    return () => {
      characterImages.forEach(url => URL.revokeObjectURL(url));
    };
  }, [characters]);

  useEffect(() => {
    const characterIdParam = searchParams.get('character_id');
    if (characterIdParam && characters.length > 0) {
      const character = characters.find(c => c.id.toString() === characterIdParam);
      if (character) {
        setSelectedCharacterId(characterIdParam);
      }
    }
  }, [searchParams, characters]);

  useEffect(() => {
    const roleIdParam = searchParams.get('role_id');
    if (roleIdParam && roles.length > 0) {
      const role = roles.find(r => r.id.toString() === roleIdParam);
      if (role) {
        setSelectedRoleId(roleIdParam);
      }
    }
  }, [searchParams, roles]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    if (!mediaId) {
      setError('Media ID is missing');
      return;
    }
    
    if (!selectedCharacterId || !selectedRoleId) {
      setError('Please select both a character and a role');
      return;
    }
    
    setSubmitting(true);
    
    try {
      await mediaCharacterService.create(
        parseInt(mediaId),
        parseInt(selectedCharacterId),
        parseInt(selectedRoleId)
      );
      
      setSuccess('Character added successfully!');
      
      setTimeout(() => {
        navigate(`/media/${mediaId}`);
      }, 1500);
    } catch (err) {
      if (err instanceof ApiException) {
        setError(err.message);
      } else {
        setError('An error occurred while adding the character');
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

  if (!mediaId) {
    return (
      <ErrorCard 
        message="Media ID is required. Please navigate from a media page."
        onRetry={() => navigate('/media')}
        retryText="Go to Media List"
      />
    );
  }

  if (loading) {
    return <Loading fullScreen />;
  }

  const selectedCharacter = characters.find(
    (c) => c.id.toString() === selectedCharacterId
  );

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <div className="space-y-4">
        <BackButton
          to={`/media/${mediaId}`}
          label="Back to Media"
        />

        <Card>
          <CardHeader>
            <CardTitle className="text-3xl">Add Character to Media</CardTitle>
            <CardDescription>
              Select an existing character and assign them a role
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <FormAlerts error={error} success={success} />

              {/* Character Selection */}
              <div className="space-y-2">
                <Label>Select Character *</Label>
                <Popover open={openCharacterCombobox} onOpenChange={setOpenCharacterCombobox}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={openCharacterCombobox}
                      className="w-full justify-between"
                    >
                      {selectedCharacterId
                        ? characters.find((c) => c.id.toString() === selectedCharacterId)?.name
                        : "Select character..."}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
                    <Command>
                      <CommandInput placeholder="Search character..." className="h-9" />
                      <CommandList>
                        <CommandEmpty>
                          <div className="space-y-2">
                            <p className="text-sm text-muted-foreground">No character found.</p>
                            <Button size="sm" asChild>
                              <Link to={`/characters/upload?media_id=${mediaId}`}>
                                Create New Character
                              </Link>
                            </Button>
                          </div>
                        </CommandEmpty>
                        <CommandGroup>
                          {characters.map((character) => {
                            const imageUrl = characterImages.get(character.id);
                            const imageFailed = imagesFailed.has(character.id);
                            
                            return (
                              <CommandItem
                                key={character.id}
                                value={character.name}
                                onSelect={(currentValue) => {
                                  const selected = characters.find(c => c.name.toLowerCase() === currentValue.toLowerCase());
                                  setSelectedCharacterId(selected ? selected.id.toString() : "");
                                  setOpenCharacterCombobox(false);
                                }}
                              >
                                <div className="flex items-center gap-3 flex-1">
                                  <div className="bg-white aspect-[3/4] w-8 rounded bg-muted flex items-center justify-center overflow-hidden flex-shrink-0">
                                    {imageUrl ? (
                                      <img 
                                        src={imageUrl} 
                                        alt={character.name}
                                        className="w-full h-full object-cover"
                                      />
                                    ) : imageFailed ? (
                                      <User className="w-6 h-6 text-muted-foreground" />
                                    ) : (
                                      <div className="w-6 h-6">
                                        <Loading />
                                      </div>
                                    )}
                                  </div>
                                  <div className="flex flex-col">
                                    <span>{character.name}</span>
                                  </div>
                                </div>
                                <Check
                                  className={cn(
                                    "ml-auto",
                                    selectedCharacterId === character.id.toString() ? "opacity-100" : "opacity-0"
                                  )}
                                />
                              </CommandItem>
                            );
                          })}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>

              {/* Selected Character Preview */}
              {selectedCharacter && (
                <div className="p-4 bg-muted rounded-md">
                  <div className="flex items-start gap-4">
                    <div className="aspect-[3/4] w-16 rounded bg-background flex items-center justify-center overflow-hidden flex-shrink-0">
                      {characterImages.get(selectedCharacter.id) ? (
                        <img 
                          src={characterImages.get(selectedCharacter.id)} 
                          alt={selectedCharacter.name}
                          className="w-full h-full object-cover"
                        />
                      ) : imagesFailed.has(selectedCharacter.id) ? (
                        <User className="w-8 h-8 text-muted-foreground" />
                      ) : (
                        <Loading />
                      )}
                    </div>
                    <div className="space-y-2">
                      <h4 className="font-semibold">{selectedCharacter.name}</h4>
                      <p className="text-sm text-muted-foreground">
                        Created by{' '}
                        <Link 
                          to={`/users/${selectedCharacter.created_by.id}`}
                          className="text-primary hover:underline font-medium"
                        >
                          {selectedCharacter.created_by.username}
                        </Link>
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Role Selection */}
              <div className="space-y-2">
                <Label>Character Role *</Label>
                <Popover open={openRoleCombobox} onOpenChange={setOpenRoleCombobox}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={openRoleCombobox}
                      className="w-full justify-between"
                    >
                      {selectedRoleId
                        ? roles.find((r) => r.id.toString() === selectedRoleId)?.name
                        : "Select role..."}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
                    <Command>
                      <CommandInput placeholder="Search role..." className="h-9" />
                      <CommandList>
                        <CommandEmpty>
                          <div className="space-y-2">
                            <p className="text-sm text-muted-foreground">No role found.</p>
                            <Button size="sm" asChild>
                              <Link to={`/media-character/roles/upload?media_id=${mediaId}`}>
                                Create New Role
                              </Link>
                            </Button>
                          </div>
                        </CommandEmpty>
                        
                        <CommandGroup>
                          {roles.map((role) => (
                            <CommandItem
                              key={role.id}
                              value={role.name}
                              onSelect={(currentValue) => {
                                const selected = roles.find(r => r.name.toLowerCase() === currentValue.toLowerCase());
                                setSelectedRoleId(selected ? selected.id.toString() : "");
                                setOpenRoleCombobox(false);
                              }}
                            >
                              {role.name}
                              <Check
                                className={cn(
                                  "ml-auto",
                                  selectedRoleId === role.id.toString() ? "opacity-100" : "opacity-0"
                                )}
                              />
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4 pt-2">
                <Button
                  type="submit"
                  disabled={submitting || !selectedCharacterId || !selectedRoleId}
                  className="flex-1"
                >
                  {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {submitting ? 'Adding...' : 'Add Character'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate(`/media/${mediaId}`)}
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

export default MediaCharacterUpload;