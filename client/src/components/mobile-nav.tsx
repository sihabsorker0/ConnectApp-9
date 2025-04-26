import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Home, Users, Tv, Store, Menu } from "lucide-react";

export default function MobileNav() {
  const [location] = useLocation();
  
  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 bg-white border-t border-slate-200 z-40">
      <div className="grid grid-cols-5 h-14 max-w-[100%] px-1">
        <Link href="/">
          <Button 
            variant="ghost" 
            className={`h-full w-full flex flex-col items-center justify-center rounded-none ${
              location === "/" ? "text-primary-500" : "text-slate-500"
            }`}
          >
            <Home className="h-6 w-6" />
            <span className="text-xs mt-1">Home</span>
          </Button>
        </Link>
        
        <Link href="/friends">
          <Button 
            variant="ghost" 
            className={`h-full w-full flex flex-col items-center justify-center rounded-none ${
              location === "/friends" ? "text-primary-500" : "text-slate-500"
            }`}
          >
            <Users className="h-6 w-6" />
            <span className="text-xs mt-1">Friends</span>
          </Button>
        </Link>
        
        <Link href="/watch">
          <Button 
            variant="ghost" 
            className="h-full w-full flex flex-col items-center justify-center rounded-none text-slate-500"
          >
            <Tv className="h-6 w-6" />
            <span className="text-xs mt-1">Watch</span>
          </Button>
        </Link>
        
        <Link href="/marketplace">
          <Button 
            variant="ghost" 
            className="h-full w-full flex flex-col items-center justify-center rounded-none text-slate-500"
          >
            <Store className="h-6 w-6" />
            <span className="text-xs mt-1">Market</span>
          </Button>
        </Link>
        
        <Button 
          variant="ghost" 
          className="h-full w-full flex flex-col items-center justify-center rounded-none text-slate-500"
        >
          <div className="relative">
            <Menu className="h-6 w-6" />
            <span className="absolute -top-1 -right-2 w-5 h-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center">
              3
            </span>
          </div>
          <span className="text-xs mt-1">Menu</span>
        </Button>
      </div>
    </nav>
  );
}
