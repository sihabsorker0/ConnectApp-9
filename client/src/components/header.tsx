import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toUndefinedFromNull } from "@/lib/utils";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Search, Home, Users, Tv, Store, GamepadIcon, Plus, MessageSquare, Bell, LogOut, User, Shield } from "lucide-react";

export default function Header() {
  const [location, navigate] = useLocation();
  const { user, logoutMutation } = useAuth();
  const [mobileSearchVisible, setMobileSearchVisible] = useState(false);

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  // Get initials for avatar fallback
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  return (
    <header className="fixed top-0 left-0 right-0 bg-white border-b border-slate-200 z-50">
      <div className="max-w-[100%] mx-auto flex items-center justify-between h-10 md:h-16 px-2 md:px-3">
        {/* Logo and Search */}
        <div className="flex items-center space-x-4 lg:space-x-8">
          <Link href="/" className="flex items-center">
            <svg className="w-8 h-8 text-primary-500" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" />
            </svg>
            <span className="ml-2 text-xl font-bold">ConnectHub</span>
          </Link>

          <div className="relative hidden md:block">
            <Input 
              type="search" 
              className="w-64 pl-10" 
              placeholder="Search ConnectHub"
            />
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400">
              <Search className="h-4 w-4" />
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="hidden md:flex items-center space-x-1">
          <Link href="/">
            <Button 
              variant="ghost" 
              className={`px-3 py-2 rounded-md flex items-center justify-center ${location === '/' ? 'text-primary-500' : 'text-slate-500 hover:bg-slate-100'}`}
            >
              <Home className="h-6 w-6" />
            </Button>
          </Link>
          <Button 
            variant="ghost" 
            className="px-3 py-2 rounded-md flex items-center justify-center text-slate-500 hover:bg-slate-100"
          >
            <Users className="h-6 w-6" />
          </Button>
          <Button 
            variant="ghost" 
            className="px-3 py-2 rounded-md flex items-center justify-center text-slate-500 hover:bg-slate-100"
          >
            <Tv className="h-6 w-6" />
          </Button>
          <Button 
            variant="ghost" 
            className="px-3 py-2 rounded-md flex items-center justify-center text-slate-500 hover:bg-slate-100"
          >
            <Store className="h-6 w-6" />
          </Button>
          <Button 
            variant="ghost" 
            className="px-3 py-2 rounded-md flex items-center justify-center text-slate-500 hover:bg-slate-100"
          >
            <GamepadIcon className="h-6 w-6" />
          </Button>
        </nav>

        {/* User menu and actions */}
        <div className="flex items-center space-x-2">
          <div className="md:hidden">
            <Button 
              variant="ghost" 
              size="icon" 
              className="rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200"
              onClick={() => setMobileSearchVisible(true)}
            >
              <Search className="h-4 w-4 md:h-5 md:w-5" />
            </Button>
          </div>

          <Button variant="ghost" size="icon" className="rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200">
            <Plus className="h-4 w-4 md:h-5 md:w-5" />
          </Button>
          <Button variant="ghost" size="icon" className="rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200">
            <MessageSquare className="h-4 w-4 md:h-5 md:w-5" />
          </Button>
          <Button variant="ghost" size="icon" className="rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200">
            <Bell className="h-4 w-4 md:h-5 md:w-5" />
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="rounded-full h-10 w-10 p-0 overflow-hidden">
                <Avatar>
                  <AvatarImage src={user?.profileImage ? toUndefinedFromNull(user.profileImage) : undefined} alt={user?.name} />
                  <AvatarFallback>{user?.name ? getInitials(user.name) : "U"}</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <Link href={`/profile/${user?.id}`}>
                <DropdownMenuItem className="cursor-pointer">
                  <User className="mr-2 h-4 w-4" />
                  <span>Profile</span>
                </DropdownMenuItem>
              </Link>
              {user?.id === 1 && (
                <Link href="/admin">
                  <DropdownMenuItem className="cursor-pointer">
                    <Shield className="mr-2 h-4 w-4" />
                    <span>Admin Panel</span>
                  </DropdownMenuItem>
                </Link>
              )}
              <DropdownMenuItem className="cursor-pointer" onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Logout</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Mobile Search */}
      {mobileSearchVisible && (
        <div className="md:hidden fixed top-0 inset-x-0 z-50 bg-white shadow-md">
          <div className="flex items-center p-2 space-x-2">
            <Button 
              variant="ghost" 
              size="icon" 
              className="p-2"
              onClick={() => setMobileSearchVisible(false)}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 19-7-7 7-7"></path><path d="M19 12H5"></path></svg>
            </Button>
            <div className="flex-1 relative">
              <div className="relative w-full">
                <Input 
                  type="search" 
                  className="w-full pl-10" 
                  placeholder="Search ConnectHub"
                  onChange={async (e) => {
                    const query = e.target.value;
                    if (query) {
                      const res = await fetch(`/api/users/search?q=${encodeURIComponent(query)}`);
                      const users = await res.json();
                      if (users.length > 0) {
                        const dropdown = document.getElementById('search-results');
                        if (dropdown) {
                          dropdown.style.display = 'block';
                          dropdown.innerHTML = users.map(user => `
                            <a href="/profile/${user.id}" class="flex items-center p-2 hover:bg-slate-100">
                              <div class="w-8 h-8 rounded-full bg-slate-200 mr-2 overflow-hidden">
                                ${user.profileImage ? 
                                  `<img src="${user.profileImage}" alt="${user.name}" class="w-full h-full object-cover"/>` : 
                                  `<div class="w-full h-full flex items-center justify-center">${user.name[0]}</div>`
                                }
                              </div>
                              <div>
                                <div class="font-medium">${user.name}</div>
                                <div class="text-sm text-slate-500">@${user.username}</div>
                              </div>
                            </a>
                          `).join('');
                        }
                      }
                    } else {
                      const dropdown = document.getElementById('search-results');
                      if (dropdown) {
                        dropdown.style.display = 'none';
                      }
                    }
                  }}
                />
                <div 
                  id="search-results" 
                  className="absolute top-full left-0 w-full bg-white shadow-lg rounded-md mt-1 border border-slate-200 z-50 max-h-64 overflow-y-auto" 
                  style={{display: 'none'}}
                ></div>
              </div>
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400">
                <Search className="h-4 w-4" />
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}