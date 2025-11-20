const crypto = require('crypto');

/**
 * Encryption Utility for Sensitive Data
 * Uses AES-256-GCM for authenticated encryption
 */
class EncryptionService {
  constructor() {
    // Get encryption key from environment variable
    const encryptionKey = process.env.ENCRYPTION_KEY;

    if (!encryptionKey) {
      console.warn('WARNING: ENCRYPTION_KEY not set in environment variables. Using fallback key (NOT SECURE for production)');
      // Fallback for development only - NOT secure for production
      this.key = crypto.scryptSync('npdi-fallback-key-change-in-production', 'salt', 32);
    } else {
      // Derive a 32-byte key from the environment variable
      this.key = crypto.scryptSync(encryptionKey, 'npdi-salt', 32);
    }

    this.algorithm = 'aes-256-gcm';
  }

  /**
   * Encrypt a string value
   * @param {string} text - Plain text to encrypt
   * @returns {string} - Encrypted text with IV and auth tag (format: iv:authTag:encryptedData)
   */
  encrypt(text) {
    if (!text || text === '') {
      return '';
    }

    try {
      // Generate a random initialization vector
      const iv = crypto.randomBytes(16);

      // Create cipher with key and IV
      const cipher = crypto.createCipheriv(this.algorithm, this.key, iv);

      // Encrypt the text
      let encrypted = cipher.update(text, 'utf8', 'hex');
      encrypted += cipher.final('hex');

      // Get authentication tag for integrity verification
      const authTag = cipher.getAuthTag();

      // Return format: iv:authTag:encryptedData
      return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
    } catch (error) {
      console.error('Encryption error:', error);
      throw new Error('Failed to encrypt data');
    }
  }

  /**
   * Decrypt an encrypted string
   * @param {string} encryptedText - Encrypted text (format: iv:authTag:encryptedData)
   * @returns {string} - Decrypted plain text
   */
  decrypt(encryptedText) {
    if (!encryptedText || encryptedText === '') {
      return '';
    }

    try {
      // Split the encrypted string into components
      const parts = encryptedText.split(':');

      if (parts.length !== 3) {
        // If not in expected format, might be unencrypted legacy data
        console.warn('Data not in encrypted format, returning as-is (legacy data?)');
        return encryptedText;
      }

      const iv = Buffer.from(parts[0], 'hex');
      const authTag = Buffer.from(parts[1], 'hex');
      const encrypted = parts[2];

      // Create decipher with key and IV
      const decipher = crypto.createDecipheriv(this.algorithm, this.key, iv);

      // Set authentication tag for integrity verification
      decipher.setAuthTag(authTag);

      // Decrypt the text
      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');

      return decrypted;
    } catch (error) {
      console.error('Decryption error:', error);
      throw new Error('Failed to decrypt data');
    }
  }

  /**
   * Check if a string is encrypted (matches our format)
   * @param {string} text - Text to check
   * @returns {boolean} - True if encrypted
   */
  isEncrypted(text) {
    if (!text || typeof text !== 'string') {
      return false;
    }

    // Check for our format: hex:hex:hex
    const parts = text.split(':');
    if (parts.length !== 3) {
      return false;
    }

    // Verify each part is valid hex
    const hexRegex = /^[0-9a-f]+$/i;
    return parts.every(part => hexRegex.test(part));
  }

  /**
   * Generate a secure encryption key (for setup)
   * @returns {string} - Random 64-character hex string
   */
  static generateEncryptionKey() {
    return crypto.randomBytes(32).toString('hex');
  }
}

// Export singleton instance
module.exports = new EncryptionService();
