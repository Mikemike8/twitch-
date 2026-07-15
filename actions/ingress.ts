"use server";

import { revalidatePath } from "next/cache";
import { getSelf } from "@/lib/auth-service";
import { createIngress, type IngressType } from "@/lib/ingress-service";
import { enforceActionRateLimit } from "@/lib/rate-limit";
import { writeAuditLog } from "@/lib/audit";
import { revalidateBrowseCaches } from "@/lib/cache-tags";

export async function onCreateIngress(inputType: IngressType) {
  if (inputType !== "RTMP_INPUT" && inputType !== "WHIP_INPUT") throw new Error("Invalid ingress type");
  const self = await getSelf();
  await enforceActionRateLimit("ingress", self.id, 3, 60 * 60 * 1000, 12);
  const ingress = await createIngress(inputType);
  await writeAuditLog(self.id, "rotate_stream_key", ingress.ingressId, { inputType });
  revalidateBrowseCaches();
  revalidatePath("/");
  return {
    ingressId: ingress.ingressId,
    serverUrl: ingress.url,
    streamKey: ingress.streamKey,
  };
}
