# Authentication System Fix

## Problem

When navigating to the User Management tab in the Admin Dashboard, users were being redirected to the login page. This was caused by a mismatch between the frontend and backend authentication systems.

## Root Cause

1. **Frontend**: Using a mock profile selection system that:
   - Stored only a profile ID in localStorage
   - Sent custom headers (`x-user-role`, `x-user-firstname`, etc.) instead of JWT tokens
   - Had no real `login` function in AuthContext

2. **Backend**: Expecting JWT-based authentication that:
   - Required a Bearer token in the `Authorization` header
   - Validated tokens using the `authenticate` middleware
   - Returned 401 errors when no valid token was provided

3. **API Interceptor**: The 401 error triggered an automatic redirect to the login page

## Solution Implemented

### 1. Updated AuthContext (`client/src/utils/AuthContext.jsx`)

Added real authentication functions:

```javascript
// Added login function that calls the backend API
const login = async (email, password) => {
  const response = await authAPI.login({ email, password });
  const { token, user } = response.data;

  // Store token and user in localStorage
  localStorage.setItem('authToken', token);
  localStorage.setItem('user', JSON.stringify(user));

  setToken(token);
  setUser(user);
  return { success: true };
};

// Added register function
const register = async (userData) => {
  const response = await authAPI.register(userData);
  const { token, user } = response.data;

  localStorage.setItem('authToken', token);
  localStorage.setItem('user', JSON.stringify(user));

  setToken(token);
  setUser(user);
  return { success: true };
};
```

### 2. Updated API Interceptor (`client/src/services/api.js`)

Changed from custom headers to JWT token:

**Before:**
```javascript
apiClient.interceptors.request.use((config) => {
  const savedProfile = localStorage.getItem('selectedProfile');
  if (savedProfile) {
    const profile = profiles.find(p => p.id === savedProfile);
    config.headers['x-user-role'] = profile.role;
    config.headers['x-user-firstname'] = profile.firstName;
    // etc...
  }
  return config;
});
```

**After:**
```javascript
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```

### 3. Updated Response Interceptor

Changed redirect target from profile selection to login:

```javascript
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      window.location.href = '/login';  // Changed from '/select-profile'
    }
    return Promise.reject(error);
  }
);
```

### 4. Updated Auth Middleware

Updated to use the correct Permission model method names (privileges instead of permissions):

```javascript
const checkPermission = (section, action) => {
  return async (req, res, next) => {
    if (req.user.role === 'ADMIN') {
      return next();
    }

    const rolePrivileges = await Permission.getPrivilegesForRole(req.user.role);

    if (!rolePrivileges || !rolePrivileges[section] || !rolePrivileges[section][action]) {
      return res.status(403).json({
        message: `You do not have permission to ${action} ${section}.`
      });
    }

    next();
  };
};
```

## How It Works Now

1. **User logs in** via the Login page
2. **Backend validates credentials** and generates a JWT token
3. **Token is stored** in localStorage along with user data
4. **All API requests** include the token in the `Authorization: Bearer <token>` header
5. **Backend validates** the token on protected routes
6. **If token is invalid/missing**, user is redirected to login

## Testing the Fix

### 1. Create a Test User

You'll need actual users in the database. Run:

```bash
node create-default-users.js
```

Or register a new admin user via the Register page.

### 2. Login

1. Go to `/login`
2. Enter credentials:
   - Email: (user email from database)
   - Password: (user password)
3. Click "Sign in"

### 3. Navigate to User Management

1. Go to Admin Dashboard
2. Click on "User Management" tab
3. Should now load users without redirect

### 4. Verify Token is Sent

Open browser DevTools > Network tab:
- Click on any API request
- Check Headers
- Should see: `Authorization: Bearer eyJhbGc...` (your token)

## Migration Notes

### For Development

The mock profile selection system is still available for quick testing:
- The `selectProfile()` function still exists in AuthContext
- However, it won't work with protected routes that require JWT tokens
- Use real login instead

### For Production

1. All users must be in the MongoDB database
2. Users must login with email/password
3. JWT tokens expire after 24 hours (configurable via `JWT_EXPIRES_IN` env variable)
4. No token refresh implemented yet - users must re-login when token expires

## Environment Variables

Required in `.env`:

```
JWT_SECRET=your-secret-key-here
JWT_EXPIRES_IN=24h
MONGODB_URI=mongodb://localhost:27017/npdi
```

## Future Enhancements

1. **Token Refresh**: Implement automatic token refresh before expiration
2. **Remember Me**: Longer-lived refresh tokens for "remember me" functionality
3. **Session Management**: Track active sessions, allow logout from all devices
4. **Password Reset**: Email-based password reset flow
5. **2FA**: Two-factor authentication for admin users

## Troubleshooting

### Still getting redirected to login

1. Check localStorage for `authToken`:
   ```javascript
   localStorage.getItem('authToken')
   ```

2. Verify token is valid:
   - Decode at jwt.io
   - Check expiration

3. Check server logs for auth errors

### 401 Unauthorized errors

1. Ensure MongoDB is running
2. Verify user exists and is active
3. Check JWT_SECRET matches between environments
4. Ensure token hasn't expired

### User data not loading

1. Check network tab for API responses
2. Verify user has required permissions (ADMIN role for User Management)
3. Check backend logs for errors

## API Documentation

### POST /api/auth/login

**Request:**
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123"
}
```

**Response:**
```json
{
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "60d5ec49f1b2c72b8c8e4f3a",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "ADMIN",
    "sbu": "Life Science"
  }
}
```

### POST /api/auth/register

**Request:**
```json
{
  "email": "newuser@example.com",
  "firstName": "Jane",
  "lastName": "Smith",
  "role": "PRODUCT_MANAGER",
  "sbu": "Electronics",
  "password": "SecurePassword123"
}
```

**Response:**
```json
{
  "message": "User registered successfully",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "60d5ec49f1b2c72b8c8e4f3b",
    "email": "newuser@example.com",
    "firstName": "Jane",
    "lastName": "Smith",
    "role": "PRODUCT_MANAGER",
    "sbu": "Electronics"
  }
}
```

## Files Modified

1. `client/src/utils/AuthContext.jsx` - Added login/register functions
2. `client/src/services/api.js` - Updated interceptors for JWT
3. `server/middleware/auth.js` - Updated to use correct Permission model methods
4. `client/src/components/admin/PermissionsManagement.jsx` - Updated to use privileges structure

## Summary

The authentication system now properly uses JWT tokens for all API requests. Users must log in with valid credentials stored in MongoDB. The frontend sends tokens in the Authorization header, and the backend validates them on protected routes. This fixes the redirect issue in User Management and establishes a proper authentication foundation for the application.
