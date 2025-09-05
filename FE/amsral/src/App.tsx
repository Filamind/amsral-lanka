import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { Toaster } from 'react-hot-toast';
import ProtectedRoute from './components/common/ProtectedRoute';
import ErrorBoundary from './components/common/ErrorBoundary';
import DashboardLayout from './components/layout/DashboardLayout';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import UserPage from './pages/UserPage';
import EmployeesPage from './pages/EmployeesPage';
import CustomersPage from './pages/CustomersPage';
import OrdersPage from './pages/OrdersPage';
import WorkFlowPage from './pages/WorkFlowPage';
import SystemDataPage from './pages/SystemDataPage';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#363636',
              color: '#fff',
            },
            success: {
              duration: 4000,
              style: {
                background: '#10B981',
                color: '#fff',
              },
            },
            error: {
              duration: 5000,
              style: {
                background: '#EF4444',
                color: '#fff',
              },
            },
          }}
        />
        <Routes>
          {/* Public route - no sidebar */}
          <Route path="/login" element={<LoginPage />} />
          {/* Protected routes with sidebar */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="orders" element={<OrdersPage />} />
            <Route path="workflow" element={<WorkFlowPage />} />
            <Route path="users" element={<UserPage />} />
            <Route path="employees" element={
              <ErrorBoundary>
                <EmployeesPage />
              </ErrorBoundary>
            } />
            <Route path="customers" element={<CustomersPage />} />
            <Route path="system-data" element={<SystemDataPage />} />
            {/* Optional: Redirect root to dashboard */}
            <Route index element={<Navigate to="dashboard" />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;