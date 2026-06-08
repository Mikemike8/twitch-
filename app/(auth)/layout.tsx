import { BrandLogo } from "@/components/brand-logo";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="grid min-h-screen place-items-center bg-black px-4 py-8">
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.3),#000),radial-gradient(circle_at_50%_0%,rgba(229,9,20,0.26),transparent_26rem)]" />
      <div className="clerk-root-box relative flex w-full max-w-[390px] flex-col items-center gap-6 rounded border border-white/15 bg-black/70 px-4 py-8 text-white shadow-[0_24px_80px_rgba(0,0,0,0.65)] sm:px-6 [&_.cl-card]:!bg-transparent [&_.cl-cardBox]:!bg-transparent [&_.cl-footerActionText]:!text-[#d4d4d8] [&_.cl-formFieldInput]:!bg-white/10 [&_.cl-formFieldInput]:!text-white [&_.cl-formFieldInput]:!shadow-none [&_.cl-formFieldInput::placeholder]:!text-[#8c8c8c] [&_.cl-formFieldLabel]:!text-white [&_.cl-formFieldSuccessText]:!text-[#d4d4d8] [&_.cl-headerSubtitle]:!text-[#d4d4d8] [&_.cl-headerTitle]:!text-white [&_.cl-identityPreviewText]:!text-white [&_.cl-internal-1dauvpw]:!hidden [&_.cl-main]:!text-white [&_.cl-socialButtonsBlockButtonText]:!text-white [&_.cl-rootBox_*]:!text-white">
        <BrandLogo className="h-14 w-auto" />
        <div className="w-full max-w-sm">{children}</div>
      </div>
    </main>
  );
}
