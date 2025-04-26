
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Link } from "wouter";
import { FriendWithUser } from "@shared/schema";
import { Check, X, Loader2 } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";

export default function FriendList() {
  const { toast } = useToast();

  const { data: friends = [] } = useQuery<FriendWithUser[], Error>({
    queryKey: ["/api/friends"],
    staleTime: 30000,
  });

  const { data: requests = [] } = useQuery<FriendWithUser[], Error>({
    queryKey: ["/api/friends/requests"],
    staleTime: 30000,
  });

  const acceptMutation = useMutation({
    mutationFn: async (requestId: number) => {
      const res = await apiRequest("PUT", `/api/friends/request/${requestId}/accept`);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/friends"] });
      queryClient.invalidateQueries({ queryKey: ["/api/friends/requests"] });
      toast({
        title: "Friend request accepted",
      });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async (requestId: number) => {
      const res = await apiRequest("PUT", `/api/friends/request/${requestId}/reject`);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/friends/requests"] });
      toast({
        title: "Friend request rejected",
      });
    },
  });

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  return (
    <Card className="mb-4">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Friends</CardTitle>
          {requests.length > 0 && (
            <div className="text-sm font-medium bg-red-500 text-white px-2 py-1 rounded-full">
              {requests.length}
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {requests.length > 0 && (
          <div className="mb-4">
            <h3 className="font-semibold mb-2">Friend Requests</h3>
            <div className="space-y-2">
              {requests.map((request) => (
                <div key={request.id} className="flex items-center justify-between">
                  <Link href={`/profile/${request.user.id}`} className="flex items-center space-x-2">
                    <Avatar>
                      <AvatarImage src={request.user.profileImage} />
                      <AvatarFallback>{getInitials(request.user.name)}</AvatarFallback>
                    </Avatar>
                    <span className="font-medium">{request.user.name}</span>
                  </Link>
                  <div className="flex space-x-2">
                    <Button
                      size="sm"
                      onClick={() => acceptMutation.mutate(request.id)}
                      disabled={acceptMutation.isPending}
                    >
                      {acceptMutation.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Check className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => rejectMutation.mutate(request.id)}
                      disabled={rejectMutation.isPending}
                    >
                      {rejectMutation.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <X className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div>
          <h3 className="font-semibold mb-2">Your Friends</h3>
          {friends.length === 0 ? (
            <p className="text-sm text-slate-500">No friends yet</p>
          ) : (
            <div className="space-y-2">
              {friends.map((friend) => (
                <Link key={friend.id} href={`/profile/${friend.user.id}`}>
                  <Button variant="ghost" className="w-full justify-start gap-2">
                    <Avatar>
                      <AvatarImage src={friend.user.profileImage} />
                      <AvatarFallback>{getInitials(friend.user.name)}</AvatarFallback>
                    </Avatar>
                    <span className="font-medium">{friend.user.name}</span>
                  </Button>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Friend Suggestions */}
        <div className="mt-4">
          <h3 className="font-semibold mb-2">People you may know</h3>
          <div className="space-y-2">
            {/* Query for suggested friends */}
            {useQuery({
              queryKey: ["/api/friends/suggestions"],
              queryFn: async () => {
                const res = await fetch("/api/friends/suggestions");
                if (!res.ok) return [];
                return res.json();
              }
            }).data?.map((suggestion: any) => (
              <div key={suggestion.id} className="flex items-center justify-between">
                <Link href={`/profile/${suggestion.id}`} className="flex items-center space-x-2">
                  <Avatar>
                    <AvatarImage src={suggestion.profileImage} />
                    <AvatarFallback>{getInitials(suggestion.name)}</AvatarFallback>
                  </Avatar>
                  <span className="font-medium">{suggestion.name}</span>
                </Link>
                <Button
                  size="sm"
                  onClick={() => {
                    fetch("/api/friends/request", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ friendId: suggestion.id })
                    }).then(() => {
                      queryClient.invalidateQueries({ queryKey: ["/api/friends/suggestions"] });
                      toast({
                        title: "Friend request sent"
                      });
                    });
                  }}
                >
                  Add Friend
                </Button>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
