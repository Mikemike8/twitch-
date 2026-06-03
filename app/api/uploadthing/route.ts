import { createRouteHandler } from "uploadthing/next";
import type { NextRequest } from "next/server";
import { uploadRouter } from "./core";
import { preflight, validateOrigin } from "@/lib/cors";

const handlers = createRouteHandler({
  router: uploadRouter,
});

export async function GET(request: NextRequest) {
  const originError = validateOrigin(request);
  if (originError) return originError;
  return handlers.GET(request);
}

export async function POST(request: NextRequest) {
  const originError = validateOrigin(request);
  if (originError) return originError;
  return handlers.POST(request);
}

export function OPTIONS(request: Request) {
  return preflight(request);
}
