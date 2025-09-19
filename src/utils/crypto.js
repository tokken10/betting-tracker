import crypto from 'crypto';

const DEFAULT_SECRET = process.env.AI_KEY_SECRET || process.env.JWT_SECRET;

function getSecretKey() {
  if (!DEFAULT_SECRET) {
    throw new Error('AI_KEY_SECRET (or JWT_SECRET) must be set to store API keys securely');
  }
  return crypto.createHash('sha256').update(DEFAULT_SECRET).digest();
}

export function encrypt(text) {
  if (!text) return null;
  const key = getSecretKey();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, encrypted]).toString('base64');
}

export function decrypt(payload) {
  if (!payload) return null;
  const key = getSecretKey();
  const raw = Buffer.from(payload, 'base64');
  const iv = raw.subarray(0, 12);
  const tag = raw.subarray(12, 28);
  const data = raw.subarray(28);
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(tag);
  const decrypted = Buffer.concat([decipher.update(data), decipher.final()]);
  return decrypted.toString('utf8');
}
