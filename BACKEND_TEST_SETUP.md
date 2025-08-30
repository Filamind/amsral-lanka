# Backend API Test Instructions

## Quick Test Setup

To test the frontend API integration, you can use this simple Node.js server:

1. Create a new folder for backend test:

```bash
mkdir backend-test
cd backend-test
npm init -y
npm install express cors
```

2. Create `server.js`:

```javascript
const express = require("express");
const cors = require("cors");

const app = express();
const PORT = 3001;

// Middleware
app.use(
  cors({
    origin: "http://localhost:5173", // Your frontend URL
    credentials: true,
  })
);
app.use(express.json());

// Test users for login
const users = [
  {
    id: 1,
    email: "admin@amsral.com",
    password: "admin123", // In real app, this should be hashed
    firstName: "Admin",
    lastName: "User",
    role: "admin",
  },
  {
    id: 2,
    email: "user@amsral.com",
    password: "user123",
    firstName: "Test",
    lastName: "User",
    role: "user",
  },
];

// Login endpoint
app.post("/api/users/login", (req, res) => {
  const { email, password } = req.body;

  // Find user
  const user = users.find((u) => u.email === email && u.password === password);

  if (!user) {
    return res.status(401).json({
      success: false,
      message: "Invalid email or password",
    });
  }

  // Generate simple token (in real app, use JWT)
  const token = `token_${user.id}_${Date.now()}`;

  res.json({
    success: true,
    message: "Login successful",
    token,
    user: {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
    },
  });
});

// In-memory storage for testing
let employees = [
  {
    id: 1,
    employeeId: "EMP001",
    firstName: "Alice",
    lastName: "Brown",
    phone: "1112223333",
    email: "alice@example.com",
    hireDate: "2023-01-15",
    dateOfBirth: "1990-01-01",
    address: "123 Main St",
    emergencyContact: "John Brown",
    emergencyPhone: "1111111111",
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

// Get all employees
app.get("/api/employees", (req, res) => {
  res.json({
    success: true,
    data: employees,
  });
});

// Create employee
app.post("/api/employees", (req, res) => {
  const {
    employeeId,
    firstName,
    lastName,
    phone,
    email,
    hireDate,
    dateOfBirth,
    address,
    emergencyContact,
    emergencyPhone,
    isActive,
  } = req.body;

  // Validation
  const errors = [];
  if (!employeeId)
    errors.push({ field: "employeeId", message: "Employee ID is required" });
  if (!firstName)
    errors.push({ field: "firstName", message: "First name is required" });
  if (!lastName)
    errors.push({ field: "lastName", message: "Last name is required" });
  if (!phone) errors.push({ field: "phone", message: "Phone is required" });

  // Check unique fields
  if (employeeId && employees.find((emp) => emp.employeeId === employeeId)) {
    errors.push({ field: "employeeId", message: "Employee ID must be unique" });
  }
  if (email && employees.find((emp) => emp.email === email)) {
    errors.push({ field: "email", message: "Email must be unique" });
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors,
    });
  }

  const newEmployee = {
    id: employees.length > 0 ? Math.max(...employees.map((e) => e.id)) + 1 : 1,
    employeeId,
    firstName,
    lastName,
    phone,
    email: email || "",
    hireDate: hireDate || "",
    dateOfBirth: dateOfBirth || "",
    address: address || "",
    emergencyContact: emergencyContact || "",
    emergencyPhone: emergencyPhone || "",
    isActive: isActive !== undefined ? isActive : true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  employees.push(newEmployee);

  res.status(201).json({
    success: true,
    message: "Employee created successfully",
    data: newEmployee,
  });
});

app.listen(PORT, () => {
  console.log(`Test backend server running on http://localhost:${PORT}`);
  console.log("Available endpoints:");
  console.log("- POST /api/users/login");
  console.log("- GET /api/employees");
  console.log("- POST /api/employees");
  console.log("");
  console.log("Test Login Credentials:");
  console.log("- Admin: admin@amsral.com / admin123");
  console.log("- User: user@amsral.com / user123");
});
```

3. Run the test server:

```bash
node server.js
```

4. Run your frontend:

```bash
cd ../FE/amsral
npm run dev
```

Now test creating a new employee - it should connect to your backend!

## API Configuration

The frontend is configured to use `http://localhost:3001/api` as the base URL.

To change this for production:

- Edit `src/config/api.ts`
- Change `API_BASE_URL` to your production URL

## Testing Steps

1. Start the backend test server
2. Start the frontend dev server
3. Go to http://localhost:5173 (should redirect to login)
4. Login with test credentials:
   - **Admin**: admin@amsral.com / admin123
   - **User**: user@amsral.com / user123
5. Should redirect to dashboard after successful login
6. Go to Employees page
7. Click "Add Employee" and test creating employees
8. Test logout from sidebar
9. Check browser console for API calls and cookie storage
