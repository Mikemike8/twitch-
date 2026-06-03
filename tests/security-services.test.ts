import assert from "node:assert/strict";
import { test } from "node:test";
import { createParticipantIdentity, getUserIdFromParticipantIdentity } from "../lib/participant-identity.ts";
import { publicUsername, redactPrivateIdentity } from "../lib/public-identity.ts";
import { createMemoryRateLimiter, RateLimitError } from "../lib/rate-limit.ts";
import { createSecretStorage } from "../lib/secret-storage.ts";
import { boundedPage, boundedSearchTerm, inputLimits, requireBoundedText, requireUuid } from "../lib/validation.ts";

test("participant identities isolate sessions and preserve the user id", () => {
  const userId = "11111111-1111-4111-8111-111111111111";
  const first = createParticipantIdentity(userId);
  const second = createParticipantIdentity(userId);

  assert.notEqual(first, second);
  assert.equal(getUserIdFromParticipantIdentity(first), userId);
  assert.equal(getUserIdFromParticipantIdentity(second), userId);
});

test("participant identity parser rejects malformed values", () => {
  assert.throws(() => getUserIdFromParticipantIdentity("not-a-session"), /Invalid participant identity/);
  assert.throws(() => getUserIdFromParticipantIdentity("11111111-1111-4111-8111-111111111111:viewer:not-a-uuid"), /Invalid participant identity/);
});

test("secret storage encrypts and decrypts values", () => {
  const storage = createSecretStorage({
    encryptionKey: "test-encryption-key",
    nodeEnv: "test",
    randomBytes: () => Buffer.alloc(12, 7),
  });
  const encrypted = storage.encrypt("stream-secret");

  assert.match(encrypted!, /^enc:/);
  assert.notEqual(encrypted, "stream-secret");
  assert.equal(storage.decrypt(encrypted), "stream-secret");
});

test("secret storage fails closed without a production key", () => {
  const storage = createSecretStorage({ nodeEnv: "production" });
  assert.throws(() => storage.encrypt("stream-secret"), /APP_ENCRYPTION_KEY is not configured/);
});

test("memory rate limiter rejects requests beyond the limit", async () => {
  const limiter = createMemoryRateLimiter();
  await limiter.enforce("viewer", 2);
  await limiter.enforce("viewer", 2);
  await assert.rejects(() => limiter.enforce("viewer", 2), RateLimitError);
});

test("bounded text validation trims accepted values and rejects oversized input", () => {
  assert.equal(requireBoundedText("  stream title  ", "streamName"), "stream title");
  assert.throws(() => requireBoundedText("x".repeat(inputLimits.streamName + 1), "streamName"), /streamName is too long/);
});

test("search terms are trimmed and capped", () => {
  assert.equal(boundedSearchTerm(`  ${"x".repeat(inputLimits.searchTerm + 20)}  `).length, inputLimits.searchTerm);
});

test("pagination accepts bounded positive integers and rejects invalid input", () => {
  assert.equal(boundedPage("2"), 2);
  assert.equal(boundedPage("-1"), 1);
  assert.equal(boundedPage("not-a-page"), 1);
  assert.equal(boundedPage("10001"), 1);
});

test("uuid validation rejects malformed identifiers", () => {
  assert.equal(requireUuid("11111111-1111-4111-8111-111111111111"), "11111111-1111-4111-8111-111111111111");
  assert.throws(() => requireUuid("not-an-id"), /id is invalid/);
});

test("public usernames never expose Clerk user ids", () => {
  const privateIdentity = "user_3EULLQjn1JqiGlrqpHCv8rYX";
  const username = publicUsername(null, privateIdentity);

  assert.match(username, /^creator-[a-f0-9]{7}$/);
  assert.equal(publicUsername(privateIdentity, privateIdentity), username);
  assert.equal(redactPrivateIdentity(`${privateIdentity}'s stream`, username), `${username}'s stream`);
});
