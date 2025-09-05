# Items Management API - Request & Response Specifications

## Database Table Structure

### Items Table:

```sql
CREATE TABLE items (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    INDEX idx_name (name)
);
```

---

## API Endpoints

### 1. GET /api/items - Get All Items (with pagination and filtering)

**Request:**

```http
GET /api/items?page=1&limit=10&search=denim
```

**Query Parameters:**

- `page` (optional): Page number for pagination
- `limit` (optional): Number of records per page
- `search` (optional): Search term for item name or description

**Response:**

```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "ITEM001",
        "name": "Denim Jeans - Classic Blue",
        "description": "Classic blue denim jeans with standard fit",
        "createdAt": "2025-08-29T10:30:00.000Z",
        "updatedAt": "2025-08-29T10:30:00.000Z"
      },
      {
        "id": "ITEM002",
        "name": "Denim Jacket - Light Blue",
        "description": null,
        "createdAt": "2025-08-29T10:30:00.000Z",
        "updatedAt": "2025-08-29T10:30:00.000Z"
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

### 2. GET /api/items/list - Get Items List (for dropdowns/selects)

**Request:**

```http
GET /api/items/list
```

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "value": "ITEM001",
      "label": "Denim Jeans - Classic Blue"
    },
    {
      "value": "ITEM002",
      "label": "Denim Jacket - Light Blue"
    },
    {
      "value": "ITEM003",
      "label": "Denim Shorts - Distressed"
    }
  ]
}
```

---

### 3. GET /api/items/stats - Get Item Statistics

**Request:**

```http
GET /api/items/stats
```

**Response:**

```json
{
  "success": true,
  "data": {
    "totalItems": 25,
    "recentlyAdded": 5,
    "mostUsedItems": [
      {
        "id": "ITEM001",
        "name": "Denim Jeans - Classic Blue",
        "orderCount": 15
      },
      {
        "id": "ITEM003",
        "name": "Denim Shorts - Distressed",
        "orderCount": 12
      }
    ]
  }
}
```

---

### 4. GET /api/items/:id - Get Item by ID

**Request:**

```http
GET /api/items/ITEM001
```

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "ITEM001",
    "name": "Denim Jeans - Classic Blue",
    "description": "Classic blue denim jeans with standard fit",
    "createdAt": "2025-08-29T10:30:00.000Z",
    "updatedAt": "2025-08-29T10:30:00.000Z"
  }
}
```

---

### 5. POST /api/items - Create New Item

**Request:**

```json
{
  "name": "Denim Shorts - Distressed",
  "description": "Trendy distressed denim shorts for summer"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Item created successfully",
  "data": {
    "id": "ITEM009",
    "name": "Denim Shorts - Distressed",
    "description": "Trendy distressed denim shorts for summer",
    "createdAt": "2025-09-05T14:30:00.000Z",
    "updatedAt": "2025-09-05T14:30:00.000Z"
  }
}
```

---

### 6. PUT /api/items/:id - Update Existing Item

**Request:**

```json
{
  "name": "Denim Shorts - Premium Distressed",
  "description": "Premium quality distressed denim shorts for summer collection"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Item updated successfully",
  "data": {
    "id": "ITEM009",
    "name": "Denim Shorts - Premium Distressed",
    "description": "Premium quality distressed denim shorts for summer collection",
    "createdAt": "2025-09-05T14:30:00.000Z",
    "updatedAt": "2025-09-05T15:45:00.000Z"
  }
}
```

---

### 7. DELETE /api/items/:id - Delete Item

**Request:**

```http
DELETE /api/items/ITEM009
```

**Response:**

```json
{
  "success": true,
  "message": "Item deleted successfully"
}
```

---

## Route Structure Summary

```javascript
// GET /api/items - Get all items with pagination and filtering
router.get("/", ItemController.getItems);

// GET /api/items/list - Get items list for dropdowns/selects
router.get("/list", ItemController.getItemsList);

// GET /api/items/stats - Get item statistics
router.get("/stats", ItemController.getItemStats);

// GET /api/items/:id - Get item by ID
router.get("/:id", ItemController.getItemById);

// POST /api/items - Create new item
router.post("/", ItemController.createItem);

// PUT /api/items/:id - Update existing item
router.put("/:id", ItemController.updateItem);

// DELETE /api/items/:id - Delete item
router.delete("/:id", ItemController.deleteItem);
```

---

### 5. GET /api/items/:id - Get Single Item

**Request:**

```http
GET /api/items/ITEM001
```

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "ITEM001",
    "name": "Denim Jeans - Classic Blue",
    "description": "Classic blue denim jeans with standard fit",
    "createdAt": "2025-08-29T10:30:00.000Z",
    "updatedAt": "2025-08-29T10:30:00.000Z"
  }
}
```

---

## Field Specifications

### Items Table Fields:

- `id`: Auto-generated string (e.g., "ITEM001", "ITEM002")
- `name`: Item name (required, unique, max 255 characters)
- `description`: Item description (optional, text field)
- `createdAt`: Timestamp (auto-generated)
- `updatedAt`: Timestamp (auto-updated)

---

## Error Responses

**Validation Error:**

```json
{
  "success": false,
  "message": "Validation failed",
  "errors": {
    "name": "Item name is required",
    "name_unique": "Item name already exists"
  }
}
```

**Not Found Error:**

```json
{
  "success": false,
  "message": "Item not found"
}
```

**Delete Constraint Error:**

```json
{
  "success": false,
  "message": "Cannot delete item. It is being used in existing orders."
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

## Additional Implementation Notes:

1. **ID Generation**: Should be auto-generated using format "ITEM" + zero-padded sequential number (e.g., ITEM001, ITEM002, etc.)

2. **Unique Constraint**: Item names must be unique across all items (case-insensitive check recommended)

3. **Cascade Check**: Before deleting an item, check if it is referenced in any orders. If referenced, prevent deletion and return appropriate error message.

4. **Search Functionality**: Should support partial matching on both name and description fields (case-insensitive)

5. **Validation Rules**:

   - Name is required and cannot be empty or whitespace only
   - Name must be unique (case-insensitive)
   - Name maximum length: 255 characters
   - Description is optional
   - Description maximum length: 1000 characters (or TEXT field limit)

6. **Pagination**: Implement standard pagination with configurable page size (default: 10, max: 100)

7. **Indexing**: Create index on name field for better search performance

8. **Timestamps**: All timestamps should be in ISO 8601 format with timezone information

9. **Data Integrity**: Ensure proper foreign key constraints and referential integrity with orders table

10. **Security**: Implement proper input sanitization and SQL injection prevention
