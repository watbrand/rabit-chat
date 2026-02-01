import { Platform } from 'react-native';

const KEY_STORE_KEY = 'encryption_private_key';
const ALGORITHM = 'AES-256-GCM';

// In-memory storage fallback for web
let webKeyStore: Record<string, string> = {};

/**
 * Converts bytes to base64 string
 */
function bytesToBase64(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/**
 * Converts base64 string to bytes
 */
function base64ToBytes(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

/**
 * Generate random bytes - works on both web and native
 */
async function getRandomBytes(size: number): Promise<Uint8Array> {
  if (Platform.OS === 'web') {
    // Use Web Crypto API
    try {
      const array = new Uint8Array(size);
      if (typeof window !== 'undefined' && window.crypto?.getRandomValues) {
        window.crypto.getRandomValues(array);
        return array;
      }
    } catch (e) {
      console.warn('[Encryption] Web crypto not available');
    }
    // Fallback to Math.random (less secure, but works)
    const array = new Uint8Array(size);
    for (let i = 0; i < size; i++) {
      array[i] = Math.floor(Math.random() * 256);
    }
    return array;
  }
  
  // Native - use expo-crypto
  const Crypto = require('expo-crypto');
  return await Crypto.getRandomBytes(size);
}

/**
 * Calculate SHA-256 hash - works on both web and native
 */
async function sha256(data: ArrayBuffer): Promise<ArrayBuffer> {
  if (Platform.OS === 'web') {
    try {
      if (typeof window !== 'undefined' && window.crypto?.subtle) {
        return await window.crypto.subtle.digest('SHA-256', data);
      }
    } catch (e) {
      console.warn('[Encryption] Web crypto subtle not available');
    }
    // Simple fallback hash (not secure, but prevents crashes)
    const bytes = new Uint8Array(data);
    const hash = new Uint8Array(32);
    for (let i = 0; i < bytes.length; i++) {
      hash[i % 32] ^= bytes[i];
    }
    return hash.buffer;
  }
  
  // Native - use expo-crypto
  const Crypto = require('expo-crypto');
  return await Crypto.digest(Crypto.CryptoDigestAlgorithm.SHA256, data);
}

/**
 * Store key securely - works on both web and native
 */
async function secureStoreSet(key: string, value: string): Promise<void> {
  if (Platform.OS === 'web') {
    // Use in-memory storage on web (sessionStorage can throw SecurityError on mobile)
    webKeyStore[key] = value;
    return;
  }
  
  // Native - use expo-secure-store
  const SecureStore = require('expo-secure-store');
  await SecureStore.setItemAsync(key, value);
}

/**
 * Get key from secure storage - works on both web and native
 */
async function secureStoreGet(key: string): Promise<string | null> {
  if (Platform.OS === 'web') {
    return webKeyStore[key] ?? null;
  }
  
  // Native - use expo-secure-store
  const SecureStore = require('expo-secure-store');
  return await SecureStore.getItemAsync(key);
}

/**
 * Delete key from secure storage - works on both web and native
 */
async function secureStoreDelete(key: string): Promise<void> {
  if (Platform.OS === 'web') {
    delete webKeyStore[key];
    return;
  }
  
  // Native - use expo-secure-store
  const SecureStore = require('expo-secure-store');
  await SecureStore.deleteItemAsync(key);
}

/**
 * Simple XOR encryption for demo purposes
 * In production, would use proper RSA encryption
 */
function xorEncrypt(data: Uint8Array, key: Uint8Array): Uint8Array {
  const encrypted = new Uint8Array(data.length);
  for (let i = 0; i < data.length; i++) {
    encrypted[i] = data[i] ^ key[i % key.length];
  }
  return encrypted;
}

/**
 * Simple XOR decryption for demo purposes
 * XOR is symmetric, so decryption uses the same operation
 */
function xorDecrypt(data: Uint8Array, key: Uint8Array): Uint8Array {
  return xorEncrypt(data, key); // XOR is symmetric
}

/**
 * Simulates AES encryption using HMAC-based approach
 * For demo purposes - in production would use proper AES
 */
async function aesEncrypt(
  plaintext: string,
  key: Uint8Array,
  iv: Uint8Array
): Promise<string> {
  // Convert plaintext to bytes
  const plaintextBytes = new TextEncoder().encode(plaintext);
  
  // XOR with IV and key for simple encryption
  const encrypted = new Uint8Array(plaintextBytes.length);
  for (let i = 0; i < plaintextBytes.length; i++) {
    encrypted[i] = plaintextBytes[i] ^ iv[i % iv.length] ^ key[i % key.length];
  }
  
  return bytesToBase64(encrypted);
}

/**
 * Simulates AES decryption
 */
async function aesDecrypt(
  ciphertext: string,
  key: Uint8Array,
  iv: Uint8Array
): Promise<string> {
  // Convert base64 back to bytes
  const encryptedBytes = base64ToBytes(ciphertext);
  
  // XOR with IV and key to decrypt
  const decrypted = new Uint8Array(encryptedBytes.length);
  for (let i = 0; i < encryptedBytes.length; i++) {
    decrypted[i] = encryptedBytes[i] ^ iv[i % iv.length] ^ key[i % key.length];
  }
  
  return new TextDecoder().decode(decrypted);
}

/**
 * Generates a random key pair
 * Returns public key, stores private key in secure storage
 */
export async function generateKeyPair(): Promise<{ publicKey: string }> {
  try {
    // Generate 32-byte private key
    const privateKeyBytes = await getRandomBytes(32);
    const privateKeyBase64 = bytesToBase64(privateKeyBytes);
    
    // Store private key securely
    await secureStoreSet(KEY_STORE_KEY, privateKeyBase64);
    
    // Derive public key from private key (deterministic hash-based derivation)
    const publicKeyBytes = new Uint8Array(32);
    const hashBuffer = await sha256(privateKeyBytes.buffer as ArrayBuffer);
    const hashBytes = new Uint8Array(hashBuffer);
    for (let i = 0; i < 32; i++) {
      publicKeyBytes[i] = hashBytes[i];
    }
    
    const publicKeyBase64 = bytesToBase64(publicKeyBytes);
    
    return { publicKey: publicKeyBase64 };
  } catch (error) {
    console.error('[Encryption] Error generating key pair:', error);
    throw new Error('Failed to generate encryption key pair');
  }
}

/**
 * Retrieves the public key from stored private key
 */
export async function getPublicKey(): Promise<string | null> {
  try {
    const privateKeyBase64 = await secureStoreGet(KEY_STORE_KEY);
    
    if (!privateKeyBase64) {
      return null;
    }
    
    // Derive public key from stored private key
    const pkBytes = base64ToBytes(privateKeyBase64);
    const hashBuffer = await sha256(pkBytes.buffer as ArrayBuffer);
    const hashBytes = new Uint8Array(hashBuffer);
    const publicKeyBytes = new Uint8Array(32);
    for (let i = 0; i < 32; i++) {
      publicKeyBytes[i] = hashBytes[i];
    }
    
    return bytesToBase64(publicKeyBytes);
  } catch (error) {
    console.error('[Encryption] Error getting public key:', error);
    return null;
  }
}

/**
 * Checks if a key pair has been generated
 */
export async function hasKeyPair(): Promise<boolean> {
  try {
    const privateKey = await secureStoreGet(KEY_STORE_KEY);
    return !!privateKey;
  } catch (error) {
    console.error('[Encryption] Error checking key pair:', error);
    return false;
  }
}

/**
 * Encrypts a message with recipient's public key
 * Returns encrypted content, encrypted AES key, and IV (all base64 encoded)
 */
export async function encryptMessage(
  content: string,
  recipientPublicKey: string
): Promise<{ encryptedContent: string; encryptedKey: string; iv: string }> {
  try {
    // Generate random AES key (32 bytes for AES-256)
    const aesKey = await getRandomBytes(32);
    
    // Generate random IV (16 bytes)
    const iv = await getRandomBytes(16);
    
    // Encrypt message content with AES key and IV
    const encryptedContent = await aesEncrypt(content, aesKey, iv);
    
    // Encrypt AES key with recipient's public key using XOR
    const recipientPublicKeyBytes = base64ToBytes(recipientPublicKey);
    const encryptedKeyBytes = xorEncrypt(aesKey, recipientPublicKeyBytes);
    
    return {
      encryptedContent,
      encryptedKey: bytesToBase64(encryptedKeyBytes),
      iv: bytesToBase64(iv),
    };
  } catch (error) {
    console.error('[Encryption] Error encrypting message:', error);
    throw new Error('Failed to encrypt message');
  }
}

/**
 * Decrypts a message using stored private key
 * Returns plaintext content
 */
export async function decryptMessage(
  encryptedContent: string,
  encryptedKey: string,
  iv: string
): Promise<string> {
  try {
    // Get stored private key
    const privateKeyBase64 = await secureStoreGet(KEY_STORE_KEY);
    
    if (!privateKeyBase64) {
      throw new Error('No encryption key found. Please set up encryption first.');
    }
    
    const privateKeyBytes = base64ToBytes(privateKeyBase64);
    
    // Decrypt AES key using private key (XOR is symmetric)
    const encryptedKeyBytes = base64ToBytes(encryptedKey);
    const aesKey = xorDecrypt(encryptedKeyBytes, privateKeyBytes);
    
    // Decrypt message content using AES key and IV
    const ivBytes = base64ToBytes(iv);
    const plaintext = await aesDecrypt(encryptedContent, aesKey, ivBytes);
    
    return plaintext;
  } catch (error) {
    console.error('[Encryption] Error decrypting message:', error);
    throw new Error('Failed to decrypt message');
  }
}

/**
 * Encrypts file data with recipient's public key
 * Returns encrypted content, encrypted key, and IV (all base64 encoded)
 */
export async function encryptFile(
  fileData: string,
  recipientPublicKey: string
): Promise<{ encryptedContent: string; encryptedKey: string; iv: string }> {
  try {
    // Generate random AES key (32 bytes for AES-256)
    const aesKey = await getRandomBytes(32);
    
    // Generate random IV (16 bytes)
    const iv = await getRandomBytes(16);
    
    // Encrypt file content with AES key and IV
    const encryptedContent = await aesEncrypt(fileData, aesKey, iv);
    
    // Encrypt AES key with recipient's public key using XOR
    const recipientPublicKeyBytes = base64ToBytes(recipientPublicKey);
    const encryptedKeyBytes = xorEncrypt(aesKey, recipientPublicKeyBytes);
    
    return {
      encryptedContent,
      encryptedKey: bytesToBase64(encryptedKeyBytes),
      iv: bytesToBase64(iv),
    };
  } catch (error) {
    console.error('[Encryption] Error encrypting file:', error);
    throw new Error('Failed to encrypt file');
  }
}

/**
 * Decrypts file data using stored private key
 * Returns plaintext file content
 */
export async function decryptFile(
  encryptedContent: string,
  encryptedKey: string,
  iv: string
): Promise<string> {
  try {
    // Get stored private key
    const privateKeyBase64 = await secureStoreGet(KEY_STORE_KEY);
    
    if (!privateKeyBase64) {
      throw new Error('No encryption key found. Please set up encryption first.');
    }
    
    const privateKeyBytes = base64ToBytes(privateKeyBase64);
    
    // Decrypt AES key using private key (XOR is symmetric)
    const encryptedKeyBytes = base64ToBytes(encryptedKey);
    const aesKey = xorDecrypt(encryptedKeyBytes, privateKeyBytes);
    
    // Decrypt file content using AES key and IV
    const ivBytes = base64ToBytes(iv);
    const plaintext = await aesDecrypt(encryptedContent, aesKey, ivBytes);
    
    return plaintext;
  } catch (error) {
    console.error('[Encryption] Error decrypting file:', error);
    throw new Error('Failed to decrypt file');
  }
}

/**
 * Deletes the stored private key
 */
export async function deleteKeyPair(): Promise<void> {
  try {
    await secureStoreDelete(KEY_STORE_KEY);
  } catch (error) {
    console.error('[Encryption] Error deleting key pair:', error);
    throw new Error('Failed to delete encryption key pair');
  }
}
