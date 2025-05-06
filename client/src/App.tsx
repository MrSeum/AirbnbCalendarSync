import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import Dashboard from "@/pages/dashboard";
import Properties from "@/pages/properties";
import PropertyForm from "@/pages/property-form";
import Housekeepers from "@/pages/housekeepers";
import HousekeeperForm from "@/pages/housekeeper-form";
import HousekeeperView from "@/pages/housekeeper-view";
import Calendar from "@/pages/calendar";
import Tasks from "@/pages/tasks";
import Settings from "@/pages/settings";
import NotFound from "@/pages/not-found";
import Sidebar from "@/components/layout/sidebar";
import { useIsMobile } from "@/hooks/use-mobile";
import { Button } from "@/components/ui/button";
import { Bell, Plus } from "lucide-react";

function Router() {
  const isMobile = useIsMobile();
  const [location] = useLocation();
  
  // Check if we're on a form page
  const isFormPage = [
    "/add-property", 
    "/edit-property", 
    "/add-housekeeper", 
    "/edit-housekeeper"
  ].some(path => location.startsWith(path));

  return (
    <div className="flex h-screen bg-[#F0F2F5] font-sans">
      {!isMobile && <Sidebar />}
      
      <div className="flex flex-col flex-1 ml-0 md:ml-[220px]">
        {/* Header for desktop */}
        {!isMobile && (
          <header className="bg-[#1E2A3B] text-white border-b border-[#2D3B4E] px-6 py-2.5 flex justify-between items-center sticky top-0 z-10">
            <div>
              <h1 className="text-xl font-semibold text-white">
                {location === "/" && "Dashboard"}
                {location === "/properties" && "Properties"}
                {location === "/housekeepers" && "Housekeepers"}
                {location === "/calendar" && "Calendar"}
                {location === "/tasks" && "Tasks"}
                {location === "/settings" && "Settings"}
                {location.startsWith("/add-property") && "Add Property"}
                {location.startsWith("/edit-property") && "Edit Property"}
                {location.startsWith("/add-housekeeper") && "Add Housekeeper"}
                {location.startsWith("/edit-housekeeper") && "Edit Housekeeper"}
              </h1>
            </div>
            
            <div className="flex items-center space-x-4">
              {location === "/properties" && (
                <Button 
                  variant="default" 
                  className="bg-[#3B68B5] hover:bg-[#2A4F8F]"
                  onClick={() => window.location.href = "/add-property"}
                >
                  <Plus className="mr-2 h-4 w-4" /> Add Property
                </Button>
              )}
              
              {location === "/housekeepers" && (
                <Button 
                  variant="default" 
                  className="bg-[#3B68B5] hover:bg-[#2A4F8F]"
                  onClick={() => window.location.href = "/add-housekeeper"}
                >
                  <Plus className="mr-2 h-4 w-4" /> Add Housekeeper
                </Button>
              )}
              
              <Button variant="ghost" size="icon" className="text-gray-300 hover:text-white hover:bg-[#2D3B4E]">
                <Bell className="h-5 w-5" />
              </Button>
              
              <div className="w-8 h-8 rounded-full bg-[#2D3B4E] flex items-center justify-center text-white">
                JS
              </div>
            </div>
          </header>
        )}
        
        <main className="flex-1 overflow-auto p-6 bg-[#F0F2F5]">
          <Switch>
            <Route path="/" component={Dashboard} />
            <Route path="/properties" component={Properties} />
            <Route path="/add-property" component={PropertyForm} />
            <Route path="/edit-property/:id" component={PropertyForm} />
            <Route path="/housekeepers" component={Housekeepers} />
            <Route path="/add-housekeeper" component={HousekeeperForm} />
            <Route path="/edit-housekeeper/:id" component={HousekeeperForm} />
            <Route path="/housekeeper-view" component={HousekeeperView} />
            <Route path="/calendar" component={Calendar} />
            <Route path="/tasks" component={Tasks} />
            <Route path="/settings" component={Settings} />
            <Route component={NotFound} />
          </Switch>
        </main>
        
        {/* Mobile Add Button */}
        {isMobile && !isFormPage && (
          <div className="fixed right-4 bottom-20">
            <Button
              variant="default"
              size="icon"
              className="bg-[#3B68B5] hover:bg-[#2A4F8F] h-12 w-12 rounded-full shadow-lg"
              onClick={() => {
                if (location === "/properties") window.location.href = "/add-property";
                if (location === "/housekeepers") window.location.href = "/add-housekeeper";
              }}
            >
              <Plus className="h-6 w-6" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router />
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;
