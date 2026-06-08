import { SignUp } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { authAppearance } from "@/lib/clerk-appearance";
import { isClerkConfigured } from "@/lib/clerk-config";

export default async function SignUpPage() {
  if (!isClerkConfigured) {
    return (
      <div className="max-w-md rounded border border-white/15 bg-[#181818] p-6 text-center text-white shadow-sm">
        <h1 className="text-lg font-bold">Authentication setup required</h1>
        <p className="mt-3 text-sm leading-6 text-[#b3b3b3]">
          Add the Clerk keys from <code className="font-bold text-[#e50914]">.env.example</code> to{" "}
          <code className="font-bold text-[#e50914]">.env</code> to create an account.
        </p>
      </div>
    );
  }

  const { userId } = await auth();
  if (userId) redirect("/");

  return <SignUp routing="path" path="/sign-up" signInUrl="/sign-in" fallbackRedirectUrl="/" appearance={authAppearance} />;
}
