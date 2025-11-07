# IT Requirements: NPDI Portal - Entra ID Integration

**To:** IT/Azure Administrator
**From:** NPDI Development Team
**Date:** 2025-11-06
**Priority:** Normal
**Estimated Completion Time:** 2-4 hours

---

## Executive Summary

We are integrating the NPDI (New Product Development & Introduction) Portal with Microsoft Entra ID to replace the current development profile system with secure, corporate authentication. This will enable users to log in with their existing Microsoft 365 credentials and provide proper access control.

**Benefits:**
- Single Sign-On with Microsoft 365
- Centralized user management
- Enhanced security with MFA support
- Foundation for future Microsoft Teams integration

---

## Required Actions

### 1. Create App Registration

**Portal:** Azure Portal → Entra ID → App Registrations
**Steps:**
1. Click **"New registration"**
2. Enter application details:
   - **Name:** `NPDI Portal`
   - **Supported account types:** Accounts in this organizational directory only (Single tenant)
   - **Redirect URI:**
     - Type: **Single-page application (SPA)**
     - Development URI: `http://localhost:3000`
     - Production URI: `https://npdi.yourcompany.com` *(to be provided)*

3. Click **"Register"**

**Please provide us with:**
- ✅ **Application (client) ID:** `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`
- ✅ **Directory (tenant) ID:** `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`

---

### 2. Configure Authentication Settings

**Location:** App Registration → Authentication
**Configuration:**

**Platform Configurations:**
- Platform Type: **Single-page application (SPA)**
- Redirect URIs:
  - `http://localhost:3000` (development)
  - `https://npdi.yourcompany.com` (production - will be provided)

**Implicit grant and hybrid flows:**
- ☑️ **Access tokens** (used for implicit flows)
- ☑️ **ID tokens** (used for implicit and hybrid flows)

**Advanced settings:**
- Allow public client flows: **No**
- Supported account types: **My organization only**

---

### 3. Configure API Permissions

**Location:** App Registration → API permissions
**Required Permissions:**

| API | Permission Name | Type | Admin Consent Required | Purpose |
|-----|----------------|------|----------------------|---------|
| Microsoft Graph | User.Read | Delegated | No | Read signed-in user's profile |
| Microsoft Graph | User.ReadBasic.All | Delegated | Yes | Read basic profiles of all users |
| Microsoft Graph | openid | Delegated | No | OpenID Connect sign-in |
| Microsoft Graph | profile | Delegated | No | View users' basic profile |
| Microsoft Graph | email | Delegated | No | View users' email address |

**Steps:**
1. Click **"Add a permission"**
2. Select **"Microsoft Graph"**
3. Choose **"Delegated permissions"**
4. Search for and add each permission listed above
5. Click **"Grant admin consent for [Your Organization]"** *(IMPORTANT)*
6. Confirm admin consent

**Verification:** All permissions should show status **"Granted for [Your Organization]"**

---

### 4. Create Azure AD Groups (for Role Mapping)

**Location:** Azure Portal → Entra ID → Groups
**Required Groups:**

| Group Name | Group Type | Description | Membership Type |
|------------|-----------|-------------|-----------------|
| `NPDI-Admins` | Security | NPDI Portal Administrators - full system access | Assigned |
| `NPDI-PMOps` | Security | Product Management Operations team | Assigned |
| `NPDI-ProductManagers-775` | Security | Product Managers for SBU 775 | Assigned |
| `NPDI-ProductManagers-P90` | Security | Product Managers for SBU P90 | Assigned |
| `NPDI-ProductManagers-440` | Security | Product Managers for SBU 440 | Assigned |
| `NPDI-ProductManagers-P87` | Security | Product Managers for SBU P87 | Assigned |
| `NPDI-ProductManagers-P89` | Security | Product Managers for SBU P89 | Assigned |
| `NPDI-ProductManagers-P85` | Security | Product Managers for SBU P85 | Assigned |

**Steps for each group:**
1. Click **"New group"**
2. **Group type:** Security
3. **Group name:** *(as listed above)*
4. **Group description:** *(from table above)*
5. **Membership type:** Assigned
6. **Owners:** *(add appropriate group owners)*
7. Click **"Create"**

**After creation, please provide us with:**
- ✅ **Object ID** for each group (needed for role mapping in application code)

**Example:**
```
NPDI-Admins: 12345678-1234-1234-1234-123456789012
NPDI-PMOps: 87654321-4321-4321-4321-210987654321
...etc
```

---

### 5. Assign Users to Groups

**Location:** Each Group → Members → Add members

**Initial User Assignment:**
Please assign the following users (or equivalent) for testing:

| User Email | Group(s) | Purpose |
|------------|----------|---------|
| *(admin-user@company.com)* | NPDI-Admins | Testing admin access |
| *(pmops-user@company.com)* | NPDI-PMOps | Testing PM-OPS access |
| *(pm-user@company.com)* | NPDI-ProductManagers-P90 | Testing product manager access |

**Note:** Additional users will be added later by group owners or IT as needed.

---

### 6. (Optional) Create Client Secret

**Only needed if we use a confidential client flow (backend-to-backend communication)**
**Location:** App Registration → Certificates & secrets

**Steps:**
1. Click **"New client secret"**
2. **Description:** `NPDI Backend Secret`
3. **Expires:** 24 months (or according to your organization's policy)
4. Click **"Add"**
5. **IMMEDIATELY COPY THE SECRET VALUE** (shown only once)
6. **Securely provide the secret** via encrypted email or password manager

**NOTE:** We will start with public client flow (SPA), so this may not be immediately needed. We'll request this if required later.

---

## Configuration Summary Checklist

Please confirm completion of the following:

- [ ] App Registration created with name "NPDI Portal"
- [ ] Application (client) ID provided to development team
- [ ] Directory (tenant) ID provided to development team
- [ ] Redirect URIs configured for SPA platform
- [ ] Implicit grant tokens enabled (Access + ID tokens)
- [ ] All 5 API permissions added (User.Read, User.ReadBasic.All, openid, profile, email)
- [ ] Admin consent granted for all permissions
- [ ] All 8 Azure AD security groups created
- [ ] Object IDs for all groups provided to development team
- [ ] Test users assigned to appropriate groups
- [ ] (Optional) Client secret created and securely shared

---

## Expected Output

After completing the above steps, please provide us with the following information:

### Application Details
```
Application Name: NPDI Portal
Application (client) ID: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
Directory (tenant) ID: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
Tenant Name: yourcompany.onmicrosoft.com
```

### Group Object IDs
```
NPDI-Admins: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
NPDI-PMOps: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
NPDI-ProductManagers-775: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
NPDI-ProductManagers-P90: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
NPDI-ProductManagers-440: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
NPDI-ProductManagers-P87: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
NPDI-ProductManagers-P89: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
NPDI-ProductManagers-P85: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
```

### Admin Consent Verification
- [ ] Screenshot of granted permissions showing "Granted for [Organization]" status

---

## Security Considerations

**Data Access:**
- This application will only read basic user profile information (name, email)
- No access to user files, emails, calendar, or other Microsoft 365 data
- Users will see a consent screen on first login explaining permissions

**Token Lifetime:**
- Access tokens expire after 1 hour
- Users will need to re-authenticate after extended inactivity
- Complies with standard Microsoft security practices

**Audit Logging:**
- All sign-ins will be logged in Azure AD sign-in logs
- Can be monitored via Azure Portal → Entra ID → Sign-in logs

---

## Timeline

| Task | Estimated Time | Dependencies |
|------|---------------|--------------|
| Create App Registration | 15 minutes | None |
| Configure authentication | 10 minutes | App Registration |
| Add API permissions | 10 minutes | App Registration |
| Grant admin consent | 5 minutes | API permissions added |
| Create 8 security groups | 20 minutes | None |
| Assign test users | 15 minutes | Groups created |
| Provide configuration details | 10 minutes | All above complete |
| **Total** | **~1.5 hours** | |

---

## Support & Questions

**Development Team Contact:**
- **Primary:** [Your Name/Email]
- **Secondary:** [Team Lead Name/Email]

**Questions We Can Help With:**
- Why specific permissions are needed
- How the authentication flow works
- Application architecture details
- Security review coordination

**Questions for IT:**
- Azure subscription access
- Tenant policies
- Group management policies
- Client secret management policies

---

## Next Steps After Completion

Once you provide the required information:

1. **Development team** will:
   - Configure the NPDI application with provided IDs
   - Begin development work (2-3 weeks)
   - Test in development environment
   - Request UAT with assigned test users

2. **Before production deployment**, we will:
   - Schedule a review meeting
   - Provide production redirect URIs
   - Request production group assignments
   - Coordinate deployment window

---

## Appendix: Verification Steps

### How to Verify App Registration
1. Go to Azure Portal → Entra ID → App Registrations
2. Find "NPDI Portal" in the list
3. Verify:
   - Platform: Single-page application
   - Redirect URIs configured
   - API permissions granted
   - Status: Enabled

### How to Verify Groups
1. Go to Azure Portal → Entra ID → Groups
2. Search for "NPDI-"
3. Verify all 8 groups exist
4. Click each group and note the **Object ID**

### How to Verify Permissions
1. Go to App Registration → API permissions
2. Verify all 5 permissions show **"Granted for [Organization]"**
3. Status should be green checkmark

---

## FAQ

**Q: Why do we need admin consent?**
**A:** `User.ReadBasic.All` requires admin consent because it allows the app to read basic profiles of all users in the organization (not just the signed-in user). This is needed to look up user names for ticket assignment and display.

**Q: Can users from other organizations access this app?**
**A:** No, the app is configured for "Accounts in this organizational directory only" - only users with an account in your Azure AD tenant can sign in.

**Q: What happens if a user doesn't have a group membership?**
**A:** The application will assign them a default role (Product Manager, SBU P90). We recommend ensuring all users are assigned to appropriate groups.

**Q: Can we use existing groups instead of creating new ones?**
**A:** Yes, if you have existing groups that align with the roles, we can map to those instead. Please provide the Object IDs.

**Q: How do we add more users later?**
**A:** Group owners can add members directly, or you can manage centrally via Azure Portal → Entra ID → Groups → [Group Name] → Members → Add members.

**Q: Is MFA supported?**
**A:** Yes, if MFA is enabled in your tenant, users will be prompted for MFA during login. The application fully supports MFA.

**Q: What if we need to revoke access?**
**A:** Remove the user from all NPDI groups. They will immediately lose access on their next login attempt.

---

**Thank you for your assistance with this integration!**

*If you have any questions or concerns, please don't hesitate to reach out to the development team.*
