
import MainLayout from "@/components/main-layout";
import PostCard from "@/components/post-card";
import { Card, CardContent } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { PostWithAuthor } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";

export default function SavedPage() {
  const {
    data: savedPosts,
    isLoading,
    error,
  } = useQuery<PostWithAuthor[], Error>({
    queryKey: ["/api/posts/saved"],
    queryFn: async () => {
      const res = await fetch("/api/posts/saved", {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch saved posts");
      return res.json();
    },
  });

  if (isLoading) {
    return (
      <MainLayout>
        <div className="space-y-4">
          <PostSkeleton />
          <PostSkeleton />
        </div>
      </MainLayout>
    );
  }

  if (error) {
    return (
      <MainLayout>
        <Card>
          <CardContent className="p-6">
            <p className="text-center text-red-500">Failed to load saved posts</p>
          </CardContent>
        </Card>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">Saved Posts</h1>
        {savedPosts?.length === 0 ? (
          <Card>
            <CardContent className="p-6">
              <p className="text-center text-gray-500">No saved posts yet</p>
            </CardContent>
          </Card>
        ) : (
          savedPosts?.map((post) => <PostCard key={post.id} post={post} />)
        )}
      </div>
    </MainLayout>
  );
}

function PostSkeleton() {
  return (
    <Card>
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
