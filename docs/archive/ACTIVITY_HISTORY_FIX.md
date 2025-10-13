# Activity History User Fix

**Date:** 2025-10-12
**Issue:** Wrong user name appearing in Activity History when PMOps or other users edit tickets or change status

## Problem

The activity history was showing incorrect user names because:
1. Frontend wasn't sending current user information to the backend
2. Backend was using hardcoded user mappings based only on role
3. Result: All PMOps actions showed "Sarah Johnson", all Product Manager actions showed "John Doe", regardless of who actually made the change

## Solution

### Frontend Changes (`client/src/services/api.js`)

Updated the API client interceptor to send current user information as headers:

```javascript
apiClient.interceptors.request.use((config) => {
  const savedProfile = localStorage.getItem('selectedProfile');

  if (savedProfile) {
    const profile = profiles.find(p => p.id === savedProfile);

    if (profile) {
      config.headers['x-user-role'] = profile.role;
      config.headers['x-user-firstname'] = profile.firstName;
      config.headers['x-user-lastname'] = profile.lastName;
      config.headers['x-user-email'] = profile.email;
    }
  }

  return config;
});
```

**Headers sent to backend:**
- `x-user-role`: User's role (e.g., 'PM_OPS', 'PRODUCT_MANAGER', 'ADMIN')
- `x-user-firstname`: User's first name (e.g., 'Sarah', 'John', 'Mike')
- `x-user-lastname`: User's last name (e.g., 'Johnson', 'Smith', 'Wilson')
- `x-user-email`: User's email address

### Backend Changes (`server/controllers/productController.js`)

Updated `getCurrentUser` function to read from headers instead of using hardcoded mappings:

```javascript
const getCurrentUser = (req) => {
  const firstName = req.headers['x-user-firstname'] || 'Unknown';
  const lastName = req.headers['x-user-lastname'] || 'User';
  const email = req.headers['x-user-email'] || '';
  const userRole = req.headers['x-user-role'] || 'PRODUCT_MANAGER';

  const roleDisplayMap = {
    'PRODUCT_MANAGER': 'Product Manager',
    'PM_OPS': 'PMOps',
    'ADMIN': 'Administrator'
  };

  return {
    firstName,
    lastName,
    email,
    role: roleDisplayMap[userRole] || userRole
  };
};
```

## Result

Activity history now correctly shows:
- **Sarah Johnson** when PMOps user makes changes
- **John Smith** when Product Manager makes changes
- **Mike Wilson** when Admin makes changes

All status changes, edits, comments, and SKU assignments now display the correct user who performed the action.

## Testing

To verify the fix:
1. Select "PM Operations" profile
2. Edit a ticket or change its status
3. Check Activity History - should show "Sarah Johnson"
4. Switch to "Product Manager" profile
5. Edit a ticket or change its status
6. Check Activity History - should show "John Smith"

## Technical Notes

- User information flows: AuthContext → localStorage → API interceptor → HTTP headers → Backend getCurrentUser
- All activity history entries use the `getCurrentUser` function
- The fix applies to:
  - Status changes (updateTicketStatus)
  - Ticket edits (updateTicket)
  - Comments (addComment)
  - Ticket creation (createTicket, saveDraft)

## Future Improvements

When real authentication is implemented:
1. Replace localStorage profile selection with JWT tokens
2. Add authentication middleware to verify tokens
3. Extract user info from validated JWT instead of headers
4. Populate `createdBy` field with actual User ObjectId references
