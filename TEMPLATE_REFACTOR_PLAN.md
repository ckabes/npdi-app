# Ticket Template Refactoring Plan

**Date:** 2025-12-05
**Objective:** Move ticket template assignment from `TicketTemplate.assignedUsers` array to `User.ticketTemplate` reference field

---

## Current Architecture

### Data Storage
1. **devProfiles.json** - Development user profiles with `templateId` field
2. **User Model (MongoDB)** - User documents (currently NO template field)
3. **TicketTemplate Model** - Has `assignedUsers: [String]` array of emails

### Current Flow
1. Admin assigns template via UserManagement UI
2. `devProfileController` updates:
   - `profile.templateId` in JSON file
   - `template.assignedUsers` array in MongoDB
3. User creates ticket:
   - Frontend calls `GET /api/templates/user/:email`
   - Backend queries `TicketTemplate.findOne({ assignedUsers: email })`
   - Falls back to default template if not found

### Problems with Current Design
- Two-step lookup (scan templates, check array membership)
- Redundant data (templateId in JSON, assignedUsers in MongoDB)
- Not standard relational pattern
- Harder to query "which template does user X have?"

---

## New Architecture

### Data Storage
1. **devProfiles.json** - Keep `templateId` (for dev profile management)
2. **User Model (MongoDB)** - ADD `ticketTemplate: ObjectId` reference
3. **TicketTemplate Model** - REMOVE `assignedUsers` array

### New Flow
1. Admin assigns template via UserManagement UI
2. `devProfileController` updates:
   - `profile.templateId` in JSON file
   - `user.ticketTemplate` in User model (MongoDB)
3. User creates ticket:
   - Frontend calls `GET /api/templates/user/:email`
   - Backend queries `User.findOne({ email }).populate('ticketTemplate')`
   - Falls back to default template if not found

### Benefits
- Single lookup by indexed email field - O(1)
- Standard relational pattern
- Eliminates data redundancy
- Cleaner, more maintainable code

---

## Implementation Plan

### 1. Schema Changes

#### File: `server/models/User.js`
**Add field:**
```javascript
ticketTemplate: {
  type: mongoose.Schema.Types.ObjectId,
  ref: 'TicketTemplate',
  required: false  // PM_OPS and ADMIN don't need templates
}
```

#### File: `server/models/TicketTemplate.js`
**Remove field:**
```javascript
// DELETE this field
assignedUsers: [{
  type: String
}]
```

---

### 2. Backend API Changes

#### File: `server/routes/templates.js`
**Update getUserTemplate endpoint (lines 37-70):**
```javascript
// OLD:
let template = await TicketTemplate.findOne({
  assignedUsers: userEmail,
  isActive: true
}).populate('formConfiguration');

// NEW:
const user = await User.findOne({ email: userEmail });
let template = null;

if (user?.ticketTemplate) {
  template = await TicketTemplate.findById(user.ticketTemplate)
    .populate('formConfiguration');
}

// Fallback to default if no template assigned
if (!template || !template.isActive) {
  template = await TicketTemplate.findOne({
    isDefault: true,
    isActive: true
  }).populate('formConfiguration');
}
```

#### File: `server/controllers/devProfileController.js`
**Update createProfile (lines 142-163):**
```javascript
// OLD: Updates TicketTemplate.assignedUsers
// NEW: Updates User.ticketTemplate

if (role === 'PRODUCT_MANAGER' && templateId) {
  try {
    // Create or update User document
    await User.findOneAndUpdate(
      { email },
      {
        email,
        firstName,
        lastName,
        role,
        sbu,
        isActive,
        ticketTemplate: templateId
      },
      { upsert: true, new: true }
    );
  } catch (error) {
    console.error('Error updating user template:', error);
  }
}
```

**Update updateProfile (lines 211-253):**
```javascript
// OLD: Updates TicketTemplate.assignedUsers
// NEW: Updates User.ticketTemplate

if (role === 'PRODUCT_MANAGER') {
  try {
    await User.findOneAndUpdate(
      { email: oldEmail },
      {
        email: oldEmail,
        firstName,
        lastName,
        role,
        sbu,
        isActive,
        ticketTemplate: templateId || null
      },
      { upsert: true }
    );
  } catch (error) {
    console.error('Error updating user template:', error);
  }
} else {
  // Role changed from PM - remove template
  await User.updateOne(
    { email: oldEmail },
    { $unset: { ticketTemplate: '' } }
  );
}
```

---

### 3. Migration Script

#### File: `server/scripts/migrateTemplatesToUsers.js` (NEW)
**Purpose:** One-time migration to populate User.ticketTemplate from existing data

**Steps:**
1. Read all TicketTemplates
2. For each template's assignedUsers array:
   - Find or create User document
   - Set user.ticketTemplate = template._id
3. Verify migration success
4. Report results

```javascript
// Pseudocode:
for each template in TicketTemplate.find():
  for each email in template.assignedUsers:
    await User.findOneAndUpdate(
      { email },
      { ticketTemplate: template._id },
      { upsert: false }  // Don't create if not exists
    );
```

---

### 4. Seed Script Changes

#### File: `server/scripts/seedDefaultTemplate.js`
**Update lines 96-138:**

**OLD:**
```javascript
// Assigns users by adding to template.assignedUsers array
assignedUsers = profiles
  .filter(profile => profile.role === 'PRODUCT_MANAGER' || profile.role === 'ADMIN')
  .map(profile => profile.email);

const defaultTemplate = new TicketTemplate({
  assignedUsers: assignedUsers
});
```

**NEW:**
```javascript
// Create template first
const defaultTemplate = new TicketTemplate({
  name: 'Default',
  // ... other fields, NO assignedUsers
});
await defaultTemplate.save();

// Then assign to users via User model
const profiles = JSON.parse(fs.readFileSync(profilesPath));
for (const profile of profiles) {
  if (profile.role === 'PRODUCT_MANAGER' || profile.role === 'ADMIN') {
    await User.findOneAndUpdate(
      { email: profile.email },
      { ticketTemplate: defaultTemplate._id },
      { upsert: true }
    );
  }
}
```

---

### 5. Files Requiring Changes

**Backend:**
- ✅ `server/models/User.js` - Add ticketTemplate field
- ✅ `server/models/TicketTemplate.js` - Remove assignedUsers field
- ✅ `server/routes/templates.js` - Update getUserTemplate query
- ✅ `server/controllers/devProfileController.js` - Update create/update to sync User model
- ✅ `server/scripts/seedDefaultTemplate.js` - Update to use User model
- ✅ `server/scripts/migrateTemplatesToUsers.js` - NEW migration script

**Frontend:**
- ⚠️ No changes needed - API interface stays the same!

**Data:**
- ✅ Migration script to populate User.ticketTemplate

---

## Testing Checklist

### Before Migration
- [ ] Backup database
- [ ] Document current template assignments
- [ ] Export devProfiles.json

### After Schema Changes
- [ ] Run migration script
- [ ] Verify User.ticketTemplate populated correctly
- [ ] Test getUserTemplate endpoint

### Admin UI Testing
- [ ] Assign template to new user
- [ ] Change user's template
- [ ] Remove template from user
- [ ] Verify changes reflected in User model

### Create Ticket Testing
- [ ] Product Manager with assigned template sees correct template
- [ ] Product Manager without assigned template gets default
- [ ] PM Ops gets no template (expected)
- [ ] Admin with assigned template sees correct template

### Edge Cases
- [ ] User deleted from User model but exists in profiles
- [ ] Template assigned but template is inactive
- [ ] Template assigned but template deleted
- [ ] Multiple users assigned to same template

---

## Rollback Plan

If issues arise:

1. **Restore assignedUsers field to TicketTemplate:**
   ```javascript
   assignedUsers: [{
     type: String
   }]
   ```

2. **Revert routes/templates.js to old query pattern**

3. **Revert devProfileController to update assignedUsers**

4. **Remove ticketTemplate field from User model** (optional - can leave)

5. **Re-run seedDefaultTemplate.js** to repopulate assignedUsers

---

## Success Criteria

- ✅ All existing template assignments migrated to User model
- ✅ Admin UI successfully assigns/unassigns templates
- ✅ CreateTicket page loads correct template for users
- ✅ No errors in server logs
- ✅ Performance improvement measurable (if testing with larger dataset)
- ✅ Code is cleaner and follows standard relational patterns

---

## Notes

- **devProfiles.json** - Keep templateId for dev convenience (not used in prod)
- **User model** becomes single source of truth for template assignments
- **Template model** focuses only on template configuration, not user assignment
- **Future enhancement:** Admin UI can show "Users with this template" by querying `User.find({ ticketTemplate: templateId })`
