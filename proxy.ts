import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse, type NextRequest } from "next/server";
import { isUsernameRootSegment, publicRoutes } from "@/lib/routes";

const isPublicRoute = createRouteMatcher([...publicRoutes]);

const configuredClerkMiddleware = clerkMiddleware(async (auth, request) => {
  const rootSegment = request.nextUrl.pathname.match(/^\/([^/]+)$/)?.[1];
  const isPublicProfile = isUsernameRootSegment(rootSegment);

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
