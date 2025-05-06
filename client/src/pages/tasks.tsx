import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { formatDate } from '@/lib/utils';
import { CleaningTask } from '@shared/schema';
import { Calendar, Clock, MapPin, User, Clipboard, Check, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const Tasks = () => {
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  const { data: todayCleanings, isLoading: isLoadingToday } = useQuery<CleaningTask[]>({
    queryKey: ['/api/cleanings', formatDate(today, 'yyyy-MM-dd')],
  });
  
  const { data: upcomingCleanings, isLoading: isLoadingUpcoming } = useQuery<CleaningTask[]>({
    queryKey: ['/api/cleanings/upcoming'],
  });
  
  const handleAssign = (taskId: number) => {
    // Implement assign functionality
    console.log('Assign task', taskId);
  };
  
  const handleComplete = (taskId: number) => {
    // Implement complete functionality
    console.log('Complete task', taskId);
  };
  
  const handleViewInstructions = (taskId: number) => {
    // Implement view instructions functionality
    console.log('View instructions for task', taskId);
  };
  
  const renderTaskCard = (task: CleaningTask) => (
    <Card key={task.id} className="mb-4 border-l-4" style={{ borderLeftColor: task.propertyColor }}>
      <CardContent className="p-5">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-lg font-semibold">{task.propertyName}</h3>
            <div className="flex items-center text-gray-500 text-sm mt-1">
              <Calendar className="h-4 w-4 mr-1" />
              <span>{formatDate(task.checkoutDate)}</span>
              <Clock className="h-4 w-4 ml-3 mr-1" />
              <span>{task.checkoutTime}</span>
            </div>
          </div>
          <Badge 
            variant="outline" 
            className={`${task.status === 'completed' 
              ? 'bg-green-100 text-green-800 border-green-200' 
              : task.status === 'in-progress' 
                ? 'bg-blue-100 text-blue-800 border-blue-200'
                : 'bg-yellow-100 text-yellow-800 border-yellow-200'}`}
          >
            {task.status === 'completed' ? 'Completed' : 
             task.status === 'in-progress' ? 'In Progress' : 'Pending'}
          </Badge>
        </div>
        
        {task.address && (
          <div className="flex items-start mb-3">
            <MapPin className="h-4 w-4 mr-2 mt-0.5 text-gray-400" />
            <p className="text-sm text-gray-600">{task.address}</p>
          </div>
        )}
        
        {task.accessCode && (
          <div className="flex items-center mb-3">
            <div className="bg-gray-100 px-3 py-2 rounded text-sm inline-flex items-center">
              <span className="font-medium mr-2">Access Code:</span> {task.accessCode}
            </div>
          </div>
        )}
        
        <div className="flex items-center mb-4">
          <User className="h-4 w-4 mr-2 text-gray-400" />
          <p className="text-sm text-gray-600">
            {task.housekeeperId ? 'Assigned to housekeeper' : 'Not assigned'}
          </p>
        </div>
        
        <div className="flex flex-wrap gap-2">
          {!task.housekeeperId && (
            <Button 
              variant="outline" 
              size="sm" 
              className="h-9 text-[#3B68B5] border-[#3B68B5] hover:bg-[#E8EDF4]"
              onClick={() => handleAssign(task.id)}
            >
              <User className="mr-1 h-4 w-4" />
              Assign
            </Button>
          )}
          
          {task.status !== 'completed' && (
            <Button 
              variant="outline" 
              size="sm" 
              className="h-9 text-green-600 border-green-200 hover:bg-green-50"
              onClick={() => handleComplete(task.id)}
            >
              <Check className="mr-1 h-4 w-4" />
              Mark Complete
            </Button>
          )}
          
          <Button 
            variant="outline" 
            size="sm" 
            className="h-9 text-[#3B68B5] border-[#3B68B5] hover:bg-[#E8EDF4]"
            onClick={() => handleViewInstructions(task.id)}
          >
            <Clipboard className="mr-1 h-4 w-4" />
            Instructions
          </Button>
        </div>
      </CardContent>
    </Card>
  );
  
  const renderSkeletonCard = () => (
    <div className="animate-pulse mb-4">
      <div className="h-40 bg-gray-200 rounded-md"></div>
    </div>
  );
  
  return (
    <div className="container mx-auto px-4 py-6 max-w-4xl">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Cleaning Tasks</h1>
      
      <Tabs defaultValue="today" className="mb-6">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="today">Today's Tasks</TabsTrigger>
          <TabsTrigger value="upcoming">Upcoming Tasks</TabsTrigger>
        </TabsList>
        
        <TabsContent value="today" className="mt-4">
          {isLoadingToday ? (
            Array(2).fill(0).map((_, i) => <div key={i}>{renderSkeletonCard()}</div>)
          ) : !todayCleanings || todayCleanings.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <h3 className="text-lg font-medium text-gray-600">No cleanings scheduled for today</h3>
                <p className="text-gray-500 mt-2">You're all caught up!</p>
              </CardContent>
            </Card>
          ) : (
            todayCleanings.map(task => renderTaskCard(task))
          )}
        </TabsContent>
        
        <TabsContent value="upcoming" className="mt-4">
          {isLoadingUpcoming ? (
            Array(3).fill(0).map((_, i) => <div key={i}>{renderSkeletonCard()}</div>)
          ) : !upcomingCleanings || upcomingCleanings.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <h3 className="text-lg font-medium text-gray-600">No upcoming cleanings scheduled</h3>
                <p className="text-gray-500 mt-2">Check back later for new bookings</p>
              </CardContent>
            </Card>
          ) : (
            upcomingCleanings.map(task => renderTaskCard(task))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Tasks;
