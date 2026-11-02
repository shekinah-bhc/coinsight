import { Suspense } from "react";
import type { Metadata } from "next";
import { AuthShell } from "@/components/auth/auth-shell";
import { RegisterForm } from "@/components/auth/register-form";
import { redirectIfAuthenticated } from "@/lib/auth/session";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata: Metadata = {
  title: "Create Account | Coinsight",
  description: "Create a Coinsight account to track and manage your finances.",
};

async function RegisterContent() {
  await redirectIfAuthenticated("/dashboard");
  return <RegisterForm />;
}

function RegisterFormSkeleton() {
  return (
    <div className="space-y-4" aria-hidden="true">
      <div className="space-y-1.5">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-9 w-full" />
      </div>
      <div className="space-y-1.5">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-9 w-full" />
      </div>
      <div className="space-y-1.5">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-9 w-full" />
      </div>
      <Skeleton className="mt-2 h-9 w-full" />
    </div>
  );
}

export default function RegisterPage() {
  return (
    <AuthShell
      title="Create your account"
      description="Start managing your accounts, budgets, and cash flow in one secure workspace."
      footerText="Already have a Coinsight account?"
      footerLinkText="Sign in"
      footerLinkHref="/login"
    >
      <Suspense fallback={<RegisterFormSkeleton />}>
        <RegisterContent />
      </Suspense>
    </AuthShell>
  );
}

