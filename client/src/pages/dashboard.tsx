import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { formatDate } from '@/lib/utils';
import CalendarGrid from '@/components/ui/calendar-grid';
import CleaningList from '@/components/ui/cleaning-list';
import PropertiesList from '@/components/ui/properties-list';
import HousekeepersList from '@/components/ui/housekeepers-list';
import { Property, User, Booking, CalendarEvent, CleaningTask } from '@shared/schema';
import { useLocation } from 'wouter';

const Dashboard = () => {
  const [, navigate] = useLocation();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [calendarYear, setCalendarYear] = useState(new Date().getFullYear());
  const [calendarMonth, setCalendarMonth] = useState(new Date().getMonth());
  
  // Fetch data
  const { data: properties } = useQuery<Property[]>({
    queryKey: ['/api/properties'],
  });
  
  const { data: bookings } = useQuery<Booking[]>({
    queryKey: ['/api/bookings', `${calendarYear}-${calendarMonth}`],
  });
  
  const { data: cleaningToday } = useQuery<CleaningTask[]>({
    queryKey: ['/api/cleanings', formatDate(new Date(), 'yyyy-MM-dd')],
  });
  
  const { data: users } = useQuery<User[]>({
    queryKey: ['/api/users'],
  });
  
  // Count housekeepers
  const housekeepers = users?.filter(user => user.role === 'housekeeper') || [];
  
  // Transform bookings to calendar events
  const calendarEvents: CalendarEvent[] = bookings?.map(booking => {
    const property = properties?.find(p => p.id === booking.propertyId);
    return {
      id: booking.id,
      title: property?.name || 'Property',
      start: new Date(booking.checkIn),
      end: new Date(booking.checkOut),
      propertyId: booking.propertyId,
      color: property?.color || '#FF5A5F',
      cleaningStatus: booking.cleaningStatus,
      housekeeperId: booking.housekeeperId
    };
  }) || [];
  
  // Handle date selection in the calendar
  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
    // You can also add logic to fetch cleanings for the selected date
  };
  
  // Handle month change in the calendar
  const handleMonthChange = (year: number, month: number) => {
    setCalendarYear(year);
    setCalendarMonth(month);
  };
  
  // Navigation handlers
  const goToProperties = () => navigate('/properties');
  const goToHousekeepers = () => navigate('/housekeepers');
  const goToEditProperty = (property: Property) => navigate(`/edit-property/${property.id}`);
  const goToViewHousekeeper = (housekeeper: User) => navigate(`/edit-housekeeper/${housekeeper.id}`);
  
  // Calculate counts for stats
  const todayCheckouts = cleaningToday?.length || 0;
  
  // Calculate this week's checkouts
  const startOfWeek = new Date();
  startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(endOfWeek.getDate() + 6);
  
  const thisWeekCheckouts = bookings?.filter(booking => {
    const checkoutDate = new Date(booking.checkOut);
    return checkoutDate >= startOfWeek && checkoutDate <= endOfWeek;
  }).length || 0;
  
  return (
    <div className="container mx-auto px-4 py-6 max-w-6xl">
      {/* Quick Stats Section */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
          <p className="text-[#767676] text-sm">Today's Checkouts</p>
          <p className="text-2xl font-bold text-[#484848]">{todayCheckouts}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
          <p className="text-[#767676] text-sm">This Week</p>
          <p className="text-2xl font-bold text-[#484848]">{thisWeekCheckouts}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
          <p className="text-[#767676] text-sm">Properties</p>
          <p className="text-2xl font-bold text-[#484848]">{properties?.length || 0}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
          <p className="text-[#767676] text-sm">Housekeepers</p>
          <p className="text-2xl font-bold text-[#484848]">{housekeepers.length}</p>
        </div>
      </div>
      
      {/* Calendar Section */}
      <CalendarGrid 
        events={calendarEvents.map(event => ({
          id: event.id,
          propertyId: event.propertyId,
          date: event.end, // Use checkout date
          propertyColor: event.color
        }))}
        onDateClick={handleDateClick}
        onMonthChange={handleMonthChange}
      />
      
      {/* Today's Cleanings Section */}
      <CleaningList 
        date={new Date()} 
        limit={2}
        onViewAll={() => {}}
      />
      
      {/* Properties Section */}
      <PropertiesList 
        limit={3}
        onManageAll={goToProperties}
        onEdit={goToEditProperty}
      />
      
      {/* Housekeepers Section */}
      <HousekeepersList 
        limit={3}
        onManageAll={goToHousekeepers}
        onViewProfile={goToViewHousekeeper}
        onSendMessage={(housekeeper) => {}}
      />
    </div>
  );
};

export default Dashboard;
