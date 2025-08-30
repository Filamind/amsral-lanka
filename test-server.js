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
    firstName: "Alice",
    lastName: "Brown",
    phone: "1112223333",
    email: "alice@example.com",
    hireDate: "2023-01-15",
    dateOfBirth: "1990-01-01",
    address: "123 Main St",
    emergencyContact: "John Brown",
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

// Get all employees
app.get("/api/employees", (req, res) => {
  console.log("GET /api/employees called");
  res.json({
    success: true,
    data: employees,
  });
});

// Create employee
app.post("/api/employees", (req, res) => {
  console.log("POST /api/employees called with data:", req.body);

  const {
    firstName,
    lastName,
    phone,
    email,
    hireDate,
    dateOfBirth,
    address,
    emergencyContact,
    isActive,
  } = req.body;

  // Validation
  const errors = [];
  if (!firstName)
    errors.push({ field: "firstName", message: "First name is required" });
  if (!lastName)
    errors.push({ field: "lastName", message: "Last name is required" });
  if (!phone) errors.push({ field: "phone", message: "Phone is required" });

  // Check unique fields
  if (email && employees.find((emp) => emp.email === email)) {
    errors.push({ field: "email", message: "Email must be unique" });
  }

  if (errors.length > 0) {
    console.log("Validation errors:", errors);
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors,
    });
  }

  const newEmployee = {
    id: employees.length > 0 ? Math.max(...employees.map((e) => e.id)) + 1 : 1,
    firstName,
    lastName,
    phone,
    email: email || "",
    hireDate: hireDate || "",
    dateOfBirth: dateOfBirth || "",
    address: address || "",
    emergencyContact: emergencyContact || "",
    isActive: isActive !== undefined ? isActive : true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  employees.push(newEmployee);

  console.log("Employee created successfully:", newEmployee);
  console.log("Total employees now:", employees.length);

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
});
