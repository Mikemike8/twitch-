import { headers } from "next/headers";

export function getClientAddressFromHeaders(requestHeaders: Headers) {
  return requestHeaders.get("x-forwarded-for")?.split(",")[0]?.trim()
    || requestHeaders.get("x-real-ip")
    || "unknown";
}

export async function getClientAddress() {
  return getClientAddressFromHeaders(await headers());
}
