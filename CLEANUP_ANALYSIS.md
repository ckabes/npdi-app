# Project Cleanup Analysis

**Date:** October 13, 2025  
**Purpose:** Identify unused dependencies, scripts, and files for removal

## Executive Summary

After comprehensive analysis, the following items have been identified as candidates for removal:

---

## 1. UNUSED STANDALONE SCRIPTS (Root Directory)

### ✅ CAN BE REMOVED

#### `create-default-users.js` (2.9 KB)
- **Purpose:** Creates default users for testing
- **Status:** **OBSOLETE** - Superseded by dev profiles system
- **Reason:** Application now uses `/server/data/devProfiles.json` for profile-based auth
- **Alternative:** Use dev profiles or registration endpoint
- **Safe to remove:** YES

#### `fix-auth-system.js` (6.7 KB)
- **Purpose:** One-time fix script for authentication issues
- **Status:** **OBSOLETE** - Was a debugging/fix script
- **Reason:** Auth system is now stable, script was for historical bugs
- **Safe to remove:** YES

#### `test-pubchem-integration.js` (3.1 KB)
- **Purpose:** Manual testing of PubChem API integration
- **Status:** **DEVELOPMENT TOOL** - Not part of production system
- **Reason:** Integration is working, manual test not needed
- **Recommendation:** Move to `/server/scripts/tests/` if keeping, or REMOVE
- **Safe to remove:** YES (functionality works)

#### `test-registration.js` (10.9 KB)
- **Purpose:** Comprehensive registration system testing
- **Status:** **DEVELOPMENT TOOL** - Manual testing script
- **Reason:** Registration works, comprehensive test suite exists
- **Safe to remove:** YES

#### `test-pubchem.js` (2.6 KB)
- **Purpose:** Additional PubChem testing
- **Status:** **DUPLICATE** - Similar to test-pubchem-integration.js
- **Safe to remove:** YES

#### `test-results.json` (4.1 KB)
- **Purpose:** Stored test output
- **Status:** **TEST ARTIFACT** - Stale test results
- **Safe to remove:** YES

### ✅ CAN BE KEPT

#### `initialize-permissions.js` (994 bytes)
- **Purpose:** Initialize permission system in database
- **Status:** **UTILITY SCRIPT** - Useful for setup
- **Used by:** Permission system (active feature)
- **Recommendation:** KEEP - useful for fresh installations
- **Safe to remove:** NO - needed for permission initialization

---

## 2. UNUSED NPM DEPENDENCIES

### Server (package.json)

#### ❌ `multer` - UNUSED
- **Purpose:** File upload middleware
- **Current Usage:** ZERO imports found in codebase
- **Reason to remove:** No file upload functionality implemented
- **Safe to remove:** YES

#### ❌ `jest` - NOT CONFIGURED
- **Purpose:** Testing framework
- **Current Usage:** No test files exist, no jest.config.js
- **Script exists:** `"test": "jest"` but no tests
- **Reason to remove:** No test suite exists
- **Safe to remove:** YES

#### ❌ `supertest` - NOT USED
- **Purpose:** HTTP testing library (works with Jest)
- **Current Usage:** No test files use it
- **Reason to remove:** No API tests exist
- **Safe to remove:** YES

#### ✅ `nodemailer` - USED
- **Purpose:** Email notifications
- **Current Usage:** `/server/utils/notifications.js`
- **Safe to remove:** NO - actively used

#### ✅ `axios` (devDependencies) - USED IN TESTS
- **Current Usage:** Used in test scripts (which we're removing)
- **Recommendation:** Move to dependencies if removing test scripts
- **Safe to remove:** NO - but move to dependencies

### Client (client/package.json)

#### All dependencies APPEAR TO BE USED
- React ecosystem: ✅ Used
- Routing: ✅ Used
- Forms: ✅ Used
- UI: ✅ Used
- Styling: ✅ Used

---

## 3. OBSOLETE DOCUMENTATION FILES

### ❓ REVIEW NEEDED

Multiple markdown files exist documenting past changes:
- `ACTIVITY_FEED_ENHANCEMENT.md`
- `ACTIVITY_HISTORY_FIX.md`
- `AUTHENTICATION_FIX.md`
- `COMMENTS_USER_FIX.md`
- `DASHBOARD_ENHANCEMENT.md`
- `NEW_FIELDS_ENHANCEMENT.md`
- `PERMISSIONS_IMPLEMENTATION.md`
- `PROFILE_AUTH_FIX.md`
- `PROFILE_BASED_ACCESS.md`
- `REFACTORING_CHECKLIST.md`
- `REFACTORING_SUMMARY.md`
- `SESSION_SUMMARY.md`
- `SETTINGS_REDESIGN.md`

**Recommendation:**
- If these document completed features, consider archiving to `/docs/archive/`
- If they're development notes, consider removing
- Keep: `README.md`, `SETUP_GUIDE.md`, `CLAUDE.md`
- Keep: `FORM_CONFIGURATION_GUIDE.md` (active feature documentation)

---

## 4. UNUSED CONFIGURATION

### `docker-compose.yml`
- **Status:** Present but MongoDB config only
- **Usage:** Not documented in README
- **Recommendation:** Keep if Docker deployment is planned, otherwise remove

### `nodemon.json`
- **Status:** Used for development
- **Safe to remove:** NO - actively used for `npm run server:dev`

---

## 5. IMAGE FILES

### `M.png` (81.9 KB) + `M.png:Zone.Identifier` (25 bytes)
- **Purpose:** Unknown - MilliporeSigma logo?
- **Location:** Root directory (should be in /client/public if needed)
- **Recommendation:** Move to proper location or remove if unused
- **Check:** Grep for references in client code

---

## RECOMMENDED CLEANUP ACTIONS

### Phase 1: Standalone Scripts (Safe - No Dependencies)
```bash
rm /home/ckabes/npdi-app/create-default-users.js
rm /home/ckabes/npdi-app/fix-auth-system.js
rm /home/ckabes/npdi-app/test-pubchem-integration.js
rm /home/ckabes/npdi-app/test-pubchem.js
rm /home/ckabes/npdi-app/test-registration.js
rm /home/ckabes/npdi-app/test-results.json
rm /home/ckabes/npdi-app/pubchem-boiling-point.json  # Test artifact
```
**Space saved:** ~31 KB

### Phase 2: NPM Dependencies (Requires package.json edit)
Remove from `/home/ckabes/npdi-app/package.json`:
- `multer` from dependencies
- `jest` from devDependencies  
- `supertest` from devDependencies
- Remove `"test": "jest"` script (or replace with actual test runner)

**Space saved:** ~50MB (node_modules)

### Phase 3: Documentation (Optional - Requires Review)
Archive or remove historical documentation files.

### Phase 4: Misplaced Files
- Move or remove `M.png` and `M.png:Zone.Identifier`
- Review `pubchem-boiling-point.json` (appears to be test data)

---

## VERIFICATION CHECKLIST

Before removing anything:
- [ ] Grep for any imports/requires
- [ ] Check if scripts are referenced in package.json
- [ ] Search for file references in documentation
- [ ] Test application after each phase

---

## WHAT TO KEEP

### Essential Files:
- ✅ `initialize-permissions.js` - Setup utility
- ✅ All files in `/server/` directory
- ✅ All files in `/client/` directory  
- ✅ `.env` and `.env.example`
- ✅ `package.json` and `package-lock.json` (after cleanup)
- ✅ `README.md`, `SETUP_GUIDE.md`, `CLAUDE.md`
- ✅ `nodemon.json`
- ✅ `.gitignore`

### Essential Dependencies:
- All current dependencies EXCEPT: multer, jest, supertest

---

## IMPACT ASSESSMENT

### Low Risk (Recommended):
- Remove standalone test scripts
- Remove unused dependencies (multer, jest, supertest)
- Remove test artifacts

### Medium Risk (Review First):
- Archive historical documentation
- Remove/relocate image files

### High Risk (Do Not Remove):
- Any files in /server/ or /client/
- initialize-permissions.js
- nodemailer dependency

---

## ESTIMATED IMPACT

**Disk Space Savings:**
- Standalone scripts: ~31 KB
- npm dependencies: ~50 MB (in node_modules)
- Documentation (if removed): ~150 KB
- **Total: ~50 MB**

**Clarity Improvement:**
- Cleaner root directory
- No confusion about test vs production code
- Focused package.json dependencies
