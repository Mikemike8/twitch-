"use server";

import { redirect } from "next/navigation";
import { getSelf } from "@/lib/auth-service";
import { writeAuditLog } from "@/lib/audit";
import { findPaidBillingPlan } from "@/lib/billing-config";
import { createBillingPortalUrl, getOrCreateStripeCustomer } from "@/lib/billing-service";
import { enforceActionRateLimit } from "@/lib/rate-limit";
import { getAppOrigin, getStripe } from "@/lib/stripe";

export async function createCreatorCheckoutSession(formData: FormData) {
  const planId = String(formData.get("planId") ?? "");
  const plan = findPaidBillingPlan(planId);
  if (!plan?.priceId) throw new Error("Selected creator plan is not configured for checkout");

  const self = await getSelf();
  await enforceActionRateLimit("billing-checkout", self.id, 10);

  const appOrigin = getAppOrigin();
  const dashboardUrl = `${appOrigin}/u/${self.username}/subscription`;
  const customer = await getOrCreateStripeCustomer(self);
  const session = await getStripe().checkout.sessions.create({
    allow_promotion_codes: true,
    billing_address_collection: "auto",
    cancel_url: dashboardUrl,
    client_reference_id: self.id,
    customer,
    line_items: [{ price: plan.priceId, quantity: 1 }],
    metadata: {
      creatorUserId: self.id,
      creatorUsername: self.username,
      planId: plan.id,
    },
    mode: "subscription",
    payment_method_collection: "always",
    saved_payment_method_options: {
      payment_method_save: "enabled",
    },
    subscription_data: {
      metadata: {
        creatorUserId: self.id,
        creatorUsername: self.username,
        planId: plan.id,
      },
    },
    success_url: `${dashboardUrl}?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
  });

  await writeAuditLog(self.id, "create_billing_checkout", self.id, {
    planId: plan.id,
    stripeSessionId: session.id,
  });

  if (!session.url) throw new Error("Stripe did not return a checkout URL");
  redirect(session.url);
}

export async function createCreatorBillingPortalSession() {
  const self = await getSelf();
  await enforceActionRateLimit("billing-portal", self.id, 20);
  const returnUrl = `${getAppOrigin()}/u/${self.username}/subscription`;
  redirect(await createBillingPortalUrl(self.id, returnUrl));
}
