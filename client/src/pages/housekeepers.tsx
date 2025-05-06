import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { queryClient } from '@/lib/queryClient';
import { apiRequest } from '@/lib/queryClient';
import { User } from '@shared/schema';
import { useLocation } from 'wouter';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Card, CardContent } from '@/components/ui/card';
import { generateInitials } from '@/lib/utils';

const Housekeepers = () => {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [housekeeperToDelete, setHousekeeperToDelete] = useState<User | null>(null);
  
  // Fetch housekeepers
  const { data: users, isLoading } = useQuery<User[]>({
    queryKey: ['/api/users'],
  });
  
  // Filter only housekeepers
  const housekeepers = users?.filter(user => user.role === 'housekeeper') || [];
  
  // Handle delete housekeeper
  const deleteMutation = useMutation({
    mutationFn: async (housekeeperId: number) => {
      const response = await apiRequest('DELETE', `/api/users/${housekeeperId}`, {});
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Housekeeper Deleted",
        description: "The housekeeper has been removed successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
      setHousekeeperToDelete(null);
    },
    onError: (error) => {
      toast({
        title: "Delete Failed",
        description: `Could not delete housekeeper: ${error.message}`,
        variant: "destructive",
      });
    }
  });
  
  const handleEdit = (housekeeper: User) => {
    navigate(`/edit-housekeeper/${housekeeper.id}`);
  };
  
  const confirmDelete = (housekeeper: User) => {
    setHousekeeperToDelete(housekeeper);
  };
  
  const executeDelete = () => {
    if (housekeeperToDelete) {
      deleteMutation.mutate(housekeeperToDelete.id);
    }
  };
  
  const handleSendMessage = (housekeeper: User) => {
    // This would open a messaging feature in a real app
    toast({
      title: "Message Feature",
      description: `This would open a messaging interface to ${housekeeper.fullName}`,
    });
  };
  
  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-6 max-w-6xl">
        <div className="animate-pulse">
          <div className="h-10 bg-gray-200 rounded-md mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-gray-200 h-48 rounded-md"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }
  
  if (!housekeepers || housekeepers.length === 0) {
    return (
      <div className="container mx-auto px-4 py-6 max-w-6xl">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-[#484848]">Housekeepers</h1>
          <button 
            onClick={() => navigate('/add-housekeeper')}
            className="bg-[#FF5A5F] text-white px-4 py-2 rounded-md text-sm font-medium"
          >
            Add Housekeeper
          </button>
        </div>
        
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <h3 className="text-lg font-semibold mb-2">No Housekeepers Yet</h3>
              <p className="text-gray-500 mb-4">Add your first housekeeper to manage your cleanings</p>
              <button 
                onClick={() => navigate('/add-housekeeper')}
                className="bg-[#FF5A5F] text-white px-4 py-2 rounded-md text-sm font-medium"
              >
                Add Housekeeper
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 py-6 max-w-6xl">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-[#484848]">Housekeepers</h1>
        <button 
          onClick={() => navigate('/add-housekeeper')}
          className="bg-[#FF5A5F] text-white px-4 py-2 rounded-md text-sm font-medium"
        >
          Add Housekeeper
        </button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {housekeepers.map((housekeeper) => (
          <div key={housekeeper.id} className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
            <div className="flex items-center mb-3">
              <div className="w-10 h-10 rounded-full bg-[#EBEBEB] flex items-center justify-center text-[#767676] mr-3">
                <span className="font-semibold">{generateInitials(housekeeper.fullName)}</span>
              </div>
              <div>
                <h3 className="font-semibold">{housekeeper.fullName}</h3>
                <p className="text-sm text-[#767676]">
                  {housekeeper.id === 1 ? 'Primary Housekeeper' : 'Housekeeper'}
                </p>
              </div>
            </div>
            
            <div className="flex items-center justify-between text-sm mb-2">
              <div className="text-[#767676]">
                <i className="far fa-calendar-check mr-1"></i> {housekeeper.cleaningCount || 0} cleanings
              </div>
              <div className="text-[#00A699] font-medium">
                <i className="far fa-star mr-1"></i> {housekeeper.rating || '-'}
              </div>
            </div>
            
            <div className="text-sm text-[#767676] mb-3">
              <i className="far fa-envelope mr-1"></i> {housekeeper.email}
            </div>
            
            <div className="flex flex-wrap justify-center gap-2 mt-4">
              <button 
                onClick={() => handleSendMessage(housekeeper)}
                className="text-xs px-3 py-1 bg-[#EBEBEB] text-[#484848] rounded-md"
              >
                <i className="far fa-comment mr-1"></i> Message
              </button>
              
              <button 
                onClick={() => handleEdit(housekeeper)}
                className="text-xs px-3 py-1 bg-[#00A699] text-white rounded-md"
              >
                Edit Profile
              </button>
              
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <button 
                    onClick={() => confirmDelete(housekeeper)}
                    className="text-xs px-3 py-1 bg-red-100 text-red-800 rounded-md"
                  >
                    Delete
                  </button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will permanently delete the housekeeper "{housekeeperToDelete?.fullName}".
                      Any assigned cleanings will be unassigned.
                      This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={executeDelete} className="bg-red-600 text-white hover:bg-red-700">
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Housekeepers;
