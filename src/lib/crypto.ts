import crypto from "crypto";

function resolveEncryptionKey(): string {
  const key = process.env.ENCRYPTION_KEY;
  if (key) return key;
  if (process.env.NODE_ENV === "production" && typeof window === "undefined" && process.env.NEXT_PHASE === "phase-production-build") {
    // Allow build without ENCRYPTION_KEY; runtime must set it
    return "build-time-placeholder-key-not-used";
  }
  if (process.env.NODE_ENV === "production") {
    throw new Error("ENCRYPTION_KEY must be set in production.");
  }
  return "psmm-dev-only-key-do-not-use-in-prod";
}

const ENCRYPTION_KEY = resolveEncryptionKey();

function getEncryptionKey(): Buffer {
  return crypto.createHash("sha256").update(ENCRYPTION_KEY).digest();
}

export function encryptText(text: string): string {
  const iv = crypto.randomBytes(16);
  const key = getEncryptionKey();
  
  const cipher = crypto.createCipheriv("aes-256-cbc", key, iv);
  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");
  
  return `${iv.toString("hex")}:${encrypted}`;
}

export function decryptText(encryptedText: string): string {
  const parts = encryptedText.split(":");
  if (parts.length !== 2) {
    throw new Error("Invalid encrypted text structure.");
  }
  
  const iv = Buffer.from(parts[0], "hex");
  const encrypted = parts[1];
  const key = getEncryptionKey();
  
  const decipher = crypto.createDecipheriv("aes-256-cbc", key, iv);
  let decrypted = decipher.update(encrypted, "hex", "utf8");
  decrypted += decipher.final("utf8");
  
  return decrypted;
}
