"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { UserOnboarding } from "@/lib/supabase/types";

const DEFAULT_STATE: Omit<UserOnboarding, "user_id" | "created_at" | "updated_at"> = {
  tour_completed: false,
  tour_skipped_at: null,
  first_quote_completed: false,
  checklist_state: {},
  dismissed_hints: [],
};

export async function getOnboardingState(): Promise<UserOnboarding | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("user_onboarding")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  if (data) return data as UserOnboarding;

  // Crear fila al primer acceso
  const newRow = {
    user_id: user.id,
    ...DEFAULT_STATE,
  };
  const { data: created } = await supabase
    .from("user_onboarding")
    .insert(newRow)
    .select("*")
    .single();

  return (created as UserOnboarding) || null;
}

export async function markTourCompleted() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  await supabase
    .from("user_onboarding")
    .upsert({
      user_id: user.id,
      tour_completed: true,
      updated_at: new Date().toISOString(),
    });
  revalidatePath("/", "layout");
}

export async function markTourSkipped() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  await supabase
    .from("user_onboarding")
    .upsert({
      user_id: user.id,
      tour_skipped_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
  revalidatePath("/", "layout");
}

export async function resetTour() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  await supabase
    .from("user_onboarding")
    .upsert({
      user_id: user.id,
      tour_completed: false,
      tour_skipped_at: null,
      updated_at: new Date().toISOString(),
    });
  revalidatePath("/", "layout");
}

export async function updateChecklistStep(step: string, value: boolean) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const { data: current } = await supabase
    .from("user_onboarding")
    .select("checklist_state")
    .eq("user_id", user.id)
    .maybeSingle();

  const checklist = ((current?.checklist_state as Record<string, boolean>) || {});
  checklist[step] = value;

  await supabase
    .from("user_onboarding")
    .upsert({
      user_id: user.id,
      checklist_state: checklist,
      updated_at: new Date().toISOString(),
    });
}

export async function markFirstQuoteCompleted() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  await supabase
    .from("user_onboarding")
    .upsert({
      user_id: user.id,
      first_quote_completed: true,
      checklist_state: {
        cliente: true,
        items: true,
        condiciones: true,
        guardar: true,
      },
      updated_at: new Date().toISOString(),
    });
  revalidatePath("/cotizaciones/nueva");
}

export async function dismissHint(hintId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const { data: current } = await supabase
    .from("user_onboarding")
    .select("dismissed_hints")
    .eq("user_id", user.id)
    .maybeSingle();

  const dismissed = ((current?.dismissed_hints as string[]) || []);
  if (!dismissed.includes(hintId)) dismissed.push(hintId);

  await supabase
    .from("user_onboarding")
    .upsert({
      user_id: user.id,
      dismissed_hints: dismissed,
      updated_at: new Date().toISOString(),
    });
}
