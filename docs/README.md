# NPDI Portal Documentation

Welcome to the NPDI (New Product Development & Introduction) Portal documentation.

## Documentation Index

### Getting Started
- [Main README](../README.md) - Project overview and quick start
- [Setup Guide](guides/SETUP_GUIDE.md) - Installation and configuration
- [Maintenance Guide](MAINTENANCE_GUIDE.md) - System maintenance and operations guide

### API Documentation
- [API Documentation](api/API_DOCUMENTATION.md) - Complete API reference
- [API Quick Start](api/API_QUICKSTART.md) - Getting started with the API
- [API Key Setup](api/API_KEY_SETUP.md) - How to generate and use API keys
- [API Key Changelog](api/CHANGELOG_API_KEYS.md) - Version history for API features

### Architecture
- [Architecture Overview](architecture/ARCHITECTURE.md) - System design and components
- [Ticket Data Flow](architecture/TICKET_DATA_FLOW.md) - Detailed diagrams of models, routes, and controllers interaction

### Features
- [PMOps SKU Workflow](features/PMOPS_SKU_WORKFLOW.md) - Part number assignment and SKU management guide
- [Quality Spec Parser](features/QUALITY_SPEC_PARSER.md) - Natural language parser for quality specifications with automatic formatting
- [AI Content Generation](features/AI_CONTENT_GENERATION.md) - Azure OpenAI integration for content generation
- [AI Content Fields Reference](features/AI_CONTENT_FIELDS.md) - Complete field mapping and configuration
- [AI Generation Improvements](features/AI_GENERATION_IMPROVEMENTS.md) - Recent enhancements to AI features
- [Azure OpenAI Setup](features/AZURE_OPENAI_SETUP.md) - Configuration guide for Azure OpenAI
- [Azure OpenAI Models](features/AZURE_OPENAI_MODELS.md) - Available models and recommendations
- [Similar Products Search](features/SIMILAR_PRODUCTS_SEARCH.md) - Find related products by CAS number from SAP MARA
- [Recent Improvements (Nov 2025)](features/RECENT_IMPROVEMENTS_2025_11.md) - Latest enhancements and bug fixes

### Integrations
- [Microsoft Teams Integration](integrations/TEAMS_INTEGRATION.md) - Teams webhook notifications setup
- [Palantir SQL Query API Integration](Palantir-SQL-Query-API-Integration-Guide.md) - SAP MARA data access via Palantir Foundry

### User Guides
- [Form Configuration Guide](guides/FORM_CONFIGURATION_GUIDE.md) - How to customize forms
- [Template Versioning](TEMPLATE_VERSIONING.md) - Ticket template versioning requirements and guidelines

### Data Mapping & Reference
- [SAP MARA to ProductTicket Mapping](features/SAP-MARA-to-ProductTicket-Mapping.md) - Complete field mapping from SAP MARA to ProductTicket schema

### Security
- [API Key Storage](security/API_KEY_STORAGE.md) - How API keys are encrypted and stored
- [Dependency Security Assessment](security/DEPENDENCY_SECURITY_ASSESSMENT.md) - npm package security audit

---

## Quick Links for Common Tasks

### For Developers
1. **First Time Setup**: Start with [Setup Guide](guides/SETUP_GUIDE.md)
2. **API Integration**: Read [API Quick Start](api/API_QUICKSTART.md)
3. **Understanding the System**: Review [Architecture Overview](architecture/ARCHITECTURE.md)

### For Administrators
1. **Configuring Forms**: Use [Form Configuration Guide](guides/FORM_CONFIGURATION_GUIDE.md)
2. **Managing API Access**: See [API Key Setup](api/API_KEY_SETUP.md)
3. **Teams Notifications**: Configure using [Teams Integration](integrations/TEAMS_INTEGRATION.md)
4. **Palantir Integration for SAP Data**: Setup guide in [Palantir SQL Query API Integration](Palantir-SQL-Query-API-Integration-Guide.md)
5. **Admin Dashboard Analysis**: Review [Admin Dashboard & System Settings Analysis](admin/ADMIN_DASHBOARD_ANALYSIS.md) for enhancement opportunities

### For IT/Infrastructure
1. **System Maintenance**: [Maintenance Guide](MAINTENANCE_GUIDE.md) - Complete operations and troubleshooting guide
2. **API Key Security**: [API Key Storage](security/API_KEY_STORAGE.md)
3. **Security Review**: [Dependency Security Assessment](security/DEPENDENCY_SECURITY_ASSESSMENT.md)

---

## Implemented Features
- Core ticket management system with status workflow
- REST API with API key authentication for external integrations
- PubChem integration for automatic chemical data population
- **Palantir Foundry SQL Query API v2 integration for SAP MARA data access**
- **Similar Products Search - Find related products by CAS number with progressive loading**
- **Quality Specifications Natural Language Parser - Convert free-text specs to structured data**
- **Quality Tests Configuration System - Database-backed parser knowledge base manageable via admin UI**
- **Weight Matrix Management for package size to weight conversions**
- Dynamic form configuration with live preview editor
- Profile-based access control (Product Manager, PM-OPS, Admin)
- Microsoft Teams webhook notifications for ticket events
- Excel export (PDP Checklist and Product Information Forms)
- AI content generation via Azure OpenAI (product descriptions, marketing content)
- Data export services for reporting and analysis
- **UNSPSC code tracking for product classification**
- **Enhanced user attribution with full name display**
- **Automatic data normalization (units, enums) for data quality**
- **Plant Codes, Business Lines, and Product Hierarchy management**

---

## Documentation Structure

```
docs/
├── README.md (this file)
├── MAINTENANCE_GUIDE.md          # System maintenance and operations guide
├── api/                          # API documentation
│   ├── API_DOCUMENTATION.md      # Complete API reference
│   ├── API_QUICKSTART.md         # Quick start guide
│   ├── API_KEY_SETUP.md          # API key management
│   └── CHANGELOG_API_KEYS.md     # API changelog
├── architecture/                 # System architecture
│   └── ARCHITECTURE.md           # Architecture overview
├── features/                     # Feature documentation
│   ├── PMOPS_SKU_WORKFLOW.md    # PMOps SKU and part number workflow
│   ├── QUALITY_SPEC_PARSER.md   # Natural language quality spec parser
│   ├── AI_CONTENT_GENERATION.md # AI content features
│   ├── AI_CONTENT_FIELDS.md     # Field mapping reference
│   ├── AI_GENERATION_IMPROVEMENTS.md # Recent AI improvements
│   ├── AZURE_OPENAI_SETUP.md    # Azure OpenAI configuration
│   ├── AZURE_OPENAI_MODELS.md   # Available AI models
│   ├── NPDI_WORKFLOW.md         # Workflow documentation
│   ├── SIMILAR_PRODUCTS_SEARCH.md # Similar products feature
│   ├── RECENT_IMPROVEMENTS_2025_11.md # Recent updates
│   └── SAP-MARA-to-ProductTicket-Mapping.md # SAP field mapping
├── integrations/                 # Third-party integrations
│   └── TEAMS_INTEGRATION.md      # Microsoft Teams webhooks
├── Palantir-SQL-Query-API-Integration-Guide.md # Palantir Foundry integration
├── guides/                       # How-to guides
│   ├── SETUP_GUIDE.md            # Installation guide
│   └── FORM_CONFIGURATION_GUIDE.md
└── security/                     # Security documentation
    └── DEPENDENCY_SECURITY_ASSESSMENT.md
```

---

## Finding What You Need

### Search Tips
1. Use your editor's file search (Ctrl+P / Cmd+P)
2. Search for keywords like "Teams", "Entra", "API", etc.
3. Check the relevant section folder first

### Common Questions

**Q: How do I set up the development environment?**
A: See [Setup Guide](guides/SETUP_GUIDE.md)

**Q: How do I implement Microsoft authentication?**
A: Start with [Entra ID Implementation Plan](integrations/ENTRA_ID_IMPLEMENTATION_PLAN.md)

**Q: How do I configure Teams notifications?**
A: Follow [Teams Integration](integrations/TEAMS_INTEGRATION.md)

**Q: How do I use the REST API?**
A: Begin with [API Quick Start](api/API_QUICKSTART.md)

**Q: What's the system architecture?**
A: Review [Architecture Overview](architecture/ARCHITECTURE.md)

**Q: Is the application secure?**
A: Check [Dependency Security Assessment](security/DEPENDENCY_SECURITY_ASSESSMENT.md)

**Q: How do I integrate with SAP MARA data?**
A: See [Palantir SQL Query API Integration](Palantir-SQL-Query-API-Integration-Guide.md)

**Q: How are SAP fields mapped to the ticket schema?**
A: Reference [SAP MARA to ProductTicket Mapping](features/SAP-MARA-to-ProductTicket-Mapping.md)

**Q: How does the Similar Products search work?**
A: See [Similar Products Search](features/SIMILAR_PRODUCTS_SEARCH.md)

**Q: What are the latest improvements?**
A: Check [Recent Improvements](features/RECENT_IMPROVEMENTS_2025_11.md)

**Q: How do I maintain and troubleshoot the system?**
A: See the comprehensive [Maintenance Guide](MAINTENANCE_GUIDE.md)

**Q: How does PMOps manage SKUs and part numbers?**
A: See [PMOps SKU Workflow](features/PMOPS_SKU_WORKFLOW.md)

**Q: How do I use the Quality Specifications parser?**
A: See [Quality Spec Parser](features/QUALITY_SPEC_PARSER.md)

---

## Contributing to Documentation

When adding new documentation:

1. **Choose the right folder:**
   - API-related: `docs/api/`
   - Architecture/design: `docs/architecture/`
   - Integration guides: `docs/integrations/`
   - How-to guides: `docs/guides/`
   - Security: `docs/security/`
   - Reports/analysis: `docs/reports/`

2. **Follow naming conventions:**
   - Use UPPERCASE for main docs (e.g., `INTEGRATION_GUIDE.md`)
   - Use descriptive names
   - Include dates for reports (e.g., `SECURITY_AUDIT_2025_11.md`)

3. **Update this index:**
   - Add your new document to the appropriate section above
   - Include a brief description
   - Link to the document

4. **Use markdown best practices:**
   - Clear headings (H1, H2, H3)
   - Table of contents for long docs
   - Code examples in fenced code blocks
   - Links to related documentation

---

## Getting Help

- **Development issues**: Check [Architecture Documentation](architecture/ARCHITECTURE.md)
- **API questions**: See [API Documentation](api/API_DOCUMENTATION.md)
- **Setup problems**: Follow [Setup Guide](guides/SETUP_GUIDE.md)
- **System maintenance & troubleshooting**: Refer to [Maintenance Guide](MAINTENANCE_GUIDE.md)
- **Entra ID questions**: Review [Implementation Plan](integrations/ENTRA_ID_IMPLEMENTATION_PLAN.md)

For additional support, contact the NPDI development team.

---

**Last Updated:** 2025-12-01
**Maintained by:** NPDI Development Team
