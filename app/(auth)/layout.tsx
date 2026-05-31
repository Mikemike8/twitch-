export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="grid min-h-screen place-items-center bg-[#0e0e10] px-4">
      <div className="flex flex-col items-center gap-6">
        <div className="grid h-16 w-16 place-items-center rounded-2xl bg-[#9147ff] text-2xl font-black text-white">
          A
        </div>
        {children}
      </div>
    </main>
  );
}
