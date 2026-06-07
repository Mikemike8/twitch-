import { createHash } from "node:crypto";
import type { PrismaClient } from "./generated/prisma/client";
import { normalizeLiveKitWsUrl } from "./livekit-url.ts";
import { secretStorage } from "./secret-storage.ts";

const livekitProvider = "livekit";

function hashForAudit(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

async function writeTokenIssuerAudit(
  actorId: string,
  action: "rotate_token_issuer" | "revoke_token_issuer",
  targetId: string,
  metadata: Record<string, unknown>,
) {
  const { writeAuditLog } = await import("./audit.ts");
  await writeAuditLog(actorId, action, targetId, metadata);
}

export type TokenIssuerCredentials = {
  apiKey: string;
  apiSecret: string;
  apiUrl?: string;
  issuerId?: string;
  source: "creator" | "global";
  version?: number;
  wsUrl?: string;
};

type SecretStorage = Pick<typeof secretStorage, "decrypt" | "encrypt">;

export async function resolveLiveKitTokenIssuer({
  db,
  hostIdentity,
  env = process.env,
  storage = secretStorage,
}: {
  db: PrismaClient;
  hostIdentity: string;
  env?: NodeJS.ProcessEnv;
  storage?: SecretStorage;
}): Promise<TokenIssuerCredentials> {
  const issuer = await db.tokenIssuer.findFirst({
    where: {
      userId: hostIdentity,
      provider: livekitProvider,
      status: "ACTIVE",
    },
    orderBy: [
      { version: "desc" },
      { createdAt: "desc" },
    ],
  });

  if (issuer) {
    const apiKey = storage.decrypt(issuer.apiKeyEncrypted);
    const apiSecret = storage.decrypt(issuer.apiSecretEncrypted);

    if (!apiKey || !apiSecret) {
      throw new Error("Creator token issuer credentials are incomplete");
    }

    const apiUrl = issuer.apiUrl ?? env.LIVEKIT_API_URL;

    return {
      apiKey,
      apiSecret,
      apiUrl,
      issuerId: issuer.id,
      source: "creator",
      version: issuer.version,
      wsUrl: normalizeLiveKitWsUrl(apiUrl) ?? normalizeLiveKitWsUrl(env.NEXT_PUBLIC_LIVEKIT_WS_URL) ?? undefined,
    };
  }

  const apiKey = env.LIVEKIT_API_KEY;
  const apiSecret = env.LIVEKIT_API_SECRET;

  if (!apiKey || !apiSecret) {
    throw new Error("LiveKit credentials are not configured");
  }

  return {
    apiKey,
    apiSecret,
    apiUrl: env.LIVEKIT_API_URL,
    source: "global",
    wsUrl: normalizeLiveKitWsUrl(env.NEXT_PUBLIC_LIVEKIT_WS_URL) ?? normalizeLiveKitWsUrl(env.LIVEKIT_API_URL) ?? undefined,
  };
}

export async function rotateLiveKitTokenIssuer({
  actorId,
  apiKey,
  apiSecret,
  apiUrl,
  db,
  storage = secretStorage,
  userId,
}: {
  actorId: string;
  apiKey: string;
  apiSecret: string;
  apiUrl?: string;
  db: PrismaClient;
  storage?: SecretStorage;
  userId: string;
}) {
  const issuer = await db.$transaction(async (tx) => {
    const latest = await tx.tokenIssuer.findFirst({
      where: { userId, provider: livekitProvider },
      orderBy: { version: "desc" },
    });
    const version = (latest?.version ?? 0) + 1;

    await tx.tokenIssuer.updateMany({
      where: { userId, provider: livekitProvider, status: "ACTIVE" },
      data: { status: "RETIRING", rotatedAt: new Date() },
    });

    return tx.tokenIssuer.create({
      data: {
        apiKeyEncrypted: storage.encrypt(apiKey)!,
        apiSecretEncrypted: storage.encrypt(apiSecret)!,
        apiUrl,
        provider: livekitProvider,
        status: "ACTIVE",
        userId,
        version,
      },
    });
  });

  await writeTokenIssuerAudit(actorId, "rotate_token_issuer", issuer.id, {
    apiKeyHash: hashForAudit(apiKey),
    provider: livekitProvider,
    userId,
    version: issuer.version,
  });

  return issuer;
}

export async function revokeLiveKitTokenIssuer({
  actorId,
  db,
  issuerId,
}: {
  actorId: string;
  db: PrismaClient;
  issuerId: string;
}) {
  const issuer = await db.tokenIssuer.update({
    where: { id: issuerId },
    data: { revokedAt: new Date(), status: "REVOKED" },
  });

  await writeTokenIssuerAudit(actorId, "revoke_token_issuer", issuer.id, {
    provider: issuer.provider,
    userId: issuer.userId,
    version: issuer.version,
  });

  return issuer;
}
