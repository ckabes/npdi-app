# Entra ID Implementation Checklist

Quick reference checklist for implementing Microsoft Entra ID authentication in NPDI Portal.

---

## Pre-Implementation

### IT/Azure Setup
- [ ] Azure App Registration created
- [ ] Client ID received: `________________`
- [ ] Tenant ID received: `________________`
- [ ] API permissions granted
- [ ] Admin consent completed
- [ ] 8 Azure AD groups created
- [ ] Group Object IDs documented
- [ ] Test users assigned to groups

### Development Environment
- [ ] Git branch created: `feature/entra-id-auth`
- [ ] Backend dependencies installed (`jsonwebtoken`, `jwks-rsa`, `passport-azure-ad`)
- [ ] Frontend dependencies installed (`@azure/msal-browser`, `@azure/msal-react`)
- [ ] Environment variables configured (`.env` files)
- [ ] Team reviewed implementation plan

---

## Week 1: Backend Implementation

### Configuration Files
- [ ] Create `server/config/azureConfig.js`
  - [ ] Add tenant/client configuration
  - [ ] Add role mapping (group IDs → NPDI roles)
  - [ ] Add metadata settings

### Middleware
- [ ] Create `server/middleware/jwtAuth.js`
  - [ ] Implement JWKS client setup
  - [ ] Implement JWT verification function
  - [ ] Implement `authenticateJWT` middleware
  - [ ] Implement `mapUserRole` function
  - [ ] Add user auto-provisioning logic

- [ ] Update `server/middleware/auth.js`
  - [ ] Import `authenticateJWT`
  - [ ] Create unified `authenticate` function
  - [ ] Add dual-auth support (feature flags)
  - [ ] Update exports

### Models
- [ ] Update `server/models/User.js`
  - [ ] Add `azureObjectId` field
  - [ ] Add `azureTenantId` field
  - [ ] Update indexes
  - [ ] Add migration notes

### Routes
- [ ] Update all route files to use new `authenticate` middleware
  - [ ] `server/routes/products.js`
  - [ ] `server/routes/users.js`
  - [ ] `server/routes/admin.js`
  - [ ] `server/routes/formConfig.js`
  - [ ] `server/routes/systemSettings.js`
  - [ ] `server/routes/templates.js`

### Testing
- [ ] Create `server/tests/middleware/jwtAuth.test.js`
  - [ ] Test token validation
  - [ ] Test role mapping
  - [ ] Test error handling
  - [ ] Test auto-provisioning

- [ ] Manual testing with Postman
  - [ ] Test valid JWT token
  - [ ] Test invalid token
  - [ ] Test expired token
  - [ ] Test missing token
  - [ ] Verify user auto-creation

---

## Week 2: Frontend Implementation

### Configuration
- [ ] Create `client/src/config/msalConfig.js`
  - [ ] Add MSAL configuration
  - [ ] Add login/token request scopes
  - [ ] Initialize MSAL instance
  - [ ] Add redirect promise handling

### Authentication Context
- [ ] Update `client/src/utils/AuthContext.jsx`
  - [ ] Add MSAL hooks (`useMsal`, `useIsAuthenticated`)
  - [ ] Implement token acquisition
  - [ ] Implement role extraction from claims
  - [ ] Implement SBU extraction from claims
  - [ ] Update login function (redirect to Microsoft)
  - [ ] Update logout function (clear tokens + sign out)
  - [ ] Set Bearer token in API client

### Pages
- [ ] Create `client/src/pages/Login.jsx`
  - [ ] Microsoft sign-in button
  - [ ] Branding and messaging
  - [ ] Loading state
  - [ ] Redirect if already authenticated

- [ ] Update `client/src/pages/ProfileSelection.jsx`
  - [ ] Mark as deprecated
  - [ ] Add redirect to login
  - [ ] Keep file for rollback (don't delete)

### API Client
- [ ] Update `client/src/services/api.js`
  - [ ] Remove custom header logic
  - [ ] Let MSAL handle token automatically
  - [ ] Add 401 interceptor (redirect to login)
  - [ ] Add token refresh logic

### App Routing
- [ ] Update `client/src/App.jsx`
  - [ ] Wrap app with `<MsalProvider>`
  - [ ] Use `<AuthenticatedTemplate>` for protected routes
  - [ ] Use `<UnauthenticatedTemplate>` for public routes
  - [ ] Add `/login` route
  - [ ] Update default redirect logic

### UI Components
- [ ] Update `client/src/components/Layout.jsx`
  - [ ] Update user info display (from MSAL account)
  - [ ] Update logout button
  - [ ] Test user menu

---

## Week 3: Testing & Integration

### Unit Tests
- [ ] Backend JWT validation tests pass
- [ ] Frontend authentication context tests pass
- [ ] Role mapping tests pass
- [ ] Token refresh tests pass

### Integration Tests
- [ ] Full login flow works end-to-end
- [ ] Protected routes require authentication
- [ ] API requests include Bearer token
- [ ] Token refresh works automatically
- [ ] Logout clears session completely

### User Acceptance Testing
- [ ] Admin user can log in and access admin features
- [ ] PM-OPS user can log in and process tickets
- [ ] Product Manager can log in and create tickets
- [ ] SBU restrictions work correctly
- [ ] All existing functionality works with Entra auth

### Security Testing
- [ ] Token signature validation works
- [ ] Expired tokens rejected
- [ ] Invalid tokens rejected
- [ ] Role escalation prevented
- [ ] HTTPS enforced in production config

---

## Week 4: Deployment Preparation

### Environment Configuration
- [ ] Development `.env` files configured
- [ ] Staging `.env` files prepared
- [ ] Production `.env` files prepared (secrets secured)
- [ ] Production redirect URIs requested from IT

### Documentation
- [ ] Update README.md with Entra ID setup
- [ ] Update API documentation
- [ ] Create user guide for new login process
- [ ] Create admin guide for user management
- [ ] Document rollback procedure

### Deployment Plan
- [ ] Create deployment runbook
- [ ] Schedule deployment window
- [ ] Prepare rollback scripts
- [ ] Set up monitoring/alerting
- [ ] Plan user communication

### Dual-Auth Migration
- [ ] Deploy with both auth methods enabled
  ```bash
  ENABLE_ENTRA_AUTH=true
  ENABLE_PROFILE_AUTH=true
  ```
- [ ] Monitor usage of each auth method
- [ ] Support users during transition
- [ ] After 2 weeks, disable profile auth if stable

---

## Production Deployment

### Pre-Deployment
- [ ] All tests passing
- [ ] Security review completed
- [ ] Performance testing completed
- [ ] UAT sign-off received
- [ ] Rollback procedure tested
- [ ] Production App Registration configured
- [ ] Production groups populated with users
- [ ] Communication sent to users

### Deployment Day
- [ ] Deploy backend changes
- [ ] Deploy frontend changes
- [ ] Update environment variables
- [ ] Restart services
- [ ] Verify login works for test users
- [ ] Monitor error logs
- [ ] Monitor authentication metrics

### Post-Deployment (First 24 Hours)
- [ ] Monitor for authentication errors
- [ ] Monitor for token refresh issues
- [ ] Monitor API error rates
- [ ] Respond to support tickets
- [ ] Collect user feedback

### Post-Deployment (First Week)
- [ ] Track authentication method usage
- [ ] Review error logs daily
- [ ] Address any issues
- [ ] Plan for disabling profile auth
- [ ] Update documentation based on feedback

---

## Rollback Criteria

### Immediate Rollback If:
- [ ] > 10% of users cannot authenticate
- [ ] Critical functionality broken
- [ ] Security vulnerability discovered
- [ ] Performance degradation > 50%

### Rollback Procedure
1. [ ] Set `ENABLE_ENTRA_AUTH=false`
2. [ ] Set `ENABLE_PROFILE_AUTH=true`
3. [ ] Restart services
4. [ ] Verify profile selection works
5. [ ] Communicate to users
6. [ ] Investigate issues

---

## Post-Migration Cleanup

### After Successful Migration (2-4 weeks)
- [ ] Disable profile auth completely
  ```bash
  ENABLE_ENTRA_AUTH=true
  ENABLE_PROFILE_AUTH=false
  ```
- [ ] Remove profile-related code (optional, keep for reference)
  - [ ] `server/data/devProfiles.json`
  - [ ] `server/controllers/devProfileController.js`
  - [ ] `server/routes/profiles.js`
  - [ ] `client/src/pages/ProfileSelection.jsx`
- [ ] Archive old user records without azureObjectId
- [ ] Update monitoring dashboards
- [ ] Final documentation update

---

## Success Metrics

### Technical Metrics
- [ ] Authentication success rate > 99%
- [ ] Token refresh success rate > 99%
- [ ] Page load time < 2 seconds
- [ ] Zero P1/P2 security incidents
- [ ] Zero authentication-related downtime

### User Metrics
- [ ] > 95% of users successfully migrated
- [ ] Support ticket volume < 5 per week
- [ ] User satisfaction score > 4/5
- [ ] No complaints about SSO experience

### Business Metrics
- [ ] Project completed on time
- [ ] Budget not exceeded
- [ ] Compliance requirements met
- [ ] Foundation ready for Teams integration

---

## Quick Commands

### Start Development
```bash
# Backend
cd server
npm install
npm run dev

# Frontend
cd client
npm install
npm start
```

### Run Tests
```bash
# Backend
cd server
npm test

# Frontend
cd client
npm test
```

### Check Environment
```bash
# Backend
cat server/.env | grep AZURE

# Frontend
cat client/.env | grep REACT_APP_AZURE
```

### View Logs
```bash
# Backend logs
pm2 logs npdi-backend

# Frontend logs (dev)
# Check browser console
```

---

## Useful Links

- **Azure Portal:** https://portal.azure.com
- **App Registrations:** https://portal.azure.com/#view/Microsoft_AAD_RegisteredApps
- **MSAL.js Docs:** https://github.com/AzureAD/microsoft-authentication-library-for-js
- **JWT Debugger:** https://jwt.io
- **Implementation Plan:** [ENTRA_ID_IMPLEMENTATION_PLAN.md](./ENTRA_ID_IMPLEMENTATION_PLAN.md)
- **IT Requirements:** [IT_REQUIREMENTS_ENTRA_ID.md](./IT_REQUIREMENTS_ENTRA_ID.md)

---

**Last Updated:** 2025-11-06
**Owner:** NPDI Development Team
**Status:** Planning Phase
