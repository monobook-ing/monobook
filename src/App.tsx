import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import GuestWidget from "./pages/GuestWidget";
import DashboardLayout from "./pages/DashboardLayout";
import { DashboardHome } from "@/components/dashboard/DashboardHome";
import { InventoryCalendar } from "@/components/dashboard/InventoryCalendar";
import { MCPIntegrationSettings } from "@/components/dashboard/MCPIntegrationSettings";
import { AuditLog } from "@/components/dashboard/AuditLog";
import { RoomManagement } from "@/components/dashboard/RoomManagement";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/widget" element={<GuestWidget />} />
          <Route element={<DashboardLayout />}>
            <Route path="/dashboard" element={<DashboardHome />} />
            <Route path="/inventory" element={<InventoryCalendar />} />
            <Route path="/rooms" element={<RoomManagement />} />
            <Route path="/settings" element={<MCPIntegrationSettings />} />
            <Route path="/audit" element={<AuditLog />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
