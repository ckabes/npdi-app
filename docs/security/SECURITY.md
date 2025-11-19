# Security Policy

## Reporting Security Vulnerabilities

If you discover a security vulnerability in this project, please report it by emailing the development team. **Do not** create a public GitHub issue for security vulnerabilities.

## Security Best Practices

### Environment Variables

**CRITICAL:** Never commit `.env` files or secrets to version control.

#### Protected Files (Already in .gitignore)
- `.env`
- `.env.local`
- `.env.production`
- `*.save`
- Certificate files (`.pem`, `.key`, `.p12`, `.pfx`)

#### Creating Your .env File

1. Copy the example template:
   ```bash
   cp .env.example .env
   ```

2. Generate a secure JWT_SECRET:
   ```bash
   node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
   ```

3. Replace placeholder values with real secrets
4. **Never share your .env file**

### JWT Security

The `JWT_SECRET` is used to sign authentication tokens. If compromised, attackers can:
- Impersonate any user
- Gain admin access
- Bypass all authentication

**Rotation Schedule:**
- Rotate JWT_SECRET every 90 days
- Rotate immediately if:
  - Secret is accidentally committed to git
  - Secret is exposed in logs
  - Suspected compromise

### API Keys

API keys are managed through the application:
- Generate: `node server/scripts/generateApiKey.js`
- Store in MongoDB (never in code)
- Use environment variables for master keys only

### Database Security

#### MongoDB Configuration
- Use strong passwords (minimum 16 characters)
- Enable authentication in production
- Use connection string format: `mongodb://username:password@host:port/database`
- Never hardcode connection strings

### SAP Connection Security

SAP credentials are stored in environment variables:
- `SAP_USERNAME`: Your SAP username
- `SAP_PASSWORD`: Your SAP password
- Never commit these values
- Use VPN when connecting to SAP systems

### Production Deployment

#### Environment Variables in Production
1. Use secure secret management (e.g., AWS Secrets Manager, Azure Key Vault)
2. Set `NODE_ENV=production`
3. Use strong, unique secrets for each environment
4. Enable HTTPS/TLS
5. Configure CORS properly

#### Security Headers
The application uses Helmet.js for security headers:
- Content Security Policy
- X-Frame-Options
- X-Content-Type-Options
- Strict-Transport-Security

### Code Review Checklist

Before committing code:
- [ ] No secrets in code
- [ ] No `.env` files staged
- [ ] No API keys hardcoded
- [ ] No passwords in comments
- [ ] Updated `.env.example` if new variables added

### Dependencies

#### Security Updates
- Run `npm audit` regularly
- Fix critical vulnerabilities immediately
- Review dependency licenses
- Keep dependencies up-to-date

#### Audit Commands
```bash
# Check for vulnerabilities
npm audit

# Fix automatically (review changes)
npm audit fix

# View full security report
npm audit --json
```

## Authentication & Authorization

### Current Implementation
- Profile-based authentication (no passwords)
- Role-based access control (RBAC)
- JWT tokens with 24-hour expiration
- Three roles: PRODUCT_MANAGER, PM_OPS, ADMIN

### Security Considerations
- Tokens expire after 24 hours
- No refresh tokens (users must re-authenticate)
- Admin actions require ADMIN role
- SBU-based data filtering for Product Managers

## Data Protection

### Sensitive Data
The following data types are considered sensitive:
- JWT tokens
- API keys
- User credentials
- SAP connection details
- Azure OpenAI API keys

### Storage Guidelines
- Never log sensitive data
- Encrypt sensitive data at rest
- Use HTTPS for data in transit
- Sanitize error messages (no stack traces in production)

## Incident Response

### If Secrets Are Compromised

1. **Immediate Actions:**
   ```bash
   # Generate new JWT_SECRET
   node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

   # Update .env file
   # Restart application
   # Notify all users to re-authenticate
   ```

2. **If Committed to Git:**
   ```bash
   # Rewrite history (WARNING: destructive)
   git filter-branch --force --index-filter \
     'git rm --cached --ignore-unmatch .env' \
     --prune-empty --tag-name-filter cat -- --all

   # Clean up
   rm -rf .git/refs/original/
   git reflog expire --expire=now --all
   git gc --prune=now --aggressive

   # Force push (coordinate with team)
   git push origin --force --all
   ```

3. **Recovery Steps:**
   - Rotate all secrets
   - Review access logs
   - Notify security team
   - Document incident

## Compliance

### Data Retention
- Authentication tokens: 24 hours
- Session logs: 90 days
- Audit trails: 7 years (as required)

### GDPR Considerations
- User data: Email, name, role
- Right to deletion supported
- Data export available
- Privacy policy required for production

## Contact

For security concerns or questions:
- Email: [Your Security Team Email]
- Internal: [Slack Channel / Teams Channel]

## Security Audit History

| Date | Type | Findings | Status |
|------|------|----------|--------|
| 2025-01-19 | Git History Cleanup | Removed .env files from all commits | ✅ Complete |
| 2025-01-19 | Secret Rotation | Generated new JWT_SECRET | ✅ Complete |
| 2025-01-19 | Code Scan | No hardcoded secrets found | ✅ Pass |

---

**Last Updated:** January 19, 2025
**Next Review:** April 19, 2025
