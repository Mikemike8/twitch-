"use server";

import { revalidatePath } from "next/cache";
import { createIngress, type IngressType } from "@/lib/ingress-service";

export async function onCreateIngress(inputType: IngressType) {
  const ingress = await createIngress(inputType);
  revalidatePath("/");
  return {
    ingressId: ingress.ingressId,
    serverUrl: ingress.url,
    streamKey: ingress.streamKey,
  };
}
