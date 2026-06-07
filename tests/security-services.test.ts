import assert from "node:assert/strict";
import { test } from "node:test";
import { createParticipantIdentity, getUserIdFromParticipantIdentity } from "../lib/participant-identity.ts";
import { publicUsername, redactPrivateIdentity } from "../lib/public-identity.ts";
import { createMemoryRateLimiter, RateLimitError } from "../lib/rate-limit.ts";
import { createSecretStorage } from "../lib/secret-storage.ts";
import { getClientAddressFromHeaders } from "../lib/client-address-core.ts";
import { resolveLiveKitTokenIssuer } from "../lib/token-issuer-service.ts";
import { boundedPage, boundedSearchTerm, inputLimits, requireBoundedText, requireUsername, requireUuid } from "../lib/validation.ts";
import { createViewerTokenService } from "../lib/viewer-token-service.ts";

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

test("client address ignores proxy headers unless trusted", () => {
  const requestHeaders = new Headers({
    "x-forwarded-for": "203.0.113.7, 10.0.0.1",
    "x-real-ip": "198.51.100.4",
  });

  assert.equal(getClientAddressFromHeaders(requestHeaders, {}), "unknown");
  assert.equal(getClientAddressFromHeaders(requestHeaders, { TRUST_PROXY_HEADERS: "true" }), "203.0.113.7");
  assert.equal(getClientAddressFromHeaders(requestHeaders, { VERCEL: "1" }), "203.0.113.7");
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

test("username validation normalizes readable handles", () => {
  assert.equal(requireUsername("  Argus_Creator-7  "), "argus_creator-7");
  assert.throws(() => requireUsername("ab"), /3 to 24/);
  assert.throws(() => requireUsername("bad name"), /letters, numbers/);
  assert.throws(() => requireUsername("api"), /reserved/);
});

test("public usernames never expose Clerk user ids", () => {
  const privateIdentity = "user_3EULLQjn1JqiGlrqpHCv8rYX";
  const username = publicUsername(null, privateIdentity);

  assert.match(username, /^creator-[a-f0-9]{7}$/);
  assert.equal(publicUsername(privateIdentity, privateIdentity), username);
  assert.equal(redactPrivateIdentity(`${privateIdentity}'s stream`, username), `${username}'s stream`);
});

test("creator token issuers override the shared LiveKit fallback", async () => {
  const storage = createSecretStorage({
    encryptionKey: "issuer-test-key",
    nodeEnv: "test",
    randomBytes: () => Buffer.alloc(12, 3),
  });
  const creatorId = "22222222-2222-4222-8222-222222222222";
  const db = {
    tokenIssuer: {
      findFirst: async ({ where }: { where: { userId: string } }) => where.userId === creatorId ? {
        id: "issuer-a",
        apiKeyEncrypted: storage.encrypt("creator-api-key"),
        apiSecretEncrypted: storage.encrypt("creator-api-secret"),
        apiUrl: "wss://creator-livekit.example.test",
        createdAt: new Date(),
        provider: "livekit",
        status: "ACTIVE",
        updatedAt: new Date(),
        userId: creatorId,
        version: 7,
      } : null,
    },
  };

  const creatorIssuer = await resolveLiveKitTokenIssuer({
    db: db as never,
    env: {
      LIVEKIT_API_KEY: "global-api-key",
      LIVEKIT_API_SECRET: "global-api-secret",
      LIVEKIT_API_URL: "wss://global-livekit.example.test",
      NEXT_PUBLIC_LIVEKIT_WS_URL: "wss://global-public-livekit.example.test",
    },
    hostIdentity: creatorId,
    storage,
  });
  const fallbackIssuer = await resolveLiveKitTokenIssuer({
    db: db as never,
    env: {
      LIVEKIT_API_KEY: "global-api-key",
      LIVEKIT_API_SECRET: "global-api-secret",
      LIVEKIT_API_URL: "wss://global-livekit.example.test",
      NEXT_PUBLIC_LIVEKIT_WS_URL: "wss://global-public-livekit.example.test",
    },
    hostIdentity: "33333333-3333-4333-8333-333333333333",
    storage,
  });

  assert.equal(creatorIssuer.source, "creator");
  assert.equal(creatorIssuer.apiKey, "creator-api-key");
  assert.equal(creatorIssuer.apiSecret, "creator-api-secret");
  assert.equal(creatorIssuer.version, 7);
  assert.equal(creatorIssuer.wsUrl, "wss://creator-livekit.example.test");
  assert.equal(fallbackIssuer.source, "global");
  assert.equal(fallbackIssuer.apiKey, "global-api-key");
  assert.equal(fallbackIssuer.wsUrl, "wss://global-public-livekit.example.test");
});

test("viewer tokens use the requested creator issuer and room", async () => {
  const creatorA = "44444444-4444-4444-8444-444444444444";
  const creatorB = "55555555-5555-4555-8555-555555555555";
  const viewer = "66666666-6666-4666-8666-666666666666";
  const grants: Array<{ apiKey: string; room?: string }> = [];
  class MockAccessToken {
    private apiKey: string;
    private room?: string;

    constructor(apiKey: string) {
      this.apiKey = apiKey;
    }

    addGrant(grant: { room?: string }) {
      this.room = grant.room;
      grants.push({ apiKey: this.apiKey, room: grant.room });
    }

    async toJwt() {
      return `token:${this.apiKey}:${this.room}`;
    }
  }
  const users = new Map([
    [creatorA, { id: creatorA, username: "creator-a" }],
    [creatorB, { id: creatorB, username: "creator-b" }],
  ]);
  const db = {
    follow: { findUnique: async () => null },
    stream: {
      findUnique: async ({ where }: { where: { userId: string } }) => ({
        id: `stream-${where.userId}`,
        isChatDelayed: false,
        isChatEnabled: true,
        isChatFollowersOnly: false,
        userId: where.userId,
      }),
    },
    user: {
      findUnique: async ({ where }: { where: { id: string } }) => users.get(where.id) ?? null,
    },
  };
  const issueViewerToken = createViewerTokenService({
    createAccessToken: MockAccessToken as never,
    createParticipantIdentity: (userId) => `${userId}:viewer:77777777-7777-4777-8777-777777777777`,
    db: db as never,
    getAuthenticatedViewer: async () => ({ id: viewer, username: "viewer" }),
    getTokenIssuer: async (hostIdentity) => ({
      apiKey: hostIdentity === creatorA ? "creator-a-key" : "creator-b-key",
      apiSecret: "secret",
      issuerId: hostIdentity === creatorA ? "issuer-a" : "issuer-b",
      source: "creator",
      version: 1,
      wsUrl: hostIdentity === creatorA ? "wss://creator-a.example.test" : "wss://creator-b.example.test",
    }),
  });

  const tokenA = await issueViewerToken(creatorA);
  const tokenB = await issueViewerToken(creatorB);

  assert.equal(tokenA.token, `token:creator-a-key:${creatorA}`);
  assert.equal(tokenB.token, `token:creator-b-key:${creatorB}`);
  assert.equal(tokenA.issuerId, "issuer-a");
  assert.equal(tokenB.issuerId, "issuer-b");
  assert.equal(tokenA.serverUrl, "wss://creator-a.example.test");
  assert.equal(tokenB.serverUrl, "wss://creator-b.example.test");
  assert.deepEqual(grants, [
    { apiKey: "creator-a-key", room: creatorA },
    { apiKey: "creator-b-key", room: creatorB },
  ]);
});
