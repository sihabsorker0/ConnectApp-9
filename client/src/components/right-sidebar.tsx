import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Link } from "wouter";
import { FriendWithUser } from "@shared/schema";
import FriendList from "./friend-list";
import { Search, Gift, MoreHorizontal } from "lucide-react";

export default function RightSidebar() {
  // Get friends for contacts list
  const { data: friends = [] } = useQuery<FriendWithUser[], Error>({
    queryKey: ["/api/friends"],
    staleTime: 30000, // 30 seconds
  });
  
  // Helper function to get initials for avatar
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };
  
  return (
    <>
      <FriendList />
      
      {/* Sponsored */}
      <Card>
        <CardContent className="p-4">
          <h3 className="font-semibold mb-3">Sponsored</h3>
          <a href="#" className="block rounded-lg overflow-hidden group">
            <div className="relative">
              <img 
                src="https://via.placeholder.com/600x300?text=EcoTech" 
                alt="Sponsored product" 
                className="w-full h-36 object-cover rounded-md"
              />
            </div>
            <div className="mt-2">
              <span className="text-sm font-medium group-hover:underline">EcoTech Smart Home Solutions</span>
              <p className="text-xs text-slate-500">ecotech.com</p>
            </div>
          </a>
        </CardContent>
      </Card>
      
      {/* Birthdays */}
      <Card>
        <CardContent className="p-4">
          <h3 className="font-semibold mb-3">Birthdays</h3>
          <div className="flex items-start space-x-2">
            <div className="text-2xl text-primary-500">
              <Gift className="h-6 w-6" />
            </div>
            <p className="text-sm">
              No birthdays today.
            </p>
          </div>
        </CardContent>
      </Card>
      
      {/* Contacts */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold">Contacts</h3>
            <div className="flex space-x-1">
              <Button variant="ghost" size="icon" className="rounded-full h-8 w-8">
                <Search className="h-4 w-4 text-slate-500" />
              </Button>
              <Button variant="ghost" size="icon" className="rounded-full h-8 w-8">
                <MoreHorizontal className="h-4 w-4 text-slate-500" />
              </Button>
            </div>
          </div>
          
          {friends.length === 0 ? (
            <div className="text-center py-2 text-slate-500 text-sm">
              No contacts yet. Add friends to see them here.
            </div>
          ) : (
            <div className="space-y-1">
              {friends.map((friend) => (
                <Link key={friend.id} href={`/profile/${friend.user.id}`}>
                  <Button variant="ghost" className="w-full justify-start gap-2 font-medium">
                    <div className="relative">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={friend.user.profileImage} alt={friend.user.name} />
                        <AvatarFallback>{getInitials(friend.user.name)}</AvatarFallback>
                      </Avatar>
                      <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-white"></span>
                    </div>
                    <span>{friend.user.name}</span>
                  </Button>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Group conversations */}
      <Card>
        <CardContent className="p-4">
          <h3 className="font-semibold mb-3">Group Conversations</h3>
          <div className="space-y-1">
            <Button variant="ghost" className="w-full justify-start gap-2 font-medium">
              <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-500"><path d="M18 21a8 8 0 0 0-16 0"></path><circle cx="10" cy="8" r="5"></circle><path d="M22 20c0-3.37-2-6.5-4-8a5 5 0 0 0-.45-8.3"></path></svg>
              </div>
              <span>Gaming Group</span>
            </Button>
            
            <Button variant="ghost" className="w-full justify-start gap-2 font-medium">
              <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-500"><path d="m18 16 4-4-4-4"></path><path d="m6 8-4 4 4 4"></path><path d="m14.5 4-5 16"></path></svg>
              </div>
              <span>Coding Community</span>
            </Button>
            
            <Button variant="ghost" className="w-full justify-start gap-2 font-medium">
              <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-500"><path d="M22 15V9a1 1 0 0 0-1-1H3a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h18a1 1 0 0 0 1-1Z"></path><path d="M3 16v3a1 1 0 0 0 1 1h16a1 1 0 0 0 1-1v-3"></path><path d="M4 8v- 10"></path><path d="M20 8v-10"></path></svg>
              </div>
              <span>Gardening Club</span>
            </Button>
          </div>
          
          <Button variant="link" className="text-primary-500 font-medium px-0 mt-2">
            Create New Group
          </Button>
        </CardContent>
      </Card>
    </>
  );
}
