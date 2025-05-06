import { useState, useEffect } from 'react';
import { useLocation, useParams } from 'wouter';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useForm } from 'react-hook-form';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useQuery } from '@tanstack/react-query';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, X } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

interface Availability {
  id: number;
  housekeeperId: number;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  maxCleanings: number;
}

interface TimeOffRequest {
  id: number;
  housekeeperId: number;
  startDate: string;
  endDate: string;
  reason: string;
  approved: boolean;
}

interface AvailabilityFormData {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  maxCleanings: number;
}

interface TimeOffFormData {
  startDate: string;
  endDate: string;
  reason: string;
}

export default function AvailabilityPage() {
  const [, setLocation] = useLocation();
  const params = useParams();
  const userId = params.id ? parseInt(params.id) : 1; // Default to first user for demo
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('availability');
  
  // Query for user data
  const userQuery = useQuery({
    queryKey: ['/api/users', userId],
    queryFn: async () => {
      const response = await apiRequest(`/api/users/${userId}`);
      return response.json();
    }
  });
  
  // Query for availability data
  const availabilityQuery = useQuery({
    queryKey: ['/api/availability/housekeeper', userId],
    queryFn: async () => {
      const response = await apiRequest(`/api/availability/housekeeper/${userId}`);
      return response.json();
    }
  });
  
  // Query for time off requests
  const timeOffQuery = useQuery({
    queryKey: ['/api/time-off/housekeeper', userId],
    queryFn: async () => {
      const response = await apiRequest(`/api/time-off/housekeeper/${userId}`);
      return response.json();
    }
  });
  
  // Initialize forms
  const availabilityForm = useForm<AvailabilityFormData>({
    defaultValues: {
      dayOfWeek: 0,
      startTime: '09:00',
      endTime: '17:00',
      maxCleanings: 3
    }
  });
  
  const timeOffForm = useForm<TimeOffFormData>({
    defaultValues: {
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date().toISOString().split('T')[0],
      reason: ''
    }
  });
  
  // Submit handlers
  const handleAvailabilitySubmit = async (data: AvailabilityFormData) => {
    try {
      // Add housekeeperId to the data
      const availabilityData = {
        ...data,
        housekeeperId: userId
      };
      
      await apiRequest('/api/availability', {
        method: 'POST',
        body: JSON.stringify(availabilityData)
      });
      
      toast({
        title: 'Availability Added',
        description: `You are now available on ${dayNames[data.dayOfWeek]} from ${data.startTime} to ${data.endTime}.`,
      });
      
      // Reset form and refresh data
      availabilityForm.reset();
      queryClient.invalidateQueries({ queryKey: ['/api/availability/housekeeper', userId] });
    } catch (err) {
      toast({
        title: 'Error',
        description: 'Failed to add availability. Please try again.',
        variant: 'destructive'
      });
      console.error('Error adding availability:', err);
    }
  };
  
  const handleTimeOffSubmit = async (data: TimeOffFormData) => {
    try {
      // Add housekeeperId to the data
      const timeOffData = {
        ...data,
        housekeeperId: userId,
        approved: false // Default to not approved
      };
      
      await apiRequest('/api/time-off', {
        method: 'POST',
        body: JSON.stringify(timeOffData)
      });
      
      toast({
        title: 'Time Off Requested',
        description: `Your time off request from ${data.startDate} to ${data.endDate} has been submitted for approval.`,
      });
      
      // Reset form and refresh data
      timeOffForm.reset();
      queryClient.invalidateQueries({ queryKey: ['/api/time-off/housekeeper', userId] });
    } catch (err) {
      toast({
        title: 'Error',
        description: 'Failed to request time off. Please try again.',
        variant: 'destructive'
      });
      console.error('Error requesting time off:', err);
    }
  };
  
  const handleDeleteAvailability = async (id: number) => {
    try {
      await apiRequest(`/api/availability/${id}`, {
        method: 'DELETE'
      });
      
      toast({
        title: 'Availability Removed',
        description: 'Your availability has been removed.',
      });
      
      queryClient.invalidateQueries({ queryKey: ['/api/availability/housekeeper', userId] });
    } catch (err) {
      toast({
        title: 'Error',
        description: 'Failed to remove availability. Please try again.',
        variant: 'destructive'
      });
      console.error('Error removing availability:', err);
    }
  };
  
  const handleDeleteTimeOff = async (id: number) => {
    try {
      await apiRequest(`/api/time-off/${id}`, {
        method: 'DELETE'
      });
      
      toast({
        title: 'Time Off Request Cancelled',
        description: 'Your time off request has been cancelled.',
      });
      
      queryClient.invalidateQueries({ queryKey: ['/api/time-off/housekeeper', userId] });
    } catch (err) {
      toast({
        title: 'Error',
        description: 'Failed to cancel time off request. Please try again.',
        variant: 'destructive'
      });
      console.error('Error cancelling time off request:', err);
    }
  };
  
  // Loading states
  if (userQuery.isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading user data...</span>
      </div>
    );
  }
  
  if (!userQuery.data) {
    return (
      <div className="container mx-auto p-6">
        <Alert variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>User not found. Please go back and try again.</AlertDescription>
        </Alert>
        <Button className="mt-4" onClick={() => setLocation('/housekeepers')}>Back to Housekeepers</Button>
      </div>
    );
  }

  const user = userQuery.data;
  
  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Manage Availability</h1>
        <Button variant="outline" onClick={() => setLocation(`/edit-housekeeper/${userId}`)}>
          Back to Profile
        </Button>
      </div>
      
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>{user.fullName}</CardTitle>
          <CardDescription>Set your availability and request time off</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="availability" value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="availability">Weekly Availability</TabsTrigger>
              <TabsTrigger value="timeoff">Time Off Requests</TabsTrigger>
            </TabsList>
            
            <TabsContent value="availability" className="p-4">
              <div className="grid gap-6 grid-cols-1 md:grid-cols-2">
                <div>
                  <h3 className="text-lg font-semibold mb-4">Add Availability</h3>
                  <form onSubmit={availabilityForm.handleSubmit(handleAvailabilitySubmit)} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="dayOfWeek">Day of Week</Label>
                      <Select
                        defaultValue="0"
                        onValueChange={(value) => availabilityForm.setValue('dayOfWeek', parseInt(value))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select day" />
                        </SelectTrigger>
                        <SelectContent>
                          {dayNames.map((day, index) => (
                            <SelectItem key={index} value={index.toString()}>{day}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="startTime">Start Time</Label>
                        <Input
                          id="startTime"
                          type="time"
                          {...availabilityForm.register('startTime')}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="endTime">End Time</Label>
                        <Input
                          id="endTime"
                          type="time"
                          {...availabilityForm.register('endTime')}
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="maxCleanings">Max Cleanings Per Day</Label>
                      <Input
                        id="maxCleanings"
                        type="number"
                        min="1"
                        max="10"
                        {...availabilityForm.register('maxCleanings', { valueAsNumber: true })}
                      />
                    </div>
                    
                    <Button type="submit" className="w-full">
                      {availabilityQuery.isLoading ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : null}
                      Add Availability
                    </Button>
                  </form>
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold mb-4">Current Availability</h3>
                  {availabilityQuery.isLoading ? (
                    <div className="flex items-center justify-center h-40">
                      <Loader2 className="h-8 w-8 animate-spin" />
                    </div>
                  ) : availabilityQuery.data?.length > 0 ? (
                    <div className="space-y-4">
                      {availabilityQuery.data.map((avail: Availability) => (
                        <div key={avail.id} className="flex items-center justify-between p-3 border rounded-md">
                          <div>
                            <span className="font-medium">{dayNames[avail.dayOfWeek]}</span>
                            <p className="text-sm text-muted-foreground">
                              {avail.startTime} - {avail.endTime} ({avail.maxCleanings} max cleanings)
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteAvailability(avail.id)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      No availability set. Add some availability to get assigned to cleanings.
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="timeoff" className="p-4">
              <div className="grid gap-6 grid-cols-1 md:grid-cols-2">
                <div>
                  <h3 className="text-lg font-semibold mb-4">Request Time Off</h3>
                  <form onSubmit={timeOffForm.handleSubmit(handleTimeOffSubmit)} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="startDate">Start Date</Label>
                      <Input
                        id="startDate"
                        type="date"
                        {...timeOffForm.register('startDate')}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="endDate">End Date</Label>
                      <Input
                        id="endDate"
                        type="date"
                        {...timeOffForm.register('endDate')}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="reason">Reason (Optional)</Label>
                      <Input
                        id="reason"
                        placeholder="Vacation, sick day, etc."
                        {...timeOffForm.register('reason')}
                      />
                    </div>
                    
                    <Button type="submit" className="w-full">
                      {timeOffQuery.isLoading ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : null}
                      Request Time Off
                    </Button>
                  </form>
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold mb-4">Pending Requests</h3>
                  {timeOffQuery.isLoading ? (
                    <div className="flex items-center justify-center h-40">
                      <Loader2 className="h-8 w-8 animate-spin" />
                    </div>
                  ) : timeOffQuery.data?.length > 0 ? (
                    <div className="space-y-4">
                      {timeOffQuery.data.map((timeOff: TimeOffRequest) => (
                        <div key={timeOff.id} className="p-3 border rounded-md">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium">
                              {new Date(timeOff.startDate).toLocaleDateString()} - {new Date(timeOff.endDate).toLocaleDateString()}
                            </span>
                            <div className="flex items-center gap-2">
                              <span className={`px-2 py-1 text-xs rounded ${timeOff.approved ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                {timeOff.approved ? 'Approved' : 'Pending'}
                              </span>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDeleteTimeOff(timeOff.id)}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                          {timeOff.reason && (
                            <p className="text-sm text-muted-foreground">
                              Reason: {timeOff.reason}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      No pending time off requests.
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
