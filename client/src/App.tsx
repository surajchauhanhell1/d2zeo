import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import SessionConflictModal from "@/components/session-conflict-modal";
import Home from "@/pages/home";
import NotFound from "@/pages/not-found";
import { useState, useEffect } from "react";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const [showSessionConflict, setShowSessionConflict] = useState(false);

  useEffect(() => {
    // Listen for force logout events
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === 'forceLogout') {
        setShowSessionConflict(true);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <SessionConflictModal 
          isOpen={showSessionConflict}
          onClose={() => {
            setShowSessionConflict(false);
            window.location.reload();
          }}
        />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
