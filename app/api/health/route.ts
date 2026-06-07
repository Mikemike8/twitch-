import { db } from "@/lib/db";
import { logger } from "@/lib/logger";
import { corsHeaders, preflight, validateOrigin } from "@/lib/cors";
import { clientRateLimitKey, RateLimitError, rateLimiter } from "@/lib/rate-limit";

export function OPTIONS(request: Request) {
  return preflight(request);
}

export async function GET(request: Request) {
  const originError = validateOrigin(request);
  if (originError) return originError;

  try {
    await rateLimiter.enforce(`health:${clientRateLimitKey(request.headers)}`, 60);
    await db.$queryRaw`SELECT 1`;
    return Response.json({ status: "ok" }, { headers: corsHeaders(request) });
  } catch (error) {
    if (error instanceof RateLimitError) {
      return Response.json({ status: "rate_limited" }, { status: 429, headers: corsHeaders(request) });
    }
    logger.error("health.database_unavailable", { error: error instanceof Error ? error.message : "Unknown error" });
    return Response.json({ status: "unavailable" }, { status: 503, headers: corsHeaders(request) });
  }
}
