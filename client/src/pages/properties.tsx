import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { queryClient } from '@/lib/queryClient';
import { apiRequest } from '@/lib/queryClient';
import { Property } from '@shared/schema';
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
import { getTimeAgo } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

const Properties = () => {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [propertyToDelete, setPropertyToDelete] = useState<Property | null>(null);
  
  // Fetch properties
  const { data: properties, isLoading } = useQuery<Property[]>({
    queryKey: ['/api/properties'],
  });
  
  // Handle sync iCal
  const syncMutation = useMutation({
    mutationFn: async (propertyId: number) => {
      const response = await apiRequest('POST', `/api/properties/${propertyId}/sync`, {});
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "iCal Synchronized",
        description: "Property calendar has been updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/properties'] });
      queryClient.invalidateQueries({ queryKey: ['/api/bookings'] });
    },
    onError: (error) => {
      toast({
        title: "Sync Failed",
        description: `Could not sync iCal: ${error.message}`,
        variant: "destructive",
      });
    }
  });
  
  // Handle delete property
  const deleteMutation = useMutation({
    mutationFn: async (propertyId: number) => {
      const response = await apiRequest('DELETE', `/api/properties/${propertyId}`, {});
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Property Deleted",
        description: "The property has been removed successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/properties'] });
      setPropertyToDelete(null);
    },
    onError: (error) => {
      toast({
        title: "Delete Failed",
        description: `Could not delete property: ${error.message}`,
        variant: "destructive",
      });
    }
  });
  
  // Handle toggle property active status
  const toggleActiveMutation = useMutation({
    mutationFn: async ({ propertyId, active }: { propertyId: number, active: boolean }) => {
      const response = await apiRequest('PATCH', `/api/properties/${propertyId}`, { active });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Property Updated",
        description: "Property status has been updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/properties'] });
    },
    onError: (error) => {
      toast({
        title: "Update Failed",
        description: `Could not update property: ${error.message}`,
        variant: "destructive",
      });
    }
  });
  
  const handleEdit = (property: Property) => {
    navigate(`/edit-property/${property.id}`);
  };
  
  const handleSync = (property: Property) => {
    syncMutation.mutate(property.id);
  };
  
  const handleToggleActive = (property: Property) => {
    toggleActiveMutation.mutate({ 
      propertyId: property.id, 
      active: !property.active 
    });
  };
  
  const confirmDelete = (property: Property) => {
    setPropertyToDelete(property);
  };
  
  const executeDelete = () => {
    if (propertyToDelete) {
      deleteMutation.mutate(propertyToDelete.id);
    }
  };
  
  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-6 max-w-6xl">
        <div className="animate-pulse">
          <div className="h-10 bg-gray-200 rounded-md mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-gray-200 h-48 rounded-md"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }
  
  if (!properties || properties.length === 0) {
    return (
      <div className="container mx-auto px-4 py-6 max-w-6xl">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-[#484848]">Properties</h1>
          <button 
            onClick={() => navigate('/add-property')}
            className="bg-[#FF5A5F] text-white px-4 py-2 rounded-md text-sm font-medium"
          >
            Add Property
          </button>
        </div>
        
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <h3 className="text-lg font-semibold mb-2">No Properties Yet</h3>
              <p className="text-gray-500 mb-4">Add your first property to get started with managing your cleaning schedule</p>
              <button 
                onClick={() => navigate('/add-property')}
                className="bg-[#FF5A5F] text-white px-4 py-2 rounded-md text-sm font-medium"
              >
                Add Property
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
        <h1 className="text-2xl font-bold text-[#484848]">Properties</h1>
        <button 
          onClick={() => navigate('/add-property')}
          className="bg-[#FF5A5F] text-white px-4 py-2 rounded-md text-sm font-medium"
        >
          Add Property
        </button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {properties.map((property) => (
          <div key={property.id} className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
            <div className="h-32 relative" style={{ backgroundColor: property.color }}>
              <div className="absolute bottom-2 left-2 right-2 flex justify-between items-center">
                <h3 className="text-white font-semibold">{property.name}</h3>
                <span className="bg-white px-2 py-0.5 rounded text-xs font-medium" style={{ color: property.color }}>
                  Last sync: {property.lastSync ? getTimeAgo(property.lastSync) : 'Never'}
                </span>
              </div>
            </div>
            
            <div className="p-4">
              <div className="grid grid-cols-2 gap-2 mb-4">
                <div>
                  <p className="text-xs text-[#767676]">Checkout Time</p>
                  <p className="text-sm font-semibold">{property.checkoutTime}</p>
                </div>
                <div>
                  <p className="text-xs text-[#767676]">Status</p>
                  <Badge 
                    variant="outline" 
                    className={`${property.active ? 'bg-green-100 text-green-800 border-green-200' : 'bg-red-100 text-red-800 border-red-200'} text-xs`}
                  >
                    {property.active ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
                {property.defaultHousekeeperId && (
                  <div>
                    <p className="text-xs text-[#767676]">Default Housekeeper</p>
                    <p className="text-sm font-semibold">Assigned</p>
                  </div>
                )}
                {property.address && (
                  <div>
                    <p className="text-xs text-[#767676]">Address</p>
                    <p className="text-sm font-semibold truncate">{property.address}</p>
                  </div>
                )}
              </div>
              
              <div className="flex flex-wrap gap-2">
                <button 
                  onClick={() => handleEdit(property)}
                  className="text-xs px-3 py-1 bg-[#EBEBEB] text-[#484848] rounded-md"
                >
                  Edit
                </button>
                <button 
                  onClick={() => handleSync(property)}
                  className="text-xs px-3 py-1 bg-[#00A699] text-white rounded-md"
                >
                  Sync iCal
                </button>
                <button 
                  onClick={() => handleToggleActive(property)}
                  className={`text-xs px-3 py-1 ${property.active ? 'bg-gray-200 text-gray-600' : 'bg-green-100 text-green-800'} rounded-md`}
                >
                  {property.active ? 'Deactivate' : 'Activate'}
                </button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <button 
                      onClick={() => confirmDelete(property)}
                      className="text-xs px-3 py-1 bg-red-100 text-red-800 rounded-md ml-auto"
                    >
                      Delete
                    </button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will permanently delete the property "{propertyToDelete?.name}" and all associated bookings.
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
          </div>
        ))}
      </div>
    </div>
  );
};

export default Properties;
