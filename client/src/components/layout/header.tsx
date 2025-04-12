import React, { useState } from 'react';
import { Link } from 'wouter';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface HeaderProps {
  userRole?: string;
}

const Header: React.FC<HeaderProps> = ({ userRole = 'owner' }) => {
  const [view, setView] = useState<'month' | 'week' | 'day'>('month');
  
  return (
    <header className="bg-white border-b border-gray-200 px-4 py-3 flex justify-between items-center sticky top-0 z-10">
      <div className="flex items-center">
        <Link href="/">
          <a className="text-xl font-bold text-[#FF5A5F]">CleanSync</a>
        </Link>
      </div>
      
      <div className="flex items-center space-x-3">
        <select 
          id="view-type" 
          className="text-sm border border-gray-300 rounded px-2 py-1"
          value={view}
          onChange={(e) => setView(e.target.value as 'month' | 'week' | 'day')}
        >
          <option value="month">Month</option>
          <option value="week">Week</option>
          <option value="day">Day</option>
        </select>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center justify-center w-8 h-8 rounded-full bg-[#FF5A5F] text-white">
              <i className="fas fa-user"></i>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <Link href="/settings">
                <a className="w-full">Profile Settings</a>
              </Link>
            </DropdownMenuItem>
            {userRole === 'owner' && (
              <DropdownMenuItem>
                <Link href="/housekeeper-view">
                  <a className="w-full">View as Housekeeper</a>
                </Link>
              </DropdownMenuItem>
            )}
            <DropdownMenuItem>
              <a href="#" className="w-full">Help & Support</a>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <a href="#" className="w-full text-[#FF5A5F]">Logout</a>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
};

export default Header;
