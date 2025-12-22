import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { NotificationProvider } from "@/contexts/NotificationContext";
import { PrivacyProvider } from "@/contexts/PrivacyContext";

// Pages
import Login from "./pages/Login";
import ActivateAccount from "./pages/ActivateAccount";
import Profile from "./pages/Profile";

// Admin Pages
import AdminDashboard from "./pages/admin/Dashboard";
import Products from "./pages/admin/Products";
import Suppliers from "./pages/admin/Suppliers";
import Collaborators from "./pages/admin/Collaborators";
import Tasks from "./pages/admin/Tasks";
import Expenses from "./pages/admin/Expenses";
import Reports from "./pages/admin/Reports";

// Collaborator Pages
import CollaboratorDashboard from "./pages/collaborator/CollaboratorDashboard";
import CollaboratorTasks from "./pages/collaborator/CollaboratorTasks";
import CollaboratorProducts from "./pages/collaborator/CollaboratorProducts";

import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function AppRoutes() {
  const { user, role, loading } = useAuth();

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Chargement...</div>;
  }

  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={!user ? <Login /> : <Navigate to="/" />} />
      <Route path="/activate" element={<ActivateAccount />} />

      {!user ? (
        <Route path="*" element={<Navigate to="/login" />} />
      ) : (
        <>
          {/* Admin Routes */}
          {role === 'admin' && (
            <>
              <Route path="/" element={<AdminDashboard />} />
              <Route path="/dashboard" element={<AdminDashboard />} />
              <Route path="/products" element={<Products />} />
              <Route path="/suppliers" element={<Suppliers />} />
              <Route path="/collaborators" element={<Collaborators />} />
              <Route path="/tasks" element={<Tasks />} />
              <Route path="/expenses" element={<Expenses />} />
              <Route path="/reports" element={<Reports />} />
              <Route path="/profile" element={<Profile />} />
            </>
          )}

          {/* Collaborator Routes */}
          {role === 'collaborator' && (
            <>
              <Route path="/" element={<CollaboratorDashboard />} />
              <Route path="/dashboard" element={<CollaboratorDashboard />} />
              <Route path="/products" element={<CollaboratorProducts />} />
              <Route path="/tasks" element={<CollaboratorTasks />} />
              <Route path="/profile" element={<Profile />} />
            </>
          )}

          {/* Redirect based on role */}
          <Route path="*" element={<Navigate to="/" />} />
        </>
      )}
    </Routes>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <NotificationProvider>
        <PrivacyProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <AppRoutes />
            </BrowserRouter>
          </TooltipProvider>
        </PrivacyProvider>
      </NotificationProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
