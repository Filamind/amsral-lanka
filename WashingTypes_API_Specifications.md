# Washing Types Management API - Request & Response Specifications

## Database Table Structure

### Washing Types Table:

```sql
CREATE TABLE washing_types (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(20) NOT NULL UNIQUE,
    description TEXT,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    INDEX idx_name (name),
    INDEX idx_code (code)
);
```

---

## API Endpoints

### 1. GET /api/washing-types - Get All Washing Types (with pagination and filtering)

**Request:**

```http
GET /api/washing-types?page=1&limit=10&search=normal
```

**Query Parameters:**

- `page` (optional): Page number for pagination
- `limit` (optional): Number of records per page
- `search` (optional): Search term for washing type name, code, or description
- `sortBy` (optional): Field to sort by (name, code, createdAt)
- `sortOrder` (optional): Sort direction (asc, desc)

**Response:**

```json
{
  "success": true,
  "data": {
    "washingTypes": [
      {
        "id": "WT001",
        "name": "Normal Wash",
        "code": "N/W",
        "description": "Standard washing process for regular garments",
        "createdAt": "2025-08-29T10:30:00.000Z",
        "updatedAt": "2025-08-29T10:30:00.000Z"
      },
      {
        "id": "WT002",
        "name": "Heavy Wash",
        "code": "Hy/W",
        "description": "Intensive washing process for heavily soiled items",
        "createdAt": "2025-08-28T09:15:00.000Z",
        "updatedAt": "2025-08-28T09:15:00.000Z"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 3,
      "totalRecords": 25,
      "limit": 10
    }
  }
}
```

---

### 2. GET /api/washing-types/predefined - Get Predefined Washing Types

**Request:**

```http
GET /api/washing-types/predefined
```

**Response:**

```json
{
  "success": true,
  "data": {
    "predefinedTypes": [
      {
        "id": "WT001",
        "name": "Normal Wash",
        "code": "N/W",
        "description": "Standard washing process for regular garments",
        "createdAt": "2025-08-29T10:30:00.000Z",
        "updatedAt": "2025-08-29T10:30:00.000Z"
      },
      {
        "id": "WT002",
        "name": "Heavy Wash",
        "code": "Hy/W",
        "description": "Intensive washing process for heavily soiled items",
        "createdAt": "2025-08-28T09:15:00.000Z",
        "updatedAt": "2025-08-28T09:15:00.000Z"
      },
      {
        "id": "WT003",
        "name": "Silicon Wash",
        "code": "Sil/W",
        "description": "Washing with silicon softener for smooth finish",
        "createdAt": "2025-08-27T14:20:00.000Z",
        "updatedAt": "2025-08-27T14:20:00.000Z"
      },
      {
        "id": "WT004",
        "name": "Enzyme Wash",
        "code": "En/W",
        "description": "Enzyme-based washing for fabric treatment",
        "createdAt": "2025-08-26T11:45:00.000Z",
        "updatedAt": "2025-08-26T11:45:00.000Z"
      }
    ]
  }
}
```

---

### 3. GET /api/washing-types/stats - Get Washing Type Statistics

**Request:**

```http
GET /api/washing-types/stats
```

**Response:**

```json
{
  "success": true,
  "data": {
    "totalWashingTypes": 15,
    "activeTypes": 12,
    "inactiveTypes": 3,
    "mostUsedType": "Normal Wash"
  }
}
```

---

### 4. GET /api/washing-types/code/:code - Get Washing Type by Code

**Request:**

```http
GET /api/washing-types/code/N%2FW
```

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "WT001",
    "name": "Normal Wash",
    "code": "N/W",
    "description": "Standard washing process for regular garments",
    "createdAt": "2025-08-29T10:30:00.000Z",
    "updatedAt": "2025-08-29T10:30:00.000Z"
  }
}
```

**Error Response (404):**

```json
{
  "success": false,
  "message": "Washing type with code 'INVALID' not found"
}
```

---

### 5. GET /api/washing-types/:id - Get Washing Type by ID

**Request:**

```http
GET /api/washing-types/WT001
```

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "WT001",
    "name": "Normal Wash",
    "code": "N/W",
    "description": "Standard washing process for regular garments",
    "createdAt": "2025-08-29T10:30:00.000Z",
    "updatedAt": "2025-08-29T10:30:00.000Z"
  }
}
```

**Error Response (404):**

```json
{
  "success": false,
  "message": "Washing type not found"
}
```

---

### 6. POST /api/washing-types - Create New Washing Type

**Request:**

```http
POST /api/washing-types
Content-Type: application/json

{
  "name": "Delicate Wash",
  "code": "Del/W",
  "description": "Gentle washing process for delicate fabrics"
}
```

**Request Body Validation:**

- `name` (required): String, 1-255 characters, must be unique
- `code` (required): String, 1-20 characters, must be unique
- `description` (optional): String, max 500 characters

**Response (201):**

```json
{
  "success": true,
  "data": {
    "id": "WT015",
    "name": "Delicate Wash",
    "code": "Del/W",
    "description": "Gentle washing process for delicate fabrics",
    "createdAt": "2025-09-05T14:30:00.000Z",
    "updatedAt": "2025-09-05T14:30:00.000Z"
  },
  "message": "Washing type created successfully"
}
```

**Error Response (400):**

```json
{
  "success": false,
  "message": "Validation failed",
  "errors": {
    "name": "Name is required",
    "code": "Code must be unique"
  }
}
```

---

### 7. PUT /api/washing-types/:id - Update Washing Type

**Request:**

```http
PUT /api/washing-types/WT015
Content-Type: application/json

{
  "name": "Ultra Delicate Wash",
  "code": "UDel/W",
  "description": "Ultra gentle washing process for extremely delicate fabrics"
}
```

**Request Body Validation:**

- `name` (optional): String, 1-255 characters, must be unique if provided
- `code` (optional): String, 1-20 characters, must be unique if provided
- `description` (optional): String, max 500 characters

**Response (200):**

```json
{
  "success": true,
  "data": {
    "id": "WT015",
    "name": "Ultra Delicate Wash",
    "code": "UDel/W",
    "description": "Ultra gentle washing process for extremely delicate fabrics",
    "createdAt": "2025-09-05T14:30:00.000Z",
    "updatedAt": "2025-09-05T15:45:00.000Z"
  },
  "message": "Washing type updated successfully"
}
```

**Error Response (404):**

```json
{
  "success": false,
  "message": "Washing type not found"
}
```

**Error Response (400):**

```json
{
  "success": false,
  "message": "Validation failed",
  "errors": {
    "code": "Code must be unique"
  }
}
```

---

### 8. DELETE /api/washing-types/:id - Delete Washing Type

**Request:**

```http
DELETE /api/washing-types/WT015
```

**Response (200):**

```json
{
  "success": true,
  "message": "Washing type deleted successfully"
}
```

**Error Response (404):**

```json
{
  "success": false,
  "message": "Washing type not found"
}
```

**Error Response (409):**

```json
{
  "success": false,
  "message": "Cannot delete washing type as it is being used in active orders"
}
```

---

## Error Handling

### Common Error Responses:

**400 Bad Request:**

```json
{
  "success": false,
  "message": "Invalid request data",
  "errors": {
    "field": "Error description"
  }
}
```

**401 Unauthorized:**

```json
{
  "success": false,
  "message": "Authentication required"
}
```

**403 Forbidden:**

```json
{
  "success": false,
  "message": "Insufficient permissions"
}
```

**500 Internal Server Error:**

```json
{
  "success": false,
  "message": "Internal server error"
}
```

---

## Business Rules

1. **Unique Constraints:**

   - Washing type codes must be unique across the system
   - Washing type names should be unique (case-insensitive)

2. **Code Format:**

   - Codes are typically short abbreviations (e.g., "N/W", "Hy/W")
   - Forward slashes and other special characters are allowed
   - Codes should be URL-encoded when used in URL paths

3. **Predefined Types:**

   - System comes with standard washing types
   - Predefined types cannot be deleted but can be modified
   - Custom types can be added by users

4. **Dependencies:**

   - Washing types used in active orders cannot be deleted
   - System will check for dependencies before deletion

5. **Validation Rules:**
   - Name: Required, 1-255 characters
   - Code: Required, 1-20 characters, unique
   - Description: Optional, max 500 characters

---

## Integration Notes

- All timestamps are in ISO 8601 format (UTC)
- IDs are generated as alphanumeric strings
- Pagination defaults: page=1, limit=10
- Search is case-insensitive and searches name, code, and description
- Sort orders: 'asc' (ascending), 'desc' (descending)
- Default sort: createdAt DESC
