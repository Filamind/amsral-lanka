# Production Flow Management API Documentation

## Overview

This document outlines the API endpoints required for the Production Flow Management system, including production records and machine assignments.

## Base URL

```
/api
```

---

## 1. Get All Production Records

### Endpoint

```
GET /orders/records
```

### Query Parameters

- `page` (optional): Page number for pagination (default: 1)
- `limit` (optional): Number of records per page (default: 10)
- `search` (optional): Search term for filtering records

### Request Example

```
GET /api/orders/records?page=1&limit=100&search=ORD002
```

### Response Structure

```json
{
  "success": true,
  "data": {
    "records": [
      {
        "id": 1,
        "orderId": 3,
        "itemId": "ITEM001",
        "quantity": 5,
        "washType": "Tint/W",
        "processTypes": ["Chev", "Grind", "H/S"],
        "orderRef": "ORD002",
        "customerName": "Customer 1",
        "itemName": "Sample Item",
        "createdAt": "2025-01-15T10:30:00.000Z",
        "updatedAt": "2025-01-15T10:30:00.000Z"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 1,
      "totalRecords": 2,
      "limit": 100
    }
  }
}
```

---

## 2. Get Single Record Details

### Endpoint

```
GET /records/{recordId}
```

### Path Parameters

- `recordId`: The ID of the record

### Request Example

```
GET /api/records/1
```

### Response Structure

```json
{
  "success": true,
  "data": {
    "id": 1,
    "orderId": 3,
    "itemId": "ITEM001",
    "quantity": 5,
    "washType": "Tint/W",
    "processTypes": ["Chev", "Grind", "H/S"],
    "orderRef": "ORD002",
    "customerName": "Customer 1",
    "itemName": "Sample Item",
    "remainingQuantity": 3,
    "status": "pending",
    "createdAt": "2025-01-15T10:30:00.000Z",
    "updatedAt": "2025-01-15T10:30:00.000Z"
  }
}
```

---

## 3. Get Machine Assignments for Record

### Endpoint

```
GET /records/{recordId}/assignments
```

### Path Parameters

- `recordId`: The ID of the record

### Query Parameters

- `page` (optional): Page number for pagination (default: 1)
- `limit` (optional): Number of assignments per page (default: 10)

### Request Example

```
GET /api/records/1/assignments?page=1&limit=10
```

### Response Structure

```json
{
  "success": true,
  "data": {
    "assignments": [
      {
        "id": 1,
        "recordId": 1,
        "orderId": 3,
        "orderRef": "ORD002",
        "customerName": "Customer 1",
        "item": "Sample Item",
        "assignedBy": "John Smith",
        "assignedById": "EMP001",
        "quantity": 2,
        "washingMachine": "W1",
        "dryingMachine": "D1",
        "assignedAt": "2025-01-15T10:30:00.000Z",
        "status": "In Progress",
        "createdAt": "2025-01-15T10:30:00.000Z",
        "updatedAt": "2025-01-15T10:30:00.000Z"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 1,
      "totalRecords": 1,
      "limit": 10
    }
  }
}
```

---

## 4. Create Machine Assignment

### Endpoint

```
POST /records/{recordId}/assignments
```

### Path Parameters

- `recordId`: The ID of the record

### Request Structure

```json
{
  "assignedById": "EMP001",
  "quantity": 2,
  "washingMachine": "W1",
  "dryingMachine": "D1",
  "orderId": 3,
  "itemId": "ITEM001",
  "recordId": "1"
}
```

### Request Example

```
POST /api/records/1/assignments
Content-Type: application/json

{
  "assignedById": "EMP001",
  "quantity": 2,
  "washingMachine": "W1",
  "dryingMachine": "D1",
  "orderId": 3,
  "itemId": "ITEM001",
  "recordId": "1"
}
```

### Response Structure

```json
{
  "success": true,
  "message": "Assignment created successfully",
  "data": {
    "id": 2,
    "recordId": 1,
    "orderId": 3,
    "orderRef": "ORD002",
    "customerName": "Customer 1",
    "item": "Sample Item",
    "assignedBy": "John Smith",
    "assignedById": "EMP001",
    "quantity": 2,
    "washingMachine": "W1",
    "dryingMachine": "D1",
    "assignedAt": "2025-01-15T11:00:00.000Z",
    "status": "In Progress",
    "createdAt": "2025-01-15T11:00:00.000Z",
    "updatedAt": "2025-01-15T11:00:00.000Z"
  }
}
```

---

## 5. Update Machine Assignment

### Endpoint

```
PUT /records/{recordId}/assignments/{assignmentId}
```

### Path Parameters

- `recordId`: The ID of the record
- `assignmentId`: The ID of the assignment

### Request Structure

```json
{
  "assignedById": "EMP002",
  "quantity": 3,
  "washingMachine": "W2",
  "dryingMachine": "D2",
  "status": "Completed"
}
```

### Request Example

```
PUT /api/records/1/assignments/2
Content-Type: application/json

{
  "assignedById": "EMP002",
  "quantity": 3,
  "washingMachine": "W2",
  "dryingMachine": "D2",
  "status": "Completed"
}
```

### Response Structure

```json
{
  "success": true,
  "message": "Assignment updated successfully",
  "data": {
    "id": 2,
    "recordId": 1,
    "orderId": 3,
    "orderRef": "ORD002",
    "customerName": "Customer 1",
    "item": "Sample Item",
    "assignedBy": "Sarah Johnson",
    "assignedById": "EMP002",
    "quantity": 3,
    "washingMachine": "W2",
    "dryingMachine": "D2",
    "assignedAt": "2025-01-15T11:00:00.000Z",
    "status": "Completed",
    "createdAt": "2025-01-15T11:00:00.000Z",
    "updatedAt": "2025-01-15T11:15:00.000Z"
  }
}
```

---

## 6. Delete Machine Assignment

### Endpoint

```
DELETE /records/{recordId}/assignments/{assignmentId}
```

### Path Parameters

- `recordId`: The ID of the record
- `assignmentId`: The ID of the assignment

### Request Example

```
DELETE /api/records/1/assignments/2
```

### Response Structure

```json
{
  "success": true,
  "message": "Assignment deleted successfully"
}
```

---

## 7. Get Available Machines

### Endpoint

```
GET /machines
```

### Query Parameters

- `type` (optional): Filter by machine type ("washing" or "drying")

### Request Example

```
GET /api/machines?type=washing
```

### Response Structure

```json
{
  "success": true,
  "data": {
    "machines": [
      {
        "id": "W1",
        "name": "Washing Machine W1",
        "type": "washing",
        "status": "available",
        "capacity": 100
      },
      {
        "id": "W2",
        "name": "Washing Machine W2",
        "type": "washing",
        "status": "in_use",
        "capacity": 100
      }
    ]
  }
}
```

---

## 8. Get Machine Assignment Statistics

### Endpoint

```
GET /records/{recordId}/assignments/stats
```

### Path Parameters

- `recordId`: The ID of the record

### Request Example

```
GET /api/records/1/assignments/stats
```

### Response Structure

```json
{
  "success": true,
  "data": {
    "totalQuantity": 5,
    "assignedQuantity": 3,
    "remainingQuantity": 2,
    "totalAssignments": 2,
    "completedAssignments": 1,
    "inProgressAssignments": 1,
    "completionPercentage": 60
  }
}
```

---

## Error Responses

### Common Error Structure

```json
{
  "success": false,
  "message": "Error description",
  "errors": {
    "field": "Field-specific error message"
  }
}
```

### Common Error Codes

- `400 Bad Request`: Invalid request data
- `404 Not Found`: Record or assignment not found
- `409 Conflict`: Quantity exceeds remaining amount
- `422 Unprocessable Entity`: Validation errors
- `500 Internal Server Error`: Server error

### Example Error Response

```json
{
  "success": false,
  "message": "Validation failed",
  "errors": {
    "quantity": "Quantity cannot exceed remaining quantity (2)",
    "washingMachine": "Washing machine is required"
  }
}
```

---

## Data Types

### Record Status

- `pending`: Record is pending assignment
- `in_progress`: Record has active assignments
- `completed`: All quantity has been assigned

### Assignment Status

- `In Progress`: Assignment is currently being processed
- `Completed`: Assignment has been completed
- `Cancelled`: Assignment was cancelled

### Machine Types

- `washing`: Washing machines (W1, W2, W3, etc.)
- `drying`: Drying machines (D1, D2, D3, etc.)

---

## Testing Examples

### Test Data Setup

```json
// Sample Record
{
  "id": 1,
  "orderId": 3,
  "itemId": "ITEM001",
  "quantity": 5,
  "washType": "Tint/W",
  "processTypes": ["Chev", "Grind", "H/S"],
  "orderRef": "ORD002",
  "customerName": "Customer 1",
  "itemName": "Sample Item",
  "remainingQuantity": 5,
  "status": "pending"
}

// Sample Assignment
{
  "id": 1,
  "recordId": 1,
  "orderId": 3,
  "orderRef": "ORD002",
  "customerName": "Customer 1",
  "item": "Sample Item",
  "assignedBy": "John Smith",
  "assignedById": "EMP001",
  "quantity": 2,
  "washingMachine": "W1",
  "dryingMachine": "D1",
  "assignedAt": "2025-01-15T10:30:00.000Z",
  "status": "In Progress"
}
```

### Test Scenarios

1. **Get all production records**

   ```
   GET /api/orders/records?limit=100
   ```

2. **Get record details**

   ```
   GET /api/records/1
   ```

3. **Get assignments for record**

   ```
   GET /api/records/1/assignments
   ```

4. **Create new assignment**

   ```
   POST /api/records/1/assignments
   {
     "assignedById": "EMP001",
     "quantity": 2,
     "washingMachine": "W1",
     "dryingMachine": "D1"
   }
   ```

5. **Update assignment status**

   ```
   PUT /api/records/1/assignments/1
   {
     "status": "Completed"
   }
   ```

6. **Delete assignment**

   ```
   DELETE /api/records/1/assignments/1
   ```

7. **Get assignment statistics**
   ```
   GET /api/records/1/assignments/stats
   ```

---

## Frontend Integration Notes

### Required API Calls for RecordAssignmentsPage

1. `GET /records/{recordId}` - Get record details
2. `GET /records/{recordId}/assignments` - Get assignments
3. `POST /records/{recordId}/assignments` - Create assignment
4. `PUT /records/{recordId}/assignments/{assignmentId}` - Update assignment
5. `DELETE /records/{recordId}/assignments/{assignmentId}` - Delete assignment
6. `GET /employees` - Get employee list (existing)
7. `GET /machines` - Get available machines

### State Management

- Record details should be fetched on page load
- Assignments should be refreshed after create/update/delete operations
- Remaining quantity should be calculated from total - assigned quantities
- Status should be updated based on remaining quantity (0 = completed)

### Error Handling

- Handle validation errors for assignment creation
- Handle quantity conflicts (exceeding remaining quantity)
- Handle machine availability conflicts
- Provide user-friendly error messages
