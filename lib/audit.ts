import { createHash } from "node:crypto";
import { db } from "@/lib/db";
import { logger } from "@/lib/logger";

export type AuditAction =
  | "block_user"
  | "unblock_user"
  | "follow_user"
  | "unfollow_user"
  | "rotate_stream_key"
  | "rotate_token_issuer"
  | "revoke_token_issuer"
  | "token_issuance_failed"
  | "create_creator_film"
  | "update_avatar"
  | "update_profile"
  | "update_stream"
  | "kick_participant"
  | "upload_thumbnail";

export function hashForAudit(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

export async function writeAuditLog(actorId: string, action: AuditAction, targetId?: string, metadata?: Record<string, unknown>) {
  try {
    await db.auditLog.create({
      data: {
        actorId,
        action,
        targetId,
        metadata: metadata ? JSON.parse(JSON.stringify(metadata)) : undefined,
      },
    });
  } catch (error) {
    logger.warn("audit.write_failed", { action, error: error instanceof Error ? error.message : "Unknown error" });
  }
}
