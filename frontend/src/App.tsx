import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";

// Pages
import Login from "./pages/Login";

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
  const { user, role, loading } = useAuth();

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Chargement...</div>;
  }

  if (!user) {
    return <Login />;
  }

  return (
    <Routes>
      {/* Admin Routes */}
      {role === 'admin' && (
        <>
          <Route path="/" element={<AdminDashboard />} />
          <Route path="/products" element={<Products />} />
          <Route path="/suppliers" element={<Suppliers />} />
          <Route path="/collaborators" element={<Collaborators />} />
          <Route path="/tasks" element={<Tasks />} />
          <Route path="/expenses" element={<Expenses />} />
        </>
      )}

      {/* Collaborator Routes */}
      {role === 'collaborator' && (
        <>
          <Route path="/" element={<CollaboratorDashboard />} />
          <Route path="/tasks" element={<CollaboratorTasks />} />
        </>
      )}

      {/* Redirect based on role */}
      <Route path="*" element={<Navigate to="/" />} />
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
