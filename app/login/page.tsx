import { Suspense } from "react";
import type { Metadata } from "next";
import { AuthShell } from "@/components/auth/auth-shell";
import { LoginForm } from "@/components/auth/login-form";
import { redirectIfAuthenticated } from "@/lib/auth/session";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata: Metadata = {
  title: "Sign In | Coinsight",
  description: "Sign in to your Coinsight personal finance workspace.",
};

interface LoginPageProps {
  searchParams: Promise<{
    next?: string;
    error?: string;
  }>;
}

async function LoginContent({ searchParams }: LoginPageProps) {
  await redirectIfAuthenticated("/dashboard");
  const params = await searchParams;

  const nextPath =
    typeof params.next === "string" &&
      params.next.startsWith("/") &&
      !params.next.startsWith("//")
      ? params.next
      : undefined;

  const callbackError =
    typeof params.error === "string" ? params.error : undefined;

  return <LoginForm nextPath={nextPath} callbackError={callbackError} />;
}

function LoginFormSkeleton() {
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
      <Skeleton className="mt-2 h-9 w-full" />
    </div>
  );
}

export default function LoginPage({ searchParams }: LoginPageProps) {
  return (
    <AuthShell
      title="Welcome back"
      description="Sign in with your email and password to access your financial overview."
      footerText="Don't have a Coinsight account?"
      footerLinkText="Create an account"
      footerLinkHref="/register"
    >
      <Suspense fallback={<LoginFormSkeleton />}>
        <LoginContent searchParams={searchParams} />
      </Suspense>
    </AuthShell>
  );
}

