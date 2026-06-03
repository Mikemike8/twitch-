import { randomUUID } from "node:crypto";

const separator = ":viewer:";

export function createParticipantIdentity(userId: string) {
  return `${userId}${separator}${randomUUID()}`;
}

export function getUserIdFromParticipantIdentity(identity: string) {
  const [userId, sessionId, extra] = identity.split(separator);
  if (!userId || !sessionId || extra || !/^[0-9a-f-]{36}$/i.test(userId) || !/^[0-9a-f-]{36}$/i.test(sessionId)) {
    throw new Error("Invalid participant identity");
  }
  return userId;
}
