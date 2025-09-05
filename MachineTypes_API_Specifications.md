# Machine Types API Specifications

## Overview

This document outlines the API endpoints for managing machine types in the Amsral system. Machine types represent different categories of equipment used in the laundry/washing process.

## Base URL

```
/api/v1/machine-types
```

## Data Model

### type Object

```json
{
  "id": "string",
  "name": "string",
  "type": "string", // 'Washing' or 'Drying'
  "description": "string (optional)",
  "createdAt": "ISO 8601 date string",
  "updatedAt": "ISO 8601 date string"
}
```

## API Endpoints

### 1. Get Machine Types (Paginated)

**Endpoint:** `GET /api/v1/machine-types`

**Description:** Retrieve a paginated list of machine types with optional search functionality.

**Query Parameters:**

- `page` (integer, optional): Page number (default: 1)
- `limit` (integer, optional): Number of items per page (default: 10, max: 100)
- `search` (string, optional): Search term to filter by name, machine type, or description

**Response Format:**

```json
{
  "success": true,
  "data": {
    "types": [
      {
        "id": "507f1f77bcf86cd799439011",
        "name": "Industrial Washer A1",
        "type": "Washing",
        "description": "High-capacity industrial washing machine",
        "createdAt": "2024-01-15T10:30:00.000Z",
        "updatedAt": "2024-01-15T10:30:00.000Z"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 5,
      "totalRecords": 50,
      "limit": 10
    }
  }
}
```

**Status Codes:**

- `200`: Success
- `400`: Bad Request (invalid query parameters)
- `500`: Internal Server Error

### 2. Get Machine Types List (No Pagination)

**Endpoint:** `GET /api/v1/machine-types/list`

**Description:** Retrieve a simple list of all machine types for dropdowns and selection components.

**Response Format:**

```json
{
  "success": true,
  "data": [
    {
      "id": "507f1f77bcf86cd799439011",
      "name": "Industrial Washer A1",
      "type": "Washing"
    }
  ]
}
```

**Status Codes:**

- `200`: Success
- `500`: Internal Server Error

### 3. Get Machine Type Statistics

**Endpoint:** `GET /api/v1/machine-types/stats`

**Description:** Retrieve statistics about machine types.

**Response Format:**

```json
{
  "success": true,
  "data": {
    "total": 25,
    "byType": {
      "Washing": 15,
      "Drying": 10
    },
    "recentlyAdded": 3
  }
}
```

**Status Codes:**

- `200`: Success
- `500`: Internal Server Error

### 4. Get Unique Machine Types

**Endpoint:** `GET /api/v1/machine-types/unique-types`

**Description:** Retrieve a list of unique machine type categories.

**Response Format:**

```json
{
  "success": true,
  "data": ["Washing", "Drying"]
}
```

**Status Codes:**

- `200`: Success
- `500`: Internal Server Error

### 5. Get Machine Type by ID

**Endpoint:** `GET /api/v1/machine-types/:id`

**Description:** Retrieve a specific machine type by its ID.

**Parameters:**

- `id` (string, required): Machine type ID

**Response Format:**

```json
{
  "success": true,
  "data": {
    "id": "507f1f77bcf86cd799439011",
    "name": "Industrial Washer A1",
    "type": "Washing",
    "description": "High-capacity industrial washing machine",
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

**Status Codes:**

- `200`: Success
- `404`: Machine type not found
- `500`: Internal Server Error

### 6. Create Machine Type

**Endpoint:** `POST /api/v1/machine-types`

**Description:** Create a new machine type.

**Request Body:**

```json
{
  "name": "Industrial Washer A1",
  "type": "Washing",
  "description": "High-capacity industrial washing machine"
}
```

**Validation Rules:**

- `name`: Required, 1-100 characters, must be unique
- `type`: Required, must be 'Washing' or 'Drying'
- `description`: Optional, max 500 characters

**Response Format:**

```json
{
  "success": true,
  "data": {
    "id": "507f1f77bcf86cd799439011",
    "name": "Industrial Washer A1",
    "type": "Washing",
    "description": "High-capacity industrial washing machine",
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

**Status Codes:**

- `201`: Created successfully
- `400`: Bad Request (validation errors)
- `409`: Conflict (name already exists)
- `500`: Internal Server Error

### 7. Update Machine Type

**Endpoint:** `PUT /api/v1/machine-types/:id`

**Description:** Update an existing machine type.

**Parameters:**

- `id` (string, required): Machine type ID

**Request Body:**

```json
{
  "name": "Industrial Washer A1 Updated",
  "type": "Washing",
  "description": "Updated description"
}
```

**Validation Rules:** Same as create endpoint

**Response Format:**

```json
{
  "success": true,
  "data": {
    "id": "507f1f77bcf86cd799439011",
    "name": "Industrial Washer A1 Updated",
    "type": "Washing",
    "description": "Updated description",
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-16T14:20:00.000Z"
  }
}
```

**Status Codes:**

- `200`: Updated successfully
- `400`: Bad Request (validation errors)
- `404`: Machine type not found
- `409`: Conflict (name already exists)
- `500`: Internal Server Error

### 8. Delete Machine Type

**Endpoint:** `DELETE /api/v1/machine-types/:id`

**Description:** Delete a machine type by ID.

**Parameters:**

- `id` (string, required): Machine type ID

**Response Format:**

```json
{
  "success": true,
  "message": "Machine type deleted successfully"
}
```

**Status Codes:**

- `200`: Deleted successfully
- `404`: Machine type not found
- `409`: Conflict (machine type is in use)
- `500`: Internal Server Error

## Error Response Format

All error responses follow this format:

```json
{
  "success": false,
  "message": "Error description",
  "errors": {
    "field": "Specific field error message"
  }
}
```

## Business Rules

1. **Machine Type Categories:** Only 'Washing' and 'Drying' are supported
2. **Name Uniqueness:** Machine type names must be unique (case-insensitive)
3. **Deletion Constraints:** Cannot delete machine types that are referenced by orders or other entities
4. **Input Validation:** All text inputs are trimmed and validated for length
5. **Search Functionality:** Search is case-insensitive and matches name, machine type, and description fields

## Usage Examples

### Create a new washing machine type

```bash
curl -X POST /api/v1/machine-types \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Heavy Duty Washer",
    "type": "Washing",
    "description": "Industrial washing machine for heavy loads"
  }'
```

### Search for drying machines

```bash
curl '/api/v1/machine-types?search=drying&page=1&limit=10'
```

### Update a machine type

```bash
curl -X PUT /api/v1/machine-types/507f1f77bcf86cd799439011 \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Updated Heavy Duty Washer",
    "type": "Washing",
    "description": "Updated description"
  }'
```
