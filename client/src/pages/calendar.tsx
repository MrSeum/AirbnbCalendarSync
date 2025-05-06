import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { formatDate, getMonthName } from '@/lib/utils';
import { Booking, Property, CalendarEvent, CleaningTask } from '@shared/schema';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';

const Calendar = () => {
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  
  // Fetch data
  const { data: properties } = useQuery<Property[]>({
    queryKey: ['/api/properties'],
  });
  
  const { data: bookings } = useQuery<Booking[]>({
    queryKey: ['/api/bookings', `${currentYear}-${currentMonth}`],
  });
  
  const { data: cleaningTasks, isLoading: isLoadingTasks } = useQuery<CleaningTask[]>({
    queryKey: ['/api/cleanings', selectedDate ? formatDate(selectedDate, 'yyyy-MM-dd') : null],
    enabled: !!selectedDate
  });
  
  // Create calendar events array
  const events: CalendarEvent[] = bookings?.map(booking => {
    const property = properties?.find(p => p.id === booking.propertyId);
    return {
      id: booking.id,
      title: property?.name || 'Unknown Property',
      start: new Date(booking.checkIn),
      end: new Date(booking.checkOut),
      propertyId: booking.propertyId,
      color: property?.color || '#1E2A3B',
      cleaningStatus: booking.cleaningStatus || 'pending',
      housekeeperId: booking.housekeeperId || undefined
    };
  }) || [];
  
  // Navigate to previous month
  const prevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };
  
  // Navigate to next month
  const nextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };
  
  // Calculate days in month and start day
  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };
  
  const getFirstDayOfMonth = (year: number, month: number) => {
    return new Date(year, month, 1).getDay();
  };
  
  // Generate calendar days
  const generateCalendarDays = () => {
    const daysInMonth = getDaysInMonth(currentYear, currentMonth);
    const firstDay = getFirstDayOfMonth(currentYear, currentMonth);
    
    // Generate blanks for days from previous month
    const blanks = [];
    for (let i = 0; i < firstDay; i++) {
      blanks.push(
        <div key={`blank-${i}`} className="h-24 border border-gray-200 bg-gray-50"></div>
      );
    }
    
    // Generate days for current month
    const days = [];
    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(currentYear, currentMonth, d);
      const dateStr = formatDate(date, 'yyyy-MM-dd');
      
      // Check for events on this day
      const dayEvents = events.filter(event => {
        const eventEnd = formatDate(event.end, 'yyyy-MM-dd');
        return eventEnd === dateStr;
      });
      
      const isToday = formatDate(new Date(), 'yyyy-MM-dd') === dateStr;
      const isSelected = selectedDate && formatDate(selectedDate, 'yyyy-MM-dd') === dateStr;
      
      days.push(
        <div 
          key={`day-${d}`} 
          className={`h-24 border border-gray-200 ${isToday ? 'bg-blue-50' : 'bg-white'} 
                     ${isSelected ? 'ring-2 ring-[#3B68B5]' : ''} 
                     relative cursor-pointer transition-all hover:bg-blue-50`}
          onClick={() => setSelectedDate(date)}
        >
          <div className="p-1">
            <span className={`inline-block rounded-full w-6 h-6 text-center leading-6 text-sm
                             ${isToday ? 'bg-[#3B68B5] text-white' : 'text-gray-700'}`}>
              {d}
            </span>
          </div>
          
          <div className="px-1 overflow-hidden max-h-16">
            {dayEvents.map((event, idx) => (
              <div 
                key={`event-${event.id}-${idx}`}
                className="text-xs mb-1 overflow-hidden text-ellipsis whitespace-nowrap rounded px-1 py-0.5 text-white"
                style={{ backgroundColor: event.color }}
              >
                {event.title} - Checkout
              </div>
            ))}
          </div>
        </div>
      );
    }
    
    return [...blanks, ...days];
  };
  
  return (
    <div className="container mx-auto px-4 py-6 max-w-6xl">
      <div className="mb-6 flex flex-wrap items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">Cleaning Calendar</h1>
        
        <div className="flex items-center space-x-2">
          <Button 
            variant="outline" 
            size="icon" 
            className="h-8 w-8 border-[#3B68B5] text-[#3B68B5]"
            onClick={prevMonth}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          
          <h2 className="text-lg font-semibold text-gray-800 w-48 text-center">
            {getMonthName(currentMonth)} {currentYear}
          </h2>
          
          <Button 
            variant="outline" 
            size="icon" 
            className="h-8 w-8 border-[#3B68B5] text-[#3B68B5]"
            onClick={nextMonth}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      {/* Calendar grid */}
      <div className="mb-6">
        <div className="grid grid-cols-7 gap-0 mb-1">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="text-sm font-medium text-gray-500 text-center py-2">
              {day}
            </div>
          ))}
        </div>
        
        <div className="grid grid-cols-7 gap-0">
          {generateCalendarDays()}
        </div>
      </div>
      
      {/* Selected day tasks */}
      {selectedDate && (
        <div>
          <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
            <CalendarIcon className="mr-2 h-5 w-5 text-[#3B68B5]" />
            Cleanings for {formatDate(selectedDate)}
          </h2>
          
          {isLoadingTasks ? (
            <div className="animate-pulse space-y-4">
              {[1, 2].map(i => (
                <div key={i} className="h-24 bg-gray-200 rounded-md"></div>
              ))}
            </div>
          ) : !cleaningTasks || cleaningTasks.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <h3 className="text-lg font-medium text-gray-600">No cleanings scheduled</h3>
                <p className="text-gray-500 mt-2">
                  There are no cleanings scheduled for {formatDate(selectedDate)}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {cleaningTasks.map(task => (
                <Card key={task.id} className="border-l-4" style={{ borderLeftColor: task.propertyColor }}>
                  <CardContent className="p-4">
                    <div className="mb-2">
                      <h3 className="font-semibold">{task.propertyName}</h3>
                      <div className="text-sm text-gray-500">
                        Checkout at {task.checkoutTime}
                      </div>
                    </div>
                    
                    {task.address && (
                      <div className="text-sm text-gray-600 mb-2">
                        {task.address}
                      </div>
                    )}
                    
                    <div className="flex justify-between items-center mt-2">
                      <span className="text-sm">
                        {task.housekeeperId ? 'Assigned' : 'Unassigned'}
                      </span>
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="h-8 text-[#3B68B5] border-[#3B68B5] hover:bg-[#E8EDF4]"
                      >
                        Details
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Calendar;
