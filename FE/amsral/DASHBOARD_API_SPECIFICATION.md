# Dashboard API Specification

## 1. Orders Trend API

**Endpoint:** `GET /api/dashboard/orders-trend`

**Query Parameters:**

- `startDate` (string, required): Start date in YYYY-MM-DD format
- `endDate` (string, required): End date in YYYY-MM-DD format
- `period` (string, optional): 'week', 'month', 'quarter' (default: 'month')

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "date": "2025-01-01",
      "orders": 5,
      "revenue": 2500
    },
    {
      "date": "2025-01-02",
      "orders": 3,
      "revenue": 1800
    }
  ]
}
```

## 2. Orders Count API

**Endpoint:** `GET /api/dashboard/orders-count`

**Query Parameters:**

- `startDate` (string, required): Start date in YYYY-MM-DD format
- `endDate` (string, required): End date in YYYY-MM-DD format
- `period` (string, optional): 'week', 'month', 'quarter' (default: 'month')

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "date": "2025-01-01",
      "orders": 5
    },
    {
      "date": "2025-01-02",
      "orders": 3
    }
  ]
}
```

## 3. Order Status Distribution API

**Endpoint:** `GET /api/dashboard/order-status-distribution`

**Query Parameters:**

- `startDate` (string, required): Start date in YYYY-MM-DD format
- `endDate` (string, required): End date in YYYY-MM-DD format

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "status": "Complete",
      "count": 15,
      "percentage": 60
    },
    {
      "status": "Pending",
      "count": 8,
      "percentage": 32
    },
    {
      "status": "In Progress",
      "count": 2,
      "percentage": 8
    }
  ]
}
```

## 4. Recent Orders API

**Endpoint:** `GET /api/dashboard/recent-orders`

**Query Parameters:**

- `limit` (number, optional): Number of orders to return (default: 10)

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "referenceNo": "ORD001",
      "customerName": "Customer 1",
      "status": "Complete",
      "quantity": 10,
      "totalAmount": 1500,
      "orderDate": "2025-01-01T10:00:00Z"
    },
    {
      "id": 2,
      "referenceNo": "ORD002",
      "customerName": "Customer 2",
      "status": "Pending",
      "quantity": 5,
      "totalAmount": 750,
      "orderDate": "2025-01-02T14:30:00Z"
    }
  ]
}
```

## 5. Quick Stats API

**Endpoint:** `GET /api/dashboard/quick-stats`

**Query Parameters:**

- `startDate` (string, required): Start date in YYYY-MM-DD format
- `endDate` (string, required): End date in YYYY-MM-DD format

**Response:**

```json
{
  "success": true,
  "data": {
    "totalOrders": 50,
    "completedOrders": 30,
    "pendingOrders": 15,
    "inProgressOrders": 5,
    "totalRevenue": 75000,
    "averageOrderValue": 1500
  }
}
```

## Notes

- All dates should be in ISO 8601 format (YYYY-MM-DD)
- All monetary values should be in the base currency unit
- Order status values should match: "Complete", "Pending", "In Progress"
- All APIs should return HTTP 200 on success
- Error responses should follow the standard error format with appropriate HTTP status codes
