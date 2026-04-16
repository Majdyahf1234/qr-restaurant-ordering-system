import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { SocketProvider } from './contexts/SocketContext';

// Public pages
import PublicLayout from './components/layouts/PublicLayout';
import PublicHome from './pages/public/Home';
import PublicMenu from './pages/public/Menu';

// Customer ordering
import CustomerOrder from './pages/customer/Order';
import OrderSuccess from './pages/customer/OrderSuccess';

// Auth
import Login from './pages/auth/Login';

// Admin pages
import AdminLayout from './components/layouts/AdminLayout';
import AdminDashboard from './pages/admin/Dashboard';
import AdminMenu from './pages/admin/Menu';
import AdminCategories from './pages/admin/Categories';
import AdminTables from './pages/admin/Tables';
import AdminStaff from './pages/admin/Staff';
import AdminOrders from './pages/admin/Orders';
import AdminReports from './pages/admin/Reports';
import AdminSettings from './pages/admin/Settings';

// Reception pages
import ReceptionLayout from './components/layouts/ReceptionLayout';
import ReceptionDashboard from './pages/reception/Dashboard';
import ReceptionTables from './pages/reception/Tables';

// Waiter pages
import WaiterLayout from './components/layouts/WaiterLayout';
import WaiterDashboard from './pages/waiter/Dashboard';
import WaiterTables from './pages/waiter/Tables';
import WaiterOrders from './pages/waiter/Orders';

// Kitchen pages
import KitchenLayout from './components/layouts/KitchenLayout';
import KitchenDisplay from './pages/kitchen/Display';

// Protected route component
interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user?.role || '')) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <Router>
          <Routes>
            {/* Public routes */}
            <Route element={<PublicLayout />}>
              <Route path="/" element={<PublicHome />} />
              <Route path="/menu" element={<PublicMenu />} />
            </Route>

            {/* Customer ordering */}
            <Route path="/order" element={<CustomerOrder />} />
            <Route path="/order/success" element={<OrderSuccess />} />
            
            {/* Auth */}
            <Route path="/login" element={<Login />} />

            {/* Admin routes */}
            <Route
              path="/admin/*"
              element={
                <ProtectedRoute allowedRoles={['ADMIN']}>
                  <AdminLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<AdminDashboard />} />
              <Route path="dashboard" element={<AdminDashboard />} />
              <Route path="menu" element={<AdminMenu />} />
              <Route path="categories" element={<AdminCategories />} />
              <Route path="tables" element={<AdminTables />} />
              <Route path="staff" element={<AdminStaff />} />
              <Route path="orders" element={<AdminOrders />} />
              <Route path="reports" element={<AdminReports />} />
              <Route path="settings" element={<AdminSettings />} />
            </Route>

            {/* Reception routes */}
            <Route
              path="/reception/*"
              element={
                <ProtectedRoute allowedRoles={['ADMIN', 'RECEPTION']}>
                  <ReceptionLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<ReceptionDashboard />} />
              <Route path="dashboard" element={<ReceptionDashboard />} />
              <Route path="tables" element={<ReceptionTables />} />
            </Route>

            {/* Waiter routes */}
            <Route
              path="/waiter/*"
              element={
                <ProtectedRoute allowedRoles={['ADMIN', 'WAITER']}>
                  <WaiterLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<WaiterDashboard />} />
              <Route path="dashboard" element={<WaiterDashboard />} />
              <Route path="tables" element={<WaiterTables />} />
              <Route path="orders" element={<WaiterOrders />} />
            </Route>

            {/* Kitchen routes */}
            <Route
              path="/kitchen/*"
              element={
                <ProtectedRoute allowedRoles={['ADMIN', 'KITCHEN']}>
                  <KitchenLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<KitchenDisplay />} />
              <Route path="display" element={<KitchenDisplay />} />
            </Route>

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>
      </SocketProvider>
    </AuthProvider>
  );
}

export default App;
