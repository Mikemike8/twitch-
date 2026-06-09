export type BillingPlan = {
  cta: string;
  description: string;
  features: string[];
  highlighted?: boolean;
  id: "free" | "pro" | "partner";
  interval: string;
  name: string;
  paymentLink?: string;
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
    paymentLink: process.env.STRIPE_CREATOR_PRO_PAYMENT_LINK,
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
    paymentLink: process.env.STRIPE_CREATOR_PARTNER_PAYMENT_LINK,
    price: "$29",
  },
];

export function hasPaidBillingConfigured() {
  return billingPlans.some((plan) => plan.id !== "free" && Boolean(plan.paymentLink));
}
