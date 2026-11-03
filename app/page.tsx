import { Suspense } from "react";
import type { Metadata } from "next";
import { getAuthClaims } from "@/lib/auth/session";
import { Navbar } from "@/components/landing/navbar";
import { Hero } from "@/components/landing/hero";
import { FinancialOverview } from "@/components/landing/financial-overview";
import { Features } from "@/components/landing/features";
import { HowItWorks } from "@/components/landing/how-it-works";
import { PrivacySecurity } from "@/components/landing/privacy-security";
import { CtaSection } from "@/components/landing/cta-section";
import { Footer } from "@/components/landing/footer";

export const metadata: Metadata = {
  title: "Coinsight — Personal Finance Intelligence & Wealth Tracking",
  description:
    "Track accounts, categorize expenses, and understand every rupee. Complete personal finance management built for India with database-level isolation.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Coinsight — Personal Finance Intelligence",
    description:
      "Track your income, manage expenses, monitor accounts, and understand your financial habits — all in one place.",
    url: "/",
    siteName: "Coinsight",
    locale: "en_IN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Coinsight — Personal Finance Intelligence",
    description:
      "Track your income, manage expenses, monitor accounts, and understand your financial habits — all in one place.",
  },
};

async function LandingDynamic() {
  const claims = await getAuthClaims();
  const isAuthenticated = Boolean(
    claims && typeof claims.sub === "string" && claims.sub.length > 0
  );

  return (
    <>
      <Navbar isAuthenticated={isAuthenticated} />
      <main id="main-content" className="flex-1">
        <Hero isAuthenticated={isAuthenticated} />
        <FinancialOverview />
        <Features />
        <HowItWorks />
        <PrivacySecurity />
        <CtaSection isAuthenticated={isAuthenticated} />
      </main>
      <Footer />
    </>
  );
}

function LandingStaticFallback() {
  return (
    <>
      <Navbar isAuthenticated={false} />
      <main id="main-content" className="flex-1">
        <Hero isAuthenticated={false} />
        <FinancialOverview />
        <Features />
        <HowItWorks />
        <PrivacySecurity />
        <CtaSection isAuthenticated={false} />
      </main>
      <Footer />
    </>
  );
}

export default function LandingPage() {
  return (
    <div className="fintech-ambient relative min-h-screen flex flex-col bg-background text-foreground scroll-smooth">
      {/* Accessible Skip Link */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:rounded-lg focus:bg-primary focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-primary-foreground focus:shadow-md focus:outline-none"
      >
        Skip to main content
      </a>

      <Suspense fallback={<LandingStaticFallback />}>
        <LandingDynamic />
      </Suspense>
    </div>
  );
}
