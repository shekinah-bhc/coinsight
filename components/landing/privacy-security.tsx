import { ShieldCheck, Lock, Database, UserCheck } from "lucide-react";

export function PrivacySecurity() {
  const securityPillars = [
    {
      title: "Database-Level Row Security (RLS)",
      description:
        "Every single table in Coinsight enforces PostgreSQL Row-Level Security. Queries physically cannot access rows belonging to another user.",
      icon: Database,
    },
    {
      title: "Per-User Data Scoping",
      description:
        "Every account balance, transaction, and preference is strictly bound to your authenticated user ID at the database trigger and view level.",
      icon: UserCheck,
    },
    {
      title: "Authenticated Session Cookies",
      description:
        "Sessions are managed using secure, HTTP-only server-side cookie verification, preventing client-side script injection and token leakage.",
      icon: Lock,
    },
    {
      title: "Zero Third-Party Data Selling",
      description:
        "Your financial records are private to you. We do not sell your transactional data, serve advertising, or share figures with third parties.",
      icon: ShieldCheck,
    },
  ];

  return (
    <section
      id="privacy"
      aria-labelledby="privacy-heading"
      className="scroll-mt-20 py-20 sm:py-28"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="mx-auto max-w-2xl text-center">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
            <Lock className="size-3.5 text-primary" aria-hidden="true" />
            <span>Architecture & Security</span>
          </div>
          <h2
            id="privacy-heading"
            className="mt-4 text-3xl font-bold tracking-tight text-foreground sm:text-4xl"
          >
            Your Finances Belong Only to You
          </h2>
          <p className="mt-3 text-base text-muted-foreground sm:text-lg">
            We don’t use marketing buzzwords like &quot;bank-grade&quot;. We implement rigorous, verifiable
            database policies that mathematically isolate your data.
          </p>
        </div>

        {/* 4 Security Pillars Grid */}
        <div className="mt-14 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {securityPillars.map((pillar) => {
            const Icon = pillar.icon;
            return (
              <div
                key={pillar.title}
                className="flex flex-col rounded-2xl border border-border bg-card p-6 shadow-xs transition-colors hover:border-brand-secondary/40"
              >
                <span className="flex size-10 items-center justify-center rounded-xl border border-border bg-background text-brand-secondary">
                  <Icon className="size-5" aria-hidden="true" />
                </span>
                <h3 className="mt-5 text-base font-semibold tracking-tight text-foreground">
                  {pillar.title}
                </h3>
                <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
                  {pillar.description}
                </p>
              </div>
            );
          })}
        </div>

        {/* Verifiable Technical Disclosure Note */}
        <div className="mt-10 rounded-2xl border border-border/70 bg-card/40 p-5 text-center text-xs text-muted-foreground">
          <p>
            Technical disclosure: Security controls are enforced directly in the database engine via PostgreSQL RLS policies
            on <code className="font-mono text-foreground/80">accounts</code>,{" "}
            <code className="font-mono text-foreground/80">transactions</code>,{" "}
            <code className="font-mono text-foreground/80">transfers</code>, and{" "}
            <code className="font-mono text-foreground/80">profiles</code>.
          </p>
        </div>
      </div>
    </section>
  );
}

