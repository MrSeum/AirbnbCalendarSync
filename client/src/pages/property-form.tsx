import React, { useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { queryClient } from '@/lib/queryClient';
import { apiRequest } from '@/lib/queryClient';
import { useParams, useLocation } from 'wouter';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Property, propertySchema } from '@shared/schema';
import { z } from 'zod';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from '@/components/ui/card';
import { User } from '@shared/schema';

type FormValues = z.infer<typeof propertySchema>;

const PropertyForm = () => {
  const { id } = useParams();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const isEditMode = !!id;
  
  const { data: property, isLoading: isPropertyLoading } = useQuery<Property>({
    queryKey: ['/api/properties', id], 
    enabled: isEditMode,
  });
  
  const { data: housekeepers, isLoading: isHousekeepersLoading } = useQuery<User[]>({
    queryKey: ['/api/users'],
  });
  
  // Filter out only housekeeper users
  const housekeeperOptions = housekeepers?.filter(user => user.role === 'housekeeper') || [];
  
  // Setup form with validation
  const form = useForm<FormValues>({
    resolver: zodResolver(propertySchema),
    defaultValues: {
      name: '',
      color: '#FF5A5F',
      icalUrl: '',
      checkoutTime: '11:00 AM',
      notes: '',
      address: '',
      accessCode: '',
      defaultHousekeeperId: undefined,
      active: true,
    },
  });
  
  // Update form values when property data is loaded
  useEffect(() => {
    if (property) {
      form.reset({
        name: property.name,
        color: property.color,
        icalUrl: property.icalUrl,
        checkoutTime: property.checkoutTime,
        notes: property.notes || '',
        address: property.address || '',
        accessCode: property.accessCode || '',
        defaultHousekeeperId: property.defaultHousekeeperId || undefined,
        active: property.active === null || property.active === undefined ? true : property.active,
      });
    }
  }, [property, form]);
  
  // Mutation to create or update a property
  const mutation = useMutation({
    mutationFn: async (values: FormValues) => {
      const url = isEditMode ? `/api/properties/${id}` : '/api/properties';
      const method = isEditMode ? 'PATCH' : 'POST';
      const response = await apiRequest(method, url, values);
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: isEditMode ? "Property Updated" : "Property Added",
        description: isEditMode 
          ? "Your property has been updated successfully." 
          : "Your property has been added successfully.",
      });
      
      queryClient.invalidateQueries({ queryKey: ['/api/properties'] });
      navigate('/properties');
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Could not ${isEditMode ? 'update' : 'add'} property: ${error.message}`,
        variant: "destructive",
      });
    }
  });
  
  const onSubmit = (values: FormValues) => {
    mutation.mutate(values);
  };
  
  const colorOptions = [
    { value: '#FF5A5F', label: 'Red' },
    { value: '#FC642D', label: 'Orange' },
    { value: '#00A699', label: 'Teal' },
    { value: '#9370DB', label: 'Purple' },
    { value: '#4169E1', label: 'Blue' },
    { value: '#3CB371', label: 'Green' }
  ];
  
  const checkoutTimeOptions = [
    '9:00 AM', '10:00 AM', '11:00 AM', '12:00 PM', '1:00 PM', '2:00 PM'
  ];
  
  if (isPropertyLoading && isEditMode) {
    return (
      <div className="container mx-auto px-4 py-6 max-w-2xl">
        <div className="animate-pulse">
          <div className="h-10 bg-gray-200 rounded-md mb-4"></div>
          <div className="bg-gray-200 h-96 rounded-md"></div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 py-6 max-w-2xl">
      <Card>
        <CardContent className="pt-6">
          <h2 className="text-xl font-bold mb-6">{isEditMode ? 'Edit Property' : 'Add New Property'}</h2>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Property Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Beach House" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="color"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Property Color</FormLabel>
                    <div className="flex space-x-3 mb-2">
                      {colorOptions.map((color) => (
                        <button
                          key={color.value}
                          type="button"
                          className={`w-8 h-8 rounded-full ${field.value === color.value ? 'border-2 border-gray-400' : ''}`}
                          style={{ backgroundColor: color.value }}
                          onClick={() => form.setValue('color', color.value)}
                        />
                      ))}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="icalUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Airbnb iCal URL</FormLabel>
                    <FormControl>
                      <Input placeholder="https://www.airbnb.com/calendar/ical/..." {...field} />
                    </FormControl>
                    <p className="text-xs text-[#767676] mt-1">
                      Find this in your Airbnb host dashboard under Calendar Settings
                    </p>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="checkoutTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Checkout Time</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select checkout time" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {checkoutTimeOptions.map((time) => (
                          <SelectItem key={time} value={time}>
                            {time}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="defaultHousekeeperId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Default Housekeeper</FormLabel>
                    <Select 
                      onValueChange={(value) => {
                        // If value is "0", set to undefined/null, otherwise parse as int
                        form.setValue('defaultHousekeeperId', value === "0" ? undefined : parseInt(value));
                      }}
                      value={field.value?.toString() || "0"}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="No default" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="0">No default</SelectItem>
                        {housekeeperOptions.map((housekeeper) => (
                          <SelectItem key={housekeeper.id} value={housekeeper.id.toString()}>
                            {housekeeper.fullName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Property Address</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. 123 Beach Rd, Oceanside" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="accessCode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Access Code</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. 1234#" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes for Housekeepers</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Special instructions for housekeepers..." 
                        className="resize-none" 
                        rows={3}
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="flex justify-end space-x-3 mt-6">
                <button 
                  type="button" 
                  onClick={() => navigate('/properties')}
                  className="px-4 py-2 border border-[#767676] text-[#767676] rounded"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="px-4 py-2 bg-[#3B68B5] text-white rounded"
                  disabled={mutation.isPending}
                >
                  {mutation.isPending ? 'Saving...' : isEditMode ? 'Update Property' : 'Add Property'}
                </button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
};

export default PropertyForm;
