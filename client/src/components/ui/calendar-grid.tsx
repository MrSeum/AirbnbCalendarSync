import React, { useState, useEffect } from 'react';
import { generateCalendarDays, getMonthName, formatDate } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Property } from '@shared/schema';

interface CalendarEvent {
  id: number;
  propertyId: number;
  date: Date; // checkout date
  propertyColor: string;
}

interface CalendarGridProps {
  events: CalendarEvent[];
  onDateClick?: (date: Date) => void;
  onMonthChange?: (year: number, month: number) => void;
}

const CalendarGrid: React.FC<CalendarGridProps> = ({ events, onDateClick, onMonthChange }) => {
  // Get current date info
  const [currentDate, setCurrentDate] = useState(new Date());
  const [calendarDays, setCalendarDays] = useState<Array<{day: number, currentMonth: boolean}>>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>('');
  
  // Map events to days
  const [eventsByDay, setEventsByDay] = useState<{[key: string]: CalendarEvent[]}>({});
  
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Fetch properties for the dropdown
  const { data: properties } = useQuery<Property[]>({
    queryKey: ['/api/properties'],
  });

  // Mutation for adding manual checkout
  const addCheckoutMutation = useMutation({
    mutationFn: async ({ propertyId, checkoutDate }: { propertyId: number, checkoutDate: string }) => {
      const bookingData = {
        propertyId,
        guestName: 'Manual Entry',
        checkIn: checkoutDate, // Same day checkin for manual entries
        checkOut: checkoutDate,
        cleaningStatus: 'pending'
      };
      const response = await apiRequest('POST', '/api/bookings', bookingData);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Checkout Added",
        description: "Manual checkout has been added successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/bookings'] });
      setIsAddDialogOpen(false);
      setSelectedPropertyId('');
      setSelectedDate(null);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to add checkout: ${error.message}`,
        variant: "destructive",
      });
    }
  });
  
  useEffect(() => {
    const month = currentDate.getMonth();
    const year = currentDate.getFullYear();
    const days = generateCalendarDays(year, month);
    setCalendarDays(days);
    
    if (onMonthChange) {
      onMonthChange(year, month);
    }
  }, [currentDate, onMonthChange]);
  
  useEffect(() => {
    // Group events by day
    const eventMap: {[key: string]: CalendarEvent[]} = {};
    
    events.forEach(event => {
      const dateKey = `${event.date.getFullYear()}-${event.date.getMonth()}-${event.date.getDate()}`;
      if (!eventMap[dateKey]) {
        eventMap[dateKey] = [];
      }
      eventMap[dateKey].push(event);
    });
    
    setEventsByDay(eventMap);
  }, [events]);
  
  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };
  
  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };
  
  const handleDateClick = (day: number, currentMonth: boolean) => {
    if (!onDateClick) return;
    
    const clickedDate = new Date(
      currentDate.getFullYear(),
      currentMonth ? currentDate.getMonth() : (currentDate.getMonth() + (day < 15 ? 1 : -1)),
      day
    );
    
    onDateClick(clickedDate);
  };

  const handleAddCheckout = (day: number, currentMonth: boolean) => {
    if (!currentMonth) return;
    
    const clickedDate = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth(),
      day
    );
    
    setSelectedDate(clickedDate);
    setIsAddDialogOpen(true);
  };

  const handleSubmitCheckout = () => {
    if (!selectedDate || !selectedPropertyId) return;
    
    const propertyId = parseInt(selectedPropertyId);
    const checkoutDate = formatDate(selectedDate, 'yyyy-MM-dd');
    
    addCheckoutMutation.mutate({ propertyId, checkoutDate });
  };
  
  // Check if a date has events
  const getEventsForDay = (day: number, currentMonth: boolean): CalendarEvent[] => {
    if (!currentMonth) return [];
    
    const dateKey = `${currentDate.getFullYear()}-${currentDate.getMonth()}-${day}`;
    return eventsByDay[dateKey] || [];
  };
  
  // Check if a date is today
  const isToday = (day: number, currentMonth: boolean): boolean => {
    if (!currentMonth) return false;
    
    const today = new Date();
    return (
      day === today.getDate() &&
      currentDate.getMonth() === today.getMonth() &&
      currentDate.getFullYear() === today.getFullYear()
    );
  };
  
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-100 mb-6 overflow-hidden">
      <div className="flex items-center justify-between p-4 border-b border-gray-100">
        <div className="flex items-center space-x-3">
          <h2 className="text-lg font-bold text-[#484848]">Checkout Calendar</h2>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button
                size="sm"
                className="h-8 w-8 p-0 bg-[#00A699] hover:bg-[#008B7A] text-white"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Add Manual Checkout</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                {selectedDate && (
                  <div className="text-sm text-gray-600">
                    Date: {formatDate(selectedDate, 'MMM d, yyyy')}
                  </div>
                )}
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Select Property</label>
                  <Select value={selectedPropertyId} onValueChange={setSelectedPropertyId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a property..." />
                    </SelectTrigger>
                    <SelectContent>
                      {properties?.map((property) => (
                        <SelectItem key={property.id} value={property.id.toString()}>
                          {property.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex justify-end space-x-2 pt-4">
                  <Button 
                    variant="outline" 
                    onClick={() => setIsAddDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleSubmitCheckout}
                    disabled={!selectedPropertyId || addCheckoutMutation.isPending}
                    className="bg-[#00A699] hover:bg-[#008B7A] text-white"
                  >
                    {addCheckoutMutation.isPending ? 'Adding...' : 'Add Checkout'}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
        <div className="flex items-center space-x-2">
          <button 
            onClick={handlePrevMonth}
            className="p-2 hover:bg-gray-100 rounded">
            <i className="fas fa-chevron-left text-[#767676]"></i>
          </button>
          <h3 className="text-md font-semibold">
            {getMonthName(currentDate.getMonth())} {currentDate.getFullYear()}
          </h3>
          <button 
            onClick={handleNextMonth}
            className="p-2 hover:bg-gray-100 rounded">
            <i className="fas fa-chevron-right text-[#767676]"></i>
          </button>
        </div>
      </div>
      
      {/* Calendar Header */}
      <div className="grid grid-cols-7 text-center text-sm font-medium p-4 pb-2">
        <div>Sun</div>
        <div>Mon</div>
        <div>Tue</div>
        <div>Wed</div>
        <div>Thu</div>
        <div>Fri</div>
        <div>Sat</div>
      </div>
      
      {/* Calendar Body */}
      <div className="grid grid-cols-7 gap-1 px-4 pb-4">
        {calendarDays.map((day, index) => {
          const dayEvents = getEventsForDay(day.day, day.currentMonth);
          const today = isToday(day.day, day.currentMonth);
          
          return (
            <div 
              key={index}
              className={`
                aspect-w-1 aspect-h-1 p-1 text-center relative group
                ${day.currentMonth ? '' : 'text-gray-400'}
                ${today ? 'bg-gray-100 rounded-lg border-2 border-[#FF5A5F] font-bold' : ''}
                ${!day.currentMonth ? 'cursor-default' : 'cursor-pointer hover:bg-gray-50'}
              `}
            >
              <div 
                onClick={() => handleDateClick(day.day, day.currentMonth)}
                className="calendar-cell w-full h-full flex items-start justify-center pt-1"
              >
                {day.day}
              </div>
              
              {/* Add button - visible on hover for current month days */}
              {day.currentMonth && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleAddCheckout(day.day, day.currentMonth);
                  }}
                  className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-[#00A699] hover:bg-[#008B7A] text-white rounded-full w-4 h-4 flex items-center justify-center"
                  title="Add checkout"
                >
                  <Plus className="w-2 h-2" />
                </button>
              )}
              
              {dayEvents.length > 0 && (
                <div className="absolute bottom-1 left-0 right-0 flex justify-center">
                  {dayEvents.map((event, eIdx) => (
                    <span 
                      key={`${event.id}-${eIdx}`}
                      className="booking-dot inline-block w-2 h-2 rounded-full mx-0.5"
                      style={{ backgroundColor: event.propertyColor }}
                    ></span>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
      
      <Separator />
      
      <div className="p-4">
        <div className="text-sm font-medium mb-2">Properties:</div>
        <div className="flex flex-wrap gap-4">
          <div className="flex items-center">
            <span className="booking-dot bg-red-500 inline-block w-3 h-3 rounded-full"></span>
            <span className="text-sm ml-2">Soho</span>
          </div>
          <div className="flex items-center">
            <span className="booking-dot bg-green-500 inline-block w-3 h-3 rounded-full"></span>
            <span className="text-sm ml-2">Thao</span>
          </div>
          <div className="flex items-center">
            <span className="booking-dot bg-blue-500 inline-block w-3 h-3 rounded-full"></span>
            <span className="text-sm ml-2">D1mension</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CalendarGrid;
