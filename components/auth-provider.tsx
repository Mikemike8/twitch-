import { ClerkProvider } from "@clerk/nextjs";
import { isClerkConfigured } from "@/lib/clerk-config";

const localization = {
  signIn: {
    start: {
      subtitle: "to continue to Argus",
      subtitleCombined: "to continue to Argus",
    },
  },
  signUp: {
    start: {
      subtitle: "to continue to Argus",
      subtitleCombined: "to continue to Argus",
    },
  },
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  if (!isClerkConfigured) {
    return children;
  }

  return <ClerkProvider localization={localization}>{children}</ClerkProvider>;
}
