import React from 'react';
import { Link, useLocation } from 'wouter';

const BottomNavigation: React.FC = () => {
  const [location] = useLocation();

  const isActive = (path: string) => {
    return location === path ? 'text-[#FF5A5F]' : 'text-[#767676]';
  };

  return (
    <nav className="bg-white border-t border-gray-200 flex justify-around py-2 sticky bottom-0">
      <Link href="/">
        <div className={`flex flex-col items-center p-2 cursor-pointer ${isActive('/')}`}>
          <i className="fas fa-calendar text-lg"></i>
          <span className="text-xs mt-1">Calendar</span>
        </div>
      </Link>
      
      <Link href="/properties">
        <div className={`flex flex-col items-center p-2 cursor-pointer ${isActive('/properties')}`}>
          <i className="fas fa-home text-lg"></i>
          <span className="text-xs mt-1">Properties</span>
        </div>
      </Link>
      
      <Link href="/housekeepers">
        <div className={`flex flex-col items-center p-2 cursor-pointer ${isActive('/housekeepers')}`}>
          <i className="fas fa-broom text-lg"></i>
          <span className="text-xs mt-1">Housekeepers</span>
        </div>
      </Link>
      
      <Link href="/settings">
        <div className={`flex flex-col items-center p-2 cursor-pointer ${isActive('/settings')}`}>
          <i className="fas fa-cog text-lg"></i>
          <span className="text-xs mt-1">Settings</span>
        </div>
      </Link>
    </nav>
  );
};

export default BottomNavigation;
