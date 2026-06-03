const localOrigins = ["http://localhost:3000", "http://127.0.0.1:3000"];

export function allowedOrigins() {
  return [
    process.env.NEXT_PUBLIC_APP_URL,
    process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined,
    process.env.NODE_ENV === "production" ? undefined : "https://saved-morality-fanfare.ngrok-free.dev",
    ...(process.env.NODE_ENV === "production" ? [] : localOrigins),
  ].filter(Boolean) as string[];
}

export function validateOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin) return null;

  return allowedOrigins().includes(origin)
    ? null
    : new Response("Forbidden", { status: 403 });
}

export function corsHeaders(request: Request) {
  const origin = request.headers.get("origin");
  const allowed = origin && allowedOrigins().includes(origin) ? origin : allowedOrigins()[0] ?? "";

  return {
    "Access-Control-Allow-Origin": allowed,
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, svix-id, svix-timestamp, svix-signature",
    "Vary": "Origin",
  };
}

export function preflight(request: Request) {
  const originError = validateOrigin(request);
  if (originError) return originError;
  return new Response(null, { status: 204, headers: corsHeaders(request) });
}
