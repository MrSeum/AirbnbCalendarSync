import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import Dashboard from "@/pages/dashboard";
import Properties from "@/pages/properties";
import PropertyForm from "@/pages/property-form";
import Housekeepers from "@/pages/housekeepers";
import HousekeeperForm from "@/pages/housekeeper-form";
import HousekeeperView from "@/pages/housekeeper-view";
import Settings from "@/pages/settings";
import NotFound from "@/pages/not-found";
import Header from "@/components/layout/header";
import BottomNavigation from "@/components/layout/bottom-navigation";

function Router() {
  return (
    <div className="flex flex-col h-screen bg-gray-50 font-circular">
      <Header />
      <main className="flex-1 overflow-auto">
        <Switch>
          <Route path="/" component={Dashboard} />
          <Route path="/properties" component={Properties} />
          <Route path="/add-property" component={PropertyForm} />
          <Route path="/edit-property/:id" component={PropertyForm} />
          <Route path="/housekeepers" component={Housekeepers} />
          <Route path="/add-housekeeper" component={HousekeeperForm} />
          <Route path="/edit-housekeeper/:id" component={HousekeeperForm} />
          <Route path="/housekeeper-view" component={HousekeeperView} />
          <Route path="/settings" component={Settings} />
          <Route component={NotFound} />
        </Switch>
      </main>
      <BottomNavigation />
      <div className="fixed right-4 bottom-20">
        <button 
          onClick={() => window.location.href = "/add-property"}
          className="bg-[#FF5A5F] text-white rounded-full w-14 h-14 flex items-center justify-center shadow-lg">
          <i className="fas fa-plus text-lg"></i>
        </button>
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
