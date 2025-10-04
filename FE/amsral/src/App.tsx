import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { AuthProvider } from './context/AuthContext';
import { PrinterProvider } from './context/PrinterContext';
import { Toaster } from 'react-hot-toast';
import ProtectedRoute from './components/common/ProtectedRoute';
import ErrorBoundary from './components/common/ErrorBoundary';
import DashboardLayout from './components/layout/DashboardLayout';
import { Suspense, lazy } from 'react';

// Lazy load pages for better performance
const LoginPage = lazy(() => import('./pages/LoginPage'));
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const UserPage = lazy(() => import('./pages/UserPage'));
const EmployeesPage = lazy(() => import('./pages/EmployeesPage'));
const CustomersPage = lazy(() => import('./pages/CustomersPage'));
const OrdersPage = lazy(() => import('./pages/OrdersPage'));
const OrderRecordsPage = lazy(() => import('./pages/OrderRecordsPage'));
const WorkFlowPage = lazy(() => import('./pages/WorkFlowPage'));
const CompleteOrderPage = lazy(() => import('./pages/CompleteOrderPage'));
const RecordAssignmentsPage = lazy(() => import('./pages/RecordAssignmentsPage'));
const SystemDataPage = lazy(() => import('./pages/SystemDataPage'));
const ManagementPage = lazy(() => import('./pages/ManagementPage'));
const OrderDetailsPage = lazy(() => import('./pages/OrderDetailsPage'));
const QCPage = lazy(() => import('./pages/QCPage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const BillingPage = lazy(() => import('./pages/BillingPage'));
const PrinterTestPage = lazy(() => import('./pages/PrinterTestPage'));

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes (renamed from cacheTime)
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <PrinterProvider>
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
            <Suspense fallback={
              <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-gray-600">Loading...</p>
                </div>
              </div>
            }>
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
                  <Route path="orders/:orderId/records" element={<OrderRecordsPage />} />
                  <Route path="production" element={<WorkFlowPage />} />
                  <Route path="complete-order" element={<CompleteOrderPage />} />
                  <Route path="production/record/:recordId" element={<RecordAssignmentsPage />} />
                  <Route path="management" element={<ManagementPage />} />
                  <Route path="management/orders/:orderId" element={<OrderDetailsPage />} />
                  <Route path="qc" element={<QCPage />} />
                  <Route path="billing" element={<BillingPage />} />
                  <Route path="printer-test" element={<PrinterTestPage />} />
                  <Route path="users" element={<UserPage />} />
                  <Route path="employees" element={
                    <ErrorBoundary>
                      <EmployeesPage />
                    </ErrorBoundary>
                  } />
                  <Route path="customers" element={<CustomersPage />} />
                  <Route path="system-data" element={<SystemDataPage />} />
                  <Route path="profile" element={<ProfilePage />} />
                  {/* Redirect to login if not authenticated */}
                  <Route index element={<Navigate to="/login" />} />
                </Route>
              </Routes>
            </Suspense>
          </BrowserRouter>
        </PrinterProvider>
      </AuthProvider>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}

export default App;