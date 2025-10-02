import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor chunks
          'react-vendor': ['react', 'react-dom'],
          'mui-vendor': ['@mui/material', '@mui/icons-material'],
          'query-vendor': ['@tanstack/react-query'],
          'axios-vendor': ['axios'],
          'pdf-vendor': ['jspdf', 'html2canvas'],
          
          // Feature chunks
          'auth': [
            './src/context/AuthContext.tsx',
            './src/hooks/useAuth.ts',
            './src/services/authService.ts'
          ],
          'orders': [
            './src/pages/OrdersPage.tsx',
            './src/hooks/useOrders.ts',
            './src/services/orderService.ts'
          ],
          'billing': [
            './src/pages/BillingPage.tsx',
            './src/hooks/useBilling.ts',
            './src/services/billingService.ts'
          ],
          'system-data': [
            './src/pages/SystemDataPage.tsx',
            './src/hooks/useSystemData.ts',
            './src/services/itemService.ts'
          ],
          'print': [
            './src/services/printerService.ts',
            './src/services/printService.ts',
            './src/utils/pdfUtils.ts'
          ]
        }
      }
    },
    chunkSizeWarningLimit: 1000 // Increase limit to 1MB
  }
})
