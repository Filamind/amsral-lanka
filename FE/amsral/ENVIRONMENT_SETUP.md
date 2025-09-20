# Environment Variables Setup

This project now uses environment variables for configuration instead of hardcoded values in the config file.

## Setup Instructions

### 1. Create Environment File

Create a `.env` file in the root of the frontend project (`FE/amsral/.env`):

```bash
# Backend API Configuration
VITE_API_BASE_URL=http://localhost:3000/api

# Environment
VITE_NODE_ENV=development

# API Timeout (optional, defaults to 10000ms)
VITE_API_TIMEOUT=10000
```

### 2. Environment Variables

| Variable            | Description                          | Default Value               | Required |
| ------------------- | ------------------------------------ | --------------------------- | -------- |
| `VITE_API_BASE_URL` | Backend API base URL                 | `http://localhost:3000/api` | No       |
| `VITE_NODE_ENV`     | Environment (development/production) | `development`               | No       |
| `VITE_API_TIMEOUT`  | API request timeout in milliseconds  | `10000`                     | No       |

### 3. Different Environments

#### Development

```bash
VITE_API_BASE_URL=http://localhost:3000/api
VITE_NODE_ENV=development
```

#### Production

```bash
VITE_API_BASE_URL=https://your-production-api.com/api
VITE_NODE_ENV=production
```

#### Staging

```bash
VITE_API_BASE_URL=https://your-staging-api.com/api
VITE_NODE_ENV=staging
```

### 4. Important Notes

- **VITE\_ Prefix**: All environment variables must start with `VITE_` to be accessible in the frontend code
- **No .env in Git**: The `.env` file should be added to `.gitignore` to keep sensitive data secure
- **Restart Required**: After creating or modifying the `.env` file, restart the development server
- **Fallback Values**: If environment variables are not set, the application will use the default values defined in the config

### 5. Security

- Never commit `.env` files to version control
- Use different `.env` files for different environments
- Keep sensitive data (like API keys) in environment variables, not in code

### 6. Verification

In development mode, the API configuration will be logged to the console when the application starts, showing:

- Base URL
- Environment
- Timeout value

This helps verify that the environment variables are loaded correctly.
