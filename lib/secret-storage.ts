import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";

const prefix = "enc:";

type SecretStorageDependencies = {
  encryptionKey?: string;
  nodeEnv?: string;
  randomBytes?: typeof import("node:crypto").randomBytes;
};

export function createSecretStorage({ encryptionKey, nodeEnv, randomBytes: createRandomBytes = randomBytes }: SecretStorageDependencies) {
  function getKey() {
    if (!encryptionKey) {
      if (nodeEnv === "production") throw new Error("APP_ENCRYPTION_KEY is not configured");
      return null;
    }
    return createHash("sha256").update(encryptionKey).digest();
  }

  function encrypt(value: string | undefined) {
    if (!value) return value;
    const key = getKey();
    if (!key) return value;
    const iv = createRandomBytes(12);
    const cipher = createCipheriv("aes-256-gcm", key, iv);
    const encrypted = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
    const tag = cipher.getAuthTag();
    return `${prefix}${Buffer.concat([iv, tag, encrypted]).toString("base64url")}`;
  }

  function decrypt(value: string | null | undefined) {
    if (!value || !value.startsWith(prefix)) return value;
    const key = getKey();
    if (!key) throw new Error("APP_ENCRYPTION_KEY is required to read stored stream keys");
    const payload = Buffer.from(value.slice(prefix.length), "base64url");
    const iv = payload.subarray(0, 12);
    const tag = payload.subarray(12, 28);
    const decipher = createDecipheriv("aes-256-gcm", key, iv);
    decipher.setAuthTag(tag);
    return Buffer.concat([decipher.update(payload.subarray(28)), decipher.final()]).toString("utf8");
  }

  return { decrypt, encrypt };
}

export const secretStorage = createSecretStorage({
  encryptionKey: process.env.APP_ENCRYPTION_KEY,
  nodeEnv: process.env.NODE_ENV,
});
