import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse, type NextRequest } from "next/server";

const isPublicRoute = createRouteMatcher([
  "/",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/search(.*)",
  "/api/webhooks(.*)",
  "/api/uploadthing(.*)",
]);

const configuredClerkMiddleware = clerkMiddleware(async (auth, request) => {
  const isPublicProfile = /^\/[^/]+$/.test(request.nextUrl.pathname);

  if (!isPublicRoute(request) && !isPublicProfile) {
    await auth.protect();
  }
});

export default function proxy(request: NextRequest) {
  if (!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || !process.env.CLERK_SECRET_KEY) {
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
