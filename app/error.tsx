"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(JSON.stringify({
      level: "error",
      event: "ui.render_failed",
      digest: error.digest,
      message: error.message,
      timestamp: new Date().toISOString(),
    }));
  }, [error]);

  return (
    <main className="grid min-h-screen place-items-center bg-[#0e0e10] px-4 text-center">
      <div className="max-w-md rounded-lg border border-[#303038] bg-[#18181b] p-6">
        <h1 className="text-xl font-black">Unable to load this view</h1>
        <p className="mt-3 text-sm leading-6 text-[#adadb8]">The request failed unexpectedly. Retry the view or return to browse.</p>
        <div className="mt-5 flex justify-center gap-3">
          <button onClick={reset} className="rounded bg-[#9147ff] px-4 py-2 text-xs font-bold hover:bg-[#a970ff]">Retry</button>
          <Link href="/" className="rounded bg-[#303038] px-4 py-2 text-xs font-bold hover:bg-[#3b3b44]">Browse</Link>
        </div>
      </div>
    </main>
  );
}
