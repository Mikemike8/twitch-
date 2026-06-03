const privateIdentityPattern = /^user_[a-zA-Z0-9]+$/;
const embeddedPrivateIdentityPattern = /user_[a-zA-Z0-9]+/g;

export function publicUsername(username: string | null | undefined, seed: string) {
  const candidate = username?.trim();
  return candidate && !privateIdentityPattern.test(candidate)
    ? candidate
    : `creator-${stableHash(seed)}`;
}

export function isGeneratedPublicUsername(username: string) {
  return /^creator-[0-9a-f]{7}$/.test(username);
}

export function redactPrivateIdentity(value: string, replacement: string) {
  return value.replace(embeddedPrivateIdentityPattern, replacement);
}

function stableHash(value: string) {
  return createHash("md5").update(value).digest("hex").slice(0, 7);
}
import { createHash } from "node:crypto";
