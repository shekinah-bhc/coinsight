import Link from "next/link";
import { ArrowRight, ShieldCheck } from "lucide-react";

interface CtaSectionProps {
  isAuthenticated: boolean;
}

export function CtaSection({ isAuthenticated }: CtaSectionProps) {
  return (
    <section
      aria-labelledby="cta-heading"
      className="relative overflow-hidden border-t border-border bg-card/30 py-20 sm:py-28"
    >
      {/* Background ambient radial accents */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 flex items-center justify-center"
      >
        <div className="size-96 rounded-full bg-primary/10 blur-3xl" />
        <div className="size-80 rounded-full bg-brand-secondary/10 blur-3xl -ml-20" />
      </div>

      <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
        <div className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3.5 py-1 text-xs font-medium text-primary">
          <ShieldCheck className="size-3.5 text-brand-secondary" aria-hidden="true" />
          <span>Free Personal Edition</span>
        </div>

        <h2
          id="cta-heading"
          className="mt-6 text-3xl font-bold tracking-tight text-foreground sm:text-4xl lg:text-5xl"
        >
          Your Financial Picture Starts Here.
        </h2>

        <p className="mx-auto mt-4 max-w-xl text-base text-muted-foreground sm:text-lg">
          Bring your accounts and transactions together. Start understanding where your money goes.
        </p>

        <div className="mt-8 flex justify-center">
          {isAuthenticated ? (
            <Link
              href="/dashboard"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-8 py-4 text-base font-semibold text-primary-foreground shadow-lg shadow-primary/25 transition-all hover:bg-primary/90 hover:shadow-primary/35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
            >
              <span>Go to Dashboard</span>
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          ) : (
            <Link
              href="/register"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-8 py-4 text-base font-semibold text-primary-foreground shadow-lg shadow-primary/25 transition-all hover:bg-primary/90 hover:shadow-primary/35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
            >
              <span>Create Your Free Account</span>
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          )}
        </div>

        <p className="mt-4 text-xs text-muted-foreground">
          No credit card required. Free setup in under 2 minutes.
        </p>
      </div>
    </section>
  );
}

