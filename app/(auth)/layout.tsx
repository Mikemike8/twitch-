import { BrandLogo } from "@/components/brand-logo";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="grid min-h-screen place-items-center bg-[#0e0e10] px-4">
      <div className="flex flex-col items-center gap-6">
        <BrandLogo className="h-16 w-16 rounded-2xl" />
        {children}
      </div>
    </main>
  );
}
