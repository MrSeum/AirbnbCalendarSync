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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { getTimeAgo } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RefreshCw, Edit, Power, Trash2, Plus } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

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
      <div>
        <h1 className="text-2xl font-bold text-gray-800 mb-4">Properties</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="overflow-hidden">
              <div className="h-40 bg-gray-200">
                <Skeleton className="h-full w-full" />
              </div>
              <CardContent className="p-5">
                <div className="space-y-3">
                  <Skeleton className="h-4 w-3/4" />
                  <div className="grid grid-cols-2 gap-4">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full" />
                  </div>
                  <div className="flex gap-2 pt-2">
                    <Skeleton className="h-8 w-16" />
                    <Skeleton className="h-8 w-16" />
                    <Skeleton className="h-8 w-16" />
                    <Skeleton className="h-8 w-16" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }
  
  if (!properties || properties.length === 0) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-gray-800 mb-4">Properties</h1>
        
        <Card className="border-dashed border-2 border-gray-200">
          <CardHeader className="text-center pb-2">
            <CardTitle className="text-xl">No Properties Yet</CardTitle>
            <CardDescription className="text-gray-500">
              Add your first property to get started with managing your cleaning schedule
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center pb-6">
            <Button 
              onClick={() => navigate('/add-property')}
              className="bg-[#3B68B5] hover:bg-[#2A4F8F]"
            >
              Add Property
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-4">Properties</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {properties.map((property) => (
          <Card key={property.id} className="overflow-hidden border-0 shadow-md hover:shadow-lg transition-shadow">
            <div className="h-40 relative" style={{ backgroundColor: property.color }}>
              <div className="absolute bottom-3 left-3 right-3 flex justify-between items-center">
                <h3 className="text-white font-semibold text-lg drop-shadow-md">{property.name}</h3>
                <span className="bg-white px-2 py-1 rounded-md text-xs font-medium shadow-sm" style={{ color: property.color }}>
                  {property.lastSync ? getTimeAgo(property.lastSync) : 'Never synced'}
                </span>
              </div>
            </div>
            
            <CardContent className="p-5">
              <div className="grid grid-cols-2 gap-4 mb-5">
                <div>
                  <p className="text-xs text-gray-500 mb-1">Checkout Time</p>
                  <p className="text-sm font-medium">{property.checkoutTime}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Status</p>
                  <Badge 
                    variant="outline" 
                    className={`${property.active ? 'bg-green-100 text-green-800 border-green-200' : 'bg-red-100 text-red-800 border-red-200'}`}
                  >
                    {property.active ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
                {property.defaultHousekeeperId && (
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Default Housekeeper</p>
                    <p className="text-sm font-medium">Assigned</p>
                  </div>
                )}
                {property.address && (
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Address</p>
                    <p className="text-sm font-medium truncate">{property.address}</p>
                  </div>
                )}
              </div>
              
              <div className="flex flex-wrap gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="h-8 text-[#3B68B5] border-[#3B68B5] hover:bg-[#E8EDF4]"
                  onClick={() => handleEdit(property)}
                >
                  <Edit className="mr-1 h-3.5 w-3.5" />
                  Edit
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="h-8 text-[#3B68B5] border-[#3B68B5] hover:bg-[#E8EDF4]"
                  onClick={() => handleSync(property)}
                >
                  <RefreshCw className="mr-1 h-3.5 w-3.5" />
                  Sync
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className={`h-8 ${property.active 
                    ? 'text-[#3B68B5] border-[#3B68B5] hover:bg-[#E8EDF4]' 
                    : 'text-[#3B68B5] border-[#3B68B5] hover:bg-[#E8EDF4]'}`}
                  onClick={() => handleToggleActive(property)}
                >
                  <Power className="mr-1 h-3.5 w-3.5" />
                  {property.active ? 'Deactivate' : 'Activate'}
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="h-8 text-red-600 border-red-200 hover:bg-red-50"
                      onClick={() => confirmDelete(property)}
                    >
                      <Trash2 className="mr-1 h-3.5 w-3.5" />
                      Delete
                    </Button>
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
                      <AlertDialogAction onClick={executeDelete} className="bg-[#3B68B5] text-white hover:bg-[#2A4F8F]">
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default Properties;
