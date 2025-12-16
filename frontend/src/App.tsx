import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";

// Admin Pages
import AdminDashboard from "./pages/admin/Dashboard";
import Products from "./pages/admin/Products";
import Suppliers from "./pages/admin/Suppliers";
import Collaborators from "./pages/admin/Collaborators";
import Tasks from "./pages/admin/Tasks";
import Expenses from "./pages/admin/Expenses";

// Collaborator Pages
import CollaboratorDashboard from "./pages/collaborator/CollaboratorDashboard";
import CollaboratorTasks from "./pages/collaborator/CollaboratorTasks";

import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function AppRoutes() {
  const { role } = useAuth();

  return (
    <Routes>
      {/* Admin Routes */}
      <Route path="/" element={role === 'admin' ? <AdminDashboard /> : <Navigate to="/collaborator" />} />
      <Route path="/products" element={role === 'admin' ? <Products /> : <Navigate to="/collaborator" />} />
      <Route path="/suppliers" element={role === 'admin' ? <Suppliers /> : <Navigate to="/collaborator" />} />
      <Route path="/collaborators" element={role === 'admin' ? <Collaborators /> : <Navigate to="/collaborator" />} />
      <Route path="/tasks" element={role === 'admin' ? <Tasks /> : <Navigate to="/collaborator" />} />
      <Route path="/expenses" element={role === 'admin' ? <Expenses /> : <Navigate to="/collaborator" />} />
      
      {/* Collaborator Routes */}
      <Route path="/collaborator" element={<CollaboratorDashboard />} />
      <Route path="/collaborator/tasks" element={<CollaboratorTasks />} />
      
      {/* Catch-all */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
