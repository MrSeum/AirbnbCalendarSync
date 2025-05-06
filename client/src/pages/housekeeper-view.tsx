import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { formatDate } from '@/lib/utils';
import { CleaningTask } from '@shared/schema';
import { Badge } from '@/components/ui/badge';

const HousekeeperView = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());

  // Fetch upcoming cleaning assignments for the housekeeper
  const { data: todayCleanings, isLoading: isTodayLoading } = useQuery<CleaningTask[]>({
    queryKey: ['/api/cleanings/assigned', formatDate(new Date(), 'yyyy-MM-dd')],
  });
  
  const { data: upcomingCleanings, isLoading: isUpcomingLoading } = useQuery<CleaningTask[]>({
    queryKey: ['/api/cleanings/assigned/upcoming'],
  });
  
  // Group upcoming cleanings by date
  const cleaningsByDate: Record<string, CleaningTask[]> = {};
  
  upcomingCleanings?.forEach(cleaning => {
    const dateKey = formatDate(cleaning.checkoutDate, 'yyyy-MM-dd');
    if (!cleaningsByDate[dateKey]) {
      cleaningsByDate[dateKey] = [];
    }
    cleaningsByDate[dateKey].push(cleaning);
  });
  
  // Sort dates
  const sortedDates = Object.keys(cleaningsByDate).sort();
  
  // Mark a cleaning as complete
  const handleMarkComplete = (taskId: number) => {
    // This would call an API to update the cleaning status
    alert(`Marking task ${taskId} as complete. This would be an API call in the real app.`);
  };
  
  // View detailed instructions
  const handleViewInstructions = (task: CleaningTask) => {
    alert(`Instructions for ${task.propertyName}: ${task.notes || 'No special instructions provided.'}`);
  };

  return (
    <div className="container mx-auto px-4 py-6 max-w-6xl">
      {/* Housekeeper Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-lg font-bold">Housekeeper View</h2>
            <p className="text-sm text-[#767676]">Welcome, Maria Lopez</p>
          </div>
          <div className="flex items-center gap-4">
            <button 
              onClick={() => window.location.href = '/availability/1'}
              className="text-sm bg-blue-100 text-blue-800 px-3 py-1.5 rounded-md hover:bg-blue-200 transition-colors"
            >
              <i className="fas fa-calendar-alt mr-1"></i> Manage Availability
            </button>
            <div className="text-sm bg-green-100 text-green-800 px-2 py-1 rounded-full">
              <i className="fas fa-circle text-xs mr-1"></i> Online
            </div>
          </div>
        </div>
      </div>
      
      {/* Today's Assignments */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-3">Today's Assignments</h3>
        
        {isTodayLoading ? (
          <div className="animate-pulse space-y-4">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="bg-gray-200 h-32 rounded-md"></div>
            ))}
          </div>
        ) : todayCleanings && todayCleanings.length > 0 ? (
          <div className="space-y-4">
            {todayCleanings.map(cleaning => (
              <div key={cleaning.id} className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center">
                    <div 
                      className="w-3 h-3 rounded-full mr-2" 
                      style={{ backgroundColor: cleaning.propertyColor }}
                    ></div>
                    <h4 className="font-medium">{cleaning.propertyName}</h4>
                  </div>
                  <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-200 text-xs">
                    Due Today
                  </Badge>
                </div>
                <div className="flex flex-col space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-[#767676]">Checkout Time:</span>
                    <span>{cleaning.checkoutTime}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-[#767676]">Address:</span>
                    <span>{cleaning.address || 'Not provided'}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-[#767676]">Access Code:</span>
                    <span>{cleaning.accessCode || 'Not provided'}</span>
                  </div>
                  <div className="flex justify-between text-sm mt-2">
                    <button 
                      onClick={() => handleViewInstructions(cleaning)}
                      className="text-[#00A699] font-medium"
                    >
                      View Instructions
                    </button>
                    <button 
                      onClick={() => handleMarkComplete(cleaning.id)}
                      className="bg-[#FF5A5F] text-white px-3 py-1 rounded text-sm"
                    >
                      Mark Complete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6 text-center">
            <p className="text-[#767676]">No assignments for today</p>
          </div>
        )}
      </div>
      
      {/* Upcoming Assignments */}
      <div>
        <h3 className="text-lg font-semibold mb-3">Upcoming Assignments</h3>
        
        {isUpcomingLoading ? (
          <div className="animate-pulse">
            <div className="bg-gray-200 h-48 rounded-md"></div>
          </div>
        ) : sortedDates.length > 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-100">
            {sortedDates.map(dateKey => (
              <div key={dateKey}>
                <div className="p-4 border-b border-gray-100">
                  <h4 className="font-medium">{formatDate(dateKey)}</h4>
                </div>
                {cleaningsByDate[dateKey].map(cleaning => (
                  <div key={cleaning.id} className="p-4 border-b border-gray-100">
                    <div className="flex items-center mb-1">
                      <div 
                        className="w-3 h-3 rounded-full mr-2" 
                        style={{ backgroundColor: cleaning.propertyColor }}
                      ></div>
                      <span className="font-medium">{cleaning.propertyName}</span>
                    </div>
                    <div className="text-sm text-[#767676]">{cleaning.checkoutTime} checkout</div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6 text-center">
            <p className="text-[#767676]">No upcoming assignments</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default HousekeeperView;
