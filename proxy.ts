import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse, type NextRequest } from "next/server";

const isPublicRoute = createRouteMatcher([
  "/",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/search(.*)",
  "/live",
  "/api/health",
  "/api/webhooks(.*)",
  "/api/uploadthing(.*)",
]);

const protectedRootSegments = new Set([
  "account",
  "admin",
  "billing",
  "dashboard",
  "moderation",
  "settings",
]);

const configuredClerkMiddleware = clerkMiddleware(async (auth, request) => {
  const rootSegment = request.nextUrl.pathname.match(/^\/([^/]+)$/)?.[1];
  const isPublicProfile = Boolean(
    rootSegment
      && /^[a-z0-9][a-z0-9_-]{2,23}$/i.test(rootSegment)
      && !rootSegment.startsWith("clerk_")
      && !protectedRootSegments.has(rootSegment.toLowerCase()),
  );

  if (!isPublicRoute(request) && !isPublicProfile) {
    await auth.protect();
  }
});

export default function proxy(request: NextRequest) {
  if (!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || !process.env.CLERK_SECRET_KEY) {
    if (process.env.NODE_ENV === "production") {
      return new NextResponse("Authentication is not configured", { status: 503 });
    }
    return NextResponse.next();
  }

  return configuredClerkMiddleware(request, {} as never);
}

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
