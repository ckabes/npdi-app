# Application Proxy Implementation Checklist

Quick reference checklist for implementing Microsoft Entra Application Proxy authentication in NPDI Portal.

**Timeline:** 1-2 weeks
**Approach:** Header-based authentication via Application Proxy

---

## Pre-Implementation

### Prerequisites Verification
- [ ] **Licensing check:** Entra ID Premium P1 or P2 available
  - Azure Portal → Entra ID → Licenses → Verify "Premium P1" or "P2"
- [ ] **Windows Server:** Identified for connector (VM or physical)
  - Windows Server 2012 R2+ (2019/2022 recommended)
  - 2 CPU cores, 4GB RAM minimum
  - Outbound HTTPS (443) to Azure
- [ ] **Network connectivity:** Outbound HTTPS verified
  - Test: `Test-NetConnection -ComputerName login.microsoftonline.com -Port 443`
- [ ] **Permissions:** Global Admin or Application Admin access confirmed

### Development Environment
- [ ] Git branch created: `feature/app-proxy-auth`
- [ ] Backend `.env` file prepared with group Object ID placeholders
- [ ] Team reviewed implementation plan
- [ ] IT team notified and ready to proceed

---

## Day 1-2: IT Setup

### Connector Installation
- [ ] Connector installer downloaded from Azure Portal
- [ ] Connector installed on Windows Server (30 min)
- [ ] Connector signed in with admin account during installation
- [ ] Connector status shows "Active" in Azure Portal
- [ ] Connector service verified running:
  ```powershell
  Get-Service -Name WAPConnectorUpdater  # Should show "Running"
  ```
- [ ] **(Production)** Second connector installed for redundancy

**Deliverable:** Active connector(s) registered in tenant

---

### Application Publishing
- [ ] NPDI application created in Application Proxy
  - Name: `NPDI Portal`
  - Internal URL: `http://localhost:5000`
  - External URL documented: `________________.msappproxy.net`
  - Pre-authentication: Azure Active Directory ✓
  - Backend timeout: Long ✓
- [ ] External URL tested (should redirect to Microsoft login)
- [ ] **(Optional)** Custom domain configured (e.g., `npdi.company.com`)
  - DNS CNAME created
  - SSL certificate uploaded
  - Custom domain verified working

**Deliverable:** External URL accessible and redirecting to login

---

### Single Sign-On Configuration
- [ ] SSO method set to "Header-based"
- [ ] Headers configured:
  - [ ] `X-MS-CLIENT-PRINCIPAL-NAME` → `user.userprincipalname`
  - [ ] `X-MS-CLIENT-PRINCIPAL-ID` → `user.objectid`
  - [ ] `X-MS-CLIENT-PRINCIPAL-IDP` → `aad` (constant)
- [ ] Group claims enabled in Token configuration
  - Security groups selected ✓
  - Group ID in "ID" section ✓
  - Group ID in "Access" section ✓
- [ ] Configuration saved

**Deliverable:** Headers configured to pass user info

---

### Azure AD Groups
- [ ] All groups created:
  - [ ] `NPDI-Admins`
  - [ ] `NPDI-PMOps`
  - [ ] `NPDI-ProductManagers-775`
  - [ ] `NPDI-ProductManagers-P90`
  - [ ] `NPDI-ProductManagers-440`
  - [ ] `NPDI-ProductManagers-P87`
  - [ ] `NPDI-ProductManagers-P89`
  - [ ] `NPDI-ProductManagers-P85`
- [ ] Group Object IDs documented:
  ```
  NPDI-Admins: _______________________________________
  NPDI-PMOps: _______________________________________
  NPDI-ProductManagers-775: _______________________________________
  NPDI-ProductManagers-P90: _______________________________________
  NPDI-ProductManagers-440: _______________________________________
  NPDI-ProductManagers-P87: _______________________________________
  NPDI-ProductManagers-P89: _______________________________________
  NPDI-ProductManagers-P85: _______________________________________
  ```
- [ ] Test users assigned to groups
- [ ] Groups assigned to NPDI application

**Deliverable:** Groups created with Object IDs documented

---

### User Assignment
- [ ] Groups assigned to application (Users and groups)
  - NPDI-Admins ✓
  - NPDI-PMOps ✓
  - NPDI-ProductManagers-* ✓
- [ ] Test users verified:
  - Admin test user: ________________@company.com
  - PM-OPS test user: ________________@company.com
  - PM test user: ________________@company.com
- [ ] Test user can access external URL and sign in

**Deliverable:** Test users can authenticate

---

### Optional: Conditional Access
- [ ] Conditional Access policy created
  - Name: "Require MFA for NPDI"
  - Target: NPDI Portal application
  - Require: Multi-factor authentication
  - Users: All (or specific groups)
- [ ] Policy enabled and tested

**Deliverable:** MFA enforced (if desired)

---

## Day 3-4: Backend Implementation

### Configuration Files
- [ ] Create `server/config/roleMapping.js`
  - [ ] Import environment variables for group Object IDs
  - [ ] Define `groupToRoleMap` object
  - [ ] Implement `mapGroupsToRole(groups)` function
  - [ ] Add default role fallback
  - [ ] Test group mapping logic

### Middleware
- [ ] Create `server/middleware/appProxyAuth.js`
  - [ ] Implement `authenticateAppProxy` middleware function
  - [ ] Read Application Proxy headers (X-MS-CLIENT-PRINCIPAL-*)
  - [ ] Parse groups from header (comma-separated)
  - [ ] Call `mapGroupsToRole()` to get NPDI role
  - [ ] Find or create user in database (auto-provisioning)
  - [ ] Update user info on each request (role, SBU, lastLogin)
  - [ ] Attach `req.user` object
  - [ ] Add error handling
  - [ ] Test with mock headers

- [ ] Update `server/middleware/auth.js`
  - [ ] Import `authenticateAppProxy`
  - [ ] Create unified `authenticate` function
  - [ ] Support dual-auth mode (App Proxy + Profile)
  - [ ] Use feature flags: `ENABLE_APP_PROXY_AUTH`, `ENABLE_PROFILE_AUTH`
  - [ ] Update exports

### Models
- [ ] Update `server/models/User.js`
  - [ ] Add `azureObjectId` field (String, unique, sparse, indexed)
  - [ ] Add `azureTenantId` field (String)
  - [ ] Test user creation with new fields

### Routes
- [ ] Create `server/routes/auth.js` (NEW)
  - [ ] Add `GET /auth/me` endpoint
  - [ ] Use `authenticate` middleware
  - [ ] Return current user info from `req.user`
  - [ ] Test endpoint returns user correctly

- [ ] Update `server/index.js`
  - [ ] Register auth routes: `app.use('/api/auth', authRoutes)`
  - [ ] Verify route accessible

### Environment Variables
- [ ] Update `.env` with:
  ```bash
  AZURE_TENANT_ID=
  AZURE_GROUP_ADMIN=
  AZURE_GROUP_PMOPS=
  AZURE_GROUP_PM_775=
  AZURE_GROUP_PM_P90=
  AZURE_GROUP_PM_440=
  AZURE_GROUP_PM_P87=
  AZURE_GROUP_PM_P89=
  AZURE_GROUP_PM_P85=
  ENABLE_APP_PROXY_AUTH=true
  ENABLE_PROFILE_AUTH=true  # Keep enabled during migration
  CLIENT_URL=https://npdi-yourcompany.msappproxy.net
  ```

### Testing
- [ ] Unit test `mapGroupsToRole` function
- [ ] Unit test `authenticateAppProxy` middleware
  - [ ] Test with valid headers
  - [ ] Test with missing headers
  - [ ] Test with invalid headers
  - [ ] Test user auto-provisioning
  - [ ] Test user update on re-login
- [ ] Manual test with Postman/curl
  - [ ] Add X-MS-CLIENT-PRINCIPAL-* headers manually
  - [ ] Verify user created in MongoDB
  - [ ] Verify correct role assigned

**Deliverable:** Backend reads headers and creates/updates users correctly

---

## Day 5: Frontend Updates

### Authentication Context
- [ ] Update `client/src/utils/AuthContext.jsx`
  - [ ] Remove profile-related state management
  - [ ] Add `fetchUserInfo()` function (calls `/api/auth/me`)
  - [ ] Call `fetchUserInfo()` on mount
  - [ ] Update `logout()` to redirect to Microsoft logout URL:
    ```javascript
    const tenantId = process.env.REACT_APP_AZURE_TENANT_ID;
    const logoutUrl = `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/logout`;
    window.location.href = logoutUrl;
    ```
  - [ ] Remove `selectProfile()` function
  - [ ] Test context with backend

### App Routing
- [ ] Update `client/src/App.jsx`
  - [ ] Create `ProtectedRoute` component
  - [ ] Check `isAuthenticated` from AuthContext
  - [ ] Show loading state while fetching user
  - [ ] Show "Authentication Required" if not authenticated
  - [ ] Wrap all routes with `ProtectedRoute`
  - [ ] Remove profile selection route
  - [ ] Test routing

### UI Components
- [ ] Update `client/src/components/Layout.jsx`
  - [ ] Update user info display (from `user` object in context)
  - [ ] Test logout button redirects to Microsoft
  - [ ] Verify user menu shows correct name/role

### Profile Selection Page
- [ ] Hide/remove `client/src/pages/ProfileSelection.jsx`
  - [ ] Option 1: Delete file (clean, but permanent)
  - [ ] Option 2: Move to `client/src/pages/deprecated/` (keep for rollback)
  - [ ] Option 3: Add redirect to dashboard if accidentally accessed
  - [ ] Update imports if any component references it

### Environment Variables
- [ ] Update `client/.env`:
  ```bash
  REACT_APP_API_BASE_URL=https://npdi-yourcompany.msappproxy.net/api
  REACT_APP_AZURE_TENANT_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
  ```
- [ ] Rebuild frontend: `npm run build`

**Deliverable:** Frontend works with Application Proxy authentication

---

## Day 6-7: Testing & Integration

### End-to-End Testing
- [ ] Access external URL (not direct internal URL)
- [ ] Redirected to Microsoft login automatically
- [ ] Sign in with test admin user
- [ ] Verify redirected back to NPDI dashboard
- [ ] Verify user info displayed correctly (name, role)
- [ ] Test all admin features work
- [ ] Test logout redirects to Microsoft and signs out
- [ ] Cannot access NPDI after logout

**Repeat for each role:**
- [ ] Admin user (NPDI-Admins group)
  - [ ] Can access admin panel
  - [ ] Can manage users, settings, templates
  - [ ] Can view all tickets (all SBUs)
- [ ] PM-OPS user (NPDI-PMOps group)
  - [ ] Can process tickets
  - [ ] Can view all tickets (all SBUs)
  - [ ] Cannot access admin panel
- [ ] Product Manager (NPDI-ProductManagers-775 group)
  - [ ] Can create tickets
  - [ ] Can only view SBU 775 tickets
  - [ ] Cannot access admin panel
  - [ ] Cannot view other SBUs

### Functional Testing
- [ ] Create ticket with App Proxy auth
  - [ ] Ticket attributed to correct user
  - [ ] User name appears in ticket history
- [ ] Update ticket with App Proxy auth
  - [ ] Status history shows correct user
  - [ ] Activity feed shows correct user
- [ ] Add comment with App Proxy auth
  - [ ] Comment shows correct user info
- [ ] View tickets list
  - [ ] SBU filtering works correctly
  - [ ] Only authorized tickets visible
- [ ] Dashboard statistics load correctly
- [ ] All existing features work

### Security Testing
- [ ] Cannot bypass App Proxy by accessing internal URL directly
  - [ ] Configure firewall/network to block direct access (IT task)
  - [ ] Test: Accessing `http://localhost:5000` should fail
- [ ] Cannot access admin features as Product Manager (403)
- [ ] Cannot view other SBU tickets as Product Manager
- [ ] Headers validated (cannot be user-supplied)
  - [ ] Try adding fake X-MS-CLIENT-PRINCIPAL-* headers directly
  - [ ] Should be stripped by App Proxy, not used by backend
- [ ] User role changes when group membership changes
  - [ ] Move test user to different group
  - [ ] Sign out and back in
  - [ ] Verify new role applied

### Performance Testing
- [ ] Page load time < 2 seconds
- [ ] No noticeable latency from Application Proxy
- [ ] Multiple concurrent users can authenticate
- [ ] Session persists across browser tabs

### User Acceptance Testing
- [ ] Admin stakeholder can test and approve
- [ ] PM-OPS stakeholder can test and approve
- [ ] Product Manager stakeholder can test and approve
- [ ] No blockers or critical issues found

**Deliverable:** All tests pass, UAT approved

---

## Day 8: Production Deployment

### Pre-Deployment
- [ ] All tests passing ✓
- [ ] Security review completed ✓
- [ ] UAT sign-off received ✓
- [ ] Rollback procedure documented and tested ✓
- [ ] Production connector verified active
- [ ] Production groups populated with real users
- [ ] Communication sent to users

### Deployment
- [ ] Deploy backend changes to production
- [ ] Deploy frontend changes to production
- [ ] Update production `.env` files:
  - [ ] Update all group Object IDs (production values)
  - [ ] Set `ENABLE_APP_PROXY_AUTH=true`
  - [ ] Set `ENABLE_PROFILE_AUTH=false` OR `true` (if dual-auth mode)
  - [ ] Update URLs to production external URL
- [ ] Restart production services
- [ ] Verify external URL accessible
- [ ] Test with IT admin account first
- [ ] Monitor logs for errors

### Post-Deployment Verification
- [ ] Test users can sign in successfully
- [ ] No authentication errors in logs
- [ ] Dashboard loads correctly
- [ ] Tickets can be created
- [ ] All major features working

### Monitoring (First 24 Hours)
- [ ] Monitor Azure AD sign-in logs for errors
- [ ] Monitor backend error logs
- [ ] Monitor Application Proxy connector status (Active)
- [ ] Track authentication success rate (target: >99%)
- [ ] Respond to user support tickets

### Post-Deployment (First Week)
- [ ] Daily log review
- [ ] User feedback collection
- [ ] Track dual-auth usage (if enabled)
  - [ ] How many users using App Proxy URL?
  - [ ] How many using old direct URL?
- [ ] Support tickets reviewed and resolved
- [ ] Document any issues encountered

**Deliverable:** Production deployment successful, users authenticating

---

## Post-Migration (Week 2+)

### Disable Profile Auth (When Ready)
- [ ] Verify >95% of users using Application Proxy URL
- [ ] Communicate upcoming change to remaining users
- [ ] Set `ENABLE_PROFILE_AUTH=false` in production
- [ ] Deploy change
- [ ] Monitor for issues
- [ ] Block direct URL access (network/firewall)

### Cleanup (Optional)
- [ ] Remove profile-related code:
  - [ ] `server/data/devProfiles.json`
  - [ ] `server/controllers/devProfileController.js`
  - [ ] `client/src/pages/ProfileSelection.jsx`
  - [ ] Profile-specific routes
- [ ] Update documentation
- [ ] Archive old authentication code (Git history)

### Ongoing Maintenance
- [ ] Weekly connector status checks
- [ ] Monthly user/group access reviews
- [ ] Update Windows Server patches regularly
- [ ] Monitor sign-in logs for anomalies

**Deliverable:** Profile auth disabled, cleanup complete

---

## Rollback Criteria

### Immediate Rollback If:
- [ ] > 10% of users cannot authenticate
- [ ] Critical functionality broken
- [ ] Security vulnerability discovered
- [ ] Connector completely offline (no redundancy)

### Rollback Procedure
1. [ ] Set `ENABLE_APP_PROXY_AUTH=false`
2. [ ] Set `ENABLE_PROFILE_AUTH=true`
3. [ ] Restart services: `pm2 restart all`
4. [ ] Verify profile selection works
5. [ ] Communicate to users
6. [ ] Investigate issues

**Advantage:** Application Proxy configuration remains in Azure - can retry later

---

## Success Metrics

### Technical Metrics
- [ ] Authentication success rate > 99%
- [ ] Page load time < 2 seconds
- [ ] Zero P1/P2 security incidents
- [ ] Zero authentication-related downtime
- [ ] Connector uptime > 99.9%

### User Metrics
- [ ] > 95% of users successfully migrated
- [ ] Support ticket volume < 5 per week
- [ ] User satisfaction score > 4/5
- [ ] No complaints about login experience

### Business Metrics
- [ ] Project completed on time (1-2 weeks)
- [ ] Budget not exceeded
- [ ] Compliance requirements met
- [ ] Foundation ready for future enhancements

---

## Quick Commands

### Backend Testing
```bash
# Start backend
cd server
npm run dev

# Test with mock headers (curl)
curl http://localhost:5000/api/auth/me \
  -H "X-MS-CLIENT-PRINCIPAL-NAME: test@company.com" \
  -H "X-MS-CLIENT-PRINCIPAL-ID: 12345678-1234-1234-1234-123456789012" \
  -H "X-MS-CLIENT-PRINCIPAL-IDP: aad" \
  -H "X-MS-CLIENT-PRINCIPAL-GROUPS: group1,group2"

# Check environment variables
cat server/.env | grep AZURE
```

### Frontend Testing
```bash
# Start frontend
cd client
npm start

# Build for production
npm run build
```

### Connector Verification (PowerShell)
```powershell
# Check connector service
Get-Service -Name WAPConnectorUpdater

# Test Azure connectivity
Test-NetConnection -ComputerName login.microsoftonline.com -Port 443

# View service logs
Get-EventLog -LogName Application -Source "Microsoft AAD Application Proxy Connector"
```

### Azure Portal Quick Links
- **Connector Status:** Entra ID → Application Proxy → Connectors
- **Published Apps:** Entra ID → Application Proxy → Applications
- **Groups:** Entra ID → Groups → Filter: "NPDI-"
- **Sign-in Logs:** Entra ID → Monitoring → Sign-in logs
- **Conditional Access:** Entra ID → Security → Conditional Access

---

## Useful Links

- **Implementation Plan:** [ENTRA_APP_PROXY_IMPLEMENTATION_PLAN.md](./ENTRA_APP_PROXY_IMPLEMENTATION_PLAN.md)
- **IT Requirements:** [IT_REQUIREMENTS_APP_PROXY.md](./IT_REQUIREMENTS_APP_PROXY.md)
- **Azure Portal:** https://portal.azure.com
- **Application Proxy Docs:** https://learn.microsoft.com/en-us/entra/identity/app-proxy/
- **Header-Based SSO:** https://learn.microsoft.com/en-us/entra/identity/app-proxy/application-proxy-configure-single-sign-on-with-headers

---

## Comparison: App Proxy vs MSAL

| Aspect | Application Proxy (This Checklist) | MSAL (Alternative) |
|--------|------------------------------------|--------------------|
| Timeline | 1-2 weeks | 3-4 weeks |
| Code changes | Minimal (read headers) | Significant (OAuth flow) |
| Licensing | Requires Entra ID Premium | Free (works with basic) |
| Complexity | Low | Medium-High |
| Best for | **Quick implementation, internal apps** | Cloud apps, advanced features |

---

**Last Updated:** 2025-11-06
**Owner:** NPDI Development Team
**Status:** Planning Phase
**Approach:** Microsoft Entra Application Proxy

**Ready to implement!** Follow this checklist day-by-day for a successful deployment in 1-2 weeks.
