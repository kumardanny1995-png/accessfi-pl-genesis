"use client";

import type { Route } from "next";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import type { FormEvent } from "react";
import { useEffect, useState } from "react";

import { AppLoadingScreen, AuthPageShell } from "@/components/can-afford/route-shells";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCanAffordIt } from "@/components/providers/can-afford-provider";

function normalizeNextRoute(next: string | null | undefined, fallback: Route): Route {
  return next && next.startsWith("/") ? (next as Route) : fallback;
}

export function AuthPage({ mode }: { mode: "login" | "signup" }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { authLoading, dataLoading, user, isOnboardingComplete, signIn, signUp } = useCanAffordIt();
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading || dataLoading || !user) {
      return;
    }

    const next = searchParams?.get("next");
    router.replace(normalizeNextRoute(next, isOnboardingComplete ? "/dashboard" : "/onboarding"));
  }, [authLoading, dataLoading, isOnboardingComplete, router, searchParams, user]);

  if (authLoading || (user && dataLoading)) {
    return <AppLoadingScreen />;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    setFeedback(null);

    const formData = new FormData(event.currentTarget);
    const submittedDisplayName = String(formData.get("displayName") ?? "").trim();
    const submittedEmail = String(formData.get("email") ?? "")
      .trim()
      .toLowerCase();
    const submittedPassword = String(formData.get("password") ?? "");

    try {
      if (mode === "login") {
        const result = await signIn(submittedEmail, submittedPassword);
        if (!result.ok) {
          setError(result.message ?? "Unable to sign you in.");
          return;
        }
      } else {
        const result = await signUp(submittedEmail, submittedPassword, submittedDisplayName || "User");
        if (!result.ok) {
          setError(result.message ?? "Unable to create your account.");
          return;
        }
        if (result.message) {
          setFeedback(result.message);
          return;
        }
      }

      const next = searchParams?.get("next");
      const fallbackRoute: Route = mode === "login" ? "/dashboard" : "/onboarding";
      router.push(normalizeNextRoute(next, fallbackRoute));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthPageShell
      eyebrow={mode === "login" ? "Welcome Back" : "Create Your Account"}
      title={mode === "login" ? "Log in and check the next decision with context." : "Create your account and start from a clearer baseline."}
      description={
        mode === "login"
          ? "Pick up where you left off. Your financial profile, goals, and decision history stay connected to your account."
          : "This sets up your finance profile, goal tracking, and decision history. You will finish the actual money setup in the onboarding flow next."
      }
      footer={
        mode === "login" ? (
          <>
            Need an account?{" "}
            <Link href="/signup" className="text-[#4fdbc8] hover:text-white">
              Sign up
            </Link>
          </>
        ) : (
          <>
            Already have an account?{" "}
            <Link href="/login" className="text-[#4fdbc8] hover:text-white">
              Log in
            </Link>
          </>
        )
      }
    >
      <form className="space-y-5" onSubmit={handleSubmit}>
        {mode === "signup" ? (
          <div className="space-y-2">
            <label className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/46">Name</label>
            <Input value={displayName} onChange={(event) => setDisplayName(event.target.value)} placeholder="Aarav" autoComplete="name" />
            <input type="hidden" name="displayName" value={displayName} />
          </div>
        ) : null}
        <div className="space-y-2">
          <label className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/46">Email</label>
          <Input
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            name="email"
            type="email"
            placeholder="you@example.com"
            autoComplete="email"
            required
          />
        </div>
        <div className="space-y-2">
          <label className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/46">Password</label>
          <Input
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            name="password"
            type="password"
            placeholder="Minimum 6 characters"
            autoComplete={mode === "login" ? "current-password" : "new-password"}
            minLength={6}
            required
          />
        </div>

        {error ? <p className="rounded-[1.4rem] border border-[#ff716c]/20 bg-[#ff716c]/10 px-4 py-3 text-sm text-[#ff9a95]">{error}</p> : null}
        {feedback ? (
          <p className="rounded-[1.4rem] border border-[#4fdbc8]/20 bg-[#4fdbc8]/10 px-4 py-3 text-sm text-[#4fdbc8]">{feedback}</p>
        ) : null}

        <Button type="submit" className="w-full" disabled={submitting}>
          {submitting ? "Working..." : mode === "login" ? "Log In" : "Create Account"}
        </Button>
      </form>
    </AuthPageShell>
  );
}
