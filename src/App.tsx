import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import AuthCallback from "./pages/AuthCallback";
import GuestWidget from "./pages/GuestWidget";
import DashboardLayout from "./pages/DashboardLayout";
import { DashboardHome } from "@/components/dashboard/DashboardHome";
import { InventoryCalendar } from "@/components/dashboard/InventoryCalendar";
import SettingsHome from "./pages/Settings";
import SettingsSectionPage from "./pages/SettingsSection";
import { RoomManagement } from "@/components/dashboard/RoomManagement";
import { GuestManagement } from "@/components/dashboard/GuestManagement";
import NotFound from "./pages/NotFound";
import ServicesLayout from "./pages/ServicesLayout";
import { ServicesPage } from "@/components/dashboard/services/ServicesPage";
import { ServiceCreateEdit } from "@/components/dashboard/services/ServiceCreateEdit";
import { ServiceDetail } from "@/components/dashboard/services/ServiceDetail";
import { CategoriesManagement } from "@/components/dashboard/services/CategoriesManagement";
import { PartnersPage } from "@/components/dashboard/services/PartnersPage";
import { ServicesAnalytics } from "@/components/dashboard/services/ServicesAnalytics";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route path="/widget" element={<GuestWidget />} />
          <Route path="/widget/search-rooms.html" element={<GuestWidget />} />
          <Route element={<DashboardLayout />}>
            <Route path="/dashboard" element={<DashboardHome />} />
            <Route path="/inventory" element={<InventoryCalendar />} />
            <Route path="/rooms" element={<RoomManagement />} />
            <Route path="/guests" element={<GuestManagement />} />
            <Route path="/services" element={<ServicesLayout />}>
              <Route index element={<ServicesPage />} />
              <Route path="categories" element={<CategoriesManagement />} />
              <Route path="partners" element={<PartnersPage />} />
              <Route path="analytics" element={<ServicesAnalytics />} />
              <Route path="new" element={<ServiceCreateEdit />} />
              <Route path=":id" element={<ServiceDetail />} />
              <Route path=":id/edit" element={<ServiceCreateEdit />} />
            </Route>
            <Route path="/settings" element={<SettingsHome />} />
            <Route path="/settings/:sectionId" element={<SettingsSectionPage />} />
            <Route path="/audit" element={<Navigate to="/settings/audit-log" replace />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
