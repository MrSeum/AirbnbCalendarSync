import React, { useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { queryClient } from '@/lib/queryClient';
import { apiRequest } from '@/lib/queryClient';
import { useParams, useLocation } from 'wouter';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { User, userSchema } from '@shared/schema';
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
import { Card, CardContent } from '@/components/ui/card';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";

type FormValues = z.infer<typeof userSchema>;

const HousekeeperForm = () => {
  const { id } = useParams();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const isEditMode = !!id;
  
  const { data: housekeeper, isLoading: isHousekeeperLoading } = useQuery<User>({
    queryKey: ['/api/users', id], 
    enabled: isEditMode,
  });
  
  // Setup form with validation
  const form = useForm<FormValues>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      username: '',
      password: '',
      fullName: '',
      email: '',
      role: 'housekeeper',
      avatar: '',
      rating: undefined,
    },
  });
  
  // Custom password validation for edit mode
  const formSchema = isEditMode 
    ? userSchema.extend({ password: z.string().optional() }) 
    : userSchema;
  
  // Update form values when housekeeper data is loaded
  useEffect(() => {
    if (housekeeper) {
      form.reset({
        username: housekeeper.username,
        password: '', // Don't populate password field for security
        fullName: housekeeper.fullName,
        email: housekeeper.email,
        role: housekeeper.role,
        avatar: housekeeper.avatar || '',
        rating: housekeeper.rating,
      });
    }
  }, [housekeeper, form]);
  
  // Mutation to create or update a housekeeper
  const mutation = useMutation({
    mutationFn: async (values: FormValues) => {
      // If in edit mode and password is empty, remove it from the payload
      if (isEditMode && !values.password) {
        const { password, ...rest } = values;
        values = rest as FormValues;
      }
      
      const url = isEditMode ? `/api/users/${id}` : '/api/users';
      const method = isEditMode ? 'PATCH' : 'POST';
      const response = await apiRequest(method, url, values);
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: isEditMode ? "Housekeeper Updated" : "Housekeeper Added",
        description: isEditMode 
          ? "Housekeeper has been updated successfully." 
          : "Housekeeper has been added successfully.",
      });
      
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
      navigate('/housekeepers');
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Could not ${isEditMode ? 'update' : 'add'} housekeeper: ${error.message}`,
        variant: "destructive",
      });
    }
  });
  
  const onSubmit = (values: FormValues) => {
    mutation.mutate(values);
  };
  
  const ratingOptions = [1, 2, 3, 4, 5];
  
  if (isHousekeeperLoading && isEditMode) {
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
          <h2 className="text-xl font-bold mb-6">{isEditMode ? 'Edit Housekeeper' : 'Add New Housekeeper'}</h2>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="fullName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Maria Lopez" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="e.g. maria@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Username</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. maria_lopez" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{isEditMode ? 'New Password (leave blank to keep current)' : 'Password'}</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="Password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {isEditMode && (
                <FormField
                  control={form.control}
                  name="rating"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Rating</FormLabel>
                      <Select 
                        onValueChange={(value) => form.setValue('rating', value ? parseInt(value) : undefined)}
                        defaultValue={field.value?.toString()}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select rating" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="">No rating</SelectItem>
                          {ratingOptions.map((rating) => (
                            <SelectItem key={rating} value={rating.toString()}>
                              {rating} {rating === 1 ? 'Star' : 'Stars'}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
              
              <div className="flex justify-end space-x-3 mt-6">
                <button 
                  type="button" 
                  onClick={() => navigate('/housekeepers')}
                  className="px-4 py-2 border border-[#767676] text-[#767676] rounded"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="px-4 py-2 bg-[#FF5A5F] text-white rounded"
                  disabled={mutation.isPending}
                >
                  {mutation.isPending ? 'Saving...' : isEditMode ? 'Update Housekeeper' : 'Add Housekeeper'}
                </button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
};

export default HousekeeperForm;
