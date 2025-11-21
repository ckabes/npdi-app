# New Fields Enhancement - Product Ticket Form

**Date:** 2025-10-12
**Objective:** Add comprehensive new fields to product ticket submission form

---

## Overview

This enhancement adds extensive new fields across multiple sections of the product ticket form to capture more detailed information about chemical products, including manufacturing details, distribution information, material properties, and expandable PubChem data.

---

## Changes Made

### 1. Database Model Updates  

**File:** `/server/models/ProductTicket.js`

#### New Fields in Main Schema:

```javascript
primaryPlant: {
  type: String
},
productScope: {
  scope: {
    type: String,
    enum: ['Worldwide', 'North America', 'South America', 'Europe', 'Asia', 'Africa', 'Oceania', 'Other']
  },
  otherSpecification: {
    type: String
  }
},
distributionType: {
  type: String,
  enum: ['Standard', 'Purchase on Demand', 'Dock-to-Stock']
},
retestOrExpiration: {
  type: {
    type: String,
    enum: ['None', 'Retest', 'Expiration']
  },
  shelfLife: {
    value: Number,
    unit: {
      type: String,
      enum: ['days', 'months', 'years']
    }
  }
},
sialProductHierarchy: {
  type: String
},
materialGroup: {
  type: String
}
```

#### New Fields in Chemical Properties Schema:

```javascript
materialSource: {
  type: String,
  enum: ['Human', 'Plant', 'Fermentation', 'Recombinant', 'Synthetic']
},
animalComponent: {
  type: String,
  enum: ['Animal Component Free', 'Animal Component Containing']
},
storageTemperature: {
  type: String,
  enum: ['CL (2-8 deg)', 'F0 (-20 C)', 'F7 (-70 C)', 'RT (RT Controlled)', 'RT (Ambient)', 'F0 (-196 C)']
},
additionalProperties: {
  meltingPoint: String,
  boilingPoint: String,
  flashPoint: String,
  density: String,
  vaporPressure: String,
  vaporDensity: String,
  refractiveIndex: String,
  logP: String,
  polarSurfaceArea: String,
  hydrogenBondDonor: Number,
  hydrogenBondAcceptor: Number,
  rotatableBonds: Number,
  exactMass: String,
  monoisotopicMass: String,
  complexity: String,
  heavyAtomCount: Number,
  charge: Number,
  visibleProperties: {
    type: [String],
    default: []
  }
}
```

---

### 2. PubChem Service Enhancement  

**File:** `/server/services/pubchemService.js`

Enhanced the `enrichTicketData` method to populate `additionalProperties` with extended chemical data from PubChem:

```javascript
additionalProperties: {
  meltingPoint: pubchemData.physicalProperties?.meltingPoint || null,
  boilingPoint: pubchemData.physicalProperties?.boilingPoint || null,
  flashPoint: pubchemData.physicalProperties?.flashPoint || null,
  density: pubchemData.physicalProperties?.density || null,
  vaporPressure: pubchemData.physicalProperties?.vaporPressure || null,
  logP: pubchemData.properties?.xLogP?.toString() || null,
  polarSurfaceArea: pubchemData.properties?.tpsa?.toString() || null,
  hydrogenBondDonor: pubchemData.properties?.hBondDonorCount || null,
  hydrogenBondAcceptor: pubchemData.properties?.hBondAcceptorCount || null,
  exactMass: pubchemData.properties?.molecularWeight?.toString() || null,
  complexity: pubchemData.properties?.complexity?.toString() || null,
  heavyAtomCount: pubchemData.properties?.heavyAtomCount || null,
  charge: pubchemData.properties?.charge || null,
  visibleProperties: [] // Empty by default - user can make properties visible
}
```

**Key Feature:** Properties are populated but hidden by default. Users can selectively show properties using the "Add Property" button.

---

### 3. CreateTicket.jsx Updates  

**File:** `/client/src/pages/CreateTicket.jsx`

#### Added Default Values:

```javascript
defaultValues: {
  // ... existing defaults
  primaryPlant: '',
  productScope: {
    scope: 'Worldwide',
    otherSpecification: ''
  },
  distributionType: 'Standard',
  retestOrExpiration: {
    type: 'None',
    shelfLife: {
      value: '',
      unit: 'months'
    }
  },
  sialProductHierarchy: '',
  materialGroup: '',
  chemicalProperties: {
    // ... existing defaults
    materialSource: '',
    animalComponent: '',
    storageTemperature: '',
    additionalProperties: {
      visibleProperties: []
    }
  }
}
```

#### Added Watch Variables:

```javascript
const productScope = watch('productScope.scope');
const retestOrExpirationType = watch('retestOrExpiration.type');
```

#### New Basic Information Fields:

1. **Primary Plant** - Text input for manufacturing plant
2. **Product Scope** - Dropdown with geographic regions + "Other" option
3. **Distribution Type** - Dropdown (Standard, Purchase on Demand, Dock-to-Stock)
4. **Retest/Expiration** - Dropdown with conditional shelf life inputs
5. **SIAL Product Hierarchy** - Text input
6. **Material Group** - Text input

**Conditional Fields:**
- Product Scope "Other" shows text input for specification
- Retest/Expiration selection shows shelf life value and unit fields

---

### 4. ChemicalPropertiesForm Component Update  

**File:** `/client/src/components/forms/ChemicalPropertiesForm.jsx`

#### New Props:
- `setValue` - Added to support dynamic property visibility

#### New State:
```javascript
const [showAddPropertyMenu, setShowAddPropertyMenu] = useState(false);
const visibleProperties = watch('chemicalProperties.additionalProperties.visibleProperties') || [];
```

#### New Fields Added:

1. **Material Source** - Dropdown (Human, Plant, Fermentation, Recombinant, Synthetic)
2. **Animal Component** - Dropdown (Free, Containing)
3. **Storage Temperature** - Dropdown with 6 temperature options

#### Expandable Properties Feature:

**Available Properties:**
- Melting Point
- Boiling Point
- Flash Point
- Density
- Vapor Pressure
- Vapor Density
- Refractive Index
- LogP
- Polar Surface Area
- H-Bond Donors
- H-Bond Acceptors
- Rotatable Bonds
- Exact Mass
- Monoisotopic Mass
- Complexity
- Heavy Atom Count
- Charge

**User Interface:**
```javascript
<button onClick={() => setShowAddPropertyMenu(!showAddPropertyMenu)}>
  + Add Property
</button>
```

**Dropdown Menu:**
- Shows only properties not currently visible
- Click to add property to visible list
- Shows "All properties are visible" when nothing left to add

**Property Display:**
- Each visible property has a "Remove" button
- Auto-populated values show green background
- Empty state message when no properties visible

**Functions:**
```javascript
const addProperty = (propertyKey) => {
  if (!visibleProperties.includes(propertyKey)) {
    const updatedVisible = [...visibleProperties, propertyKey];
    setValue('chemicalProperties.additionalProperties.visibleProperties', updatedVisible);
  }
};

const removeProperty = (propertyKey) => {
  const updatedVisible = visibleProperties.filter(key => key !== propertyKey);
  setValue('chemicalProperties.additionalProperties.visibleProperties', updatedVisible);
};
```

---

## Field Details

### Basic Information Section

| Field | Type | Options | Required | Conditional |
|-------|------|---------|----------|-------------|
| Primary Plant | Text | - | No | - |
| Product Scope | Dropdown | Worldwide, North America, South America, Europe, Asia, Africa, Oceania, Other | No | Shows text input if "Other" |
| Distribution Type | Dropdown | Standard, Purchase on Demand, Dock-to-Stock | No | - |
| Retest/Expiration | Dropdown | None, Retest, Expiration | No | Shows shelf life fields if not "None" |
| Shelf Life Value | Number | - | No | Only if Retest/Expiration selected |
| Shelf Life Unit | Dropdown | days, months, years | No | Only if Retest/Expiration selected |
| SIAL Product Hierarchy | Text | - | No | - |
| Material Group | Text | - | No | - |

### Chemical Properties Section

| Field | Type | Options | Required | Auto-Populate |
|-------|------|---------|----------|---------------|
| Material Source | Dropdown | Human, Plant, Fermentation, Recombinant, Synthetic | No | No |
| Animal Component | Dropdown | Animal Component Free, Animal Component Containing | No | No |
| Storage Temperature | Dropdown | CL (2-8 deg), F0 (-20 C), F7 (-70 C), RT (RT Controlled), RT (Ambient), F0 (-196 C) | No | No |

### Additional Properties (Expandable)

All properties in this section:
- Hidden by default
- Can be shown via "Add Property" button
- Auto-populated from PubChem when available
- Can be manually entered if not auto-populated
- Can be removed from view via "Remove" button

| Property | Data Type | PubChem Source |
|----------|-----------|----------------|
| Melting Point | String | Physical Properties |
| Boiling Point | String | Physical Properties |
| Flash Point | String | Physical Properties |
| Density | String | Physical Properties |
| Vapor Pressure | String | Physical Properties |
| Vapor Density | String | Not available |
| Refractive Index | String | Not available |
| LogP | String | Computed Properties (XLogP) |
| Polar Surface Area | String | Computed Properties (TPSA) |
| H-Bond Donors | Number | Computed Properties |
| H-Bond Acceptors | Number | Computed Properties |
| Rotatable Bonds | Number | Not available |
| Exact Mass | String | Molecular Weight |
| Monoisotopic Mass | String | Molecular Weight |
| Complexity | String | Computed Properties |
| Heavy Atom Count | Number | Computed Properties |
| Charge | Number | Computed Properties |

---

## User Experience

### Creating a New Ticket

1. **Fill Basic Information**
   - Select Primary Plant
   - Choose Product Scope (worldwide or specific region)
   - Select Distribution Type
   - Optionally set Retest/Expiration with shelf life
   - Enter SIAL Product Hierarchy and Material Group

2. **Enter CAS Number and Auto-Populate**
   - PubChem fetches all available chemical data
   - Additional properties are populated but hidden
   - Standard properties visible as before

3. **Add Additional Properties**
   - Click "+ Add Property" button
   - Select from dropdown of available properties
   - Only populated properties show green background
   - Remove unwanted properties

4. **Complete Chemical Properties**
   - Select Material Source
   - Choose Animal Component status
   - Set Storage Temperature

5. **Continue with rest of form** (Quality, Pricing, SKUs, CorpBase)

### Viewing a Ticket

- All filled fields display in view mode
- Additional properties only show if marked as visible
- Empty fields are not displayed

---

## Technical Implementation

### Data Flow - Additional Properties

```
1. User enters CAS number
   ↓
2. PubChem Service fetches data
   ↓
3. Backend populates additionalProperties with all available data
   ↓
4. visibleProperties array is empty by default
   ↓
5. User clicks "+ Add Property"
   ↓
6. Dropdown shows available properties
   ↓
7. User selects property
   ↓
8. Property key added to visibleProperties array
   ↓
9. Field becomes visible in form
   ↓
10. Value shown (if populated) or can be manually entered
```

### Conditional Field Logic

**Product Scope:**
```javascript
{productScope === 'Other' && (
  <input {...register('productScope.otherSpecification')} />
)}
```

**Shelf Life:**
```javascript
{(retestOrExpirationType === 'Retest' || retestOrExpirationType === 'Expiration') && (
  <>
    <input {...register('retestOrExpiration.shelfLife.value')} type="number" />
    <select {...register('retestOrExpiration.shelfLife.unit')}>
      <option value="days">Days</option>
      <option value="months">Months</option>
      <option value="years">Years</option>
    </select>
  </>
)}
```

---

## Files Modified

### Backend:
-   `/server/models/ProductTicket.js` - Added new fields to schemas
-   `/server/services/pubchemService.js` - Enhanced to populate additional properties

### Frontend:
-   `/client/src/pages/CreateTicket.jsx` - Added new Basic Information fields
-   `/client/src/components/forms/ChemicalPropertiesForm.jsx` - Added Material Source, Animal Component, Storage Temperature, and expandable properties

### Documentation:
-   `/NEW_FIELDS_ENHANCEMENT.md` (this file)

### Completed:
-   `/client/src/pages/TicketDetails.jsx` - Updated to display all new fields
-   Added Country of Origin field to Basic Information section
-   Added Brand field to Basic Information section
-   Added Vendor Information conditional fields
-   Added Material Source, Animal Component, Storage Temperature to Chemical Properties
-   Added expandable Additional Properties display in view mode

---

## Benefits

### For Product Managers:
1. **More Complete Data** - Capture all relevant product information in one place
2. **Manufacturing Details** - Primary plant and material group tracking
3. **Distribution Planning** - Specify distribution type upfront
4. **Shelf Life Management** - Capture retest/expiration requirements
5. **Material Traceability** - Track material source and animal components

### For PMOps:
1. **Better Planning** - Geographic scope helps with regional planning
2. **Storage Requirements** - Clear storage temperature specifications
3. **Material Compliance** - Animal component and source tracking for regulatory needs
4. **Extended Chemical Data** - Access to comprehensive PubChem properties when needed

### For Users:
1. **Flexible Data Entry** - Show only the fields you need
2. **Auto-Population** - PubChem fills in all available data
3. **Manual Override** - Can manually enter any property
4. **Clean Interface** - Hidden properties don't clutter the form

---

## Testing Checklist

### Basic Information Fields:
- [ ] Primary Plant saves correctly
- [ ] Product Scope dropdown works
- [ ] "Other" specification field appears/disappears correctly
- [ ] Distribution Type saves correctly
- [ ] Retest/Expiration dropdown works
- [ ] Shelf life fields appear when Retest or Expiration selected
- [ ] Shelf life fields hide when "None" selected
- [ ] SIAL Product Hierarchy saves correctly
- [ ] Material Group saves correctly

### Chemical Properties Fields:
- [ ] Material Source dropdown saves correctly
- [ ] Animal Component dropdown saves correctly
- [ ] Storage Temperature dropdown saves correctly

### Additional Properties:
- [ ] "+ Add Property" button shows dropdown
- [ ] Dropdown shows only non-visible properties
- [ ] Clicking property adds it to visible list
- [ ] Property field appears after adding
- [ ] "Remove" button hides property
- [ ] Auto-populated properties show green background
- [ ] Manual entry works for non-populated properties
- [ ] visibleProperties array saves correctly

### PubChem Integration:
- [ ] Additional properties populated from PubChem
- [ ] Properties remain hidden until user adds them
- [ ] Auto-populated values display correctly
- [ ] Empty state shows when no properties visible

### Edge Cases:
- [ ] Form works with no PubChem data
- [ ] All properties can be added and removed
- [ ] Product Scope "Other" saves specification text
- [ ] Shelf life with different units saves correctly
- [ ] Empty dropdowns default correctly

---

## Future Enhancements

### Possible Additions:
1. **Bulk Property Management** - "Show All Properties" button
2. **Property Groups** - Group related properties (Physical, Computed, etc.)
3. **Property Search** - Search/filter properties in dropdown
4. **Default Visible Properties** - User preferences for which properties to always show
5. **Property Templates** - Save sets of properties for different product types
6. **Enhanced PubChem Data** - Fetch even more property types
7. **Property Validation** - Validate property values against expected ranges
8. **Property History** - Track changes to property values over time
9. **Property Exports** - Export selected properties to CSV/Excel
10. **Property Comparisons** - Compare properties across multiple products

### Country of Origin (Next):
- Add to Basic Information section
- Populate with comprehensive country list
- Optional field

---

## Notes

### Implementation Notes:
- All new fields are optional
- Conditional fields use watch() for reactive display
- Additional properties use array-based visibility control
- PubChem service populates all properties but hides them by default
- Component is fully reusable across Create and Edit modes

### Performance Notes:
- Minimal impact on form load time
- Additional properties don't affect initial render
- Property visibility state managed efficiently with arrays
- No additional API calls required

---

## TicketDetails.jsx View Mode Implementation  

**File:** `/client/src/pages/TicketDetails.jsx`

### Display Sections Added:

#### Product Information Section (Lines 1424-1533):

**New fields displayed:**
1. **Primary Plant** - Conditional display if value exists
2. **Product Scope** - Shows scope and otherSpecification if "Other"
3. **Distribution Type** - Direct display
4. **Retest/Expiration** - Shows type and shelf life if not "None"
5. **SIAL Product Hierarchy** - Direct display
6. **Material Group** - Direct display
7. **Country of Origin** - Direct display
8. **Brand** - Displayed as badge with indigo color
9. **Vendor Information** - Conditional section shown only if:
   - Production Type is "Procured"
   - At least one vendor field has a value
   - Shows all 4 vendor fields with conditional display

**Code Pattern:**
```jsx
{ticket.fieldName && (
  <div>
    <label className="block text-sm font-medium text-gray-500">Label</label>
    <p className="mt-1 text-sm text-gray-900">{ticket.fieldName}</p>
  </div>
)}
```

**Special Styling:**
- Brand: Indigo badge (`bg-indigo-100 text-indigo-800`)
- SAP/Product Numbers: Monospace font
- Vendor section: Bordered subsection with heading

#### Chemical Properties Section (Lines 1677-1877):

**New fields displayed:**
1. **Material Source** (Line 1678-1687)
   - Displayed as teal badge
   - Conditional on value existence

2. **Animal Component** (Line 1689-1702)
   - Color-coded badge:
     - Green for "Animal Component Free"
     - Orange for "Animal Component Containing"
   - Conditional on value existence

3. **Storage Temperature** (Line 1704-1711)
   - Displayed with blue background and monospace font
   - Conditional on value existence

4. **Additional Properties** (Line 1830-1877)
   - Only shown if `visibleProperties` array has items
   - Maps through visible properties and displays each
   - Shows 17 possible property types with proper labels
   - Values displayed with green background indicating PubChem source
   - Shows "PubChem Data" badge if auto-populated
   - Grid layout (3 columns on large screens)

**Property Labels Mapping:**
```javascript
const propertyLabels = {
  meltingPoint: 'Melting Point',
  boilingPoint: 'Boiling Point',
  flashPoint: 'Flash Point',
  density: 'Density',
  vaporPressure: 'Vapor Pressure',
  vaporDensity: 'Vapor Density',
  refractiveIndex: 'Refractive Index',
  logP: 'LogP',
  polarSurfaceArea: 'Polar Surface Area',
  hydrogenBondDonor: 'H-Bond Donors',
  hydrogenBondAcceptor: 'H-Bond Acceptors',
  rotatableBonds: 'Rotatable Bonds',
  exactMass: 'Exact Mass',
  monoisotopicMass: 'Monoisotopic Mass',
  complexity: 'Complexity',
  heavyAtomCount: 'Heavy Atom Count',
  charge: 'Charge'
};
```

### View Mode Features:

1. **Conditional Rendering** - All new fields only show if they have values
2. **Visual Badges** - Brand, Material Source, Animal Component displayed as badges
3. **Color Coding** - Different badge colors for different field types
4. **Vendor Section** - Separate bordered section for procured products
5. **Additional Properties** - Smart display of only user-selected properties
6. **PubChem Indicator** - Green background for auto-populated additional properties

---

**Enhancement implementation completed successfully!**  

All new fields are now fully integrated into:
-   Database model
-   PubChem service
-   Create ticket form
-   Shared form components
-   View ticket details
-   Comprehensive documentation
