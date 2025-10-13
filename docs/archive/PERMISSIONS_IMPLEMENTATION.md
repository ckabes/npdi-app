# Permissions System Implementation

## Overview

This document describes the implementation of the role-based permissions system for the NPDI application. The system allows administrators to configure granular permissions for different user roles through the Admin Dashboard.

## Features

- Editable permissions through the Admin Dashboard UI
- Real-time permission updates with optimistic UI updates
- Granular control over CRUD operations for different sections
- Persistent storage in MongoDB
- Middleware for enforcing permissions at the API level
- Default permissions for all three roles (PRODUCT_MANAGER, PM_OPS, ADMIN)

## Architecture

### Backend Components

#### 1. Permission Model (`server/models/Permission.js`)

Defines the permission schema in MongoDB with the following structure:

```javascript
{
  role: String,  // PRODUCT_MANAGER, PM_OPS, ADMIN
  permissions: {
    tickets: { create, read, update, delete, viewAll },
    drafts: { create, read, update, delete, submit },
    skuVariants: { create, read, update, delete },
    skuAssignment: { create, read, update, delete, assignBaseNumbers },
    chemicalProperties: { create, read, update, delete },
    hazardClassification: { create, read, update, delete },
    corpbaseData: { create, read, update, delete },
    pricingData: { create, read, update, delete },
    comments: { create, read, update, delete },
    statusHistory: { read, create, update, delete },
    admin: { access, userManagement, systemSettings, formConfiguration }
  }
}
```

#### 2. Permission Routes (`server/routes/permissions.js`)

API endpoints for managing permissions:

- `GET /api/permissions` - Get all role permissions (Admin only)
- `GET /api/permissions/:role` - Get permissions for a specific role
- `PUT /api/permissions/:role` - Update all permissions for a role (Admin only)
- `PATCH /api/permissions/:role/:section/:action` - Update a single permission (Admin only)
- `POST /api/permissions/initialize` - Initialize default permissions (Admin only)
- `GET /api/permissions/user/me` - Get current user's permissions

#### 3. Auth Middleware (`server/middleware/auth.js`)

Enhanced with permission checking functions:

- `checkPermission(section, action)` - Middleware to verify user has specific permission
- `attachPermissions(req, res, next)` - Attach permissions to request object
- `hasPermission(permissions, section, action)` - Helper function for controllers

Example usage:
```javascript
router.post('/products',
  authenticate,
  checkPermission('tickets', 'create'),
  createProduct
);
```

### Frontend Components

#### 1. Permission API (`client/src/services/api.js`)

Client-side API functions:

```javascript
permissionAPI.getAll()
permissionAPI.getByRole(role)
permissionAPI.updateRole(role, permissions)
permissionAPI.updatePermission(role, section, action, value)
permissionAPI.initialize()
permissionAPI.getUserPermissions()
```

#### 2. Permissions Management Component (`client/src/components/admin/PermissionsManagement.jsx`)

Enhanced UI features:

- Fetches permissions from backend on load
- Displays permissions in a matrix format
- Toggle permissions with real-time updates
- Optimistic UI updates with rollback on error
- Save all permissions button for batch updates
- Loading states and error handling

## Setup Instructions

### 1. Initialize Default Permissions

Run the initialization script to populate the database with default permissions:

```bash
node initialize-permissions.js
```

This will create default permission sets for all three roles.

### 2. Access the Admin Dashboard

1. Start the application with `npm start`
2. Log in as an ADMIN user
3. Navigate to Admin Dashboard > Permissions tab
4. Select a role to configure
5. Toggle permissions as needed
6. Click "Save All Permissions" to persist changes

## Default Permissions

### Product Manager
- Can create, read, and update their own tickets
- Can manage drafts (create, read, update, delete, submit)
- Can manage SKU variants and chemical properties
- Cannot see pricing data
- Cannot delete tickets
- Cannot access admin functions

### PMOps
- Can view all tickets (including from other users)
- Can manage SKU assignments and assign base numbers
- Can view but not edit chemical properties
- Full access to pricing data
- Cannot create or edit drafts
- Cannot access admin functions

### Administrator
- Full access to all functions
- Can manage users and permissions
- Can configure system settings
- Can modify form configurations

## Usage Examples

### Example 1: Protecting a Route

```javascript
const { authenticate, checkPermission } = require('../middleware/auth');

// Only users with 'create' permission for 'tickets' can access
router.post('/tickets',
  authenticate,
  checkPermission('tickets', 'create'),
  createTicket
);
```

### Example 2: Checking Permissions in a Controller

```javascript
const { hasPermission } = require('../middleware/auth');

const getTickets = async (req, res) => {
  const query = {};

  // Check if user can view all tickets
  if (!hasPermission(req.permissions, 'tickets', 'viewAll')) {
    // Limit to user's own tickets
    query.createdBy = req.user._id;
  }

  const tickets = await Ticket.find(query);
  res.json(tickets);
};
```

### Example 3: Updating Permissions from Frontend

```javascript
// Update a single permission
await permissionAPI.updatePermission(
  'PRODUCT_MANAGER',
  'tickets',
  'delete',
  true
);

// Update all permissions for a role
await permissionAPI.updateRole('PM_OPS', {
  tickets: { create: true, read: true, update: true, delete: false, viewAll: true },
  // ... other sections
});
```

## Testing

To test the permission system:

1. Create test users with different roles
2. Log in as each role
3. Try to perform actions that should be restricted
4. Verify appropriate error messages are shown
5. Modify permissions in Admin Dashboard
6. Verify changes take effect immediately

## Future Enhancements

Potential improvements to consider:

1. Permission Templates - Create reusable permission sets
2. Permission History - Track changes to permissions over time
3. User-Specific Overrides - Allow custom permissions per user
4. Permission Groups - Create groups of permissions for easier management
5. API Key Permissions - Extend permissions to API keys
6. Audit Logging - Log all permission changes

## Troubleshooting

### Permissions not loading
- Ensure MongoDB is running
- Run the initialization script: `node initialize-permissions.js`
- Check server logs for errors

### Permission changes not taking effect
- Clear browser cache
- Log out and log back in
- Verify changes were saved in database

### 403 Forbidden errors
- Verify user has correct role
- Check permissions in Admin Dashboard
- Ensure permission middleware is applied to routes

## API Documentation

### GET /api/permissions
Get all role permissions. Admin only.

**Response:**
```json
[
  {
    "_id": "...",
    "role": "PRODUCT_MANAGER",
    "permissions": { ... },
    "createdAt": "...",
    "updatedAt": "..."
  }
]
```

### PATCH /api/permissions/:role/:section/:action
Update a specific permission. Admin only.

**Parameters:**
- `role`: PRODUCT_MANAGER | PM_OPS | ADMIN
- `section`: tickets | drafts | skuVariants | etc.
- `action`: create | read | update | delete | etc.

**Request Body:**
```json
{
  "value": true
}
```

**Response:**
```json
{
  "message": "Permission updated successfully",
  "permissions": { ... }
}
```

## Notes

- Admin role always bypasses permission checks
- Permissions are cached per request but fetched fresh on each API call
- Frontend uses optimistic updates for better UX
- All permission changes are logged to console for debugging
