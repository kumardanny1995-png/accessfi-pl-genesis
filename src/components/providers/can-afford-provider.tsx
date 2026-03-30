"use client";

import {
  createContext,
  type PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState
} from "react";
import type { Session, User } from "@supabase/supabase-js";

import { loadAppSnapshot, saveDecision, saveProfileAndGoals, type StorageMode, detectStorageMode } from "@/lib/can-afford/data";
import {
  createBlankProfileInput,
  createDefaultGoals,
  createSampleDecisionInputs,
  createSampleProfileInput
} from "@/lib/can-afford/defaults";
import { evaluateDecision } from "@/lib/finance/engine";
import type {
  DecisionInput,
  DecisionRecord,
  FinancialGoal,
  FinancialProfileInput,
  FinancialProfileRecord
} from "@/lib/finance/types";
import { validateDecisionSubmission, validateOnboardingSubmission } from "@/lib/can-afford/validation";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";

type AuthResult = {
  ok: boolean;
  message?: string;
};

interface CanAffordContextValue {
  authLoading: boolean;
  dataLoading: boolean;
  appReady: boolean;
  user: User | null;
  session: Session | null;
  storageMode: StorageMode;
  profile: FinancialProfileRecord | null;
  profileDraft: FinancialProfileInput;
  goals: FinancialGoal[];
  decisions: DecisionRecord[];
  error: string | null;
  isOnboardingComplete: boolean;
  signIn: (email: string, password: string) => Promise<AuthResult>;
  signUp: (email: string, password: string, displayName: string) => Promise<AuthResult>;
  signOut: () => Promise<void>;
  saveOnboarding: (profile: FinancialProfileInput, goals: FinancialGoal[]) => Promise<AuthResult>;
  updateSettings: (profile: FinancialProfileInput, goals: FinancialGoal[]) => Promise<AuthResult>;
  createDecision: (decision: DecisionInput) => Promise<{ ok: boolean; decision?: DecisionRecord; message?: string }>;
  refreshDecisionExplanation: (decisionId: string) => Promise<void>;
  getDecision: (decisionId: string) => DecisionRecord | null;
  applySampleProfile: () => void;
}

const CanAffordContext = createContext<CanAffordContextValue | null>(null);

function sortDecisions(decisions: DecisionRecord[]) {
  return [...decisions].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function CanAffordItProvider({ children }: PropsWithChildren) {
  const [supabase] = useState(() => getSupabaseBrowserClient());
  const [authLoading, setAuthLoading] = useState(true);
  const [dataLoading, setDataLoading] = useState(true);
  const [storageMode, setStorageMode] = useState<StorageMode>("supabase");
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<FinancialProfileRecord | null>(null);
  const [profileDraft, setProfileDraft] = useState<FinancialProfileInput>(createBlankProfileInput());
  const [goals, setGoals] = useState<FinancialGoal[]>([]);
  const [decisions, setDecisions] = useState<DecisionRecord[]>([]);
  const [error, setError] = useState<string | null>(null);

  const user = session?.user ?? null;
  const isOnboardingComplete = Boolean(profile && goals.length > 0 && profile.monthlyInHandSalary > 0);

  useEffect(() => {
    if (!supabase) {
      setAuthLoading(false);
      setDataLoading(false);
      return;
    }

    let mounted = true;

    supabase.auth
      .getSession()
      .then(({ data, error: sessionError }) => {
        if (!mounted) {
          return;
        }
        if (sessionError) {
          setError(sessionError.message);
        }
        if (data.session?.user) {
          setDataLoading(true);
        }
        setSession(data.session ?? null);
        setAuthLoading(false);
      })
      .catch((sessionError) => {
        if (!mounted) {
          return;
        }
        setError(sessionError instanceof Error ? sessionError.message : "Unable to load your session.");
        setAuthLoading(false);
      });

    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (!mounted) {
        return;
      }
      if (nextSession?.user) {
        setDataLoading(true);
      }
      setSession(nextSession);
      setAuthLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [supabase]);

  const ensureSeededDecisions = useCallback(
    async (nextProfile: FinancialProfileRecord, nextGoals: FinancialGoal[]) => {
      if (decisions.length > 0) {
        return;
      }

      const templates = createSampleDecisionInputs();
      const built = templates.map((template) => evaluateDecision(nextProfile, nextGoals, template));
      let nextMode = storageMode;

      for (const decision of built) {
        nextMode = await saveDecision({
          client: supabase,
          userId: nextProfile.userId,
          decision
        });
      }

      setStorageMode(nextMode);
      setDecisions(sortDecisions(built));
    },
    [decisions.length, storageMode, supabase]
  );

  const loadUserData = useCallback(
    async (nextUser: User) => {
      setDataLoading(true);
      setError(null);

      try {
        const nextMode = await detectStorageMode(supabase);
        const snapshot = await loadAppSnapshot(supabase, nextUser.id);
        setStorageMode(nextMode);
        setProfile(snapshot.profile);
        setGoals(snapshot.goals);
        setDecisions(sortDecisions(snapshot.decisions));

        if (snapshot.profile) {
          setProfileDraft({
            displayName: snapshot.profile.displayName,
            city: snapshot.profile.city,
            monthlyInHandSalary: snapshot.profile.monthlyInHandSalary,
            currentBankBalance: snapshot.profile.currentBankBalance,
            emergencySavings: snapshot.profile.emergencySavings,
            rent: snapshot.profile.rent,
            fixedMonthlyBills: snapshot.profile.fixedMonthlyBills,
            emiObligations: snapshot.profile.emiObligations,
            creditCardDues: snapshot.profile.creditCardDues,
            monthlyInvestments: snapshot.profile.monthlyInvestments,
            monthlyDiscretionarySpending: snapshot.profile.monthlyDiscretionarySpending,
            preferences: snapshot.profile.preferences
          });
        } else {
          const sample = createSampleProfileInput();
          setProfileDraft({
            ...sample,
            displayName:
              (nextUser.user_metadata?.display_name as string | undefined) ??
              nextUser.email?.split("@")[0] ??
              sample.displayName
          });
        }
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "Unable to load your financial profile.");
      } finally {
        setDataLoading(false);
      }
    },
    [supabase]
  );

  useEffect(() => {
    if (authLoading) {
      return;
    }

    if (!user) {
      setProfile(null);
      setGoals([]);
      setDecisions([]);
      setDataLoading(false);
      return;
    }

    loadUserData(user);
  }, [authLoading, loadUserData, user]);

  const signIn = useCallback(
    async (email: string, password: string): Promise<AuthResult> => {
      if (!supabase) {
        return { ok: false, message: "Supabase auth is not configured in this environment." };
      }

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (signInError) {
        return {
          ok: false,
          message: signInError.message
        };
      }

      return { ok: true };
    },
    [supabase]
  );

  const signUp = useCallback(
    async (email: string, password: string, displayName: string): Promise<AuthResult> => {
      if (!supabase) {
        return { ok: false, message: "Supabase auth is not configured in this environment." };
      }

      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            display_name: displayName
          }
        }
      });

      if (signUpError) {
        return {
          ok: false,
          message: signUpError.message
        };
      }

      if (!data.session) {
        return {
          ok: true,
          message: "Account created. Check your email to verify the sign-in link before continuing."
        };
      }

      return { ok: true };
    },
    [supabase]
  );

  const signOut = useCallback(async () => {
    if (supabase) {
      await supabase.auth.signOut();
    }
    setProfile(null);
    setGoals([]);
    setDecisions([]);
  }, [supabase]);

  const persistProfile = useCallback(
    async (nextProfileInput: FinancialProfileInput, nextGoals: FinancialGoal[]) => {
      if (!user) {
        return { ok: false, message: "You need to be signed in before saving your profile." };
      }

      const validated = validateOnboardingSubmission(nextProfileInput, nextGoals);
      if (!validated.ok) {
        return { ok: false, message: validated.message };
      }

      try {
        const saved = await saveProfileAndGoals({
          client: supabase,
          mode: storageMode,
          userId: user.id,
          existingProfileId: profile?.id,
          profile: validated.data.profile,
          goals: validated.data.goals
        });

        setStorageMode(saved.mode);
        setProfile(saved.profile);
        setProfileDraft(validated.data.profile);
        setGoals(validated.data.goals);
        await ensureSeededDecisions(saved.profile, validated.data.goals);
        return { ok: true };
      } catch (persistError) {
        return {
          ok: false,
          message: persistError instanceof Error ? persistError.message : "Unable to save your profile."
        };
      }
    },
    [ensureSeededDecisions, profile?.id, storageMode, supabase, user]
  );

  const saveOnboarding = useCallback(
    async (nextProfileInput: FinancialProfileInput, nextGoals: FinancialGoal[]) => persistProfile(nextProfileInput, nextGoals),
    [persistProfile]
  );

  const updateSettings = useCallback(
    async (nextProfileInput: FinancialProfileInput, nextGoals: FinancialGoal[]) => persistProfile(nextProfileInput, nextGoals),
    [persistProfile]
  );

  const createDecision = useCallback(
    async (decision: DecisionInput) => {
      if (!profile || !user) {
        return {
          ok: false,
          message: "Complete onboarding before running a decision."
        };
      }

      try {
        const candidate = {
          ...decision,
          id: decision.id || crypto.randomUUID()
        };
        const validated = validateDecisionSubmission(candidate);
        if (!validated.ok) {
          return {
            ok: false,
            message: validated.message
          };
        }

        const built = evaluateDecision(profile, goals, validated.data);

        const nextMode = await saveDecision({
          client: supabase,
          userId: user.id,
          decision: built
        });

        setStorageMode(nextMode);
        setDecisions((current) => sortDecisions([built, ...current.filter((item) => item.id !== built.id)]));
        return {
          ok: true,
          decision: built
        };
      } catch (decisionError) {
        return {
          ok: false,
          message: decisionError instanceof Error ? decisionError.message : "Unable to save that decision."
        };
      }
    },
    [goals, profile, supabase, user]
  );

  const refreshDecisionExplanation = useCallback(
    async (decisionId: string) => {
      const target = decisions.find((item) => item.id === decisionId);
      if (!target || profile?.preferences.explanationMode !== "ai") {
        return;
      }

      try {
        const response = await fetch("/api/explain", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            decision: target
          })
        });

        if (!response.ok) {
          return;
        }

        const payload = (await response.json()) as { explanation?: string };
        if (!payload.explanation) {
          return;
        }

        const explanation = payload.explanation;

        setDecisions((current) =>
          current.map((item) =>
            item.id === decisionId
              ? {
                  ...item,
                  explanation,
                  explanationSource: "ai",
                  computed: {
                    ...item.computed,
                    explanation,
                    explanationSource: "ai"
                  }
                }
              : item
          )
        );
      } catch {
        // Ignore AI explanation failures and keep the deterministic template copy.
      }
    },
    [decisions, profile?.preferences.explanationMode]
  );

  const getDecision = useCallback(
    (decisionId: string) => decisions.find((decision) => decision.id === decisionId) ?? null,
    [decisions]
  );

  const applySampleProfile = useCallback(() => {
    if (!user) {
      const sample = createSampleProfileInput();
      setProfileDraft(sample);
      setGoals(createDefaultGoals(sample));
      return;
    }

    const sample = createSampleProfileInput();
    setProfileDraft({
      ...sample,
      displayName:
        (user.user_metadata?.display_name as string | undefined) ??
        user.email?.split("@")[0] ??
        sample.displayName
    });
    setGoals(createDefaultGoals(sample));
  }, [user]);

  const value = useMemo<CanAffordContextValue>(
    () => ({
      authLoading,
      dataLoading,
      appReady: !authLoading && !dataLoading,
      user,
      session,
      storageMode,
      profile,
      profileDraft,
      goals,
      decisions,
      error,
      isOnboardingComplete,
      signIn,
      signUp,
      signOut,
      saveOnboarding,
      updateSettings,
      createDecision,
      refreshDecisionExplanation,
      getDecision,
      applySampleProfile
    }),
    [
      authLoading,
      dataLoading,
      user,
      session,
      storageMode,
      profile,
      profileDraft,
      goals,
      decisions,
      error,
      isOnboardingComplete,
      signIn,
      signUp,
      signOut,
      saveOnboarding,
      updateSettings,
      createDecision,
      refreshDecisionExplanation,
      getDecision,
      applySampleProfile
    ]
  );

  return <CanAffordContext.Provider value={value}>{children}</CanAffordContext.Provider>;
}

export function useCanAffordIt() {
  const context = useContext(CanAffordContext);
  if (!context) {
    throw new Error("useCanAffordIt must be used inside CanAffordItProvider.");
  }
  return context;
}
