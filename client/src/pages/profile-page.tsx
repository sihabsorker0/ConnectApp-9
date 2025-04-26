import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { format } from "date-fns";
import { useParams, useLocation } from "wouter";
import MainLayout from "@/components/main-layout";
import PostCard from "@/components/post-card";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { User, PostWithAuthor } from "@shared/schema";
import { User as UserIcon, Settings, Calendar, Home, MapPin, Briefcase, Loader2, GraduationCap } from "lucide-react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import FriendList from '@/components/friend-list';
import { useForm } from 'react-hook-form';

export default function ProfilePage() {
  const params = useParams<{ userId: string }>();
  const userId = parseInt(params.userId);
  const { user: currentUser } = useAuth();
  const { toast } = useToast();
  const isOwnProfile = currentUser?.id === userId;
  const form = useForm();

  // Get profile user
  const { 
    data: profileUser,
    isLoading: isLoadingUser,
    isError: isErrorUser
  } = useQuery<User, Error>({
    queryKey: [`/api/users/${userId}`],
  });

  // Get user posts
  const {
    data: posts = [],
    isLoading: isLoadingPosts,
    isError: isErrorPosts
  } = useQuery<PostWithAuthor[], Error>({
    queryKey: [`/api/posts/user/${userId}`],
    enabled: !!profileUser,
  });

  const [sortedPosts, setSortedPosts] = useState<PostWithAuthor[]>([]);

  useEffect(() => {
    if (posts) {
      setSortedPosts([...posts]);
    }
  }, [posts]);

  // Check friend status
  const {
    data: friendStatus,
    isLoading: isLoadingFriendStatus
  } = useQuery<{ status: string } | null, Error>({
    queryKey: [`/api/friends/status/${userId}`],
    enabled: !isOwnProfile && !!currentUser,
    queryFn: async () => {
      try {
        const res = await fetch(`/api/friends/status/${userId}`, {
          credentials: "include",
        });

        if (res.status === 404) {
          return null;
        }

        if (!res.ok) {
          throw new Error("Failed to fetch friend status");
        }

        return await res.json();
      } catch (error) {
        return null;
      }
    }
  });

  // Send friend request mutation
  const sendFriendRequestMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/friends/request", { friendId: userId });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/friends/status/${userId}`] });
      toast({
        title: "Friend request sent",
        description: `A friend request has been sent to ${profileUser?.name}`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to send friend request",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSendFriendRequest = () => {
    sendFriendRequestMutation.mutate();
  };

  // Get initials for avatar fallback
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  if (isLoadingUser) {
    return (
      <MainLayout hideRightSidebar>
        <ProfileSkeleton />
      </MainLayout>
    );
  }

  if (isErrorUser || !profileUser) {
    return (
      <MainLayout hideRightSidebar>
        <Card>
          <CardContent className="p-6 text-center">
            <p>Failed to load user profile. User may not exist or you may not have permission to view it.</p>
            <Button className="mt-2" onClick={() => window.location.reload()}>
              Retry
            </Button>
          </CardContent>
        </Card>
      </MainLayout>
    );
  }

  const hasFriendConnection = friendStatus !== null;
  const isPendingFriendRequest = hasFriendConnection && friendStatus?.status === "pending";
  const isAcceptedFriend = hasFriendConnection && friendStatus?.status === "accepted";

  return (
    <MainLayout hideRightSidebar>
      {/* Cover and Profile */}
      <Card className="mb-5 overflow-hidden">
        <div className="h-56 relative bg-gray-100">
          {profileUser.coverColor ? (
            <div 
              className="absolute inset-0 w-full h-full" 
              style={{ backgroundColor: profileUser.coverColor }}
            />
          ) : (
            <div className="absolute inset-0 w-full h-full">
              <img 
                src={profileUser.coverImage || "https://images.unsplash.com/photo-1614850523060-8da1d56ae167?w=1200&fit=crop"} 
                alt="Cover"
                className="w-full h-full object-cover"
                style={{
                  maxWidth: '100%',
                  maxHeight: '100%',
                  display: 'block',
                  backgroundColor: 'transparent'
                }}
                onError={(e) => {
                  e.currentTarget.src = "https://images.unsplash.com/photo-1614850523060-8da1d56ae167?w=1200&fit=crop";
                }}
              />
            </div>
          )}

          <div className="absolute -bottom-16 left-4 sm:left-8">
            <Avatar className="h-32 w-32 border-4 border-white bg-gray-100">
              <AvatarImage 
                src={profileUser.profileImage || "https://www.gravatar.com/avatar/default?s=200&d=mp"} 
                alt={profileUser.name}
                className="object-cover" 
              />
              <AvatarFallback>{getInitials(profileUser.name)}</AvatarFallback>
            </Avatar>
          </div>
        </div>

        <CardContent className="pt-20 pb-6">
          <div className="flex flex-col sm:flex-row justify-between">
            <div>
              <h1 className="text-2xl font-bold">{profileUser.name}</h1>
              <p className="text-slate-500">{profileUser.bio || "No bio available"}</p>

              <div className="flex flex-wrap gap-4 mt-3 text-sm text-slate-500">
                {profileUser.currentCity && (
                  <div className="flex items-center">
                    <Home className="h-4 w-4 mr-1" />
                    <span>Lives in {profileUser.currentCity}</span>
                  </div>
                )}
                {profileUser.hometown && (
                  <div className="flex items-center">
                    <MapPin className="h-4 w-4 mr-1" />
                    <span>From {profileUser.hometown}</span>
                  </div>
                )}
                {profileUser.work && (
                  <div className="flex items-center">
                    <Briefcase className="h-4 w-4 mr-1" />
                    <span>{profileUser.work}</span>
                  </div>
                )}
                {profileUser.education && (
                  <div className="flex items-center">
                    <GraduationCap className="h-4 w-4 mr-1" />
                    <span>{profileUser.education}</span>
                  </div>
                )}
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 mr-1" />
                  <span>Joined {format(new Date(profileUser.createdAt), 'MMMM yyyy')}</span>
                </div>
              </div>
            </div>

            <div className="mt-4 sm:mt-0 flex items-start gap-2">
              {isOwnProfile ? (
                <>
                  <Button
                    variant="outline"
                    className="flex items-center gap-2"
                    onClick={() => {
                      navigator.clipboard.writeText(userId.toString());
                      toast({
                        title: "User ID copied to clipboard",
                        description: `Your user ID is ${userId}`
                      });
                    }}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
                    <span>Copy ID</span>
                  </Button>
                  <Dialog>
                  <DialogTrigger asChild>
                    <Button className="flex items-center gap-2">
                      <Settings className="h-4 w-4" />
                      <span>Edit Profile</span>
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Edit Profile</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={async (e) => {
                      e.preventDefault();
                      const formData = new FormData(e.currentTarget);
                      try {
                        const updateData = {
                          name: formData.get('name') as string || profileUser.name,
                          bio: formData.get('bio') as string || profileUser.bio,
                          work: formData.get('work') as string || profileUser.work,
                          education: formData.get('education') as string || profileUser.education,
                          currentCity: formData.get('currentCity') as string || profileUser.currentCity,
                          hometown: formData.get('hometown') as string || profileUser.hometown,
                        };

                        const res = await fetch('/api/user/profile', {
                          method: 'PUT',
                          headers: { 'Content-Type': 'application/json' },
                          credentials: 'include',
                          body: JSON.stringify(updateData)
                        });
                        if (!res.ok) throw new Error('Failed to update profile');
                        await queryClient.invalidateQueries({ queryKey: [`/api/users/${userId}`] });
                        await queryClient.invalidateQueries({ queryKey: ['/api/user'] });
                        toast({ title: 'Profile updated successfully' });
                      } catch (error) {
                        toast({ 
                          title: 'Failed to update profile',
                          variant: 'destructive'
                        });
                      }
                    }}>
                      <div className="space-y-4 py-4">
                        <div className="space-y-2">
                          <Label htmlFor="name">Name</Label>
                          <div className="space-y-2">
                            <Input
                              id="name"
                              name="name"
                              defaultValue={profileUser.name}
                            />
                            <p className="text-xs text-muted-foreground">
                              Once changed, you won't be able to change your name again for 15 days
                            </p>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="bio">Bio</Label>
                          <Textarea
                            id="bio"
                            name="bio"
                            defaultValue={profileUser.bio || ''}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="profileImage">Profile Image</Label>
                          <div className="flex items-center gap-2">
                            <Input
                              type="file"
                              accept="image/*"
                              name="profileImage"
                              onChange={async (e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  if (file.size > 25 * 1024 * 1024) {
                                    toast({
                                      title: 'Image too large',
                                      description: 'Maximum size is 25MB',
                                      variant: 'destructive'
                                    });
                                    return;
                                  }

                                  const formData = new FormData();
                                  formData.append('image', file);
                                  try {
                                    const res = await fetch('/api/user/profile/image', {
                                      method: 'POST',
                                      credentials: 'include',
                                      body: formData
                                    });
                                    if (!res.ok) throw new Error('Failed to upload image');
                                    const data = await res.json();
                                    form.setValue('profileImage', data.imageUrl);

                                    // Refresh profile data
                                    await queryClient.invalidateQueries({ queryKey: [`/api/users/${userId}`] });
                                    toast({
                                      title: 'Profile image updated successfully'
                                    });
                                  } catch (error) {
                                    toast({
                                      title: 'Failed to upload image',
                                      variant: 'destructive'
                                    });
                                  }
                                }
                              }}
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="coverImage">Cover Image</Label>
                          <div className="flex items-center gap-2">
                            <Input
                              type="file"
                              accept="image/*"
                              name="coverImage"
                              onChange={async (e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  if (file.size > 25 * 1024 * 1024) {
                                    toast({
                                      title: 'Image too large',
                                      description: 'Maximum size is 25MB',
                                      variant: 'destructive'
                                    });
                                    return;
                                  }

                                  const formData = new FormData();
                                  formData.append('image', file);
                                  try {
                                    const res = await fetch('/api/user/profile/cover', {
                                      method: 'POST',
                                      credentials: 'include',
                                      body: formData
                                    });
                                    if (!res.ok) throw new Error('Failed to upload cover');
                                    const data = await res.json();

                                    // Update the profile with the new cover image
                                    const updateData = {
                                      ...profileUser,
                                      coverImage: data.imageUrl
                                    };

                                    const profileRes = await fetch('/api/user/profile', {
                                      method: 'PUT',
                                      headers: { 'Content-Type': 'application/json' },
                                      credentials: 'include',
                                      body: JSON.stringify(updateData)
                                    });

                                    if (!profileRes.ok) throw new Error('Failed to update profile');

                                    // Force refresh queries
                                    await queryClient.invalidateQueries({ queryKey: [`/api/users/${userId}`] });
                                    await queryClient.invalidateQueries({ queryKey: ['/api/user'] });

                                    // Update local state
                                    form.setValue('coverImage', data.imageUrl);

                                    toast({
                                      title: 'Cover image updated successfully'
                                    });
                                  } catch (error) {
                                    toast({
                                      title: 'Failed to upload cover image',
                                      variant: 'destructive'
                                    });
                                  }
                                }
                              }}
                            />
                          </div>
                        </div>
                      </div>
                      <DialogFooter>
                        <Button type="submit">Save Changes</Button>
                      </DialogFooter>
                    </form>
                  </DialogContent>
                </Dialog>
                </>
              ) : (
                <>
                  {isPendingFriendRequest ? (
                    <Button variant="outline" disabled>
                      Friend Request Sent
                    </Button>
                  ) : isAcceptedFriend ? (
                    <Button variant="outline">
                      <UserIcon className="h-4 w-4 mr-2" />
                      <span>Friends</span>
                    </Button>
                  ) : (
                    <Button 
                      className="flex items-center gap-2"
                      onClick={handleSendFriendRequest}
                      disabled={sendFriendRequestMutation.isPending}
                    >
                      {sendFriendRequestMutation.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <UserIcon className="h-4 w-4" />
                      )}
                      <span>Add Friend</span>
                    </Button>
                  )}
                  <Button variant="outline">Message</Button>
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Content tabs */}
      <Tabs defaultValue="posts">
        <Card>
          <CardHeader className="p-0">
            <TabsList className="w-full justify-start rounded-none border-b bg-transparent">
              <TabsTrigger value="posts" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent">
                Posts
              </TabsTrigger>
              <TabsTrigger value="about" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent">
                About
              </TabsTrigger>
              <TabsTrigger value="friends" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent">
                Friends
              </TabsTrigger>
              <TabsTrigger value="photos" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent">
                Photos
              </TabsTrigger>
              <TabsTrigger value="videos" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent">
                Videos
              </TabsTrigger>
            </TabsList>
          </CardHeader>
        </Card>

        <TabsContent value="posts" className="mt-4 space-y-4">
          {isLoadingPosts ? (
            <>
              <PostSkeleton />
              <PostSkeleton />
            </>
          ) : isErrorPosts ? (
            <Card>
              <CardContent className="p-6 text-center">
                <p>Failed to load posts. Please try again later.</p>
                <Button className="mt-2" onClick={() => window.location.reload()}>
                  Retry
                </Button>
              </CardContent>
            </Card>
          ) : posts.length === 0 ? (
            <Card>
              <CardContent className="p-6 text-center">
                <p>No posts yet.</p>
                {isOwnProfile && (
                  <p className="mt-2">Create your first post to share with friends!</p>
                )}
              </CardContent>
            </Card>
          ) : (
            <div>
              {posts.map((post) => (
                <PostCard key={post.id} post={post} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="about" className="mt-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-xl font-semibold">About {profileUser.name}</h2>
                {isOwnProfile && (
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="ghost" size="sm" className="text-slate-600">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>
                        <span className="ml-2">Edit</span>
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Edit Profile</DialogTitle>
                      </DialogHeader>
                      <form onSubmit={async (e) => {
                        e.preventDefault();
                        const formData = new FormData(e.currentTarget);
                        try {
                          const formValues = {
                            name: profileUser.name,
                            bio: formData.get('bio'),
                            work: formData.get('work'),
                            education: formData.get('education'),
                            currentCity: formData.get('currentCity'),
                            hometown: formData.get('hometown'),
                            profileImage: profileUser.profileImage,
                            coverImage: profileUser.coverImage
                          };

                          const res = await fetch('/api/user/profile', {
                            method: 'PUT',
                            headers: { 'Content-Type': 'application/json' },
                            credentials: 'include',
                            body: JSON.stringify(formValues)
                          });
                          if (!res.ok) throw new Error('Failed to update profile');
                          await queryClient.invalidateQueries({ queryKey: [`/api/users/${userId}`] });
                          await queryClient.invalidateQueries({ queryKey: ['/api/user'] });
                          toast({ title: 'Profile updated successfully' });
                        } catch (error) {
                          toast({ 
                            title: 'Failed to update profile',
                            variant: 'destructive'
                          });
                        }
                      }}>
                        <div className="space-y-4 py-4">
                          <div className="space-y-2">
                            <Label htmlFor="bio">Bio</Label>
                            <Textarea
                              id="bio"
                              name="bio"
                              defaultValue={profileUser.bio || ''}
                              placeholder="Write something about yourself..."
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="work">Work</Label>
                            <Input id="work" name="work" defaultValue={profileUser.work || ''} />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="education">Education</Label>
                            <Input id="education" name="education" defaultValue={profileUser.education || ''} />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="currentCity">Current City</Label>
                            <Input id="currentCity" name="currentCity" defaultValue={profileUser.currentCity || ''} />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="hometown">Hometown</Label>
                            <Input id="hometown" name="hometown" defaultValue={profileUser.hometown || ''} />
                          </div>
                        </div>
                        <DialogFooter>
                          <Button type="submit">Save Changes</Button>
                        </DialogFooter>
                      </form>
                    </DialogContent>
                  </Dialog>
                )}
              </div>
              <p className="text-slate-600 mb-6">
                {profileUser.bio || "No bio information available."}
              </p>

              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-medium mb-2">Work</h3>
                  <p>{profileUser.work || "No work information available."}</p>
                </div>
                <div>
                  <h3 className="text-lg font-medium mb-2">Education</h3>
                  <p>{profileUser.education || "No education information available."}</p>
                </div>
                <div>
                  <h3 className="text-lg font-medium mb-2">Current City</h3>
                  <p>{profileUser.currentCity || "No current city information available."}</p>
                </div>
                <div>
                  <h3 className="text-lg font-medium mb-2">Hometown</h3>
                  <p>{profileUser.hometown || "No hometown information available."}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="friends" className="mt-4">
          <Card>
            <CardContent className="p-6">
              <h2 className="text-xl font-semibold mb-4">Friends</h2>
              <FriendList userId={userId} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="photos" className="mt-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Photos</h2>
                <Select defaultValue="newest" onValueChange={(value) => {
                  const newSortedPosts = [...(posts || [])].sort((a, b) => {
                    if (value === "newest") return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
                    return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
                  });
                  setSortedPosts(newSortedPosts);
                }}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newest">Newest First</SelectItem>
                    <SelectItem value="oldest">Oldest First</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {isLoadingPosts ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {[...Array(4)].map((_, i) => (
                    <Skeleton key={i} className="aspect-square rounded-lg" />
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {profileUser.profileImage && profileUser.profileImage !== "https://www.gravatar.com/avatar/default?s=200&d=mp" && (
                  <div className="aspect-square relative overflow-hidden rounded-lg">
                    <img 
                      src={profileUser.profileImage} 
                      alt="Profile" 
                      className="object-cover w-full h-full"
                    />
                  </div>
                )}
                {profileUser.coverImage && profileUser.coverImage !== "https://images.unsplash.com/photo-1614850523060-8da1d56ae167?w=1200&fit=crop" && (
                  <div className="aspect-square relative overflow-hidden rounded-lg">
                    <img 
                      src={profileUser.coverImage} 
                      alt="Cover" 
                      className="object-cover w-full h-full"
                    />
                  </div>
                )}
                {sortedPosts.map((post) => 
                  post.image && !post.image.startsWith('data:video') && (
                    <div key={post.id} className="aspect-square relative overflow-hidden rounded-lg">
                      <img 
                        src={post.image.startsWith('data:image') ? post.image : `data:image/jpeg;base64,${post.image}`}
                        alt={`Post ${post.id}`} 
                        className="object-cover w-full h-full"
                      />
                    </div>
                  )
                )}
                {!profileUser.profileImage && !profileUser.coverImage && (!posts || !posts.some(post => post.image && !post.image.startsWith('data:video'))) && (
                  <p className="text-slate-500 col-span-full">No photos uploaded yet.</p>
                )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="videos" className="mt-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Videos</h2>
                <Select defaultValue="newest" onValueChange={(value) => {
                  const newSortedPosts = [...(posts || [])].sort((a, b) => {
                    if (value === "newest") return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
                    return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
                  });
                  setSortedPosts(newSortedPosts);
                }}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newest">Newest First</SelectItem>
                    <SelectItem value="oldest">Oldest First</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {isLoadingPosts ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {[...Array(4)].map((_, i) => (
                    <Skeleton key={i} className="aspect-square rounded-lg" />
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {sortedPosts.map((post) => 
                  post.image && post.image.startsWith('data:video') && (
                    <div key={post.id} className="aspect-square relative overflow-hidden rounded-lg">
                      <video 
                        controls
                        preload="metadata"
                        className="w-full h-full object-cover"
                        src={post.image}
                        type={post.image.split(';')[0].split(':')[1]}
                      >
                        Your browser does not support video playback.
                      </video>
                    </div>
                  )
                )}
                {!posts || !posts.some(post => post.image && post.image.startsWith('data:video')) && (
                  <p className="text-slate-500 col-span-full">No videos uploaded yet.</p>
                )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </MainLayout>
  );
}

function ProfileSkeleton() {
  return (
    <>
      <Card className="mb-5 overflow-hidden">
        <Skeleton className="h-56 w-full" />
        <CardContent className="pt-20 pb-6">
          <div className="absolute -top-16 left-8">
            <Skeleton className="h-32 w-32 rounded-full" />
          </div>
          <div>
            <Skeleton className="h-8 w-48 mb-2" />
            <Skeleton className="h-4 w-96 mb-4" />
            <div className="flex gap-4 mt-3">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-5 w-32" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="p-4">
          <div className="flex gap-2">
            <Skeleton className="h-10 w-24" />
            <Skeleton className="h-10 w-24" />
            <Skeleton className="h-10 w-24" />
          </div>
        </CardHeader>
      </Card>

      <div className="mt-4 space-y-4">
        <PostSkeleton />
        <PostSkeleton />
      </div>
    </>
  );
}

function PostSkeleton() {
  return (
    <Card className="mb-4">
      <CardContent className="p-4">
        <div className="flex items-start space-x-2">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-24" />
          </div>
        </div>
        <div className="mt-4 space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </div>
        <Skeleton className="h-64 w-full mt-4" />
      </CardContent>
    </Card>
  );
}