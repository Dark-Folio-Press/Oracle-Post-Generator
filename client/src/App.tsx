import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import OracleDashboard from "@/pages/oracle-dashboard";
import OracleRecord from "@/pages/oracle-record";
import ArchivePage from "@/pages/archive";

function Router() {
  return (
    <Switch>
      <Route path="/" component={OracleDashboard} />
      <Route path="/oracle/:date" component={OracleRecord} />
      <Route path="/archive" component={ArchivePage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;