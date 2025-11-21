# NPDI App - Code Refactoring Checklist

**Date Created:** 2025-10-12
**Purpose:** Comprehensive analysis of code quality issues, duplicate code, and technical debt

## Executive Summary

This checklist documents critical issues that need to be addressed to ensure changes to the ticket system are reflected across all users and views. The codebase currently has ~700+ lines of duplicate form code, multiple data model inconsistencies, and security vulnerabilities.

### Statistics
- **Duplicate Code:** 700+ lines across 5 major sections
- **Critical Issues:** 3 (data model mismatches, missing enum value, hardcoded auth)
- **High Priority Issues:** 4 (duplicate functions, multiple badge implementations)
- **Medium Priority Issues:** 2 (unused dependencies, inconsistent styling)

---

##  ALERT: CRITICAL ISSUES

### 1. Data Model Mismatch: targetMargin vs targetMargins
**Priority:** CRITICAL
**Impact:** Data persistence failures, calculation errors

**Frontend (CreateTicket.jsx, TicketDetails.jsx):**
```javascript
// Uses single targetMargin field
<input {...register('pricingData.targetMargin')} />
```

**Backend (ProductTicket.js, lines ~180-190):**
```javascript
targetMargins: {
  targetMarginUS: { type: Number, default: 0 },
  targetMarginEurope: { type: Number, default: 0 },
  targetMarginChina: { type: Number, default: 0 },
  targetMarginJapan: { type: Number, default: 0 }
}
```

**Fix Required:**
- Option A: Update backend schema to use single `targetMargin` field
- Option B: Update frontend to use `targetMargins` object with single region
- Option C: Add migration logic to handle both formats

---

### 2. Missing NPDI_INITIATED Status in Backend Enum
**Priority:** CRITICAL
**Impact:** Backend validation will reject this status, causing save failures

**Frontend Usage:**
- `TicketDetails.jsx` lines 270, 290
- `TicketList.jsx` lines 12, 128
- `index.css` lines 64-66

**Backend Model (ProductTicket.js, line ~250):**
```javascript
status: {
  type: String,
  enum: ['DRAFT', 'SUBMITTED', 'IN_PROCESS', 'COMPLETED', 'CANCELED'],
  default: 'DRAFT'
}
```

**Backend Validation (productController.js, lines 515-517):**
```javascript
if (status && !['DRAFT', 'SUBMITTED', 'IN_PROCESS', 'COMPLETED', 'CANCELED'].includes(status)) {
  return res.status(400).json({ error: 'Invalid status' });
}
```

**Fix Required:**
- Add `'NPDI_INITIATED'` to status enum in ProductTicket.js
- Update validation in productController.js
- Verify all status transition logic includes new status

---

### 3. Hardcoded Authentication (Security Vulnerability)
**Priority:** CRITICAL
**Impact:** No real authentication, production security risk

**Location:** `server/controllers/productController.js` lines 8-18

```javascript
const getCurrentUser = (req) => {
  return {
    id: '507f1f77bcf86cd799439011',
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@millipore.com',
    role: req.headers['x-user-role'] || 'PRODUCT_MANAGER',
    sbus: req.headers['x-user-sbus']?.split(',') || ['SBU1']
  };
};
```

**Impact on createdBy field:** Line 29 sets `createdBy: null`, forcing frontend to use fallback logic from statusHistory

**Fix Required:**
- Implement real authentication middleware
- Replace hardcoded user data with session/JWT token
- Properly populate `createdBy` field on ticket creation
- Remove fallback logic from TicketDetails.jsx once fixed

---

## HIGH PRIORITY ISSUES

### 4. Duplicate Chemical Properties Section (268 lines)
**Priority:** HIGH
**Impact:** Changes must be made in multiple places

**Locations:**
- `CreateTicket.jsx` lines 638-905 (268 lines)
- `TicketDetails.jsx` lines 512-737 (226 lines in edit mode)

**Fields Duplicated:**
- CAS Number input
- Molecular Formula input
- Molecular Weight input
- MDL Number input
- PubChem CID search and fetch
- Shipping Conditions dropdown
- InChI textarea
- InChI Key input
- Synonyms textarea
- Hazard Statements textarea
- UN Number input

**Refactoring Approach:**
Create shared component: `ChemicalPropertiesForm.jsx`

```javascript
// Proposed structure
const ChemicalPropertiesForm = ({
  register,
  watch,
  setValue,
  readOnly = false,
  onPubChemFetch
}) => {
  // All chemical properties fields
  return (
    <div className="card">
      {/* Shared form fields */}
    </div>
  );
};
```

---

### 5. Duplicate Quality Specifications Section (97 lines)
**Priority:** HIGH
**Impact:** Quality attribute logic scattered

**Locations:**
- `CreateTicket.jsx` lines 906-1003 (98 lines)
- `TicketDetails.jsx` lines 739-819 (81 lines in edit mode)
- `TicketDetails.jsx` lines 1844-1919 (76 lines in read-only view)

**Components:**
- MQ Quality Level dropdown
- Quality Attributes table with useFieldArray
- Add/Remove attribute buttons
- Data Source dropdown per attribute

**Refactoring Approach:**
Create shared component: `QualitySpecificationsForm.jsx`

---

### 6. Duplicate Pricing & Margin Section (100+ lines)
**Priority:** HIGH
**Impact:** Pricing calculation logic inconsistent

**Locations:**
- `CreateTicket.jsx` lines 1088-1210 (123 lines)
- `TicketDetails.jsx` lines 766-840 (75 lines in edit mode)

**Fields Duplicated:**
- Base Costing Unit dropdown
- Standard Cost (formerly Raw Material Cost) input
- Standard Cost display field (calculated)
- Target Margin input (formerly 4 separate margins)
- Currency Selection dropdown
- Unit conversion factors

**Refactoring Approach:**
Create shared component: `PricingCalculationForm.jsx`

---

### 7. Duplicate SKU Variants Section (167+ lines)
**Priority:** HIGH
**Impact:** SKU logic most complex, highest duplication

**Locations:**
- `CreateTicket.jsx` lines 1212-1379 (168 lines)
- `TicketDetails.jsx` lines 842-1073 (232 lines in edit mode with conditional pricing)

**Components:**
- useFieldArray for SKU management
- SKU Type dropdown (PREPACK, BULK, VAR, SPEC, CONF)
- Material Number input
- Size and Pack Size inputs with unit dropdowns
- List Price input (conditional on SKU type)
- Discount Percent input (conditional)
- Advanced Pricing section (conditional)
- Add/Remove SKU buttons

**Complex Conditionals:**
```javascript
{!['VAR', 'SPEC', 'CONF'].includes(watch(`skuVariants.${index}.type`)) && (
  // Pricing fields only for PREPACK and BULK
)}
```

**Refactoring Approach:**
Create shared component: `SKUVariantsForm.jsx` with props for conditional logic

---

### 8. Duplicate CorpBase Data Section (89 lines)
**Priority:** HIGH

**Locations:**
- `CreateTicket.jsx` lines 1381-1470 (90 lines)
- `TicketDetails.jsx` lines 1075-1163 (89 lines in edit mode)

**Fields Duplicated:**
- Product Group (P11) select
- Product Description input
- Application Title input
- Commercial Brand input
- External Key input
- Media Class dropdown
- Parent product checkboxes

**Refactoring Approach:**
Create shared component: `CorpBaseDataForm.jsx`

---

### 9. Duplicate Pricing Calculation Functions
**Priority:** HIGH
**Impact:** Business logic inconsistency

**Multiple implementations of:**
1. `calculatePricing()` - Base pricing calculation
2. `recalculatePricingForSKU()` - SKU-specific calculations
3. Handlers for margin/cost changes
4. Unit conversion factor definitions

**Example from CreateTicket.jsx (lines 240-280):**
```javascript
const calculatePricing = useCallback((standardCost, targetMargin) => {
  if (!standardCost || !targetMargin) {
    return { transferPrice: 0, listPrice: 0 };
  }
  const margin = parseFloat(targetMargin) / 100;
  const transferPrice = parseFloat(standardCost) / (1 - margin);
  const listPrice = transferPrice / 0.56;
  return {
    transferPrice: parseFloat(transferPrice.toFixed(2)),
    listPrice: parseFloat(listPrice.toFixed(2))
  };
}, []);
```

**Similar implementation in TicketDetails.jsx with variations**

**Refactoring Approach:**
Create shared utility: `utils/pricingCalculations.js`

---

### 10. Duplicate Enum Cleanup Logic (150+ lines)
**Priority:** HIGH

**Locations:**
- `productController.js` createTicket function (lines ~30-80)
- `productController.js` saveDraft function (lines ~120-170)
- `productController.js` updateTicket function (lines ~220-270)

**What gets duplicated:**
```javascript
// Example from createTicket
if (chemicalProperties?.casNumber?.includes('_')) {
  chemicalProperties.casNumber = chemicalProperties.casNumber.split('_')[0];
}
if (chemicalProperties?.shippingConditions?.includes('_')) {
  chemicalProperties.shippingConditions = chemicalProperties.shippingConditions.split('_')[0];
}
// ... repeated for many fields ...
```

**Refactoring Approach:**
Create utility function: `cleanEnumValues(data)` called once before validation

---

## MEDIUM PRIORITY ISSUES

### 11. Multiple Badge Component Implementations
**Priority:** MEDIUM
**Impact:** Inconsistent styling and duplication

**StatusBadge Component:**
- Location 1: `TicketDetails.jsx` lines 22-35
- Location 2: `TicketList.jsx` lines 8-22

**Inline Status Badge:**
- `TicketDetails.jsx` lines 267-277 (doesn't use StatusBadge component)

**PriorityBadge Component:**
- `TicketList.jsx` lines 24-37
- Not used in TicketDetails.jsx (inline implementation instead)

**Refactoring Approach:**
Create shared components directory: `src/components/badges/`
- `StatusBadge.jsx`
- `PriorityBadge.jsx`

---

### 12. Unused or Minimally Used Dependencies
**Priority:** MEDIUM
**Impact:** Bundle size, maintenance burden

**Frontend (package.json):**
- `clsx` - Not used (Tailwind handles conditional classes)
- `tailwind-merge` - Not used
- `date-fns` - Not used (using native Date methods instead)
- `@headlessui/react` - Minimal usage, could be replaced

**Backend (package.json):**
- `supertest` - Installed but no tests exist
- `jest` - Configured but no test files

**Refactoring Approach:**
- Audit actual usage with `npx depcheck`
- Remove unused dependencies
- Add tests if keeping test frameworks

---

##   LOW PRIORITY ISSUES

### 13. Inconsistent File/Component Naming
**Priority:** LOW

**Pages vs Components:**
- Some components in `src/pages/` should be in `src/components/`
- No clear separation between page-level and reusable components

**Refactoring Approach:**
Create proper component hierarchy:
```
src/
  components/
    forms/
      ChemicalPropertiesForm.jsx
      QualitySpecificationsForm.jsx
      PricingCalculationForm.jsx
      SKUVariantsForm.jsx
      CorpBaseDataForm.jsx
    badges/
      StatusBadge.jsx
      PriorityBadge.jsx
    layout/
      Header.jsx
      Sidebar.jsx
  pages/
    CreateTicket.jsx
    TicketDetails.jsx
    TicketList.jsx
  utils/
    pricingCalculations.js
    enumCleaner.js
```

---

### 14. Missing Error Boundaries
**Priority:** LOW
**Impact:** Poor error handling UX

**Current State:**
- No React Error Boundaries implemented
- Errors crash entire page
- No graceful degradation

**Refactoring Approach:**
Add ErrorBoundary components for major sections

---

### 15. No Form Validation Abstraction
**Priority:** LOW

**Current State:**
- Inline validation rules scattered throughout forms
- No centralized validation schema
- Hard to maintain consistent validation

**Refactoring Approach:**
Consider Zod or Yup schema for validation:
```javascript
// schemas/ticketSchema.js
export const ticketSchema = z.object({
  productName: z.string().min(1, 'Required'),
  casNumber: z.string().regex(/^\d+-\d+-\d+$/, 'Invalid CAS format'),
  // ... etc
});
```

---

##  RECOMMENDED REFACTORING ORDER

### Phase 1: Critical Fixes (Week 1)
1.   Add NPDI_INITIATED to backend enum
2.   Fix targetMargin/targetMargins data model mismatch
3.   Implement proper authentication (or document as future work)

### Phase 2: Extract Shared Components (Week 2-3)
1.   Create shared `ChemicalPropertiesForm.jsx`
2.   Create shared `QualitySpecificationsForm.jsx`
3.   Create shared `PricingCalculationForm.jsx`
4.   Create shared `SKUVariantsForm.jsx`
5.   Create shared `CorpBaseDataForm.jsx`

### Phase 3: Extract Utilities (Week 3)
1.   Create `utils/pricingCalculations.js`
2.   Create `utils/enumCleaner.js`
3.   Create shared badge components

### Phase 4: Cleanup (Week 4)
1.   Refactor CreateTicket.jsx to use shared components
2.   Refactor TicketDetails.jsx to use shared components
3.   Remove unused dependencies
4.   Update component organization

### Phase 5: Testing & Documentation (Week 5)
1.   Add unit tests for shared utilities
2.   Add integration tests for form components
3.   Update documentation
4.   Code review and QA

---

##  SUCCESS METRICS

After refactoring, the codebase should achieve:

- **Reduced Duplication:** <100 lines of duplicate code (currently 700+)
- **Single Source of Truth:** All form fields defined once
- **Consistent Behavior:** Changes to ticket structure reflected everywhere automatically
- **Better Maintainability:** Add new fields in 1 place, not 3+
- **Improved Testing:** Shared components easier to test
- **Smaller Bundle:** Remove unused dependencies

---

##  NOTES

### Data Model Alignment Required
Before major refactoring, align on:
- Single vs multiple target margins
- Status workflow (especially NPDI_INITIATED placement)
- Required vs optional fields
- Field naming conventions (camelCase consistency)

### Breaking Changes Consideration
Some refactoring may require:
- Database migration scripts
- API version updates
- Frontend/backend deployed together

### Testing Strategy
- Unit tests for utilities (pricingCalculations, enumCleaner)
- Integration tests for shared form components
- E2E tests for full ticket creation/edit workflow

---

**Last Updated:** 2025-10-12
**Status:** Analysis Complete - Ready for Implementation Planning
