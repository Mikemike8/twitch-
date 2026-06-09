import Link from "next/link";
import { BrandLogo } from "@/components/brand-logo";
import { billingPlans, hasPaidBillingConfigured, type BillingPlan } from "@/lib/billing-config";

export default async function SubscriptionPage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  const paidBillingConfigured = hasPaidBillingConfigured();

  return (
    <div className="min-h-[calc(100vh-3.5rem)] min-w-0 bg-[#111116]">
      <div className="mx-auto flex w-full max-w-6xl flex-col px-3 py-5 sm:px-6 lg:px-10 lg:py-10">
        <header className="flex min-w-0 items-center justify-between gap-3 border-b border-white/10 pb-5">
          <Link href="/" aria-label="Argus home" className="flex items-center gap-3">
            <BrandLogo className="h-7 w-auto max-w-[124px] sm:h-8 sm:max-w-none" />
          </Link>
          <Link href={`/u/${username}`} className="shrink-0 rounded-md border border-white/10 px-3 py-2 text-xs font-bold text-[#d6d6df] hover:bg-white/5">Dashboard</Link>
        </header>

        <section className="mx-auto flex w-full flex-1 flex-col pt-10 sm:pt-14">
          <div className="text-center">
            <p className="text-xs font-black uppercase tracking-[0.22em] text-[#27d7ff]">Creator monetization</p>
            <h1 className="mt-4 text-3xl font-black leading-tight text-white sm:text-5xl">Choose your plan</h1>
            <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-[#c8c8d2]">
              Start on Free, then connect a paid creator plan when you are ready to turn audience growth into revenue.
            </p>
          </div>

          <div className="mt-9 grid gap-4 lg:grid-cols-3">
            {billingPlans.map((plan) => (
              <PlanCard key={plan.id} plan={plan} username={username} />
            ))}
          </div>

          <div className="mt-7 rounded-md border border-white/10 bg-black/25 p-4 text-sm leading-6 text-[#b8b8c4]">
            {paidBillingConfigured
              ? "Paid checkout is configured. Stripe will handle card collection and receipts from the selected Payment Link."
              : "Paid checkout buttons are locked until STRIPE_CREATOR_PRO_PAYMENT_LINK or STRIPE_CREATOR_PARTNER_PAYMENT_LINK is added to the environment."}
          </div>
        </section>
      </div>
    </div>
  );
}

function PlanCard({ plan, username }: { plan: BillingPlan; username: string }) {
  const active = plan.id === "free";
  const canCheckout = Boolean(plan.paymentLink);
  const cardClass = plan.highlighted
    ? "border-[#0aa7c8] bg-[#27272f] shadow-[0_18px_60px_rgba(0,0,0,0.35)]"
    : "border-white/10 bg-[#19191f]";
  const ctaClass = active || canCheckout
    ? "bg-white text-black hover:bg-[#ececf1]"
    : "cursor-not-allowed bg-white/10 text-white/42";

  return (
    <article className={`flex min-h-[520px] flex-col rounded-lg border p-5 sm:p-6 ${cardClass}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-black text-white">{plan.name}</h2>
          <p className="mt-3 text-sm leading-6 text-[#b9b9c5]">{plan.description}</p>
        </div>
        {active && <span className="rounded-full bg-[#0aa7c8]/15 px-3 py-1 text-xs font-black uppercase tracking-wide text-[#50e5ff]">Active</span>}
      </div>

      <p className="mt-7 text-4xl font-black text-white">
        {plan.price}<span className="text-xl text-[#b9b9c5]">/{plan.interval}</span>
      </p>

      <ul className="mt-7 flex-1 space-y-4">
        {plan.features.map((feature) => (
          <li key={feature} className="flex gap-3 text-sm font-semibold leading-6 text-[#f2f2f5]">
            <CheckIcon className="mt-0.5 h-5 w-5 shrink-0 text-[#68c7ff]" />
            <span>{feature}</span>
          </li>
        ))}
      </ul>

      {active ? (
        <Link href={`/u/${username}`} className={`mt-7 flex min-h-12 items-center justify-center rounded-md px-5 text-sm font-black uppercase tracking-wide ${ctaClass}`}>
          {plan.cta}
        </Link>
      ) : canCheckout ? (
        <a href={plan.paymentLink} className={`mt-7 flex min-h-12 items-center justify-center rounded-md px-5 text-sm font-black uppercase tracking-wide ${ctaClass}`}>
          {plan.cta}
        </a>
      ) : (
        <button type="button" disabled className={`mt-7 min-h-12 rounded-md px-5 text-sm font-black uppercase tracking-wide ${ctaClass}`}>
          Checkout not configured
        </button>
      )}
    </article>
  );
}

function CheckIcon({ className }: { className: string }) {
  return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path d="m5 12 4 4L19 6" /></svg>;
}
