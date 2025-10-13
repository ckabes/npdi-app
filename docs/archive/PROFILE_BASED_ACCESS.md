# Profile-Based Access Control System

## Overview

The application uses a simple profile-based access control system without JWT authentication, passwords, or tokens. Users select a profile, and that profile's role determines their privileges.

## How It Works

### 1. Profile Selection

Users select a profile at `/select-profile`:
- **Product Manager** - Role: `PRODUCT_MANAGER`, SBU: Life Science
- **PM Operations** - Role: `PM_OPS`, SBU: Process Solutions
- **Administrator** - Role: `ADMIN`, SBU: Electronics

The selected profile ID is stored in `localStorage` as `selectedProfile`.

### 2. API Requests

When making API requests, the frontend sends profile information as headers (not JWT tokens):

```javascript
headers: {
  'x-user-role': 'ADMIN',
  'x-user-firstname': 'Mike',
  'x-user-lastname': 'Wilson',
  'x-user-email': 'mike.wilson@milliporesigma.com',
  'x-user-sbu': 'Electronics'
}
```

### 3. Backend Authentication

The `authenticateProfile` middleware reads these headers and creates a user object:

```javascript
req.user = {
  role,
  firstName,
  lastName,
  email,
  sbu,
  isActive: true
};
```

**No database lookup required** - the user object is created directly from headers.

### 4. Role-Based Access

Routes use `requireAdmin` middleware to restrict access:

```javascript
router.use(authenticateProfile);
router.use(requireAdmin);  // Only ADMIN role can access
```

### 5. Privilege System

Each role has granular view/edit privileges for different sections:

**Product Manager:**
- ✅ View/Edit: Tickets, Drafts, SKU Variants, Chemical Properties, etc.
- ❌ View/Edit: Pricing Data, Admin Panel

**PM Operations:**
- ✅ View/Edit: Tickets, SKU Assignment, Pricing Data
- ✅ View Only: Drafts, Chemical Properties
- ❌ View/Edit: Admin Panel

**Administrator:**
- ✅ View/Edit: Everything including Admin Panel

These privileges are stored in MongoDB and can be edited via the Admin Dashboard > Permissions tab.

## Files Modified

### Frontend

**`client/src/services/api.js`**
- ✅ Reverted to use profile headers (not JWT tokens)
- ✅ Redirect to `/select-profile` on 401 errors

### Backend

**`server/middleware/auth.js`**
- ✅ Added `authenticateProfile` middleware (reads headers)
- ✅ Kept `authenticate` for JWT (if needed later)
- ✅ Updated privilege checking to use `getPrivilegesForRole`

**`server/routes/users.js`**
- ✅ Changed from `authenticate` → `authenticateProfile`

**`server/routes/permissions.js`**
- ✅ Changed from `authenticate` → `authenticateProfile`

**`server/routes/formConfig.js`**
- ✅ Changed from `authenticate` → `authenticateProfile`

**`server/routes/auth.js`**
- ✅ Changed from `authenticate` → `authenticateProfile`

## How to Use

### 1. Select a Profile

Navigate to `/select-profile` and choose a profile:
- Select "Administrator" to access all admin features
- Select "Product Manager" for limited access
- Select "PM Operations" for operations access

### 2. Access Admin Dashboard

With the Admin profile selected:
1. Navigate to `/admin`
2. Click on any tab (User Management, Permissions, etc.)
3. Should load without redirect

### 3. Manage Privileges

In Admin Dashboard > Permissions:
1. Select a role (Product Manager, PM Ops, Admin)
2. Toggle view/edit privileges for each section
3. Changes are saved to MongoDB and apply immediately

## Key Differences from JWT System

| Feature | Profile-Based | JWT-Based |
|---------|--------------|-----------|
| Authentication | Profile headers | JWT token |
| Login Required | No | Yes |
| Password | No | Yes |
| Database Lookup | No | Yes (User model) |
| Token Expiry | Never | Yes (24h) |
| Security | Low (dev only) | High (production) |

## Security Considerations

⚠️ **This system is for development only!**

- Headers can be spoofed (anyone can send admin headers)
- No password protection
- No token validation
- Not suitable for production

For production, use the JWT-based `authenticate` middleware instead of `authenticateProfile`.

## Troubleshooting

### Still getting redirected?

1. **Check profile selection:**
   ```javascript
   localStorage.getItem('selectedProfile')  // Should return profile ID
   ```

2. **Check headers in Network tab:**
   - Open DevTools > Network
   - Click on any API request
   - Check Request Headers for `x-user-role`, `x-user-email`, etc.

3. **Verify you're using Admin profile:**
   - Only Admin role can access admin routes
   - Make sure you selected "Administrator" profile

### 401 Unauthorized errors?

1. Clear localStorage and reselect profile:
   ```javascript
   localStorage.clear()
   // Navigate to /select-profile
   ```

2. Check backend logs for auth errors

3. Ensure middleware is using `authenticateProfile` (not `authenticate`)

## Adding New Routes

When adding new protected routes:

```javascript
const { authenticateProfile, requireAdmin } = require('../middleware/auth');

// For admin-only routes
router.get('/admin-route', authenticateProfile, requireAdmin, handler);

// For any authenticated profile
router.get('/protected-route', authenticateProfile, handler);

// For public routes (no auth)
router.get('/public-route', handler);
```

## Managing Privileges

### View Current Privileges

```bash
# In MongoDB shell
db.permissions.find().pretty()
```

### Initialize Default Privileges

```bash
node initialize-permissions.js
```

### Update Privileges via API

```bash
# Update specific privilege
curl -X PATCH http://localhost:5000/api/permissions/PRODUCT_MANAGER/tickets/edit \
  -H "x-user-role: ADMIN" \
  -H "x-user-email: admin@example.com" \
  -H "Content-Type: application/json" \
  -d '{"value": true}'
```

## Summary

- ✅ No JWT tokens, passwords, or authentication required
- ✅ Simple profile selection with role-based access
- ✅ Privileges stored in MongoDB and editable via Admin UI
- ✅ Profile headers sent with every request
- ✅ Backend creates user object from headers
- ✅ Admin routes protected by `requireAdmin` middleware
- ✅ Redirects to `/select-profile` on 401 errors

The system is now working as a profile-based access control system without true authentication!
