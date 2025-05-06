import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { User } from '@shared/schema';
import { Card, CardContent } from '@/components/ui/card';
import { generateInitials } from '@/lib/utils';

interface HousekeepersListProps {
  limit?: number;
  onManageAll?: () => void;
  onViewProfile?: (housekeeper: User) => void;
  onSendMessage?: (housekeeper: User) => void;
}

const HousekeepersList: React.FC<HousekeepersListProps> = ({
  limit,
  onManageAll,
  onViewProfile,
  onSendMessage
}) => {
  const { data: users, isLoading } = useQuery<User[]>({
    queryKey: ['/api/users'],
  });

  // Filter only housekeepers
  const housekeepers = users?.filter(user => user.role === 'housekeeper');
  
  // Limit the display if needed
  const displayHousekeepers = limit ? housekeepers?.slice(0, limit) : housekeepers;

  if (isLoading) {
    return (
      <div className="animate-pulse">
        <div className="h-10 bg-gray-200 rounded-md mb-4"></div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[...Array(limit || 3)].map((_, i) => (
            <div key={i} className="bg-gray-200 h-48 rounded-md"></div>
          ))}
        </div>
      </div>
    );
  }

  if (!housekeepers || housekeepers.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <h3 className="text-lg font-semibold mb-2">No Housekeepers Yet</h3>
            <p className="text-gray-500 mb-4">Add your first housekeeper to manage your cleanings</p>
            <a 
              href="/add-housekeeper" 
              className="bg-[#3B68B5] hover:bg-[#2A4F8F] text-white px-4 py-2 rounded-md text-sm font-medium"
            >
              Add Housekeeper
            </a>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-[#484848]">Housekeepers</h2>
        {onManageAll && (
          <button 
            onClick={onManageAll}
            className="text-[#00A699] text-sm font-medium"
          >
            Manage All
          </button>
        )}
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {displayHousekeepers?.map((housekeeper) => (
          <div key={housekeeper.id} className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
            <div className="flex items-center mb-3">
              <div className="w-10 h-10 rounded-full bg-[#EBEBEB] flex items-center justify-center text-[#767676] mr-3">
                <span className="font-semibold">{generateInitials(housekeeper.fullName)}</span>
              </div>
              <div>
                <h3 className="font-semibold">{housekeeper.fullName}</h3>
                <p className="text-sm text-[#767676]">
                  {housekeeper.id === 1 ? 'Primary Housekeeper' : 'Housekeeper'}
                </p>
              </div>
            </div>
            
            <div className="flex items-center justify-between text-sm mb-2">
              <div className="text-[#767676]">
                <i className="far fa-calendar-check mr-1"></i> {housekeeper.cleaningCount || 0} cleanings
              </div>
              <div className="text-[#00A699] font-medium">
                <i className="far fa-star mr-1"></i> {housekeeper.rating || '-'}
              </div>
            </div>
            
            <div className="text-sm text-[#767676] mb-3">
              <i className="far fa-envelope mr-1"></i> {housekeeper.email}
            </div>
            
            <div className="flex justify-between">
              <button 
                onClick={() => onSendMessage && onSendMessage(housekeeper)}
                className="text-sm text-[#767676]"
              >
                <i className="far fa-comment mr-1"></i> Message
              </button>
              <button 
                onClick={() => onViewProfile && onViewProfile(housekeeper)}
                className="text-sm text-[#00A699] font-medium"
              >
                View Profile
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default HousekeepersList;
