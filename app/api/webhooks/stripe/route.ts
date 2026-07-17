import type Stripe from "stripe";
import { getStripe } from "@/lib/stripe";
import { logger } from "@/lib/logger";
import { corsHeaders, preflight, validateOrigin } from "@/lib/cors";
import { assertFreshWebhookEvent } from "@/lib/webhook-idempotency";
import { upsertBillingCustomer, upsertBillingSubscription } from "@/lib/billing-service";

export function OPTIONS(request: Request) {
  return preflight(request);
}

export async function POST(request: Request) {
  const originError = validateOrigin(request);
  if (originError) return originError;

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) return new Response("STRIPE_WEBHOOK_SECRET is not configured", { status: 503 });

  const signature = request.headers.get("stripe-signature");
  if (!signature) return new Response("Missing Stripe signature", { status: 400 });

  const body = await request.text();
  let event: Stripe.Event;

  try {
    event = getStripe().webhooks.constructEvent(body, signature, webhookSecret);
  } catch {
    logger.warn("webhook.stripe.invalid_signature");
    return new Response("Invalid Stripe webhook", { status: 400 });
  }

  try {
    await assertFreshWebhookEvent("stripe", event.id, event.created * 1000, body);
  } catch (error) {
    logger.warn("webhook.stripe.skipped", { error: error instanceof Error ? error.message : "Unknown error" });
    return new Response("Webhook skipped", { status: 200, headers: corsHeaders(request) });
  }

  try {
    await handleStripeEvent(event);
  } catch (error) {
    logger.error("webhook.stripe.processing_failed", { eventId: event.id, error: error instanceof Error ? error.message : "Unknown error" });
    return new Response("Webhook processing failed", { status: 500 });
  }

  return new Response("Webhook processed", { status: 200, headers: corsHeaders(request) });
}

async function handleStripeEvent(event: Stripe.Event) {
  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const userId = session.client_reference_id;
    const customerId = typeof session.customer === "string" ? session.customer : session.customer?.id;
    const subscriptionId = typeof session.subscription === "string" ? session.subscription : session.subscription?.id;

    if (userId && customerId) await upsertBillingCustomer(userId, customerId);
    if (subscriptionId) {
      const subscription = await getStripe().subscriptions.retrieve(subscriptionId);
      await upsertBillingSubscription(subscription, userId ?? null);
    }
    return;
  }

  if (event.type.startsWith("customer.subscription.")) {
    await upsertBillingSubscription(event.data.object as Stripe.Subscription, null);
    return;
  }

  if (event.type === "invoice.payment_succeeded" || event.type === "invoice.payment_failed") {
    const invoice = event.data.object as Stripe.Invoice & { subscription?: string | Stripe.Subscription | null };
    const subscriptionId = typeof invoice.subscription === "string" ? invoice.subscription : invoice.subscription?.id;
    if (subscriptionId) {
      const subscription = await getStripe().subscriptions.retrieve(subscriptionId);
      await upsertBillingSubscription(subscription, null);
    }
  }
}
