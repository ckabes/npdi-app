# IT Requirements: NPDI Portal - Application Proxy Integration

**To:** IT/Azure Administrator
**From:** NPDI Development Team
**Date:** 2025-11-06
**Priority:** Normal
**Estimated Completion Time:** 1-2 hours
**Approach:** Microsoft Entra Application Proxy (Reverse Proxy Authentication)

---

## Executive Summary

We are integrating the NPDI (New Product Development & Introduction) Portal with **Microsoft Entra Application Proxy** to replace the current development profile system with secure, corporate authentication.

**What is Application Proxy?**
A reverse proxy service that authenticates users at Microsoft's login page, then forwards authenticated requests to NPDI with user information in HTTP headers. The application simply reads the headers - no OAuth code required.

**Benefits:**
- Simple setup (1-2 hours)
- Centralized access control
- Automatic SSO with Microsoft 365
- MFA support via Entra ID policies
- No inbound firewall ports needed

---

## Prerequisites Check

Before starting, please verify:

- [x] **Licensing:** Entra ID Premium P1 or P2
  - Check: Azure Portal → Entra ID → Licenses
  - Required for Application Proxy and group claims

- [ ] **Windows Server:** For connector agent
  - Windows Server 2012 R2 or later (2019/2022 recommended)
  - 2 CPU cores, 4GB RAM (minimum)
  - Can be VM
  - Outbound HTTPS (443) to Azure required

- [ ] **Network:** Outbound HTTPS connectivity
  - Required domains:
    - `*.msappproxy.net`
    - `*.servicebus.windows.net`
    - `login.microsoftonline.com`
  - No inbound ports required!

- [ ] **Permissions:** Global Admin or Application Admin
  - Required to install connector and publish application

---

## Required Actions

### Task 1: Install Application Proxy Connector (30 minutes)

**Purpose:** Install agent on Windows Server to proxy requests from Azure to NPDI

**Steps:**

1. **Download Connector:**
   - Navigate to: `Azure Portal → Entra ID → Application Proxy`
   - Click **"Download connector service"**
   - Save installer to Windows Server

2. **Install Connector:**
   - On Windows Server, run installer as **Administrator**
   - Follow wizard (default settings are fine)
   - When prompted, **sign in** with Global Admin or Application Admin account
   - Connector automatically registers with your tenant
   - Installation completes in ~5 minutes

3. **Verify Installation:**
   - Go back to: `Azure Portal → Entra ID → Application Proxy → Connectors`
   - Verify connector shows status: **"Active"**
   - Note the connector name (e.g., `SERVER01-Connector`)

**PowerShell Installation (Alternative):**
```powershell
# Download
$url = "https://download.msappproxy.net/Subscription/d3c8b69d-6bf7-42be-a529-3fe9c2e70c90/Connector/Download"
Invoke-WebRequest -Uri $url -OutFile "C:\Temp\ConnectorInstaller.exe"

# Install silently (requires admin credentials interactively)
Start-Process -FilePath "C:\Temp\ConnectorInstaller.exe" -ArgumentList "/quiet" -Wait

# Verify
Get-Service -Name WAPConnectorUpdater
# Status should be "Running"
```

**Production Recommendation:**
- Install connector on **2+ servers** for high availability
- Connectors automatically load-balance
- If one connector fails, traffic routes to others

---

### Task 2: Publish NPDI Application (30 minutes)

**Purpose:** Configure Application Proxy to route external URL to NPDI

**Steps:**

1. **Create New Application:**
   - Navigate to: `Azure Portal → Entra ID → Application Proxy → Applications`
   - Click **"+ New application"**

2. **Configure Basic Settings:**
   ```
   Name: NPDI Portal

   Internal URL: http://localhost:5000
   (This is where NPDI runs on the connector server)

   External URL: https://npdi-yourcompany.msappproxy.net
   (Azure provides this URL automatically)

   Pre-authentication: Azure Active Directory
   (REQUIRED - this forces user login)

   Connector group: Default
   (Or create custom group if you have multiple connectors)

   Backend application timeout: Long
   (For file uploads and long-running operations)
   ```

3. **Configure Additional Settings:**
   ```
   Translate URLs in headers: Yes
   Translate URLs in application body: No
   Use HTTP-Only Cookie: No
   Use Secure Cookie: Yes
   Use Persistent Cookie: Yes
   ```

4. **Click "Add"**

5. **Note the External URL:**
   - Copy the external URL (e.g., `https://npdi-yourcompany.msappproxy.net`)
   - Provide this to the development team

**Custom Domain (Optional but Recommended):**

If you want to use your own domain (e.g., `https://npdi.company.com`):

1. In the application settings, click **"Custom domains"**
2. Click **"+ Add custom domain"**
3. Enter your domain: `npdi.company.com`
4. Upload SSL certificate (or use wildcard cert)
5. Configure DNS:
   - Add CNAME record: `npdi.company.com → npdi-yourcompany.msappproxy.net`
   - Wait for DNS propagation (~15 minutes)
6. Verify custom domain works

---

### Task 3: Configure Single Sign-On (15 minutes)

**Purpose:** Configure Application Proxy to pass user information via HTTP headers

**Steps:**

1. **Enable Header-Based SSO:**
   - Go to your published application → **Single sign-on**
   - Select **"Header-based"** as SSO method
   - Click **"Save"**

2. **Configure Headers:**
   - Click **"Edit"** on Header-based sign-on
   - Configure the following headers:

   | Header Name | Attribute Source |
   |-------------|------------------|
   | `X-MS-CLIENT-PRINCIPAL-NAME` | `user.userprincipalname` |
   | `X-MS-CLIENT-PRINCIPAL-ID` | `user.objectid` |
   | `X-MS-CLIENT-PRINCIPAL-IDP` | `aad` (constant value) |

   **To add each header:**
   - Click **"+ Add new header"**
   - Enter header name
   - Select attribute source from dropdown
   - Click **"Add"**

3. **Enable Group Claims:**
   - Go to: Application → **Token configuration**
   - Click **"+ Add groups claim"**
   - Select **"Security groups"**
   - In "ID" section, check **"Group ID"**
   - In "Access" section, check **"Group ID"**
   - Click **"Add"**

   This adds the `X-MS-CLIENT-PRINCIPAL-GROUPS` header with group Object IDs

4. **Click "Save"**

**Verification:**
- Headers are now configured
- Application Proxy will add these headers to every request to NPDI

---

### Task 4: Create Azure AD Groups (20 minutes)

**Purpose:** Create groups for role-based access control

**Required Groups:**

| Group Name | Group Type | Description | Members (Initial) |
|------------|-----------|-------------|-------------------|
| `NPDI-Admins` | Security | NPDI Portal Administrators | IT admin (for testing) |
| `NPDI-PMOps` | Security | Product Management Operations | PM-OPS user (for testing) |
| `NPDI-ProductManagers-775` | Security | Product Managers for SBU 775 | PM user (for testing) |
| `NPDI-ProductManagers-P90` | Security | Product Managers for SBU P90 | PM user (for testing) |
| `NPDI-ProductManagers-440` | Security | Product Managers for SBU 440 | (empty for now) |
| `NPDI-ProductManagers-P87` | Security | Product Managers for SBU P87 | (empty for now) |
| `NPDI-ProductManagers-P89` | Security | Product Managers for SBU P89 | (empty for now) |
| `NPDI-ProductManagers-P85` | Security | Product Managers for SBU P85 | (empty for now) |

**Steps for Each Group:**

1. Navigate to: `Azure Portal → Entra ID → Groups`
2. Click **"+ New group"**
3. Fill in details:
   ```
   Group type: Security
   Group name: (from table above)
   Group description: (from table above)
   Membership type: Assigned
   Owners: (add appropriate group owners)
   Members: (add initial test users)
   ```
4. Click **"Create"**
5. **IMPORTANT:** After creation, click on the group and note its **Object ID**
   - Example: `12345678-1234-1234-1234-123456789012`
   - You will need to provide these Object IDs to the development team

**Shortcut (PowerShell):**
```powershell
# Connect to Azure AD
Connect-AzureAD

# Create groups
$groups = @(
    "NPDI-Admins",
    "NPDI-PMOps",
    "NPDI-ProductManagers-775",
    "NPDI-ProductManagers-P90",
    "NPDI-ProductManagers-440",
    "NPDI-ProductManagers-P87",
    "NPDI-ProductManagers-P89",
    "NPDI-ProductManagers-P85"
)

foreach ($groupName in $groups) {
    New-AzureADGroup -DisplayName $groupName `
                     -SecurityEnabled $true `
                     -MailEnabled $false `
                     -MailNickname $groupName.Replace("-","")
    Write-Host "Created: $groupName"
}

# List all groups with Object IDs
Get-AzureADGroup -Filter "startswith(displayName,'NPDI-')" |
    Select-Object DisplayName, ObjectId |
    Format-Table
```

---

### Task 5: Assign Users to Application (15 minutes)

**Purpose:** Grant users access to NPDI Portal

**Steps:**

1. **Assign Groups to Application:**
   - Navigate to: Your published application → **Users and groups**
   - Click **"+ Add user/group"**
   - Click **"Users and groups"** → **"None Selected"**
   - Search for and select groups:
     - `NPDI-Admins`
     - `NPDI-PMOps`
     - `NPDI-ProductManagers-775`
     - `NPDI-ProductManagers-P90`
   - Click **"Select"**
   - Click **"Assign"**

2. **Assign Individual Test Users (Optional):**
   - Repeat above steps but select individual users instead of groups
   - Good for initial testing before assigning entire groups

**Important Notes:**
- Only assigned users/groups can access the application
- Users must be in at least one assigned group/user list
- Users see consent screen on first login (one-time)

---

### Task 6: Configure Conditional Access (Optional but Recommended)

**Purpose:** Enforce MFA and other security policies

**Steps:**

1. **Create Conditional Access Policy:**
   - Navigate to: `Azure Portal → Entra ID → Security → Conditional Access`
   - Click **"+ New policy"**

2. **Configure Policy:**
   ```
   Name: Require MFA for NPDI Portal

   Users and groups:
   - Include: All users (or specific groups)

   Cloud apps or actions:
   - Select: NPDI Portal (from app list)

   Conditions:
   - Locations: Any location

   Grant:
   - Require multi-factor authentication

   Enable policy: On
   ```

3. **Click "Create"**

**Additional Policies to Consider:**
- Require compliant device
- Block legacy authentication
- Require approved client app
- Sign-in risk-based policy

---

## Configuration Summary Checklist

Please confirm completion and provide the following information:

### Connector Installation
- [ ] Connector installed on Windows Server
- [ ] Connector status shows "Active" in Azure Portal
- [ ] Connector server name: `__________________`

### Application Publishing
- [ ] NPDI application published
- [ ] External URL: `__________________________________________________`
- [ ] Internal URL: `http://localhost:5000` (or custom)
- [ ] Pre-authentication: Azure Active Directory ✓

### Single Sign-On Configuration
- [ ] SSO method: Header-based ✓
- [ ] Headers configured:
  - [ ] X-MS-CLIENT-PRINCIPAL-NAME
  - [ ] X-MS-CLIENT-PRINCIPAL-ID
  - [ ] X-MS-CLIENT-PRINCIPAL-IDP
- [ ] Group claims enabled ✓

### Azure AD Groups
- [ ] All 8 groups created
- [ ] Group Object IDs documented (see table below)
- [ ] Test users assigned to groups

### User/Group Assignment
- [ ] Groups assigned to application
- [ ] Test users can access application
- [ ] Users redirected to Microsoft login

### Optional Configuration
- [ ] Custom domain configured: `__________________`
- [ ] SSL certificate uploaded
- [ ] DNS CNAME record created
- [ ] Conditional Access policy created
- [ ] MFA enforcement enabled

---

## Required Information to Provide

Please fill out and provide to the development team:

### Application Details
```
Application Name: NPDI Portal
External URL: https://npdi-yourcompany.msappproxy.net
Internal URL: http://localhost:5000
Tenant ID: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
Tenant Name: yourcompany.onmicrosoft.com
```

### Connector Details
```
Connector Server: __________________
Connector Status: Active
Connector Count: _____ (recommend 2+)
```

### Group Object IDs (CRITICAL - Development team needs these)
```
NPDI-Admins:                  xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
NPDI-PMOps:                   xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
NPDI-ProductManagers-775:     xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
NPDI-ProductManagers-P90:     xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
NPDI-ProductManagers-440:     xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
NPDI-ProductManagers-P87:     xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
NPDI-ProductManagers-P89:     xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
NPDI-ProductManagers-P85:     xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
```

**How to find Object IDs:**
- Azure Portal → Entra ID → Groups
- Click on each group
- Copy the "Object ID" field

### Test User Assignments
```
Admin test user: __________________@yourcompany.com (member of NPDI-Admins)
PM-OPS test user: __________________@yourcompany.com (member of NPDI-PMOps)
PM test user: __________________@yourcompany.com (member of NPDI-ProductManagers-775)
```

---

## Verification Steps

After completing all tasks, please verify:

### 1. Connector Verification
```powershell
# On connector server
Get-Service -Name WAPConnectorUpdater
# Should show: Running
```

**Or in Azure Portal:**
- Entra ID → Application Proxy → Connectors
- Status should show: **"Active"**
- Last check-in should be recent (< 5 minutes ago)

### 2. Application Access Test
1. Open browser (private/incognito mode)
2. Navigate to external URL (e.g., `https://npdi-yourcompany.msappproxy.net`)
3. Should redirect to: `https://login.microsoftonline.com/...`
4. Sign in with test user credentials
5. Should see NPDI application (may show error initially - that's OK, backend not updated yet)

### 3. Headers Verification (For IT Admin)
After application deployed by dev team:
1. Access external URL
2. Sign in
3. Open browser developer tools → Network tab
4. Refresh page
5. Click on any request to NPDI backend
6. Check request headers - should see:
   ```
   X-MS-CLIENT-PRINCIPAL-NAME: user@company.com
   X-MS-CLIENT-PRINCIPAL-ID: {object-id}
   X-MS-CLIENT-PRINCIPAL-IDP: aad
   X-MS-CLIENT-PRINCIPAL-GROUPS: {group-ids}
   ```

### 4. Group Membership Test
- Test user in **NPDI-Admins**: Should have admin access
- Test user in **NPDI-PMOps**: Should have PM-OPS access
- Test user in **NPDI-ProductManagers-775**: Should have PM access for SBU 775

---

## Troubleshooting

### Issue: Connector Shows "Inactive"

**Causes:**
- Connector service not running
- Network connectivity issues
- Connector not registered

**Solutions:**
```powershell
# Restart connector service
Restart-Service -Name WAPConnectorUpdater

# Check service status
Get-Service -Name WAPConnectorUpdater

# Check connectivity
Test-NetConnection -ComputerName login.microsoftonline.com -Port 443
```

### Issue: "Application is Unavailable"

**Causes:**
- Connector not active
- Internal URL incorrect
- NPDI application not running on internal URL

**Solutions:**
1. Verify connector is active
2. Check internal URL in Application Proxy settings
3. Test internal URL from connector server:
   ```powershell
   Invoke-WebRequest -Uri "http://localhost:5000" -UseBasicParsing
   ```

### Issue: Headers Not Present

**Causes:**
- SSO not configured
- Headers not mapped correctly
- Group claims not enabled

**Solutions:**
1. Verify SSO method is "Header-based"
2. Check header configuration in Application → Single sign-on
3. Verify group claims enabled in Token configuration

### Issue: User Cannot Access Application

**Causes:**
- User not assigned to application
- User not in any assigned groups
- Conditional Access policy blocking

**Solutions:**
1. Check application → Users and groups
2. Verify user is member of assigned group
3. Check Conditional Access policies

### Issue: MFA Not Required

**Causes:**
- Conditional Access policy not configured
- Policy targeting wrong application
- User excluded from policy

**Solutions:**
1. Verify Conditional Access policy exists
2. Check policy targets "NPDI Portal" application
3. Verify user not in exclusion list

---

## Security Considerations

### Network Security
- **Connector makes outbound-only connections** - No inbound ports needed ✓
- **Consider:** Block direct access to internal URL (http://localhost:5000)
- **Recommended:** Only allow connections from connector server IP

### Connector Security
- **Install on hardened Windows Server** (patches, antivirus, etc.)
- **Run connector service as limited service account** (not admin)
- **Install multiple connectors** for redundancy and load balancing
- **Monitor connector status** regularly

### User Access Security
- **Use Conditional Access** to enforce MFA
- **Regularly review** user/group assignments
- **Remove users promptly** when they leave organization
- **Use Azure AD sign-in logs** to monitor access

### Header Security
- **Application Proxy strips user-supplied X-MS-* headers** ✓
- **Only Application Proxy can set these headers** ✓
- **Backend validates header presence** (development team implements)

---

## Timeline

| Task | Time Required | Dependencies |
|------|---------------|--------------|
| Install connector | 30 minutes | Windows Server access |
| Publish application | 30 minutes | Connector installed |
| Configure SSO | 15 minutes | Application published |
| Create groups | 20 minutes | None |
| Assign users | 15 minutes | Groups created, application published |
| **Total** | **~2 hours** | |

---

## Support & Questions

### Development Team Contact
- **Primary:** [Your Name/Email]
- **Secondary:** [Team Lead Name/Email]

### Common Questions

**Q: What if we don't have Entra ID Premium?**
**A:** Application Proxy requires Premium P1 or P2. If unavailable, development team can use alternate authentication method (MSAL).

**Q: Can we use existing groups?**
**A:** Yes! If you have existing groups that align with roles (Admin, PM-OPS, PM), you can use those. Just provide the Object IDs.

**Q: How do we add more users later?**
**A:** Two options:
1. Add users to existing groups (recommended)
2. Assign users directly to application (Users and groups)

**Q: What if connector server needs maintenance?**
**A:** If you have 2+ connectors, take one offline and service it. Other(s) will handle traffic.

**Q: Can users access from home/mobile?**
**A:** Yes! Application Proxy works from anywhere with internet access.

**Q: Does this work with mobile devices?**
**A:** Yes! Works on any device with a modern browser.

**Q: How do we revoke access?**
**A:** Remove user from groups or unassign from application. Takes effect immediately.

**Q: Can we test without affecting production users?**
**A:** Yes! Create a separate "NPDI-Staging" application first for testing.

---

## Next Steps After Completion

Once you've completed all tasks and provided the information above:

1. **Development team** will:
   - Configure backend to read Application Proxy headers
   - Map group Object IDs to NPDI roles
   - Test with provided test users
   - Deploy changes (1 week)

2. **Before production deployment:**
   - Schedule brief review meeting
   - Verify all test users can access
   - Confirm group mappings correct
   - Coordinate go-live window

3. **After production deployment:**
   - Monitor Azure AD sign-in logs
   - Respond to any user access issues
   - Regular connector health checks

---

## Maintenance & Ongoing Support

### Regular Tasks (IT Team)

**Weekly:**
- [ ] Check connector status (Active)
- [ ] Review Azure AD sign-in logs for errors
- [ ] Monitor application usage

**Monthly:**
- [ ] Review user/group assignments
- [ ] Check for Windows updates on connector server
- [ ] Verify connector service health

**As Needed:**
- [ ] Add/remove users from groups
- [ ] Create new groups for additional SBUs
- [ ] Update Conditional Access policies
- [ ] Install additional connectors

### Updating User Access

**To grant access to a new user:**
1. Add user to appropriate group (NPDI-Admins, NPDI-PMOps, or NPDI-ProductManagers-*)
2. Access is immediate

**To remove access:**
1. Remove user from all NPDI-* groups
2. Access revoked immediately

**To change user role:**
1. Remove from old group
2. Add to new group
3. User gets new role on next login

---

**Thank you for setting up Application Proxy for the NPDI Portal!**

This integration will provide secure, enterprise-grade authentication while being simple to manage and maintain.

If you have any questions or encounter issues during setup, please don't hesitate to contact the development team.

---

**Document Version:** 1.0
**Date:** 2025-11-06
**Approach:** Microsoft Entra Application Proxy
