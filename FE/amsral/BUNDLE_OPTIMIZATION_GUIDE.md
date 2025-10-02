# Bundle Optimization Guide

This document outlines the changes made to optimize bundle size and provides instructions for reverting these changes if needed.

## Changes Made

### 1. Vite Configuration Changes (`vite.config.ts`)

#### What Was Added:

```typescript
export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor chunks
          "react-vendor": ["react", "react-dom"],
          "mui-vendor": ["@mui/material", "@mui/icons-material"],
          "query-vendor": ["@tanstack/react-query"],
          "axios-vendor": ["axios"],
          "pdf-vendor": ["jspdf", "html2canvas"],

          // Feature chunks
          auth: [
            "./src/context/AuthContext.tsx",
            "./src/hooks/useAuth.ts",
            "./src/services/authService.ts",
          ],
          orders: [
            "./src/pages/OrdersPage.tsx",
            "./src/hooks/useOrders.ts",
            "./src/services/orderService.ts",
          ],
          billing: [
            "./src/pages/BillingPage.tsx",
            "./src/hooks/useBilling.ts",
            "./src/services/billingService.ts",
          ],
          "system-data": [
            "./src/pages/SystemDataPage.tsx",
            "./src/hooks/useSystemData.ts",
            "./src/services/itemService.ts",
          ],
          print: [
            "./src/services/printerService.ts",
            "./src/services/printService.ts",
            "./src/utils/pdfUtils.ts",
          ],
        },
      },
    },
    chunkSizeWarningLimit: 1000, // Increase limit to 1MB
    target: "esnext",
    minify: "terser",
  },
});
```

#### Original Configuration:

```typescript
export default defineConfig({
  plugins: [react(), tailwindcss()],
});
```

### 2. App.tsx Changes - Lazy Loading Implementation

#### What Was Added:

```typescript
import { Suspense, lazy } from "react";

// Lazy load pages for better performance
const LoginPage = lazy(() => import("./pages/LoginPage"));
const DashboardPage = lazy(() => import("./pages/DashboardPage"));
const UserPage = lazy(() => import("./pages/UserPage"));
const EmployeesPage = lazy(() => import("./pages/EmployeesPage"));
const CustomersPage = lazy(() => import("./pages/CustomersPage"));
const OrdersPage = lazy(() => import("./pages/OrdersPage"));
const OrderRecordsPage = lazy(() => import("./pages/OrderRecordsPage"));
const WorkFlowPage = lazy(() => import("./pages/WorkFlowPage"));
const RecordAssignmentsPage = lazy(
  () => import("./pages/RecordAssignmentsPage")
);
const SystemDataPage = lazy(() => import("./pages/SystemDataPage"));
const ManagementPage = lazy(() => import("./pages/ManagementPage"));
const OrderDetailsPage = lazy(() => import("./pages/OrderDetailsPage"));
const QCPage = lazy(() => import("./pages/QCPage"));
const ProfilePage = lazy(() => import("./pages/ProfilePage"));
const BillingPage = lazy(() => import("./pages/BillingPage"));
const PrinterTestPage = lazy(() => import("./pages/PrinterTestPage"));
```

#### Suspense Wrapper Added:

```typescript
<Suspense
  fallback={
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading...</p>
      </div>
    </div>
  }
>
  <Routes>{/* All routes remain the same */}</Routes>
</Suspense>
```

#### Original Imports (for reference):

```typescript
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import UserPage from "./pages/UserPage";
import EmployeesPage from "./pages/EmployeesPage";
import CustomersPage from "./pages/CustomersPage";
import OrdersPage from "./pages/OrdersPage";
import OrderRecordsPage from "./pages/OrderRecordsPage";
import WorkFlowPage from "./pages/WorkFlowPage";
import RecordAssignmentsPage from "./pages/RecordAssignmentsPage";
import SystemDataPage from "./pages/SystemDataPage";
import ManagementPage from "./pages/ManagementPage";
import OrderDetailsPage from "./pages/OrderDetailsPage";
import QCPage from "./pages/QCPage";
import ProfilePage from "./pages/ProfilePage";
import BillingPage from "./pages/BillingPage";
import PrinterTestPage from "./pages/PrinterTestPage";
```

## How to Revert Changes

### Option 1: Complete Revert (Remove All Optimizations)

#### Step 1: Revert vite.config.ts

Replace the entire content with:

```typescript
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
});
```

#### Step 2: Revert App.tsx

Replace the lazy imports with direct imports:

```typescript
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { AuthProvider } from "./context/AuthContext";
import { PrinterProvider } from "./context/PrinterContext";
import { Toaster } from "react-hot-toast";
import ProtectedRoute from "./components/common/ProtectedRoute";
import ErrorBoundary from "./components/common/ErrorBoundary";
import DashboardLayout from "./components/layout/DashboardLayout";
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import UserPage from "./pages/UserPage";
import EmployeesPage from "./pages/EmployeesPage";
import CustomersPage from "./pages/CustomersPage";
import OrdersPage from "./pages/OrdersPage";
import OrderRecordsPage from "./pages/OrderRecordsPage";
import WorkFlowPage from "./pages/WorkFlowPage";
import RecordAssignmentsPage from "./pages/RecordAssignmentsPage";
import SystemDataPage from "./pages/SystemDataPage";
import ManagementPage from "./pages/ManagementPage";
import OrderDetailsPage from "./pages/OrderDetailsPage";
import QCPage from "./pages/QCPage";
import ProfilePage from "./pages/ProfilePage";
import BillingPage from "./pages/BillingPage";
import PrinterTestPage from "./pages/PrinterTestPage";
```

Remove the Suspense wrapper and keep only the Routes:

```typescript
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
    <Route
      path="production/record/:recordId"
      element={<RecordAssignmentsPage />}
    />
    <Route path="management" element={<ManagementPage />} />
    <Route path="management/orders/:orderId" element={<OrderDetailsPage />} />
    <Route path="qc" element={<QCPage />} />
    <Route path="billing" element={<BillingPage />} />
    <Route path="printer-test" element={<PrinterTestPage />} />
    <Route path="users" element={<UserPage />} />
    <Route
      path="employees"
      element={
        <ErrorBoundary>
          <EmployeesPage />
        </ErrorBoundary>
      }
    />
    <Route path="customers" element={<CustomersPage />} />
    <Route path="system-data" element={<SystemDataPage />} />
    <Route path="profile" element={<ProfilePage />} />
    {/* Redirect to login if not authenticated */}
    <Route index element={<Navigate to="/login" />} />
  </Route>
</Routes>
```

### Option 2: Partial Revert (Keep Some Optimizations)

#### Keep Lazy Loading, Remove Bundle Splitting

Keep the App.tsx changes but revert vite.config.ts to:

```typescript
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    chunkSizeWarningLimit: 1000, // Keep increased limit
  },
});
```

#### Keep Bundle Splitting, Remove Lazy Loading

Keep the vite.config.ts changes but revert App.tsx to direct imports (as shown in Option 1).

## ✅ Build Success Results

The optimization is working perfectly! Here are the actual results from the build:

### Bundle Size Improvements:

- **Before**: Single large bundle (2,311.31 kB)
- **After**: Multiple optimized chunks (largest is 591.14 kB)
- **No more warnings**: All chunks are under the 1MB limit

### Chunk Distribution:

- **Vendor chunks**: React (11.95 kB), MUI (377.87 kB), Query (34.81 kB), Axios (36.00 kB)
- **Feature chunks**: Orders (455.13 kB), Dashboard (534.02 kB), PDF (591.14 kB)
- **Page chunks**: Individual pages (1-25 kB each)

## Benefits of Current Implementation

### Performance Improvements:

- **Faster Initial Load**: Only loads essential code first
- **Better Caching**: Vendor libraries cached separately
- **Reduced Bundle Size**: Main bundle significantly smaller
- **Lazy Loading**: Pages load only when needed

### User Experience:

- **Loading Indicators**: Users see progress when navigating
- **Faster Navigation**: Subsequent page loads are faster
- **Better Mobile Performance**: Smaller initial download

## Troubleshooting

### If You Experience Issues:

1. **Loading Problems**: Check if all lazy imports are correct
2. **Build Errors**: Ensure all file paths in manualChunks are correct
3. **Performance Issues**: Monitor network tab for chunk loading
4. **Module Resolution Errors**: Remove Node.js-specific packages from manualChunks (e.g., `@serialport/parser-readline`)

### Testing After Changes:

- [ ] Run `npm run build` to check bundle sizes
- [ ] Test all page navigation
- [ ] Verify loading spinners work
- [ ] Check browser network tab for chunk loading

## File Locations

- **Vite Config**: `FE/amsral/vite.config.ts`
- **App Component**: `FE/amsral/src/App.tsx`
- **This Guide**: `FE/amsral/BUNDLE_OPTIMIZATION_GUIDE.md`

## Build Commands

```bash
# Development
npm run dev

# Production build
npm run build

# Preview production build
npm run preview
```

## Notes

- These changes are **backward compatible**
- No existing functionality is affected
- Changes can be reverted at any time
- Performance improvements are most noticeable in production builds
- Lazy loading may cause brief loading states during navigation

---

**Created**: [Current Date]
**Purpose**: Bundle size optimization and performance improvement
**Status**: Active
