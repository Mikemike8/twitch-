import { SignIn } from "@clerk/nextjs";
import { isClerkConfigured } from "@/lib/clerk-config";

export default function SignInPage() {
  if (!isClerkConfigured) {
    return <ConfigurationNotice action="sign in" />;
  }

  return <SignIn routing="path" path="/sign-in" signUpUrl="/sign-up" fallbackRedirectUrl="/" />;
}

function ConfigurationNotice({ action }: { action: string }) {
  return (
    <div className="max-w-md rounded-lg border border-[#303038] bg-[#18181b] p-6 text-center">
      <h1 className="text-lg font-black">Authentication setup required</h1>
      <p className="mt-3 text-sm leading-6 text-[#adadb8]">
        Add the Clerk keys from <code className="text-[#bf94ff]">.env.example</code> to{" "}
        <code className="text-[#bf94ff]">.env</code> to {action}.
      </p>
    </div>
  );
}
