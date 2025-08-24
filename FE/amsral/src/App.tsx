import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import DashboardLayout from './components/layout/DashboardLayout';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import UserPage from './pages/UserPage';
import EmployeesPage from './pages/EmployeesPage';
import CustomersPage from './pages/CustomersPage';
import OrdersPage from './pages/OrdersPage';



function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public route - no sidebar */}
        <Route path="/login" element={<LoginPage />} />
        {/* Protected routes with sidebar */}
        <Route
          path="/"
          element={<DashboardLayout />}
        >
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="orders" element={<OrdersPage />} />
          <Route path="users" element={<UserPage />} />
          <Route path="employees" element={<EmployeesPage />} />
          <Route path="customers" element={<CustomersPage />} />
          {/* Optional: Redirect root to dashboard */}
          <Route index element={<Navigate to="dashboard" />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;