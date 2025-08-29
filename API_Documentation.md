# AMSRAL FRONTEND - API DOCUMENTATION

**For Backend Development Team**

---

**Project:** AMSRAL Lanka - Production Management System  
**Date:** August 29, 2025  
**Frontend:** React + TypeScript + Vite  
**Backend:** REST API with JSON responses

---

## 🔐 AUTHENTICATION APIs

### 1. USER LOGIN

- **Endpoint:** `POST /api/users/login`
- **Description:** Authenticate user and return JWT token

**Input:**

```json
{
  "email": "string",
  "password": "string"
}
```

**Output:**

```json
{
  "success": boolean,
  "message": "string",
  "token": "string",
  "user": {
    "id": "number",
    "email": "string",
    "firstName": "string",
    "lastName": "string",
    "role": "string"
  }
}
```

---

## 👥 USER MANAGEMENT APIs

### 2. GET ALL USERS

- **Endpoint:** `GET /api/users`
- **Description:** Retrieve all users with pagination and search

**Query Parameters:**

- `search`: string (optional) - Search by username, email
- `page`: number (optional) - Page number
- `limit`: number (optional) - Items per page

**Output:**

```json
{
  "success": boolean,
  "data": [
    {
      "id": "number",
      "email": "string",
      "firstName": "string",
      "lastName": "string",
      "phone": "string",
      "dateOfBirth": "string (YYYY-MM-DD)",
      "role": "admin|finance|sales|user",
      "isActive": boolean,
      "createdAt": "string (ISO date)",
      "updatedAt": "string (ISO date)"
    }
  ],
  "total": "number",
  "page": "number",
  "limit": "number"
}
```

### 3. CREATE USER

- **Endpoint:** `POST /api/users`
- **Description:** Create a new user

**Input:**

```json
{
  "email": "string (required, unique)",
  "firstName": "string (required)",
  "lastName": "string (required)",
  "passwordHash": "string (required)",
  "phone": "string (optional)",
  "dateOfBirth": "string (optional, YYYY-MM-DD)",
  "role": "admin|finance|sales|user (optional, default: user)",
  "isActive": "boolean (optional, default: true)"
}
```

### 4. UPDATE USER

- **Endpoint:** `PUT /api/users/:id`
- **Input:** Same as Create User (all fields optional except validation rules)

### 5. DELETE USER

- **Endpoint:** `DELETE /api/users/:id`

---

## 🏢 CUSTOMER MANAGEMENT APIs

### 6. GET ALL CUSTOMERS

- **Endpoint:** `GET /api/customers`

**Output:**

```json
{
  "success": boolean,
  "data": [
    {
      "id": "number",
      "customerCode": "string (unique)",
      "firstName": "string",
      "lastName": "string",
      "phone": "string",
      "email": "string (optional, unique)",
      "address": "string (optional)",
      "city": "string (optional)",
      "notes": "string (optional)",
      "isActive": boolean,
      "createdAt": "string (ISO date)",
      "updatedAt": "string (ISO date)"
    }
  ],
  "total": "number"
}
```

### 7. CREATE CUSTOMER

- **Endpoint:** `POST /api/customers`

**Input:**

```json
{
  "customerCode": "string (required, unique)",
  "firstName": "string (required)",
  "lastName": "string (required)",
  "phone": "string (required)",
  "email": "string (optional, unique)",
  "address": "string (optional)",
  "city": "string (optional)",
  "notes": "string (optional)",
  "isActive": "boolean (optional, default: true)"
}
```

---

## 👨‍💼 EMPLOYEE MANAGEMENT APIs

### 10. GET ALL EMPLOYEES

- **Endpoint:** `GET /api/employees`

**Output:**

```json
{
  "success": boolean,
  "data": [
    {
      "id": "number",
      "employeeId": "string (unique)",
      "firstName": "string",
      "lastName": "string",
      "phone": "string",
      "email": "string (optional, unique)",
      "hireDate": "string (optional, YYYY-MM-DD)",
      "dateOfBirth": "string (optional, YYYY-MM-DD)",
      "address": "string (optional)",
      "emergencyContact": "string (optional)",
      "emergencyPhone": "string (optional)",
      "isActive": boolean,
      "createdAt": "string (ISO date)",
      "updatedAt": "string (ISO date)"
    }
  ]
}
```

### 11. CREATE EMPLOYEE

- **Endpoint:** `POST /api/employees`

**Input:**

```json
{
  "employeeId": "string (required, unique)",
  "firstName": "string (required)",
  "lastName": "string (required)",
  "phone": "string (required)",
  "email": "string (optional, unique)",
  "hireDate": "string (optional, YYYY-MM-DD)",
  "dateOfBirth": "string (optional, YYYY-MM-DD)",
  "address": "string (optional)",
  "emergencyContact": "string (optional)",
  "emergencyPhone": "string (optional)",
  "isActive": "boolean (optional, default: true)"
}
```

---

## 📦 ORDER MANAGEMENT APIs

### 14. GET ALL ORDERS

- **Endpoint:** `GET /api/orders`

**Output:**

```json
{
  "success": boolean,
  "data": [
    {
      "id": "number",
      "date": "string (YYYY-MM-DD)",
      "referenceNo": "string (unique)",
      "customerId": "number",
      "customerName": "string",
      "item": "string",
      "quantity": "number",
      "deliveryDate": "string (optional, YYYY-MM-DD)",
      "status": "pending|confirmed|processing|shipped|delivered|cancelled",
      "notes": "string (optional)",
      "records": [
        {
          "id": "number",
          "quantity": "number",
          "washType": "string",
          "washTypeCode": "string",
          "processTypes": ["string"],
          "processTypeCodes": ["string"]
        }
      ],
      "createdAt": "string (ISO date)",
      "updatedAt": "string (ISO date)"
    }
  ]
}
```

### 15. CREATE ORDER

- **Endpoint:** `POST /api/orders`

**Input:**

```json
{
  "date": "string (required, YYYY-MM-DD)",
  "referenceNo": "string (required, unique)",
  "customerId": "number (required)",
  "item": "string (required)",
  "quantity": "number (required)",
  "deliveryDate": "string (optional, YYYY-MM-DD)",
  "status": "string (optional, default: pending)",
  "notes": "string (optional)",
  "records": [
    {
      "quantity": "number (required)",
      "washType": "string (required)",
      "processTypes": ["string (required)"]
    }
  ]
}
```

---

## ⚙️ PRODUCTION WORKFLOW APIs

### 18. GET ALL PRODUCTION RECORDS

- **Endpoint:** `GET /api/production/records`
- **Description:** Get all order records for production workflow

**Output:**

```json
{
  "success": boolean,
  "data": [
    {
      "id": "string",
      "orderId": "number",
      "orderRef": "string",
      "customerName": "string",
      "item": "string",
      "quantity": "number",
      "remainingQuantity": "number",
      "washType": "string",
      "processTypes": ["string"],
      "status": "pending|in_progress|completed"
    }
  ]
}
```

### 19. GET MACHINE ASSIGNMENTS

- **Endpoint:** `GET /api/production/assignments`

**Output:**

```json
{
  "success": boolean,
  "data": [
    {
      "id": "string",
      "recordId": "string",
      "orderRef": "string",
      "customerName": "string",
      "item": "string",
      "assignedBy": "string",
      "assignedById": "number",
      "quantity": "number",
      "washingMachine": "W1|W2|W3|W4|W5|W6|W7|W8",
      "dryingMachine": "D1|D2|D3|D4|D5|D6|D7|D8|D9",
      "assignedAt": "string (ISO date)"
    }
  ]
}
```

### 20. CREATE MACHINE ASSIGNMENT

- **Endpoint:** `POST /api/production/assignments`

**Input:**

```json
{
  "recordId": "string (required)",
  "assignedById": "number (required)",
  "quantity": "number (required)",
  "washingMachine": "string (required, W1-W8)",
  "dryingMachine": "string (required, D1-D9)"
}
```

---

## 📊 REFERENCE DATA APIs

### 21. GET WASH TYPES

- **Endpoint:** `GET /api/reference/wash-types`

| Code     | Name               |
| -------- | ------------------ |
| N/W      | Normal Wash        |
| Hy/W     | Heavy Wash         |
| Sil/W    | Silicon Wash       |
| Hy/Sil/W | Heavy Silicon Wash |
| En/W     | Enzyme Wash        |
| Hy/En/W  | Heavy Enzyme Wash  |
| Dk/W     | Dark Wash          |
| Mid/W    | Mid Wash           |
| Lit/W    | Light Wash         |
| Sky/W    | Sky Wash           |
| Acid/W   | Acid Wash          |
| Tint/W   | Tint Wash          |
| Chem/W   | Chemical Wash      |

### 22. GET PROCESS TYPES

- **Endpoint:** `GET /api/reference/process-types`

| Code  | Name       |
| ----- | ---------- |
| Reese | Reese      |
| S/B   | Sand Blast |
| V     | Viscose    |
| Chev  | Chevron    |
| H/S   | Hand Sand  |
| Rib   | Rib        |
| Tool  | Tool       |
| Grnd  | Grind      |

### 23. GET MACHINES

- **Endpoint:** `GET /api/reference/machines`

**Washing Machines:** W1, W2, W3, W4, W5, W6, W7, W8 (8 machines)  
**Drying Machines:** D1, D2, D3, D4, D5, D6, D7, D8, D9 (9 machines)

---

## 🔧 COMMON RESPONSE PATTERNS

### Error Response:

```json
{
  "success": false,
  "message": "string",
  "error": "string (optional)",
  "details": "object (optional)"
}
```

### Validation Error Response:

```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "field": "string",
      "message": "string"
    }
  ]
}
```

---

## 🔒 AUTHENTICATION HEADERS

All protected endpoints require:

```
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
```

---

## 📝 IMPORTANT NOTES FOR BACKEND DEVELOPER

### 1. UNIQUE FIELD VALIDATION

- customerCode, employeeId, email, referenceNo must be unique
- Return proper validation errors for duplicates

### 2. PRODUCTION WORKFLOW

- When creating machine assignments, update remainingQuantity in records
- Mark record as "completed" when remainingQuantity = 0

### 3. ORDER RECORDS

- Each order can have multiple processing records
- Sum of record quantities should equal order quantity
- Validate this on order creation/update

### 4. MACHINE CONSTRAINTS

- Washing machines: W1-W8 (8 machines)
- Drying machines: D1-D9 (9 machines)
- Each assignment needs both washing AND drying machine

### 5. SEARCH FUNCTIONALITY

- Implement case-insensitive search across specified fields
- Support partial matching

### 6. DATE FORMATS

- Use YYYY-MM-DD format for dates
- ISO format for timestamps

### 7. STATUS MANAGEMENT

- Orders: pending → confirmed → processing → shipped → delivered
- Can be cancelled at any stage
- Update related records when order status changes

---

**END OF DOCUMENTATION**
