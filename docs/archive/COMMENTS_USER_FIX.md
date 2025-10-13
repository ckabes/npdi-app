# Comments User Name Fix

**Date:** 2025-10-12
**Issue:** Comments were not showing the user name who added them

---

## Problem

When users added comments to tickets, the comment display was not showing which user added the comment. The frontend was looking for `comment.user.firstName` and `comment.user.lastName`, but the backend was storing `user: null` instead of the actual user information.

---

## Solution

### 1. Backend Model Update

**File:** `/server/models/ProductTicket.js`

Added `userInfo` field to the comments schema to store user information:

```javascript
comments: [{
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false
  },
  content: {
    type: String,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  userInfo: {        // NEW FIELD
    firstName: String,
    lastName: String,
    email: String,
    role: String
  }
}]
```

This follows the same pattern as `statusHistory`, which already stores user information in a `userInfo` field.

---

### 2. Backend Controller Update

**File:** `/server/controllers/productController.js`

Updated the `addComment` function to populate the `userInfo` field when adding a comment:

**Before:**
```javascript
ticket.comments.push({
  user: null,
  content: content.trim()
});

// Track comment addition in status history
const currentUser = getCurrentUser(req);
```

**After:**
```javascript
// Get current user info
const currentUser = getCurrentUser(req);

ticket.comments.push({
  user: null,
  content: content.trim(),
  userInfo: currentUser  // ADDED
});

// Track comment addition in status history
```

The `getCurrentUser(req)` function extracts user information from HTTP headers that are sent by the frontend API interceptor:
- `x-user-firstname`
- `x-user-lastname`
- `x-user-email`
- `x-user-role`

---

### 3. Frontend Display Update

**File:** `/client/src/pages/TicketDetails.jsx`

Updated the comment display to use `comment.userInfo` instead of `comment.user`:

**Before:**
```javascript
<span className="text-white text-sm font-medium">
  {comment.user?.firstName?.[0]}{comment.user?.lastName?.[0]}
</span>
// ...
<p className="text-sm font-medium text-gray-900">
  {comment.user?.firstName} {comment.user?.lastName}
</p>
```

**After:**
```javascript
<span className="text-white text-sm font-medium">
  {comment.userInfo?.firstName?.[0]}{comment.userInfo?.lastName?.[0]}
</span>
// ...
<p className="text-sm font-medium text-gray-900">
  {comment.userInfo?.firstName} {comment.userInfo?.lastName}
</p>
```

---

## Result

Comments now correctly display:
- **User initials** in the avatar circle (e.g., "SJ" for Sarah Johnson)
- **Full user name** next to the avatar (e.g., "Sarah Johnson")
- **Timestamp** showing when the comment was added
- **User role** available in the data (for future use)

---

## Technical Details

### User Information Flow

1. **Frontend** (AuthContext) → User selects profile
2. **Frontend** (localStorage) → Profile stored locally
3. **Frontend** (API interceptor in `api.js`) → Profile sent as headers with every request
4. **Backend** (`getCurrentUser` in controller) → Extracts user info from headers
5. **Backend** (comment creation) → Stores `userInfo` in comment
6. **Frontend** (TicketDetails display) → Shows `comment.userInfo.firstName` and `lastName`

### Data Structure

Each comment now includes:
```javascript
{
  user: null,  // ObjectId reference (for future real auth)
  content: "This is my comment",
  timestamp: "2025-10-12T10:30:00.000Z",
  userInfo: {
    firstName: "Sarah",
    lastName: "Johnson",
    email: "sarah.johnson@milliporesigma.com",
    role: "PMOps"
  }
}
```

---

## Testing

To verify the fix:

1. **As Product Manager:**
   - Select "Product Manager" profile
   - Open any ticket
   - Add a comment: "Testing as Product Manager"
   - Verify comment shows "John Smith"

2. **As PMOps:**
   - Select "PM Operations" profile
   - Open the same ticket
   - Add a comment: "Testing as PMOps"
   - Verify comment shows "Sarah Johnson"

3. **As Admin:**
   - Select "Administrator" profile
   - Open the same ticket
   - Add a comment: "Testing as Admin"
   - Verify comment shows "Mike Wilson"

---

## Related Changes

This fix is consistent with the Activity History user fix (documented in `ACTIVITY_HISTORY_FIX.md`), which uses the same user information flow:
- Frontend sends user headers
- Backend extracts with `getCurrentUser(req)`
- User info stored in `userInfo` field
- Frontend displays from `userInfo`

---

## Future Improvements

When real authentication is implemented:

1. Replace HTTP headers with JWT tokens
2. Add authentication middleware to verify tokens
3. Extract user info from validated JWT
4. Populate the `user` field with actual User ObjectId references
5. Use populated `comment.user` instead of `comment.userInfo`

The current `userInfo` approach serves as a temporary solution until real authentication is in place.
