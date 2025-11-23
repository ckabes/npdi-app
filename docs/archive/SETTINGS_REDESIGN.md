# Settings Redesign - System Settings vs User Preferences

> **⚠️ OUTDATED DOCUMENT WARNING**
>
> This document contains outdated information about features that were planned but not fully implemented.
> Many sections described here (Security, Email/SMTP, Database Backup, Webhook Integration) were removed
> from the application as they were UI-only mockups without actual implementation.
>
> For current system settings capabilities, see the actual implementation in:
> - `/client/src/components/admin/SystemSettings.jsx`
> - `/server/models/SystemSettings.js`

## Overview

The application settings have been redesigned to properly separate **system-wide settings** (admin-controlled, affecting all users) from **user preferences** (individual user settings).

## What Changed

### Before
- All settings were in one System Settings page
- Settings like timezone and date format were system-wide (incorrectly)
- Settings were not actually persisted to the database
- No distinction between admin and user settings

### After
- **System Settings** (Admin Dashboard): System-wide configuration affecting all users
- **User Preferences** (User Profile): Individual user settings
- All settings are now properly persisted to MongoDB
- Auto-detection of user timezone from browser

---

## System Settings (Admin Only)

**Location:** Admin Dashboard → System Settings tab

These settings affect the entire application and all users. Only admins can modify them.

### Sections

#### 1. General Settings
- System Name
- System Description
- Company Name
- Support Email

#### 2. Ticket Configuration
- ✅ Enable status history
- ✅ Enable comments
- ~~Auto-generate ticket numbers~~ (REMOVED - Not implemented)
- ~~Ticket prefix~~ (REMOVED - Not implemented)
- ~~Default priority~~ (REMOVED - Not implemented)
- ~~Draft editing policies~~ (REMOVED - Not implemented)
- ~~Max draft age~~ (REMOVED - Not implemented)
- ~~Auto-submit reminders~~ (REMOVED - Not implemented)

#### 3. ~~Email / SMTP~~ (REMOVED - Not implemented)
- ~~Enable/disable email notifications system-wide~~
- ~~SMTP server configuration~~
- ~~SMTP connection test~~

#### 4. ~~Security~~ (REMOVED - Not implemented)
- ~~Session timeout~~
- ~~Max login attempts~~
- ~~Lockout duration~~
- ~~Password policies~~
- ~~Two-factor authentication~~
- ~~Audit logging~~

Note: The application uses profile-based authentication without traditional password/session management.

#### 5. Integrations
- ✅ **PubChem Integration** (IMPLEMENTED)
  - Enable/disable
  - Timeout settings
  - Cache time
  - Auto-population
  - Connection test
- ✅ **Microsoft Teams Integration** (IMPLEMENTED)
  - Enable/disable
  - Webhook URL
  - Notification event configuration
- ✅ **Azure OpenAI (Langdock)** (IMPLEMENTED)
  - API key (encrypted)
  - Environment selection
  - Model configuration
  - Quota management
- ✅ **Palantir Foundry** (IMPLEMENTED)
  - Token (encrypted)
  - Dataset RID
  - SQL Query API integration
- ✅ **SAP Integration** (IMPLEMENTED)
  - Credentials (encrypted)
  - RPM/PS configuration
- ~~Webhook Integration~~ (REMOVED - Not implemented)
- ~~External API Settings~~ (REMOVED - Not implemented)

#### 6. Performance
- ✅ **Cache Settings**
  - Enable/disable caching
  - Cache timeout
- ✅ **File Upload Settings**
  - Max file size
  - Max files per ticket
- ~~Database & Backup~~ (REMOVED - Not implemented)
- ~~Logging~~ (REMOVED - Not implemented)

---

## User Preferences (Per User)

**Location:** User Profile → Preferences (needs to be added to navigation)

These settings are personal to each user and don't affect other users.

### Sections

#### 1. Display
- **Timezone** - Auto-detected from browser, can be overridden
- **Date Format** - MM/DD/YYYY, DD/MM/YYYY, or YYYY-MM-DD
- **Time Format** - 12-hour or 24-hour
- **Theme** - Light, Dark, or Auto (system)
- **Language** - English, Spanish, French, German

#### 2. Notifications
- **Email Notifications**
  - Enable/disable email notifications
  - New ticket notifications
  - Status change notifications
  - Comment notifications
  - Assignment notifications
  - Reminders
  - Daily digest
  - Weekly report
- **Browser Notifications**
  - Enable/disable browser notifications
  - New ticket notifications
  - Status changes
  - Comments
  - Assignments

#### 3. Dashboard
- **Default View** - List, Grid, or Kanban
- **Items Per Page** - 10, 25, 50, or 100
- **Show Completed Tickets** - Toggle

#### 4. Accessibility
- **Font Size** - Small, Medium, Large
- **Reduce Motion** - Reduce animations
- **High Contrast** - High contrast mode
- **Screen Reader** - Screen reader optimizations

---

## Technical Implementation

### Backend

#### New Models
1. **SystemSettings** (`/server/models/SystemSettings.js`)
   - Single document in MongoDB (singleton pattern)
   - Stores all system-wide configuration
   - Tracks last updated by user and version

2. **UserPreferences** (`/server/models/UserPreferences.js`)
   - One document per user
   - Stores individual user preferences
   - Auto-creates with defaults if not exists

#### New API Endpoints

**System Settings**
- `GET /api/system-settings` - Get all system settings
- `PUT /api/system-settings` - Update system settings
- `GET /api/system-settings/:section` - Get specific section
- ~~`POST /api/system-settings/test-smtp`~~ (REMOVED - Not implemented)
- `POST /api/system-settings/test-pubchem` - Test PubChem connection
- `POST /api/system-settings/test-azure-openai` - Test Azure OpenAI connection

**User Preferences**
- `GET /api/user-preferences` - Get user's preferences
- `PUT /api/user-preferences` - Update user's preferences
- `GET /api/user-preferences/:section` - Get specific section
- `PATCH /api/user-preferences/:section` - Update specific section
- `POST /api/user-preferences/reset` - Reset to defaults

### Frontend

#### Updated Components
1. **SystemSettings** (`/client/src/components/admin/SystemSettings.jsx`)
   - Now fetches and persists settings to database
   - Removed timezone/date/time settings (moved to user preferences)
   - Updated to use new nested structure for integrations and performance
   - Added loading and saving states
   - Functional SMTP and PubChem connection tests

2. **UserPreferences** (`/client/src/pages/UserPreferences.jsx`) - NEW
   - Complete user preferences page
   - Auto-detects browser timezone
   - Sections for Display, Notifications, Dashboard, Accessibility
   - Reset to defaults functionality

#### API Client Updates (`/client/src/services/api.js`)
- Added `systemSettingsAPI` with all system settings methods
- Added `userPreferencesAPI` with all user preferences methods

---

## Migration Notes

### For Existing Users

1. **System Settings:**
   - First time an admin accesses System Settings, default values will be created
   - Existing settings should be reviewed and saved

2. **User Preferences:**
   - Each user will get default preferences on first access
   - Timezone will auto-detect from browser
   - Users can customize their preferences at any time

### Environment Variables

No new environment variables required. The existing MongoDB connection and JWT settings are sufficient.

---

## Usage Guide

### For Admins

1. **Configure System Settings:**
   - Navigate to Admin Dashboard
   - Click "System Settings" tab
   - Review and update each section
   - Click "Save Settings" to persist changes

2. **Test Integrations:**
   - PubChem: Click "Test PubChem Connection" to verify API access
   - Azure OpenAI: Click "Test Connection" to verify API key
   - Palantir: Click "Test Connection" to verify token and dataset access

### For Users

1. **Customize Your Preferences:**
   - Navigate to User Preferences (add link to navigation)
   - Update Display settings (timezone, date/time format)
   - Configure notification preferences
   - Customize dashboard view
   - Adjust accessibility settings
   - Click "Save Preferences"

2. **Reset Preferences:**
   - Click "Reset to Default" to restore all defaults
   - Timezone will reset to auto-detected value

---

## Next Steps

### Required Integration Work

1. **Add User Preferences to Navigation:**
   - Add link to User Preferences page in main navigation
   - Typically under user profile dropdown or settings menu

2. **Use Preferences in Application:**
   - Update date/time formatting throughout app to use user's preferences
   - Implement timezone conversion for all timestamps
   - Apply theme preference (light/dark mode)
   - Respect notification preferences when sending emails

3. **Implement Notification System:**
   - Use system-wide email settings for SMTP
   - Check user preferences before sending each notification
   - Implement browser notifications based on user preferences

4. ~~Apply Performance Settings:~~ (PARTIALLY IMPLEMENTED)
   - ✅ Cache settings are stored and may be used by individual services
   - ❓ File upload limits are stored but enforcement is unclear
   - ❌ Database backup scheduler - NOT IMPLEMENTED

### Future Enhancements

- Import/export user preferences
- Preference profiles (work, personal, etc.)
- Admin ability to set default preferences for new users
- More granular notification controls
- Additional language support
- Custom theme colors

---

## Testing Checklist

- [x] Admin can save and retrieve system settings
- [x] System settings persist across sessions
- [x] PubChem connection test works
- [x] Azure OpenAI connection test works
- [x] Palantir connection test works
- [x] Users can save and retrieve their preferences
- [x] User preferences persist across sessions
- [x] Timezone auto-detection works
- [x] Reset preferences works correctly
- [x] Sensitive data (API keys, tokens, passwords) are encrypted and masked in UI
- [x] Only admins can access system settings
- [x] All users can access their own preferences
- [ ] ~~SMTP connection test~~ (REMOVED - Not implemented)

---

## API Examples

### System Settings

```javascript
// Get all system settings
const response = await systemSettingsAPI.getSettings();

// Update system settings
await systemSettingsAPI.updateSettings({
  general: {
    systemName: 'My NPDI System',
    companyName: 'Acme Corp'
  },
  integrations: {
    langdock: {
      enabled: true,
      apiKey: 'your-azure-openai-key',
      environment: 'dev',
      model: 'gpt-4o-mini'
    }
  }
});

// Test Azure OpenAI
const result = await systemSettingsAPI.testAzureOpenAI();
```

### User Preferences

```javascript
// Get user preferences
const prefs = await userPreferencesAPI.getPreferences();

// Update preferences
await userPreferencesAPI.updatePreferences({
  display: {
    timezone: 'America/New_York',
    dateFormat: 'MM/DD/YYYY',
    theme: 'dark'
  },
  notifications: {
    email: {
      enabled: true,
      newTicket: true,
      statusChange: true
    }
  }
});

// Update specific section
await userPreferencesAPI.updateSection('display', {
  timezone: 'Europe/London',
  theme: 'light'
});

// Reset to defaults
await userPreferencesAPI.reset();
```

---

## Summary

This redesign provides a clear separation between:
- **System-wide configuration** (admin-controlled, affects everyone)
- **User preferences** (individual, personal settings)

All settings now properly persist to the database, and the implementation includes auto-detection of user timezone/locale for a better user experience.
