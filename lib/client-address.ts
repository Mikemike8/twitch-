import { headers } from "next/headers";
import { getClientAddressFromHeaders } from "./client-address-core.ts";
export { getClientAddressFromHeaders, trustsProxyHeaders } from "./client-address-core.ts";

export async function getClientAddress() {
  return getClientAddressFromHeaders(await headers());
}
