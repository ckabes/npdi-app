# API Key Storage and Encryption

## Overview

The NPDI application handles two types of API keys with different security approaches based on their purpose and usage patterns.

---

## 1. External API Keys (Third-Party Access to NPDI)

### Purpose

External API keys allow third-party applications to authenticate and access NPDI ticket data via the REST API.

### Storage Location

MongoDB collection: `apikeys`

### Security Model

**Cryptographic Hashing (SHA-256)** - The API key is never stored in the database.

### Implementation

**File:** `/server/models/ApiKey.js`

#### Key Generation

When an API key is generated:
```javascript
generateKey() {
  return crypto.randomBytes(32).toString('hex');
  // Returns: 64-character random hexadecimal string
  // Example: "a1b2c3d4e5f6...7890abcdef"
}
```

#### Key Storage

The plain-text key is **never** stored. Only a SHA-256 hash is saved:
```javascript
hashKey(key) {
  return crypto.createHash('sha256').update(key).digest('hex');
  // Returns: SHA-256 hash of the key
}
```

**Database fields:**
- `keyHash`: SHA-256 hash of the key (64 characters)
- `keyPrefix`: First 8 characters of the key (for display only)
- `keyHash` is indexed for fast lookup

#### Authentication Process

1. Client sends API key in `X-API-Key` HTTP header
2. Server receives the key and computes SHA-256 hash
3. Server queries database for matching `keyHash`
4. If match found and key is active/valid, request is authenticated

#### Security Features

- **One-way hashing**: Cannot reverse SHA-256 to get original key
- **Shown only once**: Key displayed to user immediately after generation
- **Cannot retrieve**: If user loses key, they must generate a new one
- **Hash excluded from API responses**: `toJSON()` method removes `keyHash` field
- **Expiration support**: Optional `expiresAt` field
- **Usage tracking**: `lastUsedAt` and `usageCount` fields
- **Rate limiting**: `rateLimit.requestsPerHour` field
- **IP whitelisting**: Optional `ipWhitelist` array

---

## 2. Azure OpenAI API Key (AI Content Generation)

### Purpose

The Azure OpenAI API key authenticates NPDI with Microsoft Azure's OpenAI service to generate product descriptions and marketing content.

### Storage Location

MongoDB collection: `systemsettings`
Field path: `integrations.langdock.apiKey` (field name retained for backward compatibility)

### Security Model

**AES-256-GCM Encryption** - The API key is encrypted at rest in the database and decrypted when needed for API calls.

### Implementation

**Files:**
- `/server/utils/encryption.js` - Encryption utility
- `/server/models/SystemSettings.js` - Database model with encryption hooks
- `/server/services/azureOpenAIService.js` - Decrypts key for API calls

#### Encryption Algorithm

**AES-256-GCM (Galois/Counter Mode)**
- Symmetric encryption algorithm
- 256-bit key strength
- Authenticated encryption (provides both confidentiality and integrity)
- Random Initialization Vector (IV) for each encryption

#### Encryption Process

When an admin saves the Azure OpenAI API key in System Settings:

1. **Pre-save hook** detects if `integrations.langdock.apiKey` was modified
2. Checks if value is already encrypted using format detection
3. If plain text, encrypts using AES-256-GCM:
   - Generates random 16-byte IV (Initialization Vector)
   - Creates cipher with encryption key and IV
   - Encrypts the plain text API key
   - Retrieves authentication tag for integrity verification
   - Stores in format: `iv:authTag:encryptedData` (all in hexadecimal)

**Example encrypted value in database:**
```
03a6e207b3b1f412696b8146a9b83c3f:c69854ea7a899bd15e4a3b2c1d0e9f8a:7b6c5d4e3f2a1b0c9d8e7f6a5b4c3d2e
└─────────── IV ─────────────┘ └──── Auth Tag ────┘ └──── Encrypted Data ────┘
```

#### Decryption Process

When making an Azure OpenAI API call:

1. **azureOpenAIService** loads settings from database
2. Calls `settings.getDecryptedApiKey()` method
3. Decryption method:
   - Splits encrypted string into IV, authTag, and encryptedData
   - Creates decipher with encryption key and IV
   - Sets authentication tag for integrity verification
   - Decrypts the data to retrieve original plain text API key
4. Plain text key is used in `api-key` HTTP header for Azure OpenAI request
5. Plain text key remains in memory only during the API call

#### Encryption Key Storage

The encryption key is stored in an environment variable:

**File:** `.env`
```bash
ENCRYPTION_KEY=7a8f9c3d2e1b6a5f4c3d2e1a9b8c7d6e5f4a3b2c1d0e9f8a7b6c5d4e3f2a1b0
```

**Key derivation:**
```javascript
// The environment variable is used to derive the actual encryption key
const key = crypto.scryptSync(process.env.ENCRYPTION_KEY, 'npdi-salt', 32);
```

**Scrypt** is used to derive a 32-byte (256-bit) key from the environment variable using a salt.

#### Security Features

- **Encrypted at rest**: API key is encrypted in MongoDB
- **Decrypted on-demand**: Only decrypted when needed for API calls
- **Memory-only plain text**: Decrypted key exists in memory only during API call
- **Authenticated encryption**: GCM mode provides integrity verification
- **Random IV**: Each encryption uses a unique IV
- **Masked in API responses**: Returns `********` instead of encrypted value
- **Masked in UI**: Input type="password" in admin interface
- **Partial logging**: Only last 8 characters shown in server logs
- **Format detection**: Automatically detects if value is already encrypted

#### API Response Sanitization

**File:** `/server/controllers/systemSettingsController.js`

When settings are retrieved via API:
```javascript
// Mask Azure OpenAI API key (encrypted in database)
if (sanitizedSettings.integrations?.langdock?.apiKey) {
  sanitizedSettings.integrations.langdock.apiKey = '********';
}
```

When settings are updated:
```javascript
// Don't allow updating if masked (user didn't change it)
if (updates.integrations?.langdock?.apiKey === '********') {
  delete updates.integrations.langdock.apiKey;
}
```

---

## Performance Impact

### Encryption/Decryption Speed

Measured on standard server hardware (1000 operations):
- **Encryption**: 0.020ms per operation
- **Decryption**: 0.008ms per operation

### API Call Comparison

| Operation | Duration |
|-----------|----------|
| Decrypt API key | 0.008ms |
| Network latency | 100-500ms |
| Azure OpenAI API call | 10,000-30,000ms |
| **Total overhead** | **0.00008%** |

The encryption/decryption overhead is negligible compared to network and API latency.

---

## Why Different Approaches?

### External API Keys → Hashing

- NPDI generates and owns these keys
- Users authenticate TO NPDI
- Key can be regenerated if compromised
- Server never needs the original key
- One-way hash is sufficient for verification
- Industry best practice for authentication tokens

### Azure OpenAI API Key → Encryption

- Microsoft Azure owns this key
- NPDI authenticates TO Azure
- Server needs the actual key to make API calls
- Must be reversible (decrypt to use)
- Encrypted storage protects against database breach
- Standard practice for third-party credentials

---

## Security Recommendations

### Production Deployment

1. **Generate unique encryption key** for production:
   ```bash
   node server/scripts/generateEncryptionKey.js
   ```

2. **Store encryption key securely**:
   - Use environment variable (not in code)
   - Different keys for dev/staging/production
   - Keep secure backup of encryption key
   - **Losing encryption key = losing encrypted data**

3. **Protect .env file**:
   - Never commit to version control (.gitignore)
   - Restrict file permissions (chmod 600)
   - Use secret management service (Azure Key Vault, AWS Secrets Manager)

4. **Rotate keys periodically**:
   - External API keys: Regenerate every 90 days
   - Azure OpenAI key: Rotate per Microsoft's recommendations
   - Encryption key: Rotate annually (requires re-encrypting all data)

### Additional Security Layers

Current implementation:
- Encryption at rest (AES-256-GCM)
- Masked in API responses
- Masked in UI
- Admin-only access
- Audit logging (updates tracked with user email)

Future considerations:
- MongoDB encryption at rest (enterprise feature)
- TLS/SSL for database connections
- Azure Key Vault integration
- Secrets rotation automation

---

## Tools and Scripts

### Generate Encryption Key

```bash
node server/scripts/generateEncryptionKey.js
```

Generates a secure random 64-character hexadecimal encryption key.

### Test Encryption

```bash
node server/scripts/testEncryption.js
```

Tests encryption/decryption functionality and measures performance.

### Generate External API Key

```bash
node server/scripts/generateApiKey.js
```

Generates a new external API key with SHA-256 hash.

---

## Database Schema

### External API Keys Collection

```javascript
{
  _id: ObjectId,
  name: String,              // Display name
  description: String,       // Purpose description
  keyHash: String,           // SHA-256 hash (indexed, unique)
  keyPrefix: String,         // First 8 chars (for display)
  isActive: Boolean,         // Active status
  permissions: [String],     // ['read', 'write', 'admin']
  lastUsedAt: Date,          // Last usage timestamp
  usageCount: Number,        // Total API calls
  rateLimit: {
    requestsPerHour: Number  // Rate limit
  },
  expiresAt: Date,           // Optional expiration
  createdBy: String,         // Creator email
  createdAt: Date,
  updatedAt: Date,
  ipWhitelist: [String],     // Optional IP restrictions
  application: String        // Application name
}
```

### System Settings (Azure OpenAI Key)

```javascript
{
  _id: ObjectId,
  integrations: {
    langdock: {              // Field name retained for backward compatibility
      enabled: Boolean,
      apiKey: String,        // Encrypted (format: iv:authTag:data)
      environment: String,   // 'dev', 'test', 'staging', 'prod'
      apiVersion: String,    // '2024-10-21'
      model: String,         // 'gpt-4o-mini'
      timeout: Number,       // Seconds
      maxTokens: Number,     // Token limit
      quota: {
        total: Number,
        used: Number,
        remaining: Number,
        resetDate: Date,
        expiryDate: Date
      }
    }
  },
  // ... other settings
}
```

**Note:** The field is named `langdock` for backward compatibility, but it contains Azure OpenAI configuration.

---

## Summary

| Feature | External API Keys | Azure OpenAI Key |
|---------|------------------|------------------|
| **Purpose** | Third-party → NPDI | NPDI → Azure |
| **Collection** | apikeys | systemsettings |
| **Security** | SHA-256 hashing | AES-256-GCM encryption |
| **Reversible** | No | Yes |
| **Storage** | Hash only | Encrypted value |
| **Retrieval** | Impossible | Decrypted on-demand |
| **Display** | Prefix (8 chars) | Masked (********) |
| **Performance** | N/A (hash comparison) | 0.008ms decryption |
| **Use Case** | Authentication verification | API calls to third party |
| **Best Practice** | Industry standard | Industry standard |

Both approaches follow security best practices appropriate for their specific use cases.
