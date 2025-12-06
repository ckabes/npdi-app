# Claude Code Instructions for NPDI Portal

## Version Management Requirements

### Template and Document Versioning

**CRITICAL**: When modifying form configurations, templates, or related documentation, version numbers MUST be incremented following semantic versioning rules.

#### Semantic Versioning Rules

Follow the same versioning requirements specified in `server/scripts/seedFormConfig.js`:

- **Patch version (x.x.X)**: Bug fixes, minor text changes, help text updates
- **Minor version (x.X.x)**: New fields, new sections, non-breaking changes
- **Major version (X.x.x)**: Breaking changes, field removals, structural changes

#### Files That Require Version Updates

When making changes to any of these files, version numbers MUST be updated:

1. **Form Configuration** (`server/scripts/seedFormConfig.js`)
   - Update `name` field (e.g., PM-Chem-1.0.0 → PM-Chem-1.1.0)
   - Update `version` field (e.g., 1.0.0 → 1.1.0)
   - Update `templateName` field (must match `name`)

2. **Template References** (`client/src/components/DynamicTicketView.jsx`)
   - Update template name references if applicable

3. **Development Profiles** (`server/data/devProfiles.json`)
   - Update template references for affected profiles

4. **Documentation**
   - Update README.md with new template version
   - Update CHANGELOG or RECENT_IMPROVEMENTS with changes

#### Version Update Checklist

When modifying form configurations or templates:

- [ ] Determine appropriate version increment (patch/minor/major)
- [ ] Update `name` in seedFormConfig.js
- [ ] Update `version` in seedFormConfig.js
- [ ] Update `templateName` in seedFormConfig.js
- [ ] Run seed script: `node server/scripts/seedFormConfig.js`
- [ ] Update devProfiles.json references if needed
- [ ] Update documentation (README.md, CHANGELOG, etc.)
- [ ] Test with both new and existing tickets
- [ ] Commit all changes together

#### Example Version Progression

```
PM-Chem-1.0.0  →  PM-Chem-1.0.1  (bug fix: typo in help text)
PM-Chem-1.0.1  →  PM-Chem-1.1.0  (added: new optional field)
PM-Chem-1.1.0  →  PM-Chem-2.0.0  (breaking: removed deprecated field)
```

#### Why This Matters

- Tickets store template references for rendering closed tickets
- Version tracking ensures proper ticket display over time
- Breaking changes could affect how historical tickets are viewed
- Semantic versioning communicates the impact of changes

---

## Other Project Guidelines

### Code Style
- Follow existing patterns in the codebase
- Use reusable utilities from `server/utils/` and `client/src/utils/`
- Prefer the new GenericCRUDManager for admin components

### Documentation
- Keep README.md, MAINTENANCE_GUIDE.md, and RECENT_IMPROVEMENTS current
- Document breaking changes thoroughly
- Update version history sections when making significant changes

### Testing
- Test changes in development before committing
- Verify both active and closed ticket views when changing templates
- Check that new code works with existing data

---

*Last Updated: 2025-12-05*
