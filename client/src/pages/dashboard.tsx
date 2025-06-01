import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { formatDate } from '@/lib/utils';
import CalendarGrid from '@/components/ui/calendar-grid';
import CleaningList from '@/components/ui/cleaning-list';
import PropertiesList from '@/components/ui/properties-list';
import HousekeepersList from '@/components/ui/housekeepers-list';
import { Property, User, Booking, CalendarEvent, CleaningTask } from '@shared/schema';
import { useLocation } from 'wouter';
import { apiRequest } from '@/lib/queryClient';
import { toast } from '@/hooks/use-toast';

const Dashboard = () => {
  const [, navigate] = useLocation();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [calendarYear, setCalendarYear] = useState(new Date().getFullYear());
  const [calendarMonth, setCalendarMonth] = useState(new Date().getMonth());
  const [isInitialSync, setIsInitialSync] = useState(true);
  const [showAllCleanings, setShowAllCleanings] = useState(false);
  const queryClient = useQueryClient();
  
  // Fetch data
  const { data: properties } = useQuery<Property[]>({
    queryKey: ['/api/properties'],
  });
  
  const { data: bookings } = useQuery<Booking[]>({
    queryKey: ['/api/bookings', `${calendarYear}-${calendarMonth}`],
  });
  
  const { data: cleaningToday } = useQuery<CleaningTask[]>({
    queryKey: ['/api/cleanings', formatDate(selectedDate, 'yyyy-MM-dd')],
  });
  
  const { data: users } = useQuery<User[]>({
    queryKey: ['/api/users'],
  });
  
  // Add mutation for syncing all properties
  const syncAllPropertiesMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/properties/sync-all', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include'
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || response.statusText);
      }
      
      return await response.json();
    },
    onSuccess: () => {
      // Refetch bookings and properties after successful sync
      queryClient.invalidateQueries({ queryKey: ['/api/bookings'] });
      queryClient.invalidateQueries({ queryKey: ['/api/properties'] });
      toast({
        title: "Calendar Synchronized",
        description: "All properties' calendars have been updated successfully.",
      });
    },
    onError: (error) => {
      console.error('Error syncing properties:', error);
      toast({
        title: "Sync Failed",
        description: "Could not sync all properties. Please try again later.",
        variant: "destructive"
      });
    }
  });
  
  // Auto-sync all properties when the page loads for the first time
  useEffect(() => {
    if (properties && properties.length > 0 && isInitialSync) {
      syncAllPropertiesMutation.mutate();
      setIsInitialSync(false);
    }
  }, [properties, isInitialSync]);
  
  // Count housekeepers
  const housekeepers = users?.filter(user => user.role === 'housekeeper') || [];
  
  // Transform bookings to calendar events
  const calendarEvents: CalendarEvent[] = bookings?.map(booking => {
    const property = properties?.find(p => p.id === booking.propertyId);
    let title = 'Property';
    
    // Rename properties for the dashboard display
    if (property) {
      if (property.id === 1) title = 'Airbnb';
      else if (property.id === 2) title = 'Booking';
      else if (property.id === 3) title = 'Agoda';
      else title = property.name;
    }
    
    return {
      id: booking.id,
      title: title,
      start: new Date(booking.checkIn),
      end: new Date(booking.checkOut),
      propertyId: booking.propertyId,
      color: property?.color || '#FF5A5F',
      cleaningStatus: booking.cleaningStatus || 'pending', // Ensure no null values
      housekeeperId: booking.housekeeperId || undefined // Convert null to undefined for type compatibility
    };
  }) || [];
  
  // Handle date selection in the calendar
  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
    setShowAllCleanings(false); // Reset to limited view when date changes
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
        date={selectedDate} 
        limit={showAllCleanings ? undefined : 2}
        showAll={showAllCleanings}
        onViewAll={() => setShowAllCleanings(true)}
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
