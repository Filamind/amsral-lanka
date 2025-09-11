# Order Management API Documentation

## Overview

This document outlines the API endpoints required for the simplified order management system.

## Base URL

```
/api/v1
```

---

## 1. Create Order

### Endpoint

```
POST /orders
```

### Request Structure

```json
{
  "date": "2025-01-15",
  "customerId": "123",
  "quantity": 1000,
  "notes": "Special handling required",
  "deliveryDate": "2025-01-30",
  "records": []
}
```

### Response Structure

```json
{
  "success": true,
  "message": "Order created successfully",
  "data": {
    "id": 1,
    "date": "2025-01-15",
    "referenceNo": "ORD001",
    "customerId": "123",
    "customerName": "John Doe",
    "itemId": null,
    "itemName": null,
    "quantity": 1000,
    "notes": "Special handling required",
    "deliveryDate": "2025-01-30",
    "status": "Pending",
    "recordsCount": 0,
    "createdAt": "2025-01-15T10:30:00Z",
    "updatedAt": "2025-01-15T10:30:00Z",
    "records": []
  }
}
```

---

## 2. Get Order Details

### Endpoint

```
GET /orders/{orderId}
```

### Response Structure

```json
{
  "success": true,
  "data": {
    "id": 1,
    "date": "2025-01-15",
    "referenceNo": "ORD001",
    "customerId": "123",
    "customerName": "John Doe",
    "itemId": null,
    "itemName": null,
    "quantity": 1000,
    "notes": "Special handling required",
    "deliveryDate": "2025-01-30",
    "status": "Pending",
    "recordsCount": 2,
    "createdAt": "2025-01-15T10:30:00Z",
    "updatedAt": "2025-01-15T10:30:00Z",
    "records": [
      {
        "id": 1,
        "orderId": 1,
        "itemId": "ITEM001",
        "quantity": 500,
        "washType": "normal",
        "processTypes": ["viscose"],
        "trackingNumber": "1A",
        "createdAt": "2025-01-15T10:35:00Z",
        "updatedAt": "2025-01-15T10:35:00Z"
      },
      {
        "id": 2,
        "orderId": 1,
        "itemId": "ITEM001",
        "quantity": 500,
        "washType": "heavy",
        "processTypes": ["viscose", "rib"],
        "trackingNumber": "1B",
        "createdAt": "2025-01-15T10:40:00Z",
        "updatedAt": "2025-01-15T10:40:00Z"
      }
    ]
  }
}
```

---

## 3. Add Order Record

### Endpoint

```
POST /orders/{orderId}/records
```

### Request Structure

```json
{
  "itemId": "ITEM001",
  "quantity": 500,
  "washType": "normal",
  "processTypes": ["viscose", "rib"],
  "trackingNumber": "6A"
}
```

**Note:** The `trackingNumber` field is optional. If not provided, the backend will automatically generate the next available tracking number for the order in the format `<order_id><alphabetical_letter>` (e.g., 6A, 6B, 6C, etc.). It's recommended to let the backend handle tracking number generation to avoid conflicts.

### Response Structure

```json
{
  "success": true,
  "data": {
    "id": 3,
    "orderId": 1,
    "itemId": "ITEM001",
    "quantity": 500,
    "washType": "normal",
    "processTypes": ["viscose", "rib"],
    "trackingNumber": "6A",
    "createdAt": "2025-01-15T11:00:00Z",
    "updatedAt": "2025-01-15T11:00:00Z"
  }
}
```

---

## 4. Update Order Record

### Endpoint

```
PUT /orders/{orderId}/records/{recordId}
```

### Request Structure

```json
{
  "itemId": "ITEM002",
  "quantity": 750,
  "washType": "heavy",
  "processTypes": ["sand_blast", "chevron"],
  "trackingNumber": "6A"
}
```

**Note:** The `trackingNumber` field is optional. If provided, it will update the tracking number for the record. If not provided, the existing tracking number will be preserved.

### Response Structure

```json
{
  "success": true,
  "data": {
    "id": 3,
    "orderId": 1,
    "itemId": "ITEM002",
    "quantity": 750,
    "washType": "heavy",
    "processTypes": ["sand_blast", "chevron"],
    "trackingNumber": "6A",
    "createdAt": "2025-01-15T11:00:00Z",
    "updatedAt": "2025-01-15T11:15:00Z"
  }
}
```

---

## 5. Delete Order Record

### Endpoint

```
DELETE /orders/{orderId}/records/{recordId}
```

### Response Structure

```json
{
  "success": true,
  "message": "Record deleted successfully"
}
```

---

## 6. Get Orders List

### Endpoint

```
GET /orders?page=1&limit=10&search=ORD001
```

### Response Structure

```json
{
  "success": true,
  "data": {
    "orders": [
      {
        "id": 1,
        "date": "2025-01-15",
        "referenceNo": "ORD001",
        "customerId": "123",
        "customerName": "John Doe",
        "itemId": null,
        "itemName": null,
        "quantity": 1000,
        "notes": "Special handling required",
        "deliveryDate": "2025-01-30",
        "status": "Pending",
        "recordsCount": 2,
        "createdAt": "2025-01-15T10:30:00Z",
        "updatedAt": "2025-01-15T10:30:00Z",
        "records": []
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

---

## Error Response Structure

### Validation Error

```json
{
  "success": false,
  "message": "Validation failed",
  "errors": {
    "customerId": "Customer is required",
    "quantity": "Quantity must be greater than 0"
  }
}
```

### General Error

```json
{
  "success": false,
  "message": "Order not found"
}
```

---

## Data Types

### Order Status

- `"Pending"` - Order created but no records added
- `"In Progress"` - Order has some records but not complete
- `"Completed"` - All quantity assigned to records
- `"Confirmed"` - Order confirmed by customer
- `"Processing"` - Order in production
- `"Delivered"` - Order delivered

### Process Types

- `"viscose"`
- `"rib"`
- `"sand_blast"`
- `"chevron"`
- `"stone_wash"`
- `"enzyme_wash"`

### Wash Types

- `"normal"`
- `"heavy"`
- `"light"`
- `"silicon"`
- `"soft"`

---

## Validation Rules

### Order Creation

- `date`: Required, valid date format (YYYY-MM-DD)
- `customerId`: Required, must exist in customers table
- `quantity`: Required, must be greater than 0
- `deliveryDate`: Required, must be after order date
- `notes`: Optional, max 500 characters

### Record Creation/Update

- `itemId`: Required, must exist in items table
- `quantity`: Required, must be greater than 0
- `washType`: Required, must be valid wash type
- `processTypes`: Required, must be array with at least one valid process type
- Total records quantity cannot exceed order quantity

---

## Notes for Backend Developer

1. **Order Reference Generation**: Auto-generate reference numbers (e.g., ORD001, ORD002)
2. **Quantity Validation**: Ensure total records quantity never exceeds order quantity
3. **Status Updates**: Automatically update order status based on records completion
4. **Audit Trail**: Track all changes with timestamps
5. **Soft Delete**: Consider soft delete for orders and records
6. **Pagination**: Implement efficient pagination for orders list
7. **Search**: Support search by reference number, customer name, or item name
