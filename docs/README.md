# NPDI Portal Documentation

Welcome to the NPDI (New Product Development & Introduction) Portal documentation.

## 📚 Documentation Index

### Getting Started
- [Main README](../README.md) - Project overview and quick start
- [Setup Guide](guides/SETUP_GUIDE.md) - Installation and configuration

### API Documentation
- [API Documentation](api/API_DOCUMENTATION.md) - Complete API reference
- [API Quick Start](api/API_QUICKSTART.md) - Getting started with the API
- [API Key Setup](api/API_KEY_SETUP.md) - How to generate and use API keys
- [API Key Changelog](api/CHANGELOG_API_KEYS.md) - Version history for API features

### Architecture
- [Architecture Overview](architecture/ARCHITECTURE.md) - System design and components
- [Architecture HTML](architecture/ARCHITECTURE.html) - Interactive architecture diagram
- [Architecture Pattern Analysis](architecture/ARCHITECTURE_PATTERN_ANALYSIS.md) - Design patterns used
- [Architecture Verification](architecture/ARCHITECTURE_VERIFICATION_REPORT.md) - Validation report

### Integrations
- [Microsoft Teams Integration](integrations/TEAMS_INTEGRATION.md) - Teams webhook notifications setup

### User Guides
- [Form Configuration Guide](guides/FORM_CONFIGURATION_GUIDE.md) - How to customize forms

### Security
- [Dependency Security Assessment](security/DEPENDENCY_SECURITY_ASSESSMENT.md) - npm package security audit
- [Security Assessment HTML](security/DEPENDENCY_SECURITY_ASSESSMENT.html) - Interactive security report

### Reports
- [Server Sizing Report](reports/SERVER_SIZING_REPORT.md) - Infrastructure requirements
- [Ticket Storage Analysis](reports/TICKET_STORAGE_ANALYSIS.md) - Database schema analysis

### Archive
- [Historical documentation](archive/) - Old documentation kept for reference

---

## 🚀 Quick Links for Common Tasks

### For Developers
1. **First Time Setup**: Start with [Setup Guide](guides/SETUP_GUIDE.md)
2. **API Integration**: Read [API Quick Start](api/API_QUICKSTART.md)
3. **Understanding the System**: Review [Architecture Overview](architecture/ARCHITECTURE.md)

### For Administrators
1. **Configuring Forms**: Use [Form Configuration Guide](guides/FORM_CONFIGURATION_GUIDE.md)
2. **Managing API Access**: See [API Key Setup](api/API_KEY_SETUP.md)
3. **Teams Notifications**: Configure using [Teams Integration](integrations/TEAMS_INTEGRATION.md)

### For IT/Infrastructure
1. **Server Sizing**: [Server Sizing Report](reports/SERVER_SIZING_REPORT.md)
2. **Security Review**: [Dependency Security Assessment](security/DEPENDENCY_SECURITY_ASSESSMENT.md)

---

## 📋 Implemented Features
- ✅ Core ticket management system
- ✅ REST API with authentication
- ✅ PubChem integration for chemical data
- ✅ Dynamic form configuration
- ✅ Profile-based access control
- ✅ Teams webhook notifications
- ✅ Excel export (PDP Checklist, PIF)
- ✅ AI content generation via Azure OpenAI

---

## 🏗️ Documentation Structure

```
docs/
├── README.md (this file)
├── api/                          # API documentation
│   ├── API_DOCUMENTATION.md      # Complete API reference
│   ├── API_QUICKSTART.md         # Quick start guide
│   ├── API_KEY_SETUP.md          # API key management
│   └── CHANGELOG_API_KEYS.md     # API changelog
├── architecture/                 # System architecture
│   ├── ARCHITECTURE.md           # Architecture overview
│   ├── ARCHITECTURE.html         # Visual diagrams
│   ├── ARCHITECTURE_PATTERN_ANALYSIS.md
│   └── ARCHITECTURE_VERIFICATION_REPORT.md
├── integrations/                 # Third-party integrations
│   └── TEAMS_INTEGRATION.md      # Microsoft Teams webhooks
├── guides/                       # How-to guides
│   ├── SETUP_GUIDE.md            # Installation guide
│   └── FORM_CONFIGURATION_GUIDE.md
├── security/                     # Security documentation
│   ├── DEPENDENCY_SECURITY_ASSESSMENT.md
│   └── DEPENDENCY_SECURITY_ASSESSMENT.html
├── reports/                      # Technical reports
│   ├── SERVER_SIZING_REPORT.md
│   └── TICKET_STORAGE_ANALYSIS.md
└── archive/                      # Historical documentation
    ├── CLEANUP_ANALYSIS.md
    ├── NEXTJS_CLEANUP_SUMMARY.md
    ├── PROJECT_CLEANUP_COMPLETE.md
    └── ... (old docs from previous refactoring)
```

---

## 🔍 Finding What You Need

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

---

## 📝 Contributing to Documentation

When adding new documentation:

1. **Choose the right folder:**
   - API-related: `docs/api/`
   - Architecture/design: `docs/architecture/`
   - Integration guides: `docs/integrations/`
   - How-to guides: `docs/guides/`
   - Security: `docs/security/`
   - Reports/analysis: `docs/reports/`
   - Obsolete docs: `docs/archive/`

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

## 🆘 Getting Help

- **Development issues**: Check [Architecture Documentation](architecture/ARCHITECTURE.md)
- **API questions**: See [API Documentation](api/API_DOCUMENTATION.md)
- **Setup problems**: Follow [Setup Guide](guides/SETUP_GUIDE.md)
- **Entra ID questions**: Review [Implementation Plan](integrations/ENTRA_ID_IMPLEMENTATION_PLAN.md)

For additional support, contact the NPDI development team.

---

**Last Updated:** 2025-11-06
**Maintained by:** NPDI Development Team
