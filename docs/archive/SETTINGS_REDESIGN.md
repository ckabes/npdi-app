# Settings Redesign - System Settings vs User Preferences

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
- Auto-generate ticket numbers
- Ticket prefix (e.g., "NPDI")
- Default priority
- Draft editing policies
- Max draft age
- Auto-submit reminders
- Enable status history
- Enable comments

#### 3. Email / SMTP
- Enable/disable email notifications system-wide
- SMTP server configuration
  - Server address
  - Port
  - Username & password
  - From email/name
  - TLS/SSL settings
- SMTP connection test

#### 4. Security
- Session timeout
- Max login attempts
- Lockout duration
- Password policies:
  - Minimum length
  - Require special characters
  - Require numbers
  - Require uppercase
  - Password expiry
- Two-factor authentication
- Audit logging

#### 5. Integrations
- **PubChem Integration**
  - Enable/disable
  - Timeout settings
  - Cache time
  - Auto-population
  - Connection test
- **Webhook Integration**
  - Enable/disable
  - Webhook URL
  - Secret key
- **External API Settings**
  - Timeout
  - Retry attempts

#### 6. Performance
- **Cache Settings**
  - Enable/disable caching
  - Cache timeout
- **File Upload Settings**
  - Max file size
  - Max files per ticket
- **Database & Backup**
  - Enable automatic backups
  - Backup frequency (hourly/daily/weekly)
  - Backup retention period
- **Logging**
  - Log retention period
  - Log level (error/warn/info/debug)
  - Debug mode

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
- `POST /api/system-settings/test-smtp` - Test SMTP connection
- `POST /api/system-settings/test-pubchem` - Test PubChem connection

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
   - SMTP: Configure email settings, click "Test SMTP Connection"
   - PubChem: Click "Test PubChem Connection" to verify API access

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

4. **Apply Performance Settings:**
   - Use system cache settings in caching logic
   - Enforce file upload limits from performance settings
   - Implement database backup scheduler

### Future Enhancements

- Import/export user preferences
- Preference profiles (work, personal, etc.)
- Admin ability to set default preferences for new users
- More granular notification controls
- Additional language support
- Custom theme colors

---

## Testing Checklist

- [ ] Admin can save and retrieve system settings
- [ ] System settings persist across sessions
- [ ] SMTP connection test works (if SMTP configured)
- [ ] PubChem connection test works
- [ ] Users can save and retrieve their preferences
- [ ] User preferences persist across sessions
- [ ] Timezone auto-detection works
- [ ] Reset preferences works correctly
- [ ] Sensitive data (passwords) are masked in UI
- [ ] Only admins can access system settings
- [ ] All users can access their own preferences

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
  email: {
    enabled: true,
    smtpServer: 'smtp.gmail.com',
    smtpPort: 587
  }
});

// Test SMTP
const result = await systemSettingsAPI.testSmtp({
  smtpServer: 'smtp.gmail.com',
  smtpPort: 587,
  smtpUsername: 'user@example.com',
  smtpPassword: 'password'
});
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
