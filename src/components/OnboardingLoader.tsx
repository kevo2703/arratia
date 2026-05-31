import { getOnboardingState } from "@/app/onboarding/actions";
import { OnboardingProvider } from "./OnboardingContext";
import { OnboardingTour } from "./OnboardingTour";

export async function OnboardingLoader({ children }: { children: React.ReactNode }) {
  let initialState = null;
  try {
    initialState = await getOnboardingState();
  } catch {
    // Sin auth o sin tabla: skip silencioso (Fase 0 / migración pendiente)
  }

  return (
    <OnboardingProvider initialState={initialState}>
      {children}
      <OnboardingTour />
    </OnboardingProvider>
  );
}
