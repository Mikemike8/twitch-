import type { PrismaClient } from "@/lib/generated/prisma/client";
import { logger } from "@/lib/logger";

type BlockFlagState = "blocked" | "clear" | "unknown";

type BlockFlagStore = {
  get: (blockerId: string, blockedId: string) => Promise<BlockFlagState>;
  set: (blockerId: string, blockedId: string) => Promise<void>;
  clear: (blockerId: string, blockedId: string) => Promise<void>;
};

const memoryFlags = new Set<string>();

function blockFlagKey(blockerId: string, blockedId: string) {
  return `block:${blockerId}:${blockedId}`;
}

function createMemoryBlockFlagStore(): BlockFlagStore {
  return {
    async get(blockerId, blockedId) {
      return memoryFlags.has(blockFlagKey(blockerId, blockedId)) ? "blocked" : "clear";
    },
    async set(blockerId, blockedId) {
      memoryFlags.add(blockFlagKey(blockerId, blockedId));
    },
    async clear(blockerId, blockedId) {
      memoryFlags.delete(blockFlagKey(blockerId, blockedId));
    },
  };
}

function createUpstashBlockFlagStore(url: string, token: string): BlockFlagStore {
  async function request(path: string) {
    const response = await fetch(`${url}/${path}`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    if (!response.ok) throw new Error("Block flag store is unavailable");
    return response.json() as Promise<{ result: unknown }>;
  }

  return {
    async get(blockerId, blockedId) {
      const { result } = await request(`get/${encodeURIComponent(blockFlagKey(blockerId, blockedId))}`);
      return result === "1" ? "blocked" : "clear";
    },
    async set(blockerId, blockedId) {
      const { result } = await request(`set/${encodeURIComponent(blockFlagKey(blockerId, blockedId))}/1`);
      if (result !== "OK") throw new Error("Block flag was not stored");
    },
    async clear(blockerId, blockedId) {
      await request(`del/${encodeURIComponent(blockFlagKey(blockerId, blockedId))}`);
    },
  };
}

function getBlockFlagStore() {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (url && token) return createUpstashBlockFlagStore(url, token);
  if (process.env.NODE_ENV === "production") throw new Error("Production block flag store is not configured");
  return createMemoryBlockFlagStore();
}

export async function setBlockFlag(blockerId: string, blockedId: string) {
  await getBlockFlagStore().set(blockerId, blockedId);
}

export async function clearBlockFlag(blockerId: string, blockedId: string) {
  await getBlockFlagStore().clear(blockerId, blockedId);
}

export async function getBlockFlag(blockerId: string, blockedId: string) {
  try {
    return await getBlockFlagStore().get(blockerId, blockedId);
  } catch (error) {
    logger.warn("block_flag.lookup_failed", { error: error instanceof Error ? error.message : "Unknown error" });
    return "unknown" as const;
  }
}

export async function isBlockedWithFailClosedFallback(dbClient: PrismaClient, blockerId: string, blockedId: string) {
  const flag = await getBlockFlag(blockerId, blockedId);
  if (flag === "blocked") return true;
  if (flag === "clear") return false;

  try {
    return Boolean(
      await dbClient.block.findUnique({
        where: {
          blockerId_blockedId: {
            blockerId,
            blockedId,
          },
        },
      }),
    );
  } catch (error) {
    logger.error("block_flag.database_fallback_failed", { error: error instanceof Error ? error.message : "Unknown error" });
    return true;
  }
}
