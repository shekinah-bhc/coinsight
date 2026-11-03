import { UserCheck, PlusCircle, BarChart3 } from "lucide-react";

export function HowItWorks() {
  const steps = [
    {
      step: "01",
      title: "Create your secure account",
      description:
        "Sign up with your email in seconds. Your private database partition is provisioned immediately with strict Row-Level Security.",
      icon: UserCheck,
    },
    {
      step: "02",
      title: "Add your accounts & entries",
      description:
        "Set up your bank accounts, credit cards, or cash balances. Log incoming salary and expenses with quick categorization.",
      icon: PlusCircle,
    },
    {
      step: "03",
      title: "Understand your true position",
      description:
        "View accurate net worth, monthly cash flow, and spending patterns on your unified dashboard without guesswork.",
      icon: BarChart3,
    },
  ];

  return (
    <section
      id="how-it-works"
      aria-labelledby="how-it-works-heading"
      className="scroll-mt-20 border-t border-border bg-card/10 py-20 sm:py-28"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="mx-auto max-w-2xl text-center">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-brand-secondary/30 bg-brand-secondary/10 px-3 py-1 text-xs font-medium text-brand-secondary">
            <span>Simple 3-Step Setup</span>
          </div>
          <h2
            id="how-it-works-heading"
            className="mt-4 text-3xl font-bold tracking-tight text-foreground sm:text-4xl"
          >
            How Coinsight Works
          </h2>
          <p className="mt-3 text-base text-muted-foreground sm:text-lg">
            No complicated aggregators or third-party bank screen-scrapers. Take ownership in minutes.
          </p>
        </div>

        {/* Steps: Horizontal on md+, vertical below */}
        <div className="mt-16 grid grid-cols-1 gap-8 md:grid-cols-3 md:gap-6">
          {steps.map((item, index) => {
            const Icon = item.icon;
            return (
              <div
                key={item.step}
                className="relative flex flex-col rounded-2xl border border-border bg-card p-6 shadow-xs transition-all duration-200 hover:border-primary/40"
              >
                {/* Step Indicator Header */}
                <div className="flex items-center justify-between">
                  <span className="font-mono text-2xl font-bold text-primary/70">
                    {item.step}
                  </span>
                  <span className="flex size-10 items-center justify-center rounded-xl border border-border bg-background text-primary">
                    <Icon className="size-5" aria-hidden="true" />
                  </span>
                </div>

                {/* Step Body */}
                <h3 className="mt-6 text-lg font-semibold tracking-tight text-foreground">
                  {item.title}
                </h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                  {item.description}
                </p>

                {/* Progress bar line indicator on desktop */}
                {index < steps.length - 1 && (
                  <div
                    aria-hidden="true"
                    className="hidden md:block absolute -right-3 top-1/2 -translate-y-1/2 z-10 size-6 rounded-full border border-border bg-background text-center text-xs leading-6 text-muted-foreground font-mono"
                  >
                    →
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

