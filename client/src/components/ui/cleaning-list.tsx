import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { formatDate } from '@/lib/utils';
import { CleaningTask } from '@shared/schema';
import { Card, CardContent } from '@/components/ui/card';

interface CleaningListProps {
  date?: Date;
  limit?: number;
  onViewAll?: () => void;
  onViewDetails?: (task: CleaningTask) => void;
}

const CleaningList: React.FC<CleaningListProps> = ({
  date = new Date(),
  limit,
  onViewAll,
  onViewDetails
}) => {
  const { data: cleanings, isLoading } = useQuery<CleaningTask[]>({
    queryKey: ['/api/cleanings', formatDate(date, 'yyyy-MM-dd')],
  });

  const displayCleanings = limit ? cleanings?.slice(0, limit) : cleanings;

  if (isLoading) {
    return (
      <div className="animate-pulse">
        <div className="h-10 bg-gray-200 rounded-md mb-4"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[...Array(limit || 2)].map((_, i) => (
            <div key={i} className="bg-gray-200 h-32 rounded-md"></div>
          ))}
        </div>
      </div>
    );
  }

  if (!cleanings || cleanings.length === 0) {
    return (
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-[#484848]">{formatDate(date) === formatDate(new Date()) ? "Today's" : formatDate(date)} Cleanings</h2>
          {onViewAll && (
            <button 
              onClick={onViewAll}
              className="text-[#00A699] text-sm font-medium"
            >
              View All
            </button>
          )}
        </div>
        
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-4">
              <p className="text-gray-500">No cleanings scheduled for {formatDate(date)}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-[#484848]">{formatDate(date) === formatDate(new Date()) ? "Today's" : formatDate(date)} Cleanings</h2>
        {onViewAll && (
          <button 
            onClick={onViewAll}
            className="text-[#00A699] text-sm font-medium"
          >
            View All
          </button>
        )}
      </div>
      
      <div className="max-h-80 overflow-y-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {displayCleanings?.map((cleaning) => (
            <div key={cleaning.id} className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
              <div className="flex justify-between mb-2">
                <div className="flex items-center">
                  <div 
                    className="w-3 h-3 rounded-full mr-2" 
                    style={{ backgroundColor: cleaning.propertyColor }}
                  ></div>
                  <h3 className="font-semibold">{cleaning.propertyName}</h3>
                </div>
                <span className="text-sm bg-[#EBEBEB] text-[#484848] px-2 py-0.5 rounded">Checkout</span>
              </div>
              
              <div className="flex justify-between mb-3">
                <div className="text-sm text-[#767676]">
                  <i className="far fa-clock mr-1"></i> {cleaning.checkoutTime} checkout
                </div>
                <div className="text-sm font-medium text-[#00A699]">
                  <i className="far fa-user mr-1"></i> {cleaning.housekeeperId ? 'Assigned' : 'Unassigned'}
                </div>
              </div>
              
              <div className="flex justify-between items-center">
                <div className="text-sm">
                  <i className="far fa-calendar mr-1"></i> {formatDate(cleaning.checkoutDate)}
                </div>
                <button 
                  onClick={() => onViewDetails && onViewDetails(cleaning)}
                  className="text-[#00A699] text-sm font-medium"
                >
                  Details
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CleaningList;
