import React from 'react';
import { Link, useLocation } from 'wouter';
import { cn } from '@/lib/utils';

interface SidebarProps {
  collapsed?: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ collapsed = false }) => {
  const [location] = useLocation();

  const isActive = (path: string) => {
    return location === path;
  };

  const navItems = [
    { icon: 'home', label: 'Dashboard', path: '/' },
    { icon: 'building', label: 'Properties', path: '/properties' },
    { icon: 'broom', label: 'Housekeepers', path: '/housekeepers' },
    { icon: 'calendar-alt', label: 'Calendar', path: '/calendar' },
    { icon: 'clipboard-list', label: 'Tasks', path: '/tasks' },
    { icon: 'cog', label: 'Settings', path: '/settings' },
  ];

  return (
    <aside className="bg-[#1E2A3B] text-white h-screen w-[220px] flex flex-col fixed left-0 top-0">
      <div className="p-4 border-b border-gray-700">
        <Link href="/">
          <div className="flex items-center cursor-pointer">
            <div className="w-8 h-8 rounded-full bg-[#3B82F6] flex items-center justify-center text-white font-bold mr-2">
              CS
            </div>
            <span className="text-xl font-semibold">CleanSync</span>
          </div>
        </Link>
      </div>
      
      <nav className="flex-1 pt-4">
        <ul>
          {navItems.map((item) => (
            <li key={item.path}>
              <Link href={item.path}>
                <a 
                  className={cn(
                    "flex items-center px-4 py-3 text-sm hover:bg-[#2D3B4E] transition-colors",
                    isActive(item.path) ? "bg-[#2D3B4E] border-l-4 border-[#3B82F6]" : ""
                  )}
                >
                  <i className={`fas fa-${item.icon} w-5 text-center mr-3 ${isActive(item.path) ? 'text-[#3B82F6]' : 'text-gray-400'}`}></i>
                  <span>{item.label}</span>
                </a>
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      
      <div className="p-4 border-t border-gray-700">
        <div className="flex items-center">
          <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center mr-2">
            <i className="fas fa-user text-sm"></i>
          </div>
          <div className="text-sm">
            <div className="font-medium">John Smith</div>
            <div className="text-gray-400 text-xs">Property Owner</div>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;