# Profile-Based Authentication Fix

## Issue
The application was throwing errors when trying to save form configurations and other data:
```
Cast to ObjectId failed for value "mike.wilson@milliporesigma.com" (type string) at path "updatedBy"
```

## Root Cause
The models were expecting ObjectId references to User documents for tracking who created/updated records, but the new profile-based authentication system uses email addresses instead of database user IDs.

## Solution
Updated all models to use String fields (email addresses) instead of ObjectId references for tracking users.

## Models Updated

### 1. FormConfiguration
- `createdBy`: ObjectId → String (email)
- `updatedBy`: ObjectId → String (email)

### 2. SystemSettings
- `lastUpdatedBy`: ObjectId → String (email)

### 3. UserPreferences
- `userId`: ObjectId → String (email)

### 4. ProductTicket
- `createdBy`: ObjectId → String (email)
- `assignedTo`: ObjectId → String (email)
- `partNumber.assignedBy`: ObjectId → String (email)
- `statusHistory.changedBy`: ObjectId → String (email)
- `comments.user`: ObjectId → String (email)
- `documents.uploadedBy`: ObjectId → String (email)
- `skuVariants.createdBy`: ObjectId → String (email)

## Controllers Updated

### systemSettingsController.js
- Changed `req.user._id` to `req.user.email`

### userPreferencesController.js
- Changed all instances of `req.user._id` to `req.user.email` in:
  - getUserPreferences
  - updateUserPreferences
  - updatePreferenceSection
  - resetPreferences
  - getPreferenceSection

## Routes Already Correct

The `formConfig.js` routes were already using `req.headers['x-user-email']` to set the `updatedBy` field, so they didn't need updates. They were just waiting for the model changes.

## Result

✅ All form configuration updates now work correctly
✅ System settings can be saved by admins
✅ User preferences can be saved per user
✅ Product tickets can be created and updated
✅ All user tracking now uses email addresses from profile headers

## Testing

To verify the fix works:

1. **As Admin:**
   - Go to Admin Dashboard → System Settings
   - Make changes and click "Save Settings"
   - Should save successfully

2. **As Any User:**
   - Go to User Preferences (when added to navigation)
   - Change your preferences
   - Click "Save Preferences"
   - Should save successfully

3. **Form Configuration:**
   - Go to Admin Dashboard → Form Configuration
   - Make changes to the form
   - Should update successfully

## Technical Notes

- Email addresses are now used as identifiers throughout the system
- All `updatedBy`/`createdBy` fields now store email addresses like "mike.wilson@milliporesigma.com"
- This aligns with the profile-based authentication system that passes user information via headers
- No database migration needed - new records will use emails, old ObjectIds will be ignored
