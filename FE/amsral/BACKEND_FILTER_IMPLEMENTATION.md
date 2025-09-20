# Backend Filter Implementation for Orders

## Overview

The frontend has been updated to support filtering out delivered orders from the Orders table. This requires a corresponding backend implementation to handle the `excludeDelivered` parameter.

## Frontend Changes Made

### 1. Updated OrderService (`src/services/orderService.ts`)

Added a new parameter to the `getOrders` function:

```typescript
async getOrders(params?: {
  page?: number;
  limit?: number;
  search?: string;
  customerName?: string;
  orderId?: string;
  billingStatus?: string;
  excludeDelivered?: boolean; // New parameter to exclude delivered orders
}): Promise<OrdersResponse>
```

The parameter is sent to the backend as a query parameter:

```typescript
if (params?.excludeDelivered) queryParams.append("excludeDelivered", "true");
```

### 2. Updated OrdersPage (`src/pages/OrdersPage.tsx`)

Modified the `fetchOrders` function to exclude delivered orders:

```typescript
const response = await orderService.getOrders({
  page: currentPage,
  limit: pageSize,
  search: search || undefined,
  excludeDelivered: true, // Exclude delivered orders from the orders table
});
```

## Backend Implementation Required

### API Endpoint: `GET /api/orders`

The backend needs to handle the `excludeDelivered` query parameter.

#### Query Parameters

| Parameter          | Type    | Description                                     | Example                 |
| ------------------ | ------- | ----------------------------------------------- | ----------------------- |
| `excludeDelivered` | boolean | If true, exclude orders with status 'Delivered' | `excludeDelivered=true` |

#### Implementation Example

```javascript
// Express.js example
app.get("/api/orders", async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search,
      customerName,
      orderId,
      billingStatus,
      excludeDelivered = false, // Default to false
    } = req.query;

    // Build the query
    let query = {};

    // Add search conditions
    if (search) {
      query.$or = [
        { referenceNo: { $regex: search, $options: "i" } },
        { customerName: { $regex: search, $options: "i" } },
      ];
    }

    if (customerName) {
      query.customerName = { $regex: customerName, $options: "i" };
    }

    if (orderId) {
      query.id = parseInt(orderId);
    }

    if (billingStatus) {
      query.billingStatus = billingStatus;
    }

    // Exclude delivered orders if requested
    if (excludeDelivered === "true") {
      query.status = { $ne: "Delivered" };
    }

    // Execute query with pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const orders = await Order.find(query)
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    const totalRecords = await Order.countDocuments(query);
    const totalPages = Math.ceil(totalRecords / parseInt(limit));

    res.json({
      success: true,
      data: {
        orders,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalRecords,
          limit: parseInt(limit),
        },
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch orders",
    });
  }
});
```

#### SQL Implementation Example

```sql
-- For SQL databases
SELECT * FROM orders
WHERE 1=1
  AND (@excludeDelivered = 0 OR status != 'Delivered')
  AND (@search IS NULL OR reference_no LIKE '%' + @search + '%' OR customer_name LIKE '%' + @search + '%')
  AND (@customerName IS NULL OR customer_name LIKE '%' + @customerName + '%')
  AND (@orderId IS NULL OR id = @orderId)
  AND (@billingStatus IS NULL OR billing_status = @billingStatus)
ORDER BY created_at DESC
OFFSET @offset ROWS
FETCH NEXT @limit ROWS ONLY;
```

## Benefits

1. **Performance**: Reduces data transfer by filtering at the database level
2. **User Experience**: Orders table shows only relevant orders (non-delivered)
3. **Scalability**: Backend filtering is more efficient than frontend filtering
4. **Consistency**: Management table shows all orders, Orders table shows active orders

## Testing

### Test Cases

1. **Without excludeDelivered parameter**: Should return all orders
2. **With excludeDelivered=true**: Should exclude orders with status 'Delivered'
3. **With excludeDelivered=false**: Should return all orders (same as case 1)
4. **Combined with other filters**: Should work with search, pagination, etc.

### Example API Calls

```bash
# Get all orders
GET /api/orders?page=1&limit=10

# Get orders excluding delivered ones
GET /api/orders?page=1&limit=10&excludeDelivered=true

# Search with delivered exclusion
GET /api/orders?page=1&limit=10&search=ORD001&excludeDelivered=true
```

## Status Values

The backend should recognize these status values as "delivered":

- `'Delivered'` (exact match)
- `'delivered'` (case insensitive)
- Any other variations your system uses

## Notes

- The `excludeDelivered` parameter is optional and defaults to `false`
- This filter only affects the Orders table, not the Management table
- The Management table continues to show all orders including delivered ones
- Consider adding this filter to other endpoints that might benefit from it
