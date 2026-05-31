"use client";

import { createContext, useContext, useState, useCallback } from "react";
import type { OnboardingStepId, UserOnboarding } from "@/lib/supabase/types";

interface OnboardingContextValue {
  state: UserOnboarding | null;
  tourActive: boolean;
  currentStep: OnboardingStepId;
  startTour: () => void;
  advanceTo: (step: OnboardingStepId) => void;
  endTour: (skipped?: boolean) => void;
  refreshState: (s: UserOnboarding) => void;
}

const TOUR_ORDER: OnboardingStepId[] = [
  "marca",
  "cliente",
  "producto",
  "cotizacion",
  "envio",
];

const ctx = createContext<OnboardingContextValue>({
  state: null,
  tourActive: false,
  currentStep: "marca",
  startTour: () => {},
  advanceTo: () => {},
  endTour: () => {},
  refreshState: () => {},
});

export function OnboardingProvider({
  initialState,
  children,
}: {
  initialState: UserOnboarding | null;
  children: React.ReactNode;
}) {
  const [state, setState] = useState<UserOnboarding | null>(initialState);
  const [tourActive, setTourActive] = useState<boolean>(
    !!initialState &&
      !initialState.tour_completed &&
      !initialState.tour_skipped_at
  );
  const [currentStep, setCurrentStep] = useState<OnboardingStepId>("marca");

  const startTour = useCallback(() => {
    setCurrentStep("marca");
    setTourActive(true);
  }, []);

  const advanceTo = useCallback((step: OnboardingStepId) => {
    setCurrentStep(step);
  }, []);

  const endTour = useCallback((skipped: boolean = false) => {
    setTourActive(false);
    // Llamadas a server actions las hace el componente OnboardingTour
    if (state) {
      setState({
        ...state,
        tour_completed: !skipped,
        tour_skipped_at: skipped ? new Date().toISOString() : null,
      });
    }
  }, [state]);

  const refreshState = useCallback((s: UserOnboarding) => {
    setState(s);
  }, []);

  return (
    <ctx.Provider
      value={{
        state,
        tourActive,
        currentStep,
        startTour,
        advanceTo,
        endTour,
        refreshState,
      }}
    >
      {children}
    </ctx.Provider>
  );
}

export function useOnboarding() {
  return useContext(ctx);
}

export function nextStep(step: OnboardingStepId): OnboardingStepId | null {
  const idx = TOUR_ORDER.indexOf(step);
  if (idx < 0 || idx >= TOUR_ORDER.length - 1) return null;
  return TOUR_ORDER[idx + 1];
}

export { TOUR_ORDER };
