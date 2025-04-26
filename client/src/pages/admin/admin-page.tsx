import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { User, Post } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { toUndefinedFromNull } from "@/lib/utils";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Check, 
  Ban, 
  UserX, 
  Shield, 
  Trash2, 
  Loader2, 
  Users as UsersIcon, 
  FileTextIcon,
  BarChart3, 
  Settings, 
  Bell,
  Search,
  PanelLeft,
  LayoutDashboard
} from "lucide-react";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";

export default function AdminPage() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("users");
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [postToDelete, setPostToDelete] = useState<(Post & { author: User, likesCount?: number, commentsCount?: number }) | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  
  // Fetch all users
  const {
    data: users,
    isLoading: isLoadingUsers,
    error: usersError,
  } = useQuery<User[], Error>({
    queryKey: ["/api/admin/users"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/admin/users");
      return await res.json();
    },
  });
  
  // Fetch all posts with authors
  const {
    data: posts,
    isLoading: isLoadingPosts,
    error: postsError,
  } = useQuery<(Post & { author: User, likesCount?: number, commentsCount?: number })[], Error>({
    queryKey: ["/api/admin/posts"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/admin/posts");
      return await res.json();
    },
  });
  
  // Toggle user ban status
  const toggleBanMutation = useMutation({
    mutationFn: async (userId: number) => {
      const res = await apiRequest("PUT", `/api/admin/users/${userId}/ban`);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({
        title: "User status updated",
        description: "User ban status has been toggled successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update user status",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Delete user
  const deleteUserMutation = useMutation({
    mutationFn: async (userId: number) => {
      const res = await apiRequest("DELETE", `/api/admin/users/${userId}`);
      return await res.json();
    },
    onSuccess: () => {
      setUserToDelete(null);
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({
        title: "User deleted",
        description: "User has been removed successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to delete user",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Delete post
  const deletePostMutation = useMutation({
    mutationFn: async (postId: number) => {
      const res = await apiRequest("DELETE", `/api/admin/posts/${postId}`);
      return await res.json();
    },
    onSuccess: () => {
      setPostToDelete(null);
      queryClient.invalidateQueries({ queryKey: ["/api/admin/posts"] });
      toast({
        title: "Post deleted",
        description: "Post has been removed successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to delete post",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Helper to get initials for avatar
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  // Stats for dashboard
  const totalUsers = users?.length || 0;
  const totalPosts = posts?.length || 0;
  const bannedUsers = users?.filter(user => user.isBanned).length || 0;
  const activeUsers = totalUsers - bannedUsers;
  
  return (
    <div className="h-screen flex flex-col">
      {/* Top navbar */}
      <header className="border-b h-16 px-6 flex items-center justify-between bg-white shadow-sm">
        <div className="flex items-center">
          <Shield className="h-6 w-6 mr-2 text-primary" />
          <h1 className="text-xl font-bold">ConnectHub Admin</h1>
          <Button 
            variant="ghost" 
            size="icon" 
            className="ml-4"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          >
            <PanelLeft className="h-5 w-5" />
          </Button>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input 
              type="search" 
              placeholder="Search..." 
              className="w-64 pl-8 rounded-lg bg-slate-50" 
            />
          </div>
          
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="h-5 w-5" />
            <span className="absolute top-1 right-1 flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
            </span>
          </Button>
          
          <Separator orientation="vertical" className="h-8" />
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center space-x-2">
                <Avatar className="h-8 w-8">
                  <AvatarFallback>AD</AvatarFallback>
                </Avatar>
                <span>Admin</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>Profile</DropdownMenuItem>
              <DropdownMenuItem>Settings</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>Logout</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>
      
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <aside className={`bg-slate-50 border-r flex flex-col ${sidebarCollapsed ? 'w-16' : 'w-60'} transition-all duration-300`}>
          <div className="p-4">
            <nav className="space-y-2">
              <Button 
                variant={activeTab === "dashboard" ? "default" : "ghost"} 
                className={`w-full justify-start ${sidebarCollapsed ? 'justify-center px-0' : ''}`}
                onClick={() => setActiveTab("dashboard")}
              >
                <LayoutDashboard className="h-5 w-5 mr-2" />
                {!sidebarCollapsed && <span>Dashboard</span>}
              </Button>
              
              <Button 
                variant={activeTab === "users" ? "default" : "ghost"} 
                className={`w-full justify-start ${sidebarCollapsed ? 'justify-center px-0' : ''}`}
                onClick={() => setActiveTab("users")}
              >
                <UsersIcon className="h-5 w-5 mr-2" />
                {!sidebarCollapsed && <span>Users</span>}
              </Button>
              
              <Button 
                variant={activeTab === "posts" ? "default" : "ghost"} 
                className={`w-full justify-start ${sidebarCollapsed ? 'justify-center px-0' : ''}`}
                onClick={() => setActiveTab("posts")}
              >
                <FileTextIcon className="h-5 w-5 mr-2" />
                {!sidebarCollapsed && <span>Posts</span>}
              </Button>
              
              <Button 
                variant={activeTab === "analytics" ? "default" : "ghost"} 
                className={`w-full justify-start ${sidebarCollapsed ? 'justify-center px-0' : ''}`}
                onClick={() => setActiveTab("analytics")}
              >
                <BarChart3 className="h-5 w-5 mr-2" />
                {!sidebarCollapsed && <span>Analytics</span>}
              </Button>
              
              <Button 
                variant={activeTab === "settings" ? "default" : "ghost"} 
                className={`w-full justify-start ${sidebarCollapsed ? 'justify-center px-0' : ''}`}
                onClick={() => setActiveTab("settings")}
              >
                <Settings className="h-5 w-5 mr-2" />
                {!sidebarCollapsed && <span>Settings</span>}
              </Button>
            </nav>
          </div>
        </aside>
        
        {/* Main content */}
        <main className="flex-1 overflow-auto bg-slate-100 p-6">
          <div className="mb-6">
            <h1 className="text-2xl font-bold mb-2">
              {activeTab === "dashboard" && "Dashboard"}
              {activeTab === "users" && "User Management"}
              {activeTab === "posts" && "Content Management"}
              {activeTab === "analytics" && "Analytics"}
              {activeTab === "settings" && "Settings"}
            </h1>
            <p className="text-slate-500">
              {activeTab === "dashboard" && "Overview of your platform"}
              {activeTab === "users" && "Manage user accounts and permissions"}
              {activeTab === "posts" && "Review and moderate user content"}
              {activeTab === "analytics" && "View platform statistics and trends"}
              {activeTab === "settings" && "Configure system settings"}
            </p>
          </div>
          
          {/* Dashboard content */}
          {activeTab === "dashboard" && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
              <Card className="bg-white">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-500">Total Users</p>
                      <h3 className="text-3xl font-bold mt-1">{totalUsers}</h3>
                    </div>
                    <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-600">
                      <UsersIcon className="h-6 w-6" />
                    </div>
                  </div>
                  <div className="mt-4 text-sm text-slate-600">
                    <span className="text-green-500 font-medium">Active: {activeUsers}</span>
                    <span className="mx-2">|</span>
                    <span className="text-red-500 font-medium">Banned: {bannedUsers}</span>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-white">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-500">Total Posts</p>
                      <h3 className="text-3xl font-bold mt-1">{totalPosts}</h3>
                    </div>
                    <div className="h-12 w-12 bg-violet-100 rounded-full flex items-center justify-center text-violet-600">
                      <FileTextIcon className="h-6 w-6" />
                    </div>
                  </div>
                  <div className="mt-4 text-sm text-slate-600">
                    <span className="font-medium">Last 30 days</span>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-white">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-500">Engagement Rate</p>
                      <h3 className="text-3xl font-bold mt-1">68%</h3>
                    </div>
                    <div className="h-12 w-12 bg-amber-100 rounded-full flex items-center justify-center text-amber-600">
                      <BarChart3 className="h-6 w-6" />
                    </div>
                  </div>
                  <div className="mt-4 text-sm text-green-600">
                    <span className="font-medium">↑ 12% from last month</span>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-white">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-500">New Signups</p>
                      <h3 className="text-3xl font-bold mt-1">24</h3>
                    </div>
                    <div className="h-12 w-12 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600">
                      <UsersIcon className="h-6 w-6" />
                    </div>
                  </div>
                  <div className="mt-4 text-sm text-slate-600">
                    <span className="font-medium">This week</span>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="md:col-span-2 lg:col-span-4">
                <CardHeader className="pb-2">
                  <CardTitle>Recent Activity</CardTitle>
                  <CardDescription>Platform activity in the last 24 hours</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Placeholder for recent activity */}
                    <div className="flex items-start space-x-4 p-3 rounded-lg border bg-slate-50">
                      <div className="h-9 w-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                        <UsersIcon className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">New user registered</p>
                        <p className="text-xs text-slate-500">John Doe created an account</p>
                        <p className="text-xs text-slate-400 mt-1">2 hours ago</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start space-x-4 p-3 rounded-lg border bg-slate-50">
                      <div className="h-9 w-9 rounded-full bg-violet-100 flex items-center justify-center text-violet-600">
                        <FileTextIcon className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">New post created</p>
                        <p className="text-xs text-slate-500">User shared a new post about their vacation</p>
                        <p className="text-xs text-slate-400 mt-1">4 hours ago</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start space-x-4 p-3 rounded-lg border bg-slate-50">
                      <div className="h-9 w-9 rounded-full bg-red-100 flex items-center justify-center text-red-600">
                        <Ban className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">User reported</p>
                        <p className="text-xs text-slate-500">A post was reported for inappropriate content</p>
                        <p className="text-xs text-slate-400 mt-1">6 hours ago</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
          
          {/* Users tab content */}
          {activeTab === "users" && (
            <Card className="bg-white">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>User Management</CardTitle>
                  <CardDescription>
                    Manage user accounts. You can ban or delete users.
                  </CardDescription>
                </div>
                <div className="flex items-center space-x-2">
                  <Input 
                    type="search" 
                    placeholder="Search users..." 
                    className="w-64" 
                  />
                  <Button variant="outline" size="sm">
                    Filter
                  </Button>
                  <Button variant="default" size="sm">
                    Export
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {isLoadingUsers ? (
                  <div className="space-y-4">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <div key={i} className="flex items-center space-x-4">
                        <Skeleton className="h-12 w-12 rounded-full" />
                        <div className="space-y-2">
                          <Skeleton className="h-4 w-24" />
                          <Skeleton className="h-4 w-36" />
                        </div>
                        <div className="ml-auto space-x-2">
                          <Skeleton className="h-10 w-20" />
                          <Skeleton className="h-10 w-20" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : usersError ? (
                  <div className="text-center py-4 text-red-500">
                    <p>Error loading users. Please try again.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto -mx-6">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>User</TableHead>
                          <TableHead>Username</TableHead>
                          <TableHead>Joined</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {users?.map((user) => (
                          <TableRow key={user.id}>
                            <TableCell>
                              <div className="flex items-center space-x-3">
                                <Avatar>
                                  <AvatarImage src={toUndefinedFromNull(user.profileImage)} alt={user.name} />
                                  <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
                                </Avatar>
                                <div>
                                  <p className="font-medium">{user.name}</p>
                                  <p className="text-xs text-gray-500">ID: {user.id}</p>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>{user.username}</TableCell>
                            <TableCell>{format(new Date(user.createdAt), 'MMM d, yyyy')}</TableCell>
                            <TableCell>
                              {user.isBanned ? (
                                <Badge variant="destructive" className="flex items-center justify-center gap-1">
                                  <Ban className="h-3 w-3" />
                                  Banned
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 flex items-center justify-center gap-1">
                                  <Check className="h-3 w-3" />
                                  Active
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                <Button
                                  variant={user.isBanned ? "outline" : "secondary"}
                                  size="sm"
                                  onClick={() => toggleBanMutation.mutate(user.id)}
                                  disabled={user.id === 1 || toggleBanMutation.isPending}
                                >
                                  {toggleBanMutation.isPending ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : user.isBanned ? (
                                    "Unban"
                                  ) : (
                                    <span className="flex items-center">
                                      <UserX className="h-4 w-4 mr-1" />
                                      Ban
                                    </span>
                                  )}
                                </Button>
                                
                                <Dialog>
                                  <DialogTrigger asChild>
                                    <Button
                                      variant="destructive"
                                      size="sm"
                                      disabled={user.id === 1}
                                      onClick={() => setUserToDelete(user)}
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </DialogTrigger>
                                  <DialogContent>
                                    <DialogHeader>
                                      <DialogTitle>Delete User</DialogTitle>
                                      <DialogDescription>
                                        Are you sure you want to delete this user? This action cannot be undone.
                                      </DialogDescription>
                                    </DialogHeader>
                                    {userToDelete && (
                                      <div className="flex items-center space-x-3 my-4">
                                        <Avatar>
                                          <AvatarImage src={toUndefinedFromNull(userToDelete.profileImage)} alt={userToDelete.name} />
                                          <AvatarFallback>{getInitials(userToDelete.name)}</AvatarFallback>
                                        </Avatar>
                                        <div>
                                          <p className="font-medium">{userToDelete.name}</p>
                                          <p className="text-sm text-slate-500">@{userToDelete.username}</p>
                                        </div>
                                      </div>
                                    )}
                                    <DialogFooter>
                                      <DialogClose asChild>
                                        <Button variant="outline">Cancel</Button>
                                      </DialogClose>
                                      <Button
                                        variant="destructive"
                                        onClick={() => userToDelete && deleteUserMutation.mutate(userToDelete.id)}
                                        disabled={deleteUserMutation.isPending}
                                      >
                                        {deleteUserMutation.isPending ? (
                                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                        ) : (
                                          <Trash2 className="h-4 w-4 mr-2" />
                                        )}
                                        Delete User
                                      </Button>
                                    </DialogFooter>
                                  </DialogContent>
                                </Dialog>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                    {users && users.length === 0 && (
                      <div className="text-center py-10 text-slate-500">
                        <UsersIcon className="mx-auto h-12 w-12 text-slate-300" />
                        <p className="mt-2">No users found</p>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
              <CardFooter className="flex items-center justify-between">
                <div className="text-sm text-slate-500">
                  Showing <span className="font-medium">{users?.length || 0}</span> users
                </div>
                <div className="flex items-center space-x-2">
                  <Button variant="outline" size="sm" disabled>
                    Previous
                  </Button>
                  <Button variant="outline" size="sm" disabled>
                    Next
                  </Button>
                </div>
              </CardFooter>
            </Card>
          )}
          
          {/* Posts tab content */}
          {activeTab === "posts" && (
            <Card className="bg-white">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Content Management</CardTitle>
                  <CardDescription>
                    Monitor and manage all posts on the platform.
                  </CardDescription>
                </div>
                <div className="flex items-center space-x-2">
                  <Input 
                    type="search" 
                    placeholder="Search posts..." 
                    className="w-64" 
                  />
                  <Button variant="outline" size="sm">
                    Filter
                  </Button>
                  <Button variant="default" size="sm">
                    Export
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {isLoadingPosts ? (
                  <div className="space-y-4">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <div key={i} className="space-y-2">
                        <div className="flex items-center space-x-4">
                          <Skeleton className="h-12 w-12 rounded-full" />
                          <div className="space-y-2">
                            <Skeleton className="h-4 w-32" />
                            <Skeleton className="h-3 w-24" />
                          </div>
                        </div>
                        <Skeleton className="h-24 w-full" />
                        <div className="flex justify-between">
                          <Skeleton className="h-4 w-20" />
                          <Skeleton className="h-8 w-24" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : postsError ? (
                  <div className="text-center py-4 text-red-500">
                    <p>Error loading posts. Please try again.</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {posts?.map((post) => (
                      <Card key={post.id} className="overflow-hidden border border-slate-200">
                        <CardHeader className="p-4 bg-slate-50">
                          <div className="flex justify-between items-start">
                            <div className="flex items-center space-x-3">
                              <Avatar>
                                <AvatarImage src={toUndefinedFromNull(post.author.profileImage)} alt={post.author.name} />
                                <AvatarFallback>{getInitials(post.author.name)}</AvatarFallback>
                              </Avatar>
                              <div>
                                <div className="font-medium">{post.author.name}</div>
                                <div className="text-xs text-slate-500">
                                  {format(new Date(post.createdAt), 'MMM d, yyyy • h:mm a')}
                                </div>
                              </div>
                            </div>
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  onClick={() => setPostToDelete(post)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Delete Post</DialogTitle>
                                  <DialogDescription>
                                    Are you sure you want to delete this post? This action cannot be undone.
                                  </DialogDescription>
                                </DialogHeader>
                                <div className="my-4 p-4 bg-slate-50 rounded-md">
                                  <p className="font-medium mb-2">Post by {postToDelete?.author.name}</p>
                                  <p className="text-sm">{postToDelete?.content}</p>
                                </div>
                                <DialogFooter>
                                  <DialogClose asChild>
                                    <Button variant="outline">Cancel</Button>
                                  </DialogClose>
                                  <Button
                                    variant="destructive"
                                    onClick={() => postToDelete && deletePostMutation.mutate(postToDelete.id)}
                                    disabled={deletePostMutation.isPending}
                                  >
                                    {deletePostMutation.isPending ? (
                                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                    ) : (
                                      <Trash2 className="h-4 w-4 mr-2" />
                                    )}
                                    Delete Post
                                  </Button>
                                </DialogFooter>
                              </DialogContent>
                            </Dialog>
                          </div>
                        </CardHeader>
                        <CardContent className="p-4">
                          <p className="text-sm">{post.content}</p>
                        </CardContent>
                        <CardFooter className="p-3 bg-slate-50 flex justify-between text-xs text-slate-500 border-t">
                          <div className="flex gap-4">
                            <span>❤️ {post.likesCount || 0} likes</span>
                            <span>💬 {post.commentsCount || 0} comments</span>
                          </div>
                          <div className="flex items-center">
                            <Badge variant="outline" className="mr-2 text-xs">
                              ID: {post.id}
                            </Badge>
                            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                              Public
                            </Badge>
                          </div>
                        </CardFooter>
                      </Card>
                    ))}
                    
                    {posts && posts.length === 0 && (
                      <div className="text-center py-10 text-slate-500">
                        <FileTextIcon className="mx-auto h-12 w-12 text-slate-300" />
                        <p className="mt-2">No posts found</p>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
              <CardFooter className="flex items-center justify-between">
                <div className="text-sm text-slate-500">
                  Showing <span className="font-medium">{posts?.length || 0}</span> posts
                </div>
                <div className="flex items-center space-x-2">
                  <Button variant="outline" size="sm" disabled>
                    Previous
                  </Button>
                  <Button variant="outline" size="sm" disabled>
                    Next
                  </Button>
                </div>
              </CardFooter>
            </Card>
          )}
          
          {/* Analytics tab content */}
          {activeTab === "analytics" && (
            <Card className="bg-white">
              <CardHeader>
                <CardTitle>Platform Analytics</CardTitle>
                <CardDescription>
                  View detailed statistics and trends about your platform.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <div className="h-64 flex items-center justify-center bg-slate-50 rounded-lg border border-dashed">
                  <div className="text-center">
                    <BarChart3 className="h-10 w-10 mx-auto text-slate-300" />
                    <p className="mt-2 text-slate-500">Analytics dashboard coming soon</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
          
          {/* Settings tab content */}
          {activeTab === "settings" && (
            <Card className="bg-white">
              <CardHeader>
                <CardTitle>System Settings</CardTitle>
                <CardDescription>
                  Configure platform settings and preferences.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-medium mb-3">General Settings</h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between bg-slate-50 p-3 rounded-md">
                        <div>
                          <p className="font-medium">Maintenance Mode</p>
                          <p className="text-sm text-slate-500">Temporarily disable access to the platform</p>
                        </div>
                        <Button variant="outline">Enable</Button>
                      </div>
                      
                      <div className="flex items-center justify-between bg-slate-50 p-3 rounded-md">
                        <div>
                          <p className="font-medium">User Registration</p>
                          <p className="text-sm text-slate-500">Allow new users to register</p>
                        </div>
                        <Button variant="outline">Disable</Button>
                      </div>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div>
                    <h3 className="text-lg font-medium mb-3">Content Settings</h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between bg-slate-50 p-3 rounded-md">
                        <div>
                          <p className="font-medium">Content Moderation</p>
                          <p className="text-sm text-slate-500">Require approval for new posts</p>
                        </div>
                        <Button variant="outline">Enable</Button>
                      </div>
                      
                      <div className="flex items-center justify-between bg-slate-50 p-3 rounded-md">
                        <div>
                          <p className="font-medium">File Uploads</p>
                          <p className="text-sm text-slate-500">Allow users to upload files</p>
                        </div>
                        <Button variant="outline">Disable</Button>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </main>
      </div>
    </div>
  );
}