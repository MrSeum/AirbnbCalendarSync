import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { CalendarIcon, Check, Loader2, X } from 'lucide-react';
import { format } from 'date-fns';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

interface User {
  id: number;
  fullName: string;
  email: string;
  role: string;
  avatar: string | null;
  rating: number | null;
  cleaningCount: number | null;
}

interface TimeOffRequest {
  id: number;
  housekeeperId: number;
  startDate: string;
  endDate: string;
  reason: string;
  approved: boolean;
}

interface CleaningTask {
  id: number;
  propertyId: number;
  propertyName: string;
  propertyColor: string;
  checkoutTime: string;
  checkoutDate: Date;
  address?: string;
  accessCode?: string;
  notes?: string;
  status: string;
  housekeeperId?: number;
}

export default function SchedulerPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('auto-assign');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [availableHousekeepers, setAvailableHousekeepers] = useState<User[]>([]);
  const [selectedHousekeeper, setSelectedHousekeeper] = useState<number | null>(null);
  const [selectedTask, setSelectedTask] = useState<number | null>(null);
  
  // Format date for API requests
  const formatDateForApi = (date: Date) => {
    return date.toISOString().split('T')[0];
  };
  
  // Query for time off requests that need approval
  const timeOffQuery = useQuery({
    queryKey: ['/api/time-off-pending'],
    queryFn: async () => {
      // This is a mock endpoint - in a real app, you'd have an endpoint to fetch only pending requests
      const allTimeOff = await apiRequest('/api/time-off/all');
      return allTimeOff.filter((req: TimeOffRequest) => !req.approved);
    },
    enabled: activeTab === 'time-off'
  });
  
  // Query for cleaning tasks on the selected date
  const tasksQuery = useQuery({
    queryKey: ['/api/cleanings', formatDateForApi(selectedDate)],
    queryFn: () => apiRequest(`/api/cleanings/${formatDateForApi(selectedDate)}`),
    enabled: activeTab === 'auto-assign' || activeTab === 'manual-assign'
  });
  
  // Query for housekeepers
  const housekeepersQuery = useQuery({
    queryKey: ['/api/users/housekeepers'],
    queryFn: async () => {
      const users = await apiRequest('/api/users');
      return users.filter((user: User) => user.role === 'housekeeper');
    }
  });
  
  // Query for available housekeepers on selected date
  const fetchAvailableHousekeepers = async () => {
    try {
      const available = await apiRequest(`/api/available-housekeepers/${formatDateForApi(selectedDate)}`);
      setAvailableHousekeepers(available);
    } catch (err) {
      console.error('Error fetching available housekeepers:', err);
      setAvailableHousekeepers([]);
    }
  };
  
  // Auto-assign mutation
  const autoAssignMutation = useMutation({
    mutationFn: async (date: string) => {
      return apiRequest(`/api/auto-assign/${date}`, {
        method: 'POST'
      });
    },
    onSuccess: (data) => {
      toast({
        title: 'Auto Assignment Complete',
        description: data.message,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/cleanings', formatDateForApi(selectedDate)] });
    },
    onError: (err) => {
      toast({
        title: 'Error',
        description: 'Failed to auto-assign housekeepers. Please try again.',
        variant: 'destructive'
      });
      console.error('Error auto-assigning housekeepers:', err);
    }
  });
  
  // Manual assign mutation
  const manualAssignMutation = useMutation({
    mutationFn: async ({bookingId, housekeeperId}: {bookingId: number, housekeeperId: number}) => {
      return apiRequest('/api/assign-housekeeper', {
        method: 'POST',
        body: JSON.stringify({bookingId, housekeeperId})
      });
    },
    onSuccess: () => {
      toast({
        title: 'Housekeeper Assigned',
        description: 'The housekeeper has been assigned to the selected task.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/cleanings', formatDateForApi(selectedDate)] });
      // Reset selections
      setSelectedHousekeeper(null);
      setSelectedTask(null);
    },
    onError: (err) => {
      toast({
        title: 'Error',
        description: 'Failed to assign housekeeper. Please try again.',
        variant: 'destructive'
      });
      console.error('Error assigning housekeeper:', err);
    }
  });
  
  // Time off approval mutation
  const approveTimeOffMutation = useMutation({
    mutationFn: async (timeOffId: number) => {
      return apiRequest(`/api/time-off/${timeOffId}`, {
        method: 'PATCH',
        body: JSON.stringify({approved: true})
      });
    },
    onSuccess: () => {
      toast({
        title: 'Time Off Approved',
        description: 'The time off request has been approved.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/time-off-pending'] });
    },
    onError: (err) => {
      toast({
        title: 'Error',
        description: 'Failed to approve time off request. Please try again.',
        variant: 'destructive'
      });
      console.error('Error approving time off:', err);
    }
  });
  
  // Time off rejection mutation
  const rejectTimeOffMutation = useMutation({
    mutationFn: async (timeOffId: number) => {
      return apiRequest(`/api/time-off/${timeOffId}`, {
        method: 'DELETE'
      });
    },
    onSuccess: () => {
      toast({
        title: 'Time Off Rejected',
        description: 'The time off request has been rejected.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/time-off-pending'] });
    },
    onError: (err) => {
      toast({
        title: 'Error',
        description: 'Failed to reject time off request. Please try again.',
        variant: 'destructive'
      });
      console.error('Error rejecting time off:', err);
    }
  });
  
  // Effects
  useEffect(() => {
    if (activeTab === 'auto-assign' || activeTab === 'manual-assign') {
      fetchAvailableHousekeepers();
    }
  }, [selectedDate, activeTab]);
  
  // Handlers
  const handleAutoAssign = () => {
    autoAssignMutation.mutate(formatDateForApi(selectedDate));
  };
  
  const handleManualAssign = () => {
    if (selectedTask && selectedHousekeeper) {
      manualAssignMutation.mutate({bookingId: selectedTask, housekeeperId: selectedHousekeeper});
    } else {
      toast({
        title: 'Selection Required',
        description: 'Please select both a task and a housekeeper.',
        variant: 'destructive'
      });
    }
  };
  
  const handleApproveTimeOff = (id: number) => {
    approveTimeOffMutation.mutate(id);
  };
  
  const handleRejectTimeOff = (id: number) => {
    rejectTimeOffMutation.mutate(id);
  };
  
  // Get housekeeper name helper
  const getHousekeeperName = (id: number | undefined) => {
    if (!id) return 'Unassigned';
    const housekeeper = housekeepersQuery.data?.find((h: User) => h.id === id);
    return housekeeper ? housekeeper.fullName : 'Unknown';
  };
  
  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Cleaning Scheduler</h1>
        <Button variant="outline" onClick={() => setLocation('/dashboard')}>
          Back to Dashboard
        </Button>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Schedule Management</CardTitle>
          <CardDescription>Assign housekeepers to cleaning tasks and manage time off requests</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="auto-assign" value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="auto-assign">Auto Assignment</TabsTrigger>
              <TabsTrigger value="manual-assign">Manual Assignment</TabsTrigger>
              <TabsTrigger value="time-off">Time Off Approval</TabsTrigger>
            </TabsList>
            
            <TabsContent value="auto-assign" className="p-4">
              <div className="grid gap-6">
                <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
                  <div>
                    <Label>Select Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-[240px] justify-start text-left font-normal mt-1",
                            !selectedDate && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {selectedDate ? format(selectedDate, "PPP") : <span>Pick a date</span>}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={selectedDate}
                          onSelect={(date) => date && setSelectedDate(date)}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div className="flex-1"></div>
                  <div className="mt-6 md:mt-0">
                    <Button
                      onClick={handleAutoAssign}
                      disabled={autoAssignMutation.isPending}
                    >
                      {autoAssignMutation.isPending ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : null}
                      Auto-Assign Housekeepers
                    </Button>
                  </div>
                </div>
                
                <div className="mt-6">
                  <h3 className="text-lg font-semibold mb-4">Available Housekeepers for {format(selectedDate, "PPP")}</h3>
                  {availableHousekeepers.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {availableHousekeepers.map((housekeeper) => (
                        <Card key={housekeeper.id}>
                          <CardContent className="pt-6">
                            <div className="flex items-center gap-4">
                              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                                {housekeeper.fullName.charAt(0)}
                              </div>
                              <div>
                                <h4 className="font-semibold">{housekeeper.fullName}</h4>
                                <p className="text-sm text-muted-foreground">
                                  {housekeeper.cleaningCount || 0} cleanings completed
                                </p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      No housekeepers available on this date.
                    </div>
                  )}
                </div>
                
                <div className="mt-6">
                  <h3 className="text-lg font-semibold mb-4">Cleaning Tasks for {format(selectedDate, "PPP")}</h3>
                  {tasksQuery.isLoading ? (
                    <div className="flex items-center justify-center h-40">
                      <Loader2 className="h-8 w-8 animate-spin" />
                    </div>
                  ) : tasksQuery.data?.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left p-2">Property</th>
                            <th className="text-left p-2">Checkout</th>
                            <th className="text-left p-2">Status</th>
                            <th className="text-left p-2">Assigned To</th>
                          </tr>
                        </thead>
                        <tbody>
                          {tasksQuery.data.map((task: CleaningTask) => (
                            <tr key={task.id} className="border-b hover:bg-muted/50">
                              <td className="p-2">
                                <div className="flex items-center">
                                  <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: task.propertyColor }}></div>
                                  {task.propertyName}
                                </div>
                              </td>
                              <td className="p-2">{task.checkoutTime}</td>
                              <td className="p-2">
                                <Badge
                                  variant={task.status === 'completed' ? 'default' : 
                                          task.status === 'assigned' ? 'outline' : 'secondary'}
                                >
                                  {task.status.charAt(0).toUpperCase() + task.status.slice(1)}
                                </Badge>
                              </td>
                              <td className="p-2">{getHousekeeperName(task.housekeeperId)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      No cleaning tasks for this date.
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="manual-assign" className="p-4">
              <div className="grid gap-6">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="w-full md:w-1/3">
                    <Label>Select Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-full justify-start text-left font-normal mt-1",
                            !selectedDate && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {selectedDate ? format(selectedDate, "PPP") : <span>Pick a date</span>}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={selectedDate}
                          onSelect={(date) => date && setSelectedDate(date)}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  
                  <div className="w-full md:w-1/3">
                    <Label>Select Task</Label>
                    <Select 
                      value={selectedTask?.toString() || ''} 
                      onValueChange={(value) => setSelectedTask(parseInt(value))}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Select a task" />
                      </SelectTrigger>
                      <SelectContent>
                        {tasksQuery.data?.map((task: CleaningTask) => (
                          <SelectItem key={task.id} value={task.id.toString()}>
                            {task.propertyName} - {task.checkoutTime}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="w-full md:w-1/3">
                    <Label>Select Housekeeper</Label>
                    <Select 
                      value={selectedHousekeeper?.toString() || ''}
                      onValueChange={(value) => setSelectedHousekeeper(parseInt(value))}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Select a housekeeper" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableHousekeepers.map((housekeeper) => (
                          <SelectItem key={housekeeper.id} value={housekeeper.id.toString()}>
                            {housekeeper.fullName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="flex justify-end mt-4">
                  <Button
                    onClick={handleManualAssign}
                    disabled={manualAssignMutation.isPending || !selectedTask || !selectedHousekeeper}
                  >
                    {manualAssignMutation.isPending ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : null}
                    Assign Housekeeper
                  </Button>
                </div>
                
                <div className="mt-6">
                  <h3 className="text-lg font-semibold mb-4">Cleaning Tasks for {format(selectedDate, "PPP")}</h3>
                  {tasksQuery.isLoading ? (
                    <div className="flex items-center justify-center h-40">
                      <Loader2 className="h-8 w-8 animate-spin" />
                    </div>
                  ) : tasksQuery.data?.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left p-2">Property</th>
                            <th className="text-left p-2">Checkout</th>
                            <th className="text-left p-2">Status</th>
                            <th className="text-left p-2">Assigned To</th>
                          </tr>
                        </thead>
                        <tbody>
                          {tasksQuery.data.map((task: CleaningTask) => (
                            <tr 
                              key={task.id} 
                              className={`border-b hover:bg-muted/50 cursor-pointer ${selectedTask === task.id ? 'bg-muted' : ''}`}
                              onClick={() => setSelectedTask(task.id)}
                            >
                              <td className="p-2">
                                <div className="flex items-center">
                                  <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: task.propertyColor }}></div>
                                  {task.propertyName}
                                </div>
                              </td>
                              <td className="p-2">{task.checkoutTime}</td>
                              <td className="p-2">
                                <Badge
                                  variant={task.status === 'completed' ? 'default' : 
                                          task.status === 'assigned' ? 'outline' : 'secondary'}
                                >
                                  {task.status.charAt(0).toUpperCase() + task.status.slice(1)}
                                </Badge>
                              </td>
                              <td className="p-2">{getHousekeeperName(task.housekeeperId)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      No cleaning tasks for this date.
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="time-off" className="p-4">
              <h3 className="text-lg font-semibold mb-4">Pending Time Off Requests</h3>
              {timeOffQuery.isLoading ? (
                <div className="flex items-center justify-center h-40">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : timeOffQuery.data?.length > 0 ? (
                <div className="space-y-4">
                  {timeOffQuery.data.map((timeOff: TimeOffRequest) => {
                    const housekeeper = housekeepersQuery.data?.find((h: User) => h.id === timeOff.housekeeperId);
                    return (
                      <Card key={timeOff.id}>
                        <CardContent className="pt-6">
                          <div className="flex flex-col md:flex-row justify-between gap-4">
                            <div>
                              <h4 className="font-semibold">{housekeeper?.fullName || 'Unknown Housekeeper'}</h4>
                              <p className="text-sm">
                                {new Date(timeOff.startDate).toLocaleDateString()} - {new Date(timeOff.endDate).toLocaleDateString()}
                              </p>
                              {timeOff.reason && (
                                <p className="text-sm text-muted-foreground mt-2">
                                  Reason: {timeOff.reason}
                                </p>
                              )}
                            </div>
                            <div className="flex gap-2 items-start">
                              <Button
                                variant="outline"
                                size="sm"
                                className="border-green-500 text-green-500 hover:bg-green-50 hover:text-green-600"
                                onClick={() => handleApproveTimeOff(timeOff.id)}
                                disabled={approveTimeOffMutation.isPending}
                              >
                                <Check className="h-4 w-4 mr-1" />
                                Approve
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="border-red-500 text-red-500 hover:bg-red-50 hover:text-red-600"
                                onClick={() => handleRejectTimeOff(timeOff.id)}
                                disabled={rejectTimeOffMutation.isPending}
                              >
                                <X className="h-4 w-4 mr-1" />
                                Reject
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No pending time off requests.
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
