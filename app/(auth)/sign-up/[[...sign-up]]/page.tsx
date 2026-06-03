import { SignUp } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { isClerkConfigured } from "@/lib/clerk-config";

export default async function SignUpPage() {
  if (!isClerkConfigured) {
    return (
      <div className="max-w-md rounded-lg border border-[#303038] bg-[#18181b] p-6 text-center">
        <h1 className="text-lg font-black">Authentication setup required</h1>
        <p className="mt-3 text-sm leading-6 text-[#adadb8]">
          Add the Clerk keys from <code className="text-[#bf94ff]">.env.example</code> to{" "}
          <code className="text-[#bf94ff]">.env</code> to create an account.
        </p>
      </div>
    );
  }

  const { userId } = await auth();
  if (userId) redirect("/");

  return <SignUp routing="path" path="/sign-up" signInUrl="/sign-in" fallbackRedirectUrl="/" />;
}
