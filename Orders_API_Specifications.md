# Orders Management API - Request & Response Specifications

## Database Structure

### Tables Required:

1. **orders** table

   - Primary key: `id` (auto-increment)
   - Other fields as specified below

2. **order_records** table
   - Primary key: `id` (auto-increment)
   - Foreign key: `order_id` (references orders.id)
   - Other fields as specified below

---

## API Endpoints

### 1. GET /api/orders - Get All Orders

**Request:**

```http
GET /api/orders?page=1&limit=10&search=ORD001
```

**Query Parameters:**

- `page` (optional): Page number for pagination
- `limit` (optional): Number of records per page
- `search` (optional): Search term for reference number, customer name, or item

**Response:**

```json
{
  "success": true,
  "data": {
    "orders": [
      {
        "id": 1,
        "date": "2025-08-29",
        "referenceNo": "ORD001",
        "customerId": "CUST001",
        "customerName": "John Doe",
        "itemId": "ITEM001",
        "itemName": "Denim Jeans - Classic Blue",
        "quantity": 1000,
        "notes": "Special handling required",
        "deliveryDate": "2025-09-05",
        "status": "Confirmed",
        "recordsCount": 2,
        "createdAt": "2025-08-29T10:30:00.000Z",
        "updatedAt": "2025-08-29T10:30:00.000Z",
        "records": [
          {
            "id": 1,
            "orderId": 1,
            "quantity": 500,
            "washType": "normal",
            "processTypes": ["viscose"],
            "createdAt": "2025-08-29T10:30:00.000Z",
            "updatedAt": "2025-08-29T10:30:00.000Z"
          },
          {
            "id": 2,
            "orderId": 1,
            "quantity": 500,
            "washType": "heavy",
            "processTypes": ["viscose", "rib"],
            "createdAt": "2025-08-29T10:30:00.000Z",
            "updatedAt": "2025-08-29T10:30:00.000Z"
          }
        ]
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

### 2. POST /api/orders - Create New Order

**Request:**

```json
{
  "date": "2025-08-29",
  "customerId": "CUST001",
  "itemId": "ITEM001",
  "quantity": 1000,
  "notes": "Special handling required",
  "deliveryDate": "2025-09-05",
  "records": [
    {
      "quantity": 500,
      "washType": "normal",
      "processTypes": ["viscose"]
    },
    {
      "quantity": 500,
      "washType": "heavy",
      "processTypes": ["viscose", "rib"]
    }
  ]
}
```

**Response:**

```json
{
  "success": true,
  "message": "Order created successfully",
  "data": {
    "id": 1,
    "date": "2025-08-29",
    "referenceNo": "ORD001",
    "customerId": "CUST001",
    "customerName": "John Doe",
    "itemId": "ITEM001",
    "itemName": "Denim Jeans - Classic Blue",
    "quantity": 1000,
    "notes": "Special handling required",
    "deliveryDate": "2025-09-05",
    "status": "Pending",
    "recordsCount": 2,
    "createdAt": "2025-08-29T10:30:00.000Z",
    "updatedAt": "2025-08-29T10:30:00.000Z",
    "records": [
      {
        "id": 1,
        "orderId": 1,
        "quantity": 500,
        "washType": "normal",
        "processTypes": ["viscose"],
        "createdAt": "2025-08-29T10:30:00.000Z",
        "updatedAt": "2025-08-29T10:30:00.000Z"
      },
      {
        "id": 2,
        "orderId": 1,
        "quantity": 500,
        "washType": "heavy",
        "processTypes": ["viscose", "rib"],
        "createdAt": "2025-08-29T10:30:00.000Z",
        "updatedAt": "2025-08-29T10:30:00.000Z"
      }
    ]
  }
}
```

---

### 3. PUT /api/orders/:id - Update Existing Order

**Request:**

```json
{
  "date": "2025-08-29",
  "customerId": "CUST001",
  "itemId": "ITEM001",
  "quantity": 1200,
  "notes": "Updated notes",
  "deliveryDate": "2025-09-08",
  "status": "Confirmed",
  "records": [
    {
      "id": 1,
      "quantity": 600,
      "washType": "normal",
      "processTypes": ["viscose"]
    },
    {
      "quantity": 600,
      "washType": "heavy",
      "processTypes": ["viscose", "rib", "tool"]
    }
  ]
}
```

**Note:** For records array:

- If `id` is provided: Update existing record
- If `id` is not provided: Create new record
- Records not included in the array should be deleted

**Response:**

```json
{
  "success": true,
  "message": "Order updated successfully",
  "data": {
    "id": 1,
    "date": "2025-08-29",
    "referenceNo": "ORD001",
    "customerId": "CUST001",
    "customerName": "John Doe",
    "itemId": "ITEM001",
    "itemName": "Denim Jeans - Classic Blue",
    "quantity": 1200,
    "notes": "Updated notes",
    "deliveryDate": "2025-09-08",
    "status": "Confirmed",
    "recordsCount": 2,
    "createdAt": "2025-08-29T10:30:00.000Z",
    "updatedAt": "2025-08-29T15:45:00.000Z",
    "records": [
      {
        "id": 1,
        "orderId": 1,
        "quantity": 600,
        "washType": "normal",
        "processTypes": ["viscose"],
        "createdAt": "2025-08-29T10:30:00.000Z",
        "updatedAt": "2025-08-29T15:45:00.000Z"
      },
      {
        "id": 3,
        "orderId": 1,
        "quantity": 600,
        "washType": "heavy",
        "processTypes": ["viscose", "rib", "tool"],
        "createdAt": "2025-08-29T15:45:00.000Z",
        "updatedAt": "2025-08-29T15:45:00.000Z"
      }
    ]
  }
}
```

---

### 4. DELETE /api/orders/:id - Delete Order

**Request:**

```http
DELETE /api/orders/1
```

**Response:**

```json
{
  "success": true,
  "message": "Order and all associated records deleted successfully"
}
```

---

### 5. GET /api/orders/:id - Get Single Order

**Request:**

```http
GET /api/orders/1
```

**Response:**

```json
{
  "success": true,
  "data": {
    "id": 1,
    "date": "2025-08-29",
    "referenceNo": "ORD001",
    "customerId": "CUST001",
    "customerName": "John Doe",
    "itemId": "ITEM001",
    "itemName": "Denim Jeans - Classic Blue",
    "quantity": 1000,
    "notes": "Special handling required",
    "deliveryDate": "2025-09-05",
    "status": "Confirmed",
    "recordsCount": 2,
    "createdAt": "2025-08-29T10:30:00.000Z",
    "updatedAt": "2025-08-29T10:30:00.000Z",
    "records": [
      {
        "id": 1,
        "orderId": 1,
        "quantity": 500,
        "washType": "normal",
        "processTypes": ["viscose"],
        "createdAt": "2025-08-29T10:30:00.000Z",
        "updatedAt": "2025-08-29T10:30:00.000Z"
      },
      {
        "id": 2,
        "orderId": 1,
        "quantity": 500,
        "washType": "heavy",
        "processTypes": ["viscose", "rib"],
        "createdAt": "2025-08-29T10:30:00.000Z",
        "updatedAt": "2025-08-29T10:30:00.000Z"
      }
    ]
  }
}
```

---

## Field Specifications

### Orders Table Fields:

- `id`: Auto-increment primary key
- `date`: Date (YYYY-MM-DD format)
- `referenceNo`: Auto-generated string (e.g., "ORD001")
- `customerId`: String (references customer ID)
- `itemId`: String (references item ID)
- `quantity`: Integer (total order quantity)
- `notes`: Text (optional)
- `deliveryDate`: Date (YYYY-MM-DD format)
- `status`: String (default: "Pending")
- `createdAt`: Timestamp
- `updatedAt`: Timestamp

### Order Records Table Fields:

- `id`: Auto-increment primary key
- `orderId`: Integer (foreign key to orders.id)
- `quantity`: Integer
- `washType`: String (enum from predefined wash types)
- `processTypes`: JSON array of strings
- `createdAt`: Timestamp
- `updatedAt`: Timestamp

---

## Predefined Values

### Wash Type Options:

```json
[
  { "value": "normal", "label": "Normal Wash (N/W)" },
  { "value": "heavy", "label": "Heavy Wash (Hy/W)" },
  { "value": "silicon", "label": "Silicon Wash (Sil/W)" },
  { "value": "heavy_silicon", "label": "Heavy Silicon Wash (Hy/Sil/W)" },
  { "value": "enzyme", "label": "Enzyme Wash (En/W)" },
  { "value": "heavy_enzyme", "label": "Heavy Enzyme Wash (Hy/En/W)" },
  { "value": "dark", "label": "Dark Wash (Dk/W)" },
  { "value": "mid", "label": "Mid Wash (Mid/W)" },
  { "value": "light", "label": "Light Wash (Lit/W)" },
  { "value": "sky", "label": "Sky Wash (Sky/W)" },
  { "value": "acid", "label": "Acid Wash (Acid/W)" },
  { "value": "tint", "label": "Tint Wash (Tint/W)" },
  { "value": "chemical", "label": "Chemical Wash (Chem/W)" }
]
```

### Process Type Options:

```json
[
  { "value": "reese", "label": "Reese" },
  { "value": "sand_blast", "label": "Sand Blast (S/B)" },
  { "value": "viscose", "label": "Viscose (V)" },
  { "value": "chevron", "label": "Chevron (Chev)" },
  { "value": "hand_sand", "label": "Hand Sand (H/S)" },
  { "value": "rib", "label": "Rib" },
  { "value": "tool", "label": "Tool" },
  { "value": "grind", "label": "Grind (Grnd)" }
]
```

---

## Error Responses

**Validation Error:**

```json
{
  "success": false,
  "message": "Validation failed",
  "errors": {
    "customerId": "Customer is required",
    "quantity": "Quantity must be greater than 0",
    "records": "Records total quantity cannot exceed order quantity"
  }
}
```

**Not Found Error:**

```json
{
  "success": false,
  "message": "Order not found"
}
```

**Server Error:**

```json
{
  "success": false,
  "message": "Internal server error"
}
```

---

## Additional Notes:

1. **Reference Number**: Should be auto-generated using format "ORD" + zero-padded sequential number (e.g., ORD001, ORD002, etc.)

2. **Customer & Item Names**: Should be fetched from respective tables using the provided IDs and included in the response

3. **Cascade Delete**: When an order is deleted, all associated records should also be deleted

4. **Validation Rules**:

   - Total quantity of all records should not exceed the order quantity
   - Each record must have a valid wash type
   - Record quantities must be greater than 0
   - All required fields must be provided

5. **Process Types**: Should be stored as JSON array to allow multiple selections per record

6. **Status Values**: Suggested values: "Pending", "Confirmed", "Processing", "Completed", "Cancelled"

7. **Database Relationships**:

   - One order can have multiple records (one-to-many)
   - Records are dependent on orders (cascade delete)
   - Record IDs are auto-increment within the order_records table

8. **Search Functionality**: Should support partial matching on reference number, customer name, and item name (case-insensitive)

9. **Pagination**: Implement standard pagination with configurable page size

10. **Timestamps**: All timestamps should be in ISO 8601 format with timezone information
