# Recent System Improvements - November 2025

## Overview

This document tracks recent enhancements, bug fixes, and UX improvements made to the NPDI Portal in November 2025.

## Major Features

### 1. Similar Products Search Enhancement

**Status:** ✅ Completed
**Date:** November 22, 2025

#### What Changed
Enhanced the Similar Products search feature with progressive loading capabilities.

#### Key Improvements
- **Progressive Loading**: Initially shows 3 results, expandable with "Load More" button
- **Smart Detection**: Only shows "Load More" when additional results are available
- **Improved UX**: Clearer search progress indicators and result messaging
- **Performance**: Reduces initial load time by fetching fewer results upfront

#### Technical Details
- Component: `client/src/components/admin/SimilarProductsPopup.jsx`
- Added `hasMoreResults` state tracking
- Implemented `handleLoadMore()` function
- Dynamic result fetching based on user interaction

#### User Impact
- Faster initial search results
- Better control over how many results to load
- More responsive user interface

**Documentation:** [Similar Products Search](SIMILAR_PRODUCTS_SEARCH.md)

---

### 2. Product Composition IUPAC Name Fix

**Status:** ✅ Completed
**Date:** November 22, 2025

#### What Changed
Fixed Product Composition table to use IUPAC name instead of product name for the "100%" auto-populate feature.

#### Key Improvements
- **Accuracy**: Uses IUPAC chemical name for composition component
- **Consistency**: Aligns with chemical nomenclature standards
- **CAS Lookup**: Composition CAS lookup also uses IUPAC name

#### Technical Details
- File: `client/src/pages/CreateTicket.jsx`
- Lines 1297-1309: Updated "Populate with Chemical Data (100%)" button
- Lines 780-787: Updated `handleCompositionCASLookup()` function
- Added `iupacName` watch variable

#### Before
```javascript
componentName: productName  // e.g., "Ethanol"
```

#### After
```javascript
componentName: iupacName    // e.g., "Ethanol"
```

**Impact:** More accurate chemical component naming in product compositions

---

### 3. User Attribution Improvements

**Status:** ✅ Completed
**Date:** November 22, 2025

#### What Changed
Enhanced user tracking and display throughout the application.

#### Key Improvements

##### Added User Reference Field
- **Field:** `createdByUser` in ProductTicket model
- **Type:** MongoDB ObjectId reference to User collection
- **Purpose:** Enable rich user data population in queries

##### Dashboard User Display
- Shows user's full name (firstName + lastName) instead of email
- Falls back to email if user record not found
- Applied to:
  - Recently Submitted Tickets table
  - All ticket lists
  - Activity feeds

##### Query Enhancements
- Added `.populate('createdByUser', 'firstName lastName email')` to ticket queries
- Improved sorting options: `sortBy` and `sortOrder` query parameters
- Better user experience in dashboards and ticket lists

#### Technical Details
- Model: `server/models/ProductTicket.js`
  - Added `createdByUser` field (line 462-465)
- Controller: `server/controllers/productController.js`
  - Updated `createTicket()` to set user reference
  - Updated `saveDraft()` to set user reference
  - Enhanced `getTickets()` with sorting and population
- UI: `client/src/pages/Dashboard.jsx`
  - Updated user display logic (lines 511-513, 531-532)

#### Before
```
Submitted By: user@milliporesigma.com
```

#### After
```
Submitted By: John Smith
```

**Impact:** Better user experience and clearer ticket ownership

---

### 4. Data Normalization Enhancements

**Status:** ✅ Completed
**Date:** November 22, 2025

#### What Changed
Added pre-save hooks to automatically clean and normalize data before validation.

#### Key Improvements

##### Enum Field Cleanup
- Converts empty strings to `undefined` for enum fields
- Prevents validation errors from empty string submissions
- Applies to:
  - `productScope.scope`
  - `distributionType.type`
  - `distributionType.coaCreator`
  - `distributionType.labelingType`
  - `distributionType.labelingResponsibility`

##### Unit Normalization
- Automatically converts units to lowercase
- Ensures consistency: `"ML"` → `"ml"`, `"KG"` → `"kg"`
- Applies to:
  - Package size units (`skuVariants[].packageSize.unit`)
  - Gross weight units (`skuVariants[].grossWeight.unit`)
  - Net weight units (`skuVariants[].netWeight.unit`)

#### Technical Details
- File: `server/models/ProductTicket.js`
- Hook: `productTicketSchema.pre('validate', function(next) {...})`
- Lines: 609-676

#### Example Normalization
```javascript
// Before validation
{
  packageSize: { value: 100, unit: "ML" },
  productScope: { scope: "" }
}

// After normalization
{
  packageSize: { value: 100, unit: "ml" },
  productScope: { scope: undefined }
}
```

**Impact:** Cleaner data, fewer validation errors, more consistent database

---

### 5. SBU Validation Improvements

**Status:** ✅ Completed
**Date:** November 22, 2025

#### What Changed
Simplified SBU (Strategic Business Unit) validation in routes.

#### Key Improvements
- Removed hardcoded SBU value restrictions
- Allows flexible SBU values for future expansion
- Maintains required field validation
- Cleaner, more maintainable code

#### Technical Details
- File: `server/routes/products.js`
- Removed custom SBU enum validator
- Kept `notEmpty()` validation

#### Before
```javascript
body('sbu').optional().custom(value => {
  if (value === '') return true;
  return ['775', 'P90', '440', 'P87', 'P89', 'P85'].includes(value);
})
```

#### After
```javascript
body('sbu').notEmpty().withMessage('SBU is required').trim()
```

**Impact:** More flexible SBU configuration, easier to add new SBUs

---

## Bug Fixes

### Dashboard User Display
- **Issue**: Dashboard showed email addresses instead of names
- **Fix**: Added user population and proper name display logic
- **Files**: `client/src/pages/Dashboard.jsx`

### Composition Component Naming
- **Issue**: Used product name instead of IUPAC name for chemical components
- **Fix**: Updated to use IUPAC name from PubChem data
- **Files**: `client/src/pages/CreateTicket.jsx`

### Enum Validation Errors
- **Issue**: Empty strings in enum fields caused validation failures
- **Fix**: Pre-save hook converts empty strings to undefined
- **Files**: `server/models/ProductTicket.js`

---

## Performance Optimizations

### Query Performance
- Added selective field population (only firstName, lastName, email)
- Optimized sorting with dynamic sort objects
- Reduced data transfer with targeted field selection

### Frontend Rendering
- Progressive loading in Similar Products search
- Reduced initial payload size
- Faster search result display

---

## Developer Experience

### Code Quality
- Better separation of concerns in controllers
- Reusable data normalization logic
- Cleaner validation code

### Maintainability
- Removed hardcoded values where possible
- Added comprehensive inline comments
- Improved error messages

---

## Breaking Changes

None. All improvements are backward compatible.

---

## Migration Notes

No database migrations required. Changes are additive and backward compatible:

- `createdByUser` field is optional and will be populated for new tickets
- Existing tickets without `createdByUser` will continue to work
- Pre-save hooks only affect new saves/updates

---

## Testing Recommendations

### Manual Testing
1. ✅ Test Similar Products search with "Load More" functionality
2. ✅ Verify IUPAC names appear in composition table
3. ✅ Check user names display correctly in dashboard
4. ✅ Confirm unit normalization works (try "ML", "KG", etc.)
5. ✅ Test empty enum field submission doesn't cause errors

### Automated Testing
- Unit tests for data normalization hooks
- Integration tests for user population
- E2E tests for Similar Products workflow

---

## Related Documentation

- [Similar Products Search](SIMILAR_PRODUCTS_SEARCH.md)
- [SAP MARA Integration](../Palantir-SQL-Query-API-Integration-Guide.md)
- [Architecture](../architecture/ARCHITECTURE.md)
- [API Documentation](../api/API_DOCUMENTATION.md)

---

## Future Improvements

### Planned Enhancements
1. Additional normalization rules (dates, currencies)
2. More robust user attribution across all entities
3. Enhanced Similar Products comparison features
4. Field-level audit trails

### Under Consideration
1. Real-time validation feedback
2. Bulk data import with normalization
3. Advanced search and filtering
4. Custom field validation rules

---

## Contributors

- NPDI Development Team
- Product Manager feedback
- PM-OPS user testing

---

**Last Updated:** 2025-11-22
**Version:** 1.0
**Status:** Active
