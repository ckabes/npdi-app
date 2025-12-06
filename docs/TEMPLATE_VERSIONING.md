# Template Versioning Requirements

## Overview

This document defines the versioning requirements for ticket templates, form configurations, and view templates in the NPDI application.

## Naming Convention

**Format:** `PM-<Type>-<Version>`

- `PM`: Product Manager
- `<Type>`: Template type (e.g., Chem for Chemistry, Bio for Biologics, etc.)
- `<Version>`: Semantic version number (Major.Minor.Patch)

**Examples:**
- `PM-Chem-1.0.0` - Product Manager Chemistry template, version 1.0.0
- `PM-Chem-1.1.0` - Product Manager Chemistry template, version 1.1.0
- `PM-Bio-1.0.0` - Product Manager Biologics template, version 1.0.0

## Active Template

**Current Active Template:** `PM-Chem-1.0.0`

## Versioning Rules

Version numbers follow semantic versioning:

### Patch Version (x.x.X)

Increment for:
- Bug fixes
- Minor text changes
- Help text updates
- Typo corrections
- Clarifications

**Example:** `1.0.0` → `1.0.1`

### Minor Version (x.X.x)

Increment for:
- New optional fields
- New sections
- Non-breaking changes
- Additional field options
- Enhanced features that don't break existing tickets

**Example:** `1.0.0` → `1.1.0`

### Major Version (X.x.x)

Increment for:
- Breaking changes
- Field removals
- Required field changes
- Structural changes
- Changes that affect existing ticket data compatibility

**Example:** `1.0.0` → `2.0.0`

## Components That Must Match

The following components must use consistent naming:

1. **TicketTemplate** (MongoDB collection: `tickettemplates`)
   - `name` field must be `PM-<Type>-<Version>`

2. **FormConfiguration** (MongoDB collection: `formconfigurations`)
   - `name` field must be `PM-<Type>-<Version>`
   - `templateName` field must be `PM-<Type>-<Version>`
   - `version` field must be `<Version>` (e.g., "1.0.0")

3. **Seed Script** (`server/scripts/seedFormConfig.js`)
   - Must reflect the current template name and version

4. **Dev Profiles** (`server/data/devProfiles.json`)
   - `assignedTemplate` field must reference `PM-<Type>-<Version>`
   - `templateId` must reference the correct TicketTemplate ObjectId

5. **View Templates** (`client/src/components/DynamicTicketView.jsx`)
   - Should reference the template by name consistently

## Update Checklist

When making changes to a template, follow this checklist:

### Before Making Changes

- [ ] Determine the appropriate version increment (patch/minor/major)
- [ ] Note the current version number
- [ ] Calculate the new version number

### Update Process

1. **Update Seed Script**
   ```bash
   # Edit server/scripts/seedFormConfig.js
   # Update name, templateName, and version fields
   # Update the VERSIONING REQUIREMENTS comment if needed
   ```

2. **Run Seed Script**
   ```bash
   node server/scripts/seedFormConfig.js
   ```

3. **Update TicketTemplate in Database**
   ```bash
   mongosh npdi-app --eval "
   db.tickettemplates.updateOne(
     { name: 'PM-Chem-1.0.0' },
     { \$set: { name: 'PM-Chem-1.1.0' } }
   )"
   ```

4. **Update Dev Profiles**
   ```bash
   # Edit server/data/devProfiles.json
   # Update assignedTemplate fields
   ```

5. **Update Documentation**
   - Update this file (TEMPLATE_VERSIONING.md)
   - Update CHANGELOG or release notes
   - Update any relevant user guides

6. **Test**
   - Create a new ticket with the template
   - View an existing ticket
   - Edit an existing ticket
   - Verify form rendering
   - Verify view rendering

7. **Commit Changes**
   ```bash
   git add .
   git commit -m "Update template to PM-Chem-X.Y.Z"
   git push
   ```

### After Deployment

- [ ] Verify template is active in production
- [ ] Test ticket creation and viewing
- [ ] Update team on new template version
- [ ] Archive old template version if necessary

## Template Types

### Current Templates

| Template Name | Type | Version | Description | Status |
|--------------|------|---------|-------------|---------|
| PM-Chem-1.0.0 | Chemistry | 1.0.0 | Standard chemical product tickets | Active |

### Future Templates (Planned)

| Template Name | Type | Description |
|--------------|------|-------------|
| PM-Bio-1.0.0 | Biologics | Biological product tickets |
| PM-Instr-1.0.0 | Instruments | Laboratory instrument tickets |
| PM-Mat-1.0.0 | Materials | General materials tickets |

## Version History

### PM-Chem-1.0.0 (Current)
- **Date:** December 2025
- **Changes:** Initial versioned template
  - Renamed from "Default" to establish versioning system
  - Includes all core sections: Production Type, Basic Info, Vendor Info, Chemical Properties, Pricing, Composition, Quality Specs, CorpBase, Intellectual Property
  - Supports both Produced and Procured product types

## Database Queries

### Check Current Template Version

```bash
mongosh npdi-app --eval "
db.tickettemplates.find({ isActive: true }, { name: 1, isDefault: 1 }).pretty()
"
```

### Check Form Configuration Version

```bash
mongosh npdi-app --eval "
db.formconfigurations.find({ isActive: true }, { name: 1, templateName: 1, version: 1 }).pretty()
"
```

### Find Tickets Using Template

```bash
mongosh npdi-app --eval "
db.producttickets.find({ 'template.name': 'PM-Chem-1.0.0' }).count()
"
```

## Best Practices

1. **Never** modify an active template version directly
2. **Always** increment version when making changes
3. **Keep** old template versions for reference
4. **Test** thoroughly before activating new version
5. **Document** all changes in version history
6. **Communicate** version updates to users
7. **Maintain** backwards compatibility when possible

## Troubleshooting

### Template Not Found

If users see "Template configuration not available":
1. Check that template exists in database
2. Verify template is marked as active
3. Check user's assignedTemplate in devProfiles.json
4. Verify FormConfiguration references correct templateName

### Version Mismatch

If template name and version don't match:
1. Run seed script to update FormConfiguration
2. Update TicketTemplate name in database
3. Update devProfiles.json references
4. Clear any caches and restart application

## Related Documentation

- [Form Configuration Guide](guides/FORM_CONFIGURATION_GUIDE.md) - How to modify form fields
- [Maintenance Guide](MAINTENANCE_GUIDE.md) - Section 11.6 on form configuration
- [Architecture Documentation](architecture/ARCHITECTURE.md) - Template system overview
- [Discriminator Pattern Plan](DISCRIMINATOR_PATTERN_REFACTORING_PLAN.md) - Future multi-type ticket system
