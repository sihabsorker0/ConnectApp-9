import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Home, User, Users, Bookmark, Clock, Group, Store, Tv } from "lucide-react";

export default function LeftSidebar() {
  const [location] = useLocation();
  const { user } = useAuth();
  
  return (
    <>
      <Card>
        <CardContent className="p-2">
          <nav className="space-y-1">
            <Link href="/">
              <Button 
                variant={location === "/" ? "secondary" : "ghost"} 
                className="w-full justify-start gap-3 font-medium"
              >
                <Home className="h-5 w-5" />
                <span>Home</span>
              </Button>
            </Link>
            
            <Link href={`/profile/${user?.id}`}>
              <Button 
                variant={location.startsWith("/profile") ? "secondary" : "ghost"} 
                className="w-full justify-start gap-3 font-medium"
              >
                <User className="h-5 w-5" />
                <span>Profile</span>
              </Button>
            </Link>
            
            <Link href="/friends">
              <Button 
                variant={location === "/friends" ? "secondary" : "ghost"} 
                className="w-full justify-start gap-3 font-medium"
              >
                <Users className="h-5 w-5" />
                <span>Friends</span>
              </Button>
            </Link>
            
            <Link href="/saved">
              <Button 
                variant={location === "/saved" ? "secondary" : "ghost"} 
                className="w-full justify-start gap-3 font-medium"
              >
                <Bookmark className="h-5 w-5" />
                <span>Saved</span>
              </Button>
            </Link>
            
            <Button variant="ghost" className="w-full justify-start gap-3 font-medium">
              <Clock className="h-5 w-5" />
              <span>Memories</span>
            </Button>
            
            <Link href="/groups">
              <Button variant="ghost" className="w-full justify-start gap-3 font-medium">
                <Group className="h-5 w-5" />
                <span>Groups</span>
              </Button>
            </Link>
            
            <Link href="/marketplace">
              <Button variant="ghost" className="w-full justify-start gap-3 font-medium">
                <Store className="h-5 w-5" />
                <span>Marketplace</span>
              </Button>
            </Link>
            
            <Link href="/watch">
              <Button variant="ghost" className="w-full justify-start gap-3 font-medium">
                <Tv className="h-5 w-5" />
                <span>Watch</span>
              </Button>
            </Link>
          </nav>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="p-4">
          <h3 className="font-semibold mb-2">Your Shortcuts</h3>
          <div className="space-y-3">
            <Button variant="ghost" className="w-full justify-start gap-3 font-medium">
              <div className="w-8 h-8 rounded-md bg-primary-100 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary-500"><path d="M10.8 22H7a2 2 0 0 1-2-2v-8m0-2V7a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v1"></path><path d="M9 11h12v2a4 4 0 0 1-4 4h-2.5"></path><path d="M13 19h4"></path><circle cx="9" cy="7" r="1"></circle><circle cx="4" cy="16" r="4"></circle></svg>
              </div>
              <span className="text-sm">Gaming Group</span>
            </Button>
            
            <Button variant="ghost" className="w-full justify-start gap-3 font-medium">
              <div className="w-8 h-8 rounded-md bg-slate-100 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-500"><path d="m18 16 4-4-4-4"></path><path d="m6 8-4 4 4 4"></path><path d="m14.5 4-5 16"></path></svg>
              </div>
              <span className="text-sm">Coding Community</span>
            </Button>
            
            <Button variant="ghost" className="w-full justify-start gap-3 font-medium">
              <div className="w-8 h-8 rounded-md bg-green-100 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-500"><path d="M22 15V9a1 1 0 0 0-1-1H3a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h18a1 1 0 0 0 1-1Z"></path><path d="M3 16v3a1 1 0 0 0 1 1h16a1 1 0 0 0 1-1v-3"></path><path d="M4 8v- 10"></path><path d="M20 8v-10"></path></svg>
              </div>
              <span className="text-sm">Gardening Club</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
