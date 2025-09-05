# Process Types API Specifications

## Overview

This document outlines the API endpoints for managing process types in the Amsral system. Process types represent different processing methods or techniques used in the laundry/washing workflow.

## Base URL

```
/api/v1/process-types
```

## Data Model

### ProcessType Object

```json
{
  "id": "string",
  "name": "string",
  "code": "string",
  "description": "string (optional)",
  "createdAt": "ISO 8601 date string",
  "updatedAt": "ISO 8601 date string"
}
```

## API Endpoints

### 1. Get Process Types (Paginated)

**Endpoint:** `GET /api/v1/process-types`

**Description:** Retrieve a paginated list of process types with optional search functionality.

**Query Parameters:**

- `page` (integer, optional): Page number (default: 1)
- `limit` (integer, optional): Number of items per page (default: 10, max: 100)
- `search` (string, optional): Search term to filter by name, code, or description

**Response Format:**

```json
{
  "success": true,
  "data": {
    "processTypes": [
      {
        "id": "507f1f77bcf86cd799439011",
        "name": "Reese",
        "code": "REE",
        "description": "Reese finishing process for fabric texture enhancement",
        "createdAt": "2024-01-15T10:30:00.000Z",
        "updatedAt": "2024-01-15T10:30:00.000Z"
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

**Status Codes:**

- `200`: Success
- `400`: Bad Request (invalid query parameters)
- `500`: Internal Server Error

### 2. Get Process Types List (No Pagination)

**Endpoint:** `GET /api/v1/process-types/list`

**Description:** Retrieve a simple list of all process types for dropdowns and selection components.

**Response Format:**

```json
{
  "success": true,
  "data": [
    {
      "id": "507f1f77bcf86cd799439011",
      "name": "Reese",
      "code": "REE"
    }
  ]
}
```

**Status Codes:**

- `200`: Success
- `500`: Internal Server Error

### 3. Get Process Type Statistics

**Endpoint:** `GET /api/v1/process-types/stats`

**Description:** Retrieve statistics about process types.

**Response Format:**

```json
{
  "success": true,
  "data": {
    "total": 15,
    "mostUsed": [
      {
        "id": "507f1f77bcf86cd799439011",
        "name": "Reese",
        "code": "REE",
        "usageCount": 245
      }
    ],
    "recentlyAdded": 2
  }
}
```

**Status Codes:**

- `200`: Success
- `500`: Internal Server Error

### 4. Get Process Type by Code

**Endpoint:** `GET /api/v1/process-types/code/:code`

**Description:** Retrieve a specific process type by its code (case-insensitive).

**Parameters:**

- `code` (string, required): Process type code

**Response Format:**

```json
{
  "success": true,
  "data": {
    "id": "507f1f77bcf86cd799439011",
    "name": "Reese",
    "code": "REE",
    "description": "Reese finishing process for fabric texture enhancement",
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

**Status Codes:**

- `200`: Success
- `404`: Process type not found
- `500`: Internal Server Error

### 5. Get Process Type by ID

**Endpoint:** `GET /api/v1/process-types/:id`

**Description:** Retrieve a specific process type by its ID.

**Parameters:**

- `id` (string, required): Process type ID

**Response Format:**

```json
{
  "success": true,
  "data": {
    "id": "507f1f77bcf86cd799439011",
    "name": "Reese",
    "code": "REE",
    "description": "Reese finishing process for fabric texture enhancement",
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

**Status Codes:**

- `200`: Success
- `404`: Process type not found
- `500`: Internal Server Error

### 6. Create Process Type

**Endpoint:** `POST /api/v1/process-types`

**Description:** Create a new process type.

**Request Body:**

```json
{
  "name": "Reese",
  "code": "REE",
  "description": "Reese finishing process for fabric texture enhancement"
}
```

**Validation Rules:**

- `name`: Required, 1-100 characters, must be unique (case-insensitive)
- `code`: Required, 1-20 characters, must be unique (case-insensitive), alphanumeric and special chars allowed
- `description`: Optional, max 500 characters

**Response Format:**

```json
{
  "success": true,
  "data": {
    "id": "507f1f77bcf86cd799439011",
    "name": "Reese",
    "code": "REE",
    "description": "Reese finishing process for fabric texture enhancement",
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

**Status Codes:**

- `201`: Created successfully
- `400`: Bad Request (validation errors)
- `409`: Conflict (name or code already exists)
- `500`: Internal Server Error

### 7. Update Process Type

**Endpoint:** `PUT /api/v1/process-types/:id`

**Description:** Update an existing process type.

**Parameters:**

- `id` (string, required): Process type ID

**Request Body:**

```json
{
  "name": "Reese Updated",
  "code": "REE",
  "description": "Updated description for Reese process"
}
```

**Validation Rules:** Same as create endpoint

**Response Format:**

```json
{
  "success": true,
  "data": {
    "id": "507f1f77bcf86cd799439011",
    "name": "Reese Updated",
    "code": "REE",
    "description": "Updated description for Reese process",
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-16T14:20:00.000Z"
  }
}
```

**Status Codes:**

- `200`: Updated successfully
- `400`: Bad Request (validation errors)
- `404`: Process type not found
- `409`: Conflict (name or code already exists)
- `500`: Internal Server Error

### 8. Delete Process Type

**Endpoint:** `DELETE /api/v1/process-types/:id`

**Description:** Delete a process type by ID.

**Parameters:**

- `id` (string, required): Process type ID

**Response Format:**

```json
{
  "success": true,
  "message": "Process type deleted successfully"
}
```

**Status Codes:**

- `200`: Deleted successfully
- `404`: Process type not found
- `409`: Conflict (process type is in use)
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

1. **Code Uniqueness:** Process type codes must be unique across the system (case-insensitive)
2. **Name Uniqueness:** Process type names must be unique (case-insensitive)
3. **Code Format:** Codes can contain letters, numbers, and common special characters (/, -, \_, etc.)
4. **Deletion Constraints:** Cannot delete process types that are referenced by orders or other entities
5. **Input Validation:** All text inputs are trimmed and validated for length
6. **Search Functionality:** Search is case-insensitive and matches name, code, and description fields
7. **Code Lookup:** Codes are commonly used in business operations, so lookup by code is optimized

## Common Process Types

Based on the existing data, common process types include:

- **REE** (Reese): Fabric texture enhancement
- **S/B** (Sand Blast): Distressed denim effects
- **V** (Viscose): Viscose treatment
- **CHEV** (Chevron): Chevron pattern processing
- **H/S** (Hand Sand): Manual sanding process
- **GRND** (Grind): Grinding for unique textures

## Usage Examples

### Create a new process type

```bash
curl -X POST /api/v1/process-types \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Steam Treatment",
    "code": "ST",
    "description": "High-temperature steam treatment for sanitization"
  }'
```

### Search for process types

```bash
curl '/api/v1/process-types?search=sand&page=1&limit=10'
```

### Get process type by code

```bash
curl '/api/v1/process-types/code/REE'
```

### Update a process type

```bash
curl -X PUT /api/v1/process-types/507f1f77bcf86cd799439011 \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Enhanced Reese Process",
    "code": "REE",
    "description": "Enhanced Reese process with improved texture results"
  }'
```

### Get process type statistics

```bash
curl '/api/v1/process-types/stats'
```
