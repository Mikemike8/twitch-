import Link from "next/link";
import { BrandLogo } from "@/components/brand-logo";

const freePlanFeatures = [
  "Create a public channel profile",
  "Go live with RTMP or WHIP connection keys",
  "Use live chat, slow mode, and followers-only controls",
  "Moderate participants and blocked users",
  "Upload a stream thumbnail",
];

export default async function SubscriptionPage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;

  return (
    <div className="min-h-[calc(100vh-3.5rem)] min-w-0 bg-[#111116]">
      <div className="mx-auto flex w-full max-w-5xl flex-col px-3 py-5 sm:px-6 lg:px-10 lg:py-10">
        <header className="flex min-w-0 items-center justify-between gap-3 border-b border-white/10 pb-5">
          <Link href="/" aria-label="Argus home" className="flex items-center gap-3">
            <BrandLogo className="h-7 w-auto max-w-[124px] sm:h-8 sm:max-w-none" />
          </Link>
          <Link href={`/u/${username}`} className="shrink-0 rounded-md border border-white/10 px-3 py-2 text-xs font-bold text-[#d6d6df] hover:bg-white/5">Dashboard</Link>
        </header>

        <section className="mx-auto flex w-full max-w-3xl flex-1 flex-col pt-10 sm:pt-14">
          <div className="text-center">
            <p className="text-xs font-black uppercase tracking-[0.22em] text-[#27d7ff]">Step 1 of 1</p>
            <h1 className="mt-4 text-3xl font-black leading-tight text-white sm:text-5xl">Choose your plan</h1>
            <p className="mx-auto mt-4 max-w-xl text-base leading-7 text-[#c8c8d2]">Your creator account is on the Free plan while subscription billing is still being prepared.</p>
          </div>

          <div className="mt-9 rounded-lg border-2 border-[#0aa7c8] bg-[#27272f] p-4 shadow-[0_18px_60px_rgba(0,0,0,0.35)] sm:p-7">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-xl font-black text-white">Argus Free</p>
                <p className="mt-5 text-4xl font-black text-white">$0<span className="text-xl text-[#b9b9c5]">/month</span></p>
                <p className="mt-2 text-sm text-[#a7a7b2]">No payment method required.</p>
              </div>
              <span className="self-start rounded-full bg-[#0aa7c8]/15 px-3 py-1 text-xs font-black uppercase tracking-wide text-[#50e5ff]">Active</span>
            </div>

            <ul className="mt-7 space-y-5">
              {freePlanFeatures.map((feature) => (
                <li key={feature} className="flex gap-4 text-base font-semibold leading-6 text-[#f2f2f5]">
                  <CheckIcon className="mt-0.5 h-6 w-6 shrink-0 text-[#68c7ff]" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-9 grid gap-3 sm:grid-cols-[1fr_auto] sm:items-center">
            <Link href={`/u/${username}`} className="flex min-h-14 items-center justify-center rounded-md bg-white px-5 text-sm font-black uppercase tracking-wide text-black hover:bg-[#ececf1]">Continue with Free</Link>
            <p className="text-center text-xs leading-5 text-[#8f8f9b] sm:text-left">Paid tiers will appear here after monetization is ready.</p>
          </div>
        </section>
      </div>
    </div>
  );
}

function CheckIcon({ className }: { className: string }) {
  return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path d="m5 12 4 4L19 6" /></svg>;
}
