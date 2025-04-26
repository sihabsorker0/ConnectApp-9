import { useState } from "react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PostWithAuthor, Comment } from "@shared/schema";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";
import { useAuth } from "@/hooks/use-auth";
import { Link } from "wouter";
import { ThumbsUp, MessageSquare, Share2, Send, Smile, Users, Globe, Pin, Bookmark, Archive, Trash2, Link2, Eye, Flag } from "lucide-react";
import { Pencil } from "lucide-react"; // Using Lucide icons instead


interface PostCardProps {
  post: PostWithAuthor;
}

export default function PostCard({ post }: PostCardProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [comment, setComment] = useState("");
  const [showAllComments, setShowAllComments] = useState(false);

  const formattedDate = formatDistanceToNow(new Date(post.createdAt), { 
    addSuffix: true 
  });

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (post.saved) {
        await apiRequest("DELETE", `/api/posts/${post.id}/save`);
      } else {
        await apiRequest("POST", `/api/posts/${post.id}/save`);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/posts/saved"] });
      toast({
        title: post.saved ? "Post unsaved" : "Post saved",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to save post",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const likeMutation = useMutation({
    mutationFn: async () => {
      if (post.liked) {
        const res = await apiRequest("DELETE", `/api/posts/${post.id}/like`);
        return await res.json();
      } else {
        const res = await apiRequest("POST", `/api/posts/${post.id}/like`);
        return await res.json();
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
    },
    onError: (error: Error) => {
      toast({
        title: post.liked ? "Failed to unlike" : "Failed to like",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const commentMutation = useMutation({
    mutationFn: async (content: string) => {
      const res = await apiRequest("POST", `/api/posts/${post.id}/comments`, { content });
      return await res.json();
    },
    onSuccess: () => {
      setComment("");
      queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to comment",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleLike = () => {
    likeMutation.mutate();
  };

  const handleComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (comment.trim()) {
      commentMutation.mutate(comment);
    }
  };

  const displayedComments = showAllComments 
    ? (post.comments || [])
    : (post.comments || []).slice(0, 2);

  return (
    <Card className="mb-2 md:mb-4 w-full break-words">
      <CardContent className="p-2 space-y-1 md:p-4 md:space-y-4">
        <div className="flex items-start justify-between">
          <div className="flex space-x-1 md:space-x-2">
            <Link href={`/profile/${post.author.id}`}>
              <Avatar className="h-10 w-10 cursor-pointer">
                <AvatarImage src={post.author.profileImage} alt={post.author.name} />
                <AvatarFallback>{getInitials(post.author.name)}</AvatarFallback>
              </Avatar>
            </Link>
            <div>
              <Link href={`/profile/${post.author.id}`} className="font-medium hover:underline">
                {post.author.name}
              </Link>
              <div className="flex items-center text-sm text-slate-500">
                <span>{formattedDate}</span>
                <span className="inline-block mx-1">•</span>
                <span>🌐</span>
              </div>
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-500">
                  <circle cx="12" cy="12" r="1"></circle>
                  <circle cx="19" cy="12" r="1"></circle>
                  <circle cx="5" cy="12" r="1"></circle>
                </svg>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              {post.userId === user?.id ? (
                <>
                  <DropdownMenuItem onClick={() => toast({ title: "Comment settings updated" })}>
                    <Users className="mr-2 h-4 w-4" />
                    <span>Who can comment</span>
                  </DropdownMenuItem>

                  <Dialog>
                    <DialogTrigger asChild>
                      <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                        <Globe className="mr-2 h-4 w-4" />
                        <span>Edit audience</span>
                      </DropdownMenuItem>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Who can see your post?</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div className="flex items-center space-x-2">
                          <Globe className="h-4 w-4" />
                          <div>Public</div>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>

                  <Dialog>
                    <DialogTrigger asChild>
                      <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                        <Pencil className="mr-2 h-4 w-4" />
                        <span>Edit post</span>
                      </DropdownMenuItem>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Edit Post</DialogTitle>
                      </DialogHeader>
                      <form onSubmit={async (e) => {
                        e.preventDefault();
                        const formData = new FormData(e.currentTarget);
                        try {
                          await fetch(`/api/posts/${post.id}`, {
                            method: 'PUT',
                            headers: { 'Content-Type': 'application/json' },
                            credentials: 'include',
                            body: JSON.stringify({ content: formData.get('content') })
                          });
                          queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
                          toast({ title: "Post updated successfully" });
                        } catch (error) {
                          toast({ 
                            title: "Failed to update post",
                            variant: "destructive"
                          });
                        }
                      }}>
                        <div className="space-y-4 py-4">
                          <div className="space-y-2">
                            <Label htmlFor="content">Content</Label>
                            <Textarea
                              id="content"
                              name="content"
                              defaultValue={post.content}
                            />
                          </div>
                        </div>
                        <DialogFooter>
                          <Button type="submit">Save Changes</Button>
                        </DialogFooter>
                      </form>
                    </DialogContent>
                  </Dialog>

                  <DropdownMenuItem onClick={() => {
                    const postUrl = `${window.location.origin}/posts/${post.id}`;
                    navigator.clipboard.writeText(postUrl);
                    toast({ title: "Post URL copied to clipboard" });
                  }}>
                    <Link2 className="mr-2 h-4 w-4" />
                    <span>Embed post</span>
                  </DropdownMenuItem>

                  <DropdownMenuItem onClick={async () => {
                    try {
                      await fetch(`/api/posts/${post.id}`, {
                        method: 'DELETE',
                        credentials: 'include'
                      });
                      queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
                      toast({ title: "Post deleted successfully" });
                    } catch (error) {
                      toast({
                        title: "Failed to delete post",
                        variant: "destructive"
                      });
                    }
                  }} className="text-red-600">
                    <Trash2 className="mr-2 h-4 w-4" />
                    <span>Delete post</span>
                  </DropdownMenuItem>

                  <DropdownMenuItem onClick={() => toast({ title: "Post pinned" })}>
                    <Pin className="mr-2 h-4 w-4" />
                    <span>Pin post</span>
                  </DropdownMenuItem>

                  <DropdownMenuItem onClick={() => saveMutation.mutate()}>
                    <Bookmark className="mr-2 h-4 w-4" />
                    <span>{post.saved ? "Unsave post" : "Save post"}</span>
                  </DropdownMenuItem>

                  <DropdownMenuItem onClick={() => toast({ title: "Post archived" })}>
                    <Archive className="mr-2 h-4 w-4" />
                    <span>Archive post</span>
                  </DropdownMenuItem>
                </>
              ) : (
                <>
                  <DropdownMenuItem onClick={() => saveMutation.mutate()}>
                    <Bookmark className="mr-2 h-4 w-4" />
                    <span>{post.saved ? "Unsave post" : "Save post"}</span>
                  </DropdownMenuItem>

                  <DropdownMenuItem onClick={() => toast({ title: "Post hidden" })}>
                    <Eye className="mr-2 h-4 w-4" />
                    <span>Hide post</span>
                  </DropdownMenuItem>

                  <DropdownMenuItem onClick={() => toast({ title: "Post reported" })} className="text-red-600">
                    <Flag className="mr-2 h-4 w-4" />
                    <span>Report post</span>
                  </DropdownMenuItem>

                  <DropdownMenuItem onClick={() => {
                    const postUrl = `${window.location.origin}/posts/${post.id}`;
                    navigator.clipboard.writeText(postUrl);
                    toast({ title: "Link copied to clipboard" });
                  }}>
                    <Link2 className="mr-2 h-4 w-4" />
                    <span>Copy link</span>
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="mt-3">
          <p className="whitespace-pre-line">{post.content}</p>
          {post.image && (
            <div className="mt-3">
              {post.image && (
                post.image.startsWith('data:video') ? (
                  <video 
                    controls
                    preload="metadata"
                    className="rounded-lg max-h-[500px] w-full"
                    src={post.image}
                    type={post.image.split(';')[0].split(':')[1]}
                  >
                    Your browser does not support video playback.
                  </video>
                ) : (
                  <img 
                    src={post.image.startsWith('data:image') ? post.image : `data:image/jpeg;base64,${post.image}`}
                    alt="Post content" 
                    className="rounded-lg max-h-[500px] object-cover"
                  />
                )
              )}
            </div>
          )}
        </div>

        {/* Post stats */}
        <div className="mt-4 flex items-center justify-between text-sm text-slate-500">
          <div className="flex items-center">
            {post.likes > 0 && (
              <>
                <span className="flex items-center justify-center w-5 h-5 rounded-full bg-primary-500 text-white">
                  <ThumbsUp className="h-3 w-3" />
                </span>
                <span className="ml-1">{post.likes}</span>
              </>
            )}
          </div>
          <div>
            {post.comments.length > 0 && (
              <span>{post.comments.length} comments</span>
            )}
          </div>
        </div>
      </CardContent>

      {/* Post actions */}
      <div className="px-4 py-2 flex justify-between border-t border-slate-200">
        <Button 
          variant="ghost" 
          className={`flex-1 flex items-center justify-center space-x-2 ${post.liked ? 'text-primary-500' : 'text-slate-600'}`}
          onClick={handleLike}
          disabled={likeMutation.isPending}
        >
          <ThumbsUp className="h-5 w-5" />
          <span className="font-medium">Like</span>
        </Button>
        <Button variant="ghost" className="flex-1 flex items-center justify-center space-x-2 text-slate-600">
          <MessageSquare className="h-5 w-5" />
          <span className="font-medium">Comment</span>
        </Button>
        <Button variant="ghost" className="flex-1 flex items-center justify-center space-x-2 text-slate-600">
          <Share2 className="h-5 w-5" />
          <span className="font-medium">Share</span>
        </Button>
      </div>

      <CardFooter className="p-4 flex flex-col">
        {/* Comments section */}
        {post.comments.length > 0 && (
          <div className="w-full mb-4 space-y-3">
            {displayedComments.map((comment) => (
              <CommentCard key={comment.id} comment={comment} />
            ))}

            {post.comments.length > 2 && !showAllComments && (
              <Button
                variant="ghost"
                className="text-sm font-medium text-slate-600 hover:text-slate-900 px-0"
                onClick={() => setShowAllComments(true)}
              >
                View {post.comments.length - 2} more comments
              </Button>
            )}

            {showAllComments && post.comments.length > 2 && (
              <Button
                variant="ghost"
                className="text-sm font-medium text-slate-600 hover:text-slate-900 px-0"
                onClick={() => setShowAllComments(false)}
              >
                Hide comments
              </Button>
            )}
          </div>
        )}

        {/* Comment form */}
        <form onSubmit={handleComment} className="flex space-x-2 w-full items-center">
          <Avatar className="h-8 w-8">
            <AvatarImage src={user?.profileImage} alt={user?.name} />
            <AvatarFallback>{user?.name ? getInitials(user.name) : "U"}</AvatarFallback>
          </Avatar>
          <div className="flex-1 relative">
            <Input 
              className="bg-slate-100 rounded-full pr-20"
              placeholder="Write a comment..." 
              value={comment}
              onChange={(e) => setComment(e.target.value)}
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center space-x-1 text-slate-400">
              <Button type="button" variant="ghost" size="icon" className="h-8 w-8 rounded-full text-slate-400 hover:text-slate-600">
                <Smile className="h-5 w-5" />
              </Button>
              <Button 
                type="submit"
                variant="ghost" 
                size="icon" 
                className="h-8 w-8 rounded-full text-primary-500" 
                disabled={!comment.trim() || commentMutation.isPending}
              >
                <Send className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </form>
      </CardFooter>
    </Card>
  );
}

function CommentCard({ comment }: { comment: Comment & { author: any } }) {
  const formattedDate = formatDistanceToNow(new Date(comment.createdAt), { 
    addSuffix: true 
  });

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  return (
    <div className="flex space-x-2">
      <Link href={`/profile/${comment.author.id}`}>
        <Avatar className="h-8 w-8">
          <AvatarImage src={comment.author.profileImage} alt={comment.author.name} />
          <AvatarFallback>{getInitials(comment.author.name)}</AvatarFallback>
        </Avatar>
      </Link>
      <div>
        <div className="bg-slate-100 rounded-2xl px-3 py-2">
          <Link href={`/profile/${comment.author.id}`} className="font-medium hover:underline">
            {comment.author.name}
          </Link>
          <p className="text-sm">{comment.content}</p>
        </div>
        <div className="flex items-center space-x-3 mt-1 text-xs text-slate-500">
          <Button variant="ghost" className="font-medium hover:text-slate-700 h-auto py-0 px-1">Like</Button>
          <Button variant="ghost" className="font-medium hover:text-slate-700 h-auto py-0 px-1">Reply</Button>
          <span>{formattedDate}</span>
        </div>
      </div>
    </div>
  );
}