import { randomUUID } from "node:crypto";
import type Stripe from "stripe";
import { db } from "@/lib/db";
import { findBillingPlanByPriceId } from "@/lib/billing-config";
import { logger } from "@/lib/logger";
import { getStripe } from "@/lib/stripe";

export type BillingState = {
  cancelAtPeriodEnd: boolean;
  currentPeriodEnd: string | null;
  planId: "free" | "pro" | "partner";
  status: string;
  stripeCustomerId: string | null;
};

type BillingCustomerRow = {
  stripeCustomerId: string;
};

type BillingSubscriptionRow = {
  cancelAtPeriodEnd: boolean;
  currentPeriodEnd: Date | string | null;
  planId: string;
  status: string;
  stripeCustomerId: string;
};

export async function getUserBillingState(userId: string): Promise<BillingState> {
  try {
    const rows = await db.$queryRaw<BillingSubscriptionRow[]>`
      SELECT "stripeCustomerId", "planId", "status", "currentPeriodEnd", "cancelAtPeriodEnd"
      FROM "BillingSubscription"
      WHERE "userId" = ${userId}
      ORDER BY "updatedAt" DESC
      LIMIT 1
    `;
    const current = rows[0];
    if (!current) {
      const customer = await getBillingCustomer(userId);
      return { cancelAtPeriodEnd: false, currentPeriodEnd: null, planId: "free", status: "free", stripeCustomerId: customer?.stripeCustomerId ?? null };
    }
    return {
      cancelAtPeriodEnd: current.cancelAtPeriodEnd,
      currentPeriodEnd: current.currentPeriodEnd ? new Date(current.currentPeriodEnd).toISOString() : null,
      planId: current.status === "active" || current.status === "trialing" || current.status === "past_due" ? planIdFromString(current.planId) : "free",
      status: current.status,
      stripeCustomerId: current.stripeCustomerId,
    };
  } catch (error) {
    logger.warn("billing.state.query_failed", { error: error instanceof Error ? error.message : "Unknown error" });
    return { cancelAtPeriodEnd: false, currentPeriodEnd: null, planId: "free", status: "unavailable", stripeCustomerId: null };
  }
}

export async function getOrCreateStripeCustomer(user: { id: string; username: string }) {
  const existing = await getBillingCustomer(user.id);
  if (existing) return existing.stripeCustomerId;

  const customer = await getStripe().customers.create({
    metadata: {
      creatorUserId: user.id,
      creatorUsername: user.username,
    },
    name: user.username,
  });

  await upsertBillingCustomer(user.id, customer.id);
  return customer.id;
}

export async function upsertBillingCustomer(userId: string, stripeCustomerId: string) {
  await db.$executeRaw`
    INSERT INTO "BillingCustomer" ("id", "userId", "stripeCustomerId", "updatedAt")
    VALUES (${randomUUID()}, ${userId}, ${stripeCustomerId}, CURRENT_TIMESTAMP)
    ON CONFLICT ("userId") DO UPDATE SET
      "stripeCustomerId" = EXCLUDED."stripeCustomerId",
      "updatedAt" = CURRENT_TIMESTAMP
  `;
}

export async function upsertBillingSubscription(subscription: Stripe.Subscription, userId: string | null) {
  const stripeCustomerId = typeof subscription.customer === "string" ? subscription.customer : subscription.customer.id;
  const resolvedUserId = userId ?? await findUserIdByStripeCustomer(stripeCustomerId);
  if (!resolvedUserId) return;

  await upsertBillingCustomer(resolvedUserId, stripeCustomerId);

  const item = subscription.items.data[0];
  const priceId = item?.price.id ?? null;
  const plan = findBillingPlanByPriceId(priceId);
  const unsafeSubscription = subscription as Stripe.Subscription & {
    current_period_end?: number;
    current_period_start?: number;
  };

  await db.$executeRaw`
    INSERT INTO "BillingSubscription" (
      "id",
      "userId",
      "stripeCustomerId",
      "stripeSubscriptionId",
      "stripePriceId",
      "planId",
      "status",
      "currentPeriodStart",
      "currentPeriodEnd",
      "cancelAtPeriodEnd",
      "canceledAt",
      "updatedAt"
    )
    VALUES (
      ${randomUUID()},
      ${resolvedUserId},
      ${stripeCustomerId},
      ${subscription.id},
      ${priceId},
      ${plan?.id ?? "free"},
      ${subscription.status},
      ${dateFromEpoch(unsafeSubscription.current_period_start)},
      ${dateFromEpoch(unsafeSubscription.current_period_end)},
      ${subscription.cancel_at_period_end},
      ${dateFromEpoch(subscription.canceled_at ?? undefined)},
      CURRENT_TIMESTAMP
    )
    ON CONFLICT ("stripeSubscriptionId") DO UPDATE SET
      "userId" = EXCLUDED."userId",
      "stripeCustomerId" = EXCLUDED."stripeCustomerId",
      "stripePriceId" = EXCLUDED."stripePriceId",
      "planId" = EXCLUDED."planId",
      "status" = EXCLUDED."status",
      "currentPeriodStart" = EXCLUDED."currentPeriodStart",
      "currentPeriodEnd" = EXCLUDED."currentPeriodEnd",
      "cancelAtPeriodEnd" = EXCLUDED."cancelAtPeriodEnd",
      "canceledAt" = EXCLUDED."canceledAt",
      "updatedAt" = CURRENT_TIMESTAMP
  `;
}

export async function createBillingPortalUrl(userId: string, returnUrl: string) {
  const customer = await getBillingCustomer(userId);
  if (!customer) throw new Error("Billing customer is not available yet");
  const session = await getStripe().billingPortal.sessions.create({
    customer: customer.stripeCustomerId,
    return_url: returnUrl,
  });
  return session.url;
}

async function getBillingCustomer(userId: string) {
  try {
    const rows = await db.$queryRaw<BillingCustomerRow[]>`
      SELECT "stripeCustomerId"
      FROM "BillingCustomer"
      WHERE "userId" = ${userId}
      LIMIT 1
    `;
    return rows[0] ?? null;
  } catch {
    return null;
  }
}

async function findUserIdByStripeCustomer(stripeCustomerId: string) {
  const rows = await db.$queryRaw<{ userId: string }[]>`
    SELECT "userId"
    FROM "BillingCustomer"
    WHERE "stripeCustomerId" = ${stripeCustomerId}
    LIMIT 1
  `;
  return rows[0]?.userId ?? null;
}

function dateFromEpoch(value: number | null | undefined) {
  return typeof value === "number" && Number.isFinite(value) ? new Date(value * 1000) : null;
}

function planIdFromString(value: string): BillingState["planId"] {
  return value === "pro" || value === "partner" ? value : "free";
}
