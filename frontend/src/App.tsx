import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { ProtectedRoute } from './routes/ProtectedRoute';

// Pages
import { Login } from './pages/auth/Login';
import { Register } from './pages/auth/Register';
import { MyOrders } from './pages/customer/MyOrders';
import { NewOrder } from './pages/customer/NewOrder';
import { OrderDetail } from './pages/customer/OrderDetail';
import { MyDeliveries } from './pages/agent/MyDeliveries';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { AllOrders } from './pages/admin/AllOrders';
import { ZonesAreas } from './pages/admin/ZonesAreas';
import { RateCards } from './pages/admin/RateCards';
import { Agents } from './pages/admin/Agents';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

const HomeRedirect: React.FC = () => {
  const { user, isLoading } = useAuth();
  if (isLoading) return null;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === 'ADMIN') return <Navigate to="/admin" replace />;
  if (user.role === 'AGENT') return <Navigate to="/agent/orders" replace />;
  return <Navigate to="/orders" replace />;
};

export const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <div className="min-h-screen flex flex-col bg-[#F7F9FB] text-[#191C1E] selection:bg-[#0F172A] selection:text-white">
            <Navbar />
            <main className="flex-1 pb-12">
              <Routes>
                {/* Home Redirect */}
                <Route path="/" element={<HomeRedirect />} />

                {/* Auth Routes */}
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />

                {/* Customer Routes */}
                <Route
                  path="/orders"
                  element={
                    <ProtectedRoute allowedRoles={['CUSTOMER']}>
                      <MyOrders />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/orders/new"
                  element={
                    <ProtectedRoute allowedRoles={['CUSTOMER', 'ADMIN']}>
                      <NewOrder />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/orders/:id"
                  element={
                    <ProtectedRoute allowedRoles={['CUSTOMER', 'AGENT', 'ADMIN']}>
                      <OrderDetail />
                    </ProtectedRoute>
                  }
                />

                {/* Agent Routes */}
                <Route
                  path="/agent/orders"
                  element={
                    <ProtectedRoute allowedRoles={['AGENT']}>
                      <MyDeliveries />
                    </ProtectedRoute>
                  }
                />

                {/* Admin Routes */}
                <Route
                  path="/admin"
                  element={
                    <ProtectedRoute allowedRoles={['ADMIN']}>
                      <AdminDashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/orders"
                  element={
                    <ProtectedRoute allowedRoles={['ADMIN']}>
                      <AllOrders />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/zones"
                  element={
                    <ProtectedRoute allowedRoles={['ADMIN']}>
                      <ZonesAreas />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/rate-cards"
                  element={
                    <ProtectedRoute allowedRoles={['ADMIN']}>
                      <RateCards />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/agents"
                  element={
                    <ProtectedRoute allowedRoles={['ADMIN']}>
                      <Agents />
                    </ProtectedRoute>
                  }
                />

                {/* Catch All */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </main>

            {/* Footer */}
            <footer className="border-t border-[#E2E8F0] bg-[#F7F9FB] py-6 text-center text-xs text-slate-500 font-medium">
              <div className="max-w-[1440px] mx-auto px-4">
                Precision Logistics OS &copy; 2026. Built with Node.js, Express, PostgreSQL, Prisma & React.
              </div>
            </footer>
          </div>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
};
