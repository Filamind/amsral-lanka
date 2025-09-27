# Deployment Guide for Amsral Application

## Environment Setup

### 1. Backend API Configuration

You need to update the API URL in your environment configuration:

**For Production:**

```bash
# Set environment variable
VITE_API_BASE_URL=https://your-backend-domain.com/api
```

**For Development:**

```bash
# Set environment variable (optional, defaults to localhost)
VITE_API_BASE_URL=http://localhost:3000/api
```

### 2. Environment Variables

Create a `.env.production` file in your project root:

```env
# Production Environment Variables
VITE_API_BASE_URL=https://your-backend-domain.com/api
VITE_NODE_ENV=production
VITE_API_TIMEOUT=15000
```

### 3. Build Configuration

Update your `vite.config.ts` to handle environment variables:

```typescript
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  define: {
    // Ensure environment variables are available
    "process.env": process.env,
  },
  build: {
    // Ensure environment variables are included in build
    envPrefix: "VITE_",
  },
});
```

## Printing Solutions

### 1. Serial Printing (Desktop Chrome/Edge Only)

- Works on desktop computers with Chrome or Edge browsers
- Requires direct USB connection to thermal printer
- Not available on mobile devices or hosted environments

### 2. Browser Printing (Universal)

- Works on all devices and browsers
- Opens print dialog for standard printers
- Fallback method when serial printing is not available

### 3. PDF Generation (Future Enhancement)

- Can be implemented with jsPDF library
- Generates downloadable PDF files
- Works on all devices

## Mobile Device Support

### Login Issues on Mobile

The main issue was the hardcoded `localhost:3000` API URL. This has been fixed with:

1. **Environment-based configuration** - API URL changes based on environment
2. **Production fallback** - Uses your hosted backend URL in production
3. **Mobile-friendly authentication** - Works on all devices

### Printing on Mobile

- Serial printing is not available on mobile devices
- Browser printing works on mobile devices
- Users can print to any connected printer via mobile browser

## Deployment Steps

### 1. Update Backend URL

Replace `https://your-backend-domain.com/api` with your actual backend URL.

### 2. Build for Production

```bash
npm run build
```

### 3. Deploy to Hosting Service

- Upload the `dist` folder to your hosting service
- Ensure environment variables are set correctly
- Test the application on different devices

### 4. Test Printing

- Test on desktop with Chrome/Edge for serial printing
- Test on mobile devices for browser printing
- Verify API connectivity from hosted environment

## Troubleshooting

### API Connection Issues

1. Check that your backend is running and accessible
2. Verify the API URL in environment variables
3. Check CORS settings on your backend
4. Ensure HTTPS is properly configured

### Printing Issues

1. **Serial printing not working**: Use Chrome/Edge browser on desktop
2. **Mobile printing**: Use browser printing method
3. **Hosted environment**: Browser printing is the primary method

### Mobile Login Issues

1. Ensure API URL is not localhost in production
2. Check that backend accepts requests from your domain
3. Verify CORS configuration allows your frontend domain

## Browser Compatibility

### Serial Printing

- ✅ Chrome (Desktop)
- ✅ Edge (Desktop)
- ❌ Firefox
- ❌ Safari
- ❌ Mobile browsers

### Browser Printing

- ✅ All modern browsers
- ✅ Mobile browsers
- ✅ All devices

## Security Considerations

### HTTPS Requirements

- Production deployments should use HTTPS
- Web Serial API requires secure context
- Cookies are set with secure flag in production

### CORS Configuration

Ensure your backend allows requests from your frontend domain:

```javascript
// Backend CORS configuration
app.use(
  cors({
    origin: ["https://your-frontend-domain.com", "http://localhost:5173"],
    credentials: true,
  })
);
```

## Performance Optimization

### Build Optimization

- Environment variables are resolved at build time
- Unused code is tree-shaken
- Assets are optimized for production

### Runtime Optimization

- API calls are cached where appropriate
- Print methods are selected automatically
- Error handling provides fallback options
