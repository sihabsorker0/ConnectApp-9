import { useQuery } from "@tanstack/react-query";
import MainLayout from "@/components/main-layout";
import CreatePost from "@/components/create-post";
import PostCard from "@/components/post-card";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/use-auth";
import { PostWithAuthor } from "@shared/schema";
import { Plus, Video } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

function StoryCard({ isCreateStory = false }: { isCreateStory?: boolean }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };
  
  if (isCreateStory) {
    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        if (file.type.startsWith('image/') || file.type.startsWith('video/')) {
          if (file.size > 100 * 1024 * 1024) {
            alert('File size must be less than 100MB');
            return;
          }

          try {
            const formData = new FormData();
            formData.append('media', file);

            const response = await fetch('/api/stories', {
              method: 'POST',
              body: formData,
              credentials: 'include'
            });

            const data = await response.json();

            if (!response.ok) {
              throw new Error(data.message || 'Failed to upload story');
            }

            queryClient.invalidateQueries({ queryKey: ["/api/stories"] });
            toast({
              title: "Story uploaded successfully!",
              description: "Your story is now visible to your friends"
            });
          } catch (error) {
            toast({
              title: "Failed to upload story",
              description: error instanceof Error ? error.message : "Please try again",
              variant: "destructive"
            });
          }
        } else {
          toast({
            title: "Invalid file type",
            description: "Please select an image or video file",
            variant: "destructive"
          });
        }
      }
    };

    return (
      <label className="flex-shrink-0 w-28 h-44 relative rounded-xl overflow-hidden cursor-pointer group">
        <input 
          type="file" 
          className="hidden" 
          accept="image/*,video/*"
          onChange={handleFileUpload}
        />
        <div className="absolute inset-0 bg-slate-200"></div>
        <div className="absolute inset-x-0 bottom-0 h-24 bg-white p-2 flex flex-col items-center justify-center text-center">
          <div className="w-8 h-8 rounded-full bg-primary-500 text-white flex items-center justify-center -mt-8 mb-1 border-4 border-white">
            <Plus className="h-4 w-4" />
          </div>
          <span className="text-sm font-medium">Create Story</span>
        </div>
      </label>
    );
  }
  
  return (
    <div className="flex-shrink-0 w-20 h-32 md:w-28 md:h-44 relative rounded-xl overflow-hidden cursor-pointer group">
      <div className="absolute inset-0 bg-gray-300 animate-pulse"></div>
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black opacity-70"></div>
      <div className="absolute top-2 left-2 w-8 h-8 rounded-full border-4 border-primary-500 overflow-hidden">
        <Avatar>
          <AvatarImage src={user?.profileImage} alt={user?.name} />
          <AvatarFallback>{user?.name ? getInitials(user.name) : "U"}</AvatarFallback>
        </Avatar>
      </div>
      <div className="absolute bottom-2 left-2 right-2 text-white text-xs font-medium">
        {user?.name?.split(' ')[0]}
      </div>
    </div>
  );
}

export default function HomePage() {
  const { user } = useAuth();
  
  // Get posts for news feed
  const { 
    data: posts = [], 
    isLoading,
    isError 
  } = useQuery<PostWithAuthor[], Error>({
    queryKey: ["/api/posts"],
  });
  
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };
  
  return (
    <MainLayout>
      {/* Stories */}
      <Card>
        <CardContent className="p-2 md:p-4">
          <div className="flex space-x-2 p-1 overflow-x-auto hide-scrollbar">
              <StoryCard isCreateStory />
              <StoryCard />
              <StoryCard />
              <StoryCard />
              <StoryCard />
            </div>
        </CardContent>
      </Card>
      
      {/* Create post */}
      <CreatePost />
      
      {/* Room */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center space-x-2 overflow-x-auto pb-2">
            <Button 
              variant="outline" 
              className="flex-shrink-0 flex items-center justify-center space-x-2 rounded-full px-4 py-2 border border-slate-200 font-medium text-primary-500"
            >
              <Video className="h-5 w-5" />
              <span>Create Room</span>
            </Button>
            
            {/* Active friends */}
            <div className="flex-shrink-0 relative group cursor-pointer">
              <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-white">
                <Avatar>
                  <AvatarImage src={user?.profileImage} alt={user?.name} />
                  <AvatarFallback>{user?.name ? getInitials(user.name) : "U"}</AvatarFallback>
                </Avatar>
              </div>
              <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></span>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Posts */}
      {isLoading ? (
        <>
          <PostSkeleton />
          <PostSkeleton />
        </>
      ) : isError ? (
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
            <p>No posts yet. Connect with friends or create a post!</p>
          </CardContent>
        </Card>
      ) : (
        <div>
          {posts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      )}
    </MainLayout>
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
