import React, { useState, useEffect } from 'react';
import { generateCalendarDays, getMonthName } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';

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
  
  // Map events to days
  const [eventsByDay, setEventsByDay] = useState<{[key: string]: CalendarEvent[]}>({});
  
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
        <h2 className="text-lg font-bold text-[#484848]">Checkout Calendar</h2>
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
              onClick={() => handleDateClick(day.day, day.currentMonth)}
              className={`
                aspect-w-1 aspect-h-1 p-1 text-center relative 
                ${day.currentMonth ? '' : 'text-gray-400'}
                ${today ? 'bg-gray-100 rounded-lg border-2 border-[#FF5A5F] font-bold' : ''}
                ${!day.currentMonth ? 'cursor-default' : 'cursor-pointer hover:bg-gray-50'}
              `}
            >
              <div className="calendar-cell">{day.day}</div>
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
        <div className="flex flex-wrap gap-2">
          {/* This will be populated dynamically from the properties */}
          <div className="flex items-center">
            <span className="booking-dot bg-[#FF5A5F] inline-block w-2 h-2 rounded-full"></span>
            <span className="text-sm ml-1">Beach House</span>
          </div>
          <div className="flex items-center">
            <span className="booking-dot bg-[#FC642D] inline-block w-2 h-2 rounded-full"></span>
            <span className="text-sm ml-1">Downtown Loft</span>
          </div>
          <div className="flex items-center">
            <span className="booking-dot bg-[#00A699] inline-block w-2 h-2 rounded-full"></span>
            <span className="text-sm ml-1">Mountain Cabin</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CalendarGrid;
