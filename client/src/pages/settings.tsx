import React from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { queryClient } from '@/lib/queryClient';
import { apiRequest } from '@/lib/queryClient';
import { User } from '@shared/schema';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';

// Define settings schema
const settingsSchema = z.object({
  emailNotifications: z.boolean().default(true),
  pushNotifications: z.boolean().default(true),
  darkMode: z.boolean().default(false),
  syncFrequency: z.enum(['hourly', 'daily', 'manual']).default('daily'),
});

type SettingsFormValues = z.infer<typeof settingsSchema>;

// Define profile update schema
const profileSchema = z.object({
  fullName: z.string().min(1, "Full name is required"),
  email: z.string().email("Please enter a valid email"),
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(6, "New password must be at least 6 characters").optional(),
  confirmPassword: z.string().optional(),
}).refine(data => !data.newPassword || data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type ProfileFormValues = z.infer<typeof profileSchema>;

const Settings = () => {
  const { toast } = useToast();
  
  // Fetch current user
  const { data: currentUser, isLoading } = useQuery<User>({
    queryKey: ['/api/users/current'],
  });
  
  // Settings form
  const settingsForm = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      emailNotifications: true,
      pushNotifications: true,
      darkMode: false,
      syncFrequency: 'daily',
    },
  });
  
  // Profile form
  const profileForm = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      fullName: '',
      email: '',
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  });
  
  // Update profile form values when user data loads
  React.useEffect(() => {
    if (currentUser) {
      profileForm.reset({
        fullName: currentUser.fullName,
        email: currentUser.email,
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    }
  }, [currentUser, profileForm]);
  
  // Settings mutation
  const settingsMutation = useMutation({
    mutationFn: async (values: SettingsFormValues) => {
      const response = await apiRequest('PATCH', '/api/settings', values);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Settings Updated",
        description: "Your settings have been saved successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Update Failed",
        description: `Could not update settings: ${error.message}`,
        variant: "destructive",
      });
    }
  });
  
  // Profile mutation
  const profileMutation = useMutation({
    mutationFn: async (values: ProfileFormValues) => {
      const response = await apiRequest('PATCH', '/api/users/current', values);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Profile Updated",
        description: "Your profile has been updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/users/current'] });
      profileForm.reset({
        ...profileForm.getValues(),
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    },
    onError: (error) => {
      toast({
        title: "Update Failed",
        description: `Could not update profile: ${error.message}`,
        variant: "destructive",
      });
    }
  });
  
  const onSubmitSettings = (values: SettingsFormValues) => {
    settingsMutation.mutate(values);
  };
  
  const onSubmitProfile = (values: ProfileFormValues) => {
    profileMutation.mutate(values);
  };
  
  // Mock the sync all calendars functionality
  const handleSyncAllCalendars = () => {
    toast({
      title: "Syncing Calendars",
      description: "All property calendars are being synchronized...",
    });
    
    // This would be an actual API call in production
    setTimeout(() => {
      toast({
        title: "Sync Complete",
        description: "All property calendars have been updated.",
      });
    }, 2000);
  };
  
  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-6 max-w-3xl">
        <div className="animate-pulse space-y-6">
          <div className="h-10 bg-gray-200 rounded-md"></div>
          <div className="h-64 bg-gray-200 rounded-md"></div>
          <div className="h-64 bg-gray-200 rounded-md"></div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 py-6 max-w-3xl">
      <h1 className="text-2xl font-bold text-[#484848] mb-6">Settings</h1>
      
      <div className="space-y-6">
        {/* Application Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Application Settings</CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...settingsForm}>
              <form onSubmit={settingsForm.handleSubmit(onSubmitSettings)} className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">Email Notifications</h3>
                    <p className="text-sm text-[#767676]">Receive email alerts for new bookings and checkouts</p>
                  </div>
                  <FormField
                    control={settingsForm.control}
                    name="emailNotifications"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
                
                <Separator />
                
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">Push Notifications</h3>
                    <p className="text-sm text-[#767676]">Receive push notifications on your devices</p>
                  </div>
                  <FormField
                    control={settingsForm.control}
                    name="pushNotifications"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
                
                <Separator />
                
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">Dark Mode</h3>
                    <p className="text-sm text-[#767676]">Switch between light and dark theme</p>
                  </div>
                  <FormField
                    control={settingsForm.control}
                    name="darkMode"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
                
                <Separator />
                
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">Calendar Sync Frequency</h3>
                    <p className="text-sm text-[#767676]">How often to sync your Airbnb calendars</p>
                  </div>
                  <FormField
                    control={settingsForm.control}
                    name="syncFrequency"
                    render={({ field }) => (
                      <FormItem>
                        <select
                          className="px-3 py-1.5 border border-gray-300 rounded-md text-sm"
                          value={field.value}
                          onChange={field.onChange}
                        >
                          <option value="hourly">Hourly</option>
                          <option value="daily">Daily</option>
                          <option value="manual">Manual Only</option>
                        </select>
                      </FormItem>
                    )}
                  />
                </div>
                
                <Separator />
                
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">Export Calendar</h3>
                    <p className="text-sm text-[#767676]">Export checkout calendar to external calendar applications</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const icalUrl = `${window.location.origin}/api/calendar/export.ics`;
                      navigator.clipboard.writeText(icalUrl);
                      toast({
                        title: "iCal URL Copied",
                        description: "The calendar URL has been copied to your clipboard. Add this URL to your Gmail or other calendar app.",
                      });
                    }}
                    className="px-4 py-2 bg-[#00A699] hover:bg-[#008B7A] text-white rounded text-sm"
                  >
                    Copy iCal URL
                  </button>
                </div>
                
                <div className="pt-4 flex justify-between">
                  <button
                    type="button"
                    onClick={handleSyncAllCalendars}
                    className="px-4 py-2 bg-[#3B68B5] hover:bg-[#2A4F8F] text-white rounded"
                  >
                    Sync All Calendars Now
                  </button>
                  
                  <button
                    type="submit"
                    className="px-4 py-2 bg-[#3B68B5] hover:bg-[#2A4F8F] text-white rounded"
                    disabled={settingsMutation.isPending}
                  >
                    {settingsMutation.isPending ? 'Saving...' : 'Save Settings'}
                  </button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
        
        {/* Profile Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Profile Settings</CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...profileForm}>
              <form onSubmit={profileForm.handleSubmit(onSubmitProfile)} className="space-y-4">
                <FormField
                  control={profileForm.control}
                  name="fullName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={profileForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email Address</FormLabel>
                      <FormControl>
                        <Input type="email" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <Separator className="my-4" />
                
                <h3 className="font-medium">Change Password</h3>
                
                <FormField
                  control={profileForm.control}
                  name="currentPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Current Password</FormLabel>
                      <FormControl>
                        <Input type="password" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={profileForm.control}
                  name="newPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>New Password</FormLabel>
                      <FormControl>
                        <Input type="password" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={profileForm.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Confirm New Password</FormLabel>
                      <FormControl>
                        <Input type="password" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="pt-4 flex justify-end">
                  <button
                    type="submit"
                    className="px-4 py-2 bg-[#3B68B5] hover:bg-[#2A4F8F] text-white rounded"
                    disabled={profileMutation.isPending}
                  >
                    {profileMutation.isPending ? 'Updating...' : 'Update Profile'}
                  </button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Settings;
