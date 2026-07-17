export type BillingPlan = {
  cta: string;
  description: string;
  features: string[];
  highlighted?: boolean;
  id: "free" | "pro" | "partner";
  interval: string;
  name: string;
  priceId?: string;
  price: string;
};

export const billingPlans: BillingPlan[] = [
  {
    cta: "Continue with Free",
    description: "Start streaming and build a public channel without a payment method.",
    features: [
      "Public creator profile",
      "RTMP or WHIP connection keys",
      "Live chat moderation",
      "Stream thumbnail uploads",
      "Community followers list",
    ],
    id: "free",
    interval: "month",
    name: "Argus Free",
    price: "$0",
  },
  {
    cta: "Start Pro",
    description: "For creators ready to grow with better discovery and monetization tools.",
    features: [
      "Everything in Free",
      "Paid subscriber-ready channel",
      "Priority placement in live discovery",
      "Subscriber-only chat room prep",
      "Monthly creator analytics exports",
    ],
    highlighted: true,
    id: "pro",
    interval: "month",
    name: "Argus Pro",
    priceId: process.env.STRIPE_CREATOR_PRO_PRICE_ID,
    price: "$12",
  },
  {
    cta: "Apply for Partner",
    description: "For established streamers who need advanced revenue and support workflows.",
    features: [
      "Everything in Pro",
      "Partner profile review",
      "Payout onboarding checklist",
      "Featured launch support",
      "Custom sponsorship package prep",
    ],
    id: "partner",
    interval: "month",
    name: "Argus Partner",
    priceId: process.env.STRIPE_CREATOR_PARTNER_PRICE_ID,
    price: "$29",
  },
];

export function hasPaidBillingConfigured() {
  return Boolean(process.env.STRIPE_SECRET_KEY) && billingPlans.some((plan) => plan.id !== "free" && Boolean(plan.priceId));
}

export function findPaidBillingPlan(planId: string) {
  return billingPlans.find((plan) => plan.id === planId && plan.id !== "free");
}

export function findBillingPlanByPriceId(priceId: string | null | undefined) {
  return billingPlans.find((plan) => plan.priceId && plan.priceId === priceId);
}
