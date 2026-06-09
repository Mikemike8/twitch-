export const publicRoutes = [
  "/",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/search(.*)",
  "/live",
  "/api/health",
  "/api/webhooks(.*)",
  "/api/uploadthing(.*)",
] as const;

export const protectedRootSegments = new Set([
  "account",
  "admin",
  "billing",
  "dashboard",
  "moderation",
  "settings",
  "u",
]);

export function isUsernameRootSegment(value: string | undefined) {
  return Boolean(
    value
      && /^[a-z0-9][a-z0-9_-]{2,23}$/i.test(value)
      && !value.startsWith("clerk_")
      && !protectedRootSegments.has(value.toLowerCase()),
  );
}
