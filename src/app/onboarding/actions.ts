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

// Defensive: wraps any onboarding operation so a missing table or RLS error
// never bubbles up to crash a Server Component render.
async function safe<T>(fn: () => Promise<T>, label: string, fallback: T): Promise<T> {
  try {
    return await fn();
  } catch (e) {
    console.error(`[onboarding:${label}]`, e instanceof Error ? e.message : e);
    return fallback;
  }
}

export async function getOnboardingState(): Promise<UserOnboarding | null> {
  return safe(
    async () => {
      const supabase = await createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error: qErr } = await supabase
        .from("user_onboarding")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (qErr) {
        console.error("[onboarding:get] query error:", qErr.message);
        return null;
      }
      if (data) return data as UserOnboarding;

      // Crear fila al primer acceso (tabla puede no existir todavía → atrapado por safe())
      const { data: created, error: insErr } = await supabase
        .from("user_onboarding")
        .insert({ user_id: user.id, ...DEFAULT_STATE })
        .select("*")
        .single();

      if (insErr) {
        console.error("[onboarding:get] insert error:", insErr.message);
        return null;
      }
      return (created as UserOnboarding) || null;
    },
    "get",
    null
  );
}

export async function markTourCompleted() {
  await safe(
    async () => {
      const supabase = await createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      await supabase.from("user_onboarding").upsert({
        user_id: user.id,
        tour_completed: true,
        updated_at: new Date().toISOString(),
      });
      revalidatePath("/", "layout");
    },
    "markTourCompleted",
    undefined
  );
}

export async function markTourSkipped() {
  await safe(
    async () => {
      const supabase = await createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      await supabase.from("user_onboarding").upsert({
        user_id: user.id,
        tour_skipped_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
      revalidatePath("/", "layout");
    },
    "markTourSkipped",
    undefined
  );
}

export async function resetTour() {
  await safe(
    async () => {
      const supabase = await createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      await supabase.from("user_onboarding").upsert({
        user_id: user.id,
        tour_completed: false,
        tour_skipped_at: null,
        updated_at: new Date().toISOString(),
      });
      revalidatePath("/", "layout");
    },
    "resetTour",
    undefined
  );
}

export async function updateChecklistStep(step: string, value: boolean) {
  await safe(
    async () => {
      const supabase = await createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data: current, error: qErr } = await supabase
        .from("user_onboarding")
        .select("checklist_state")
        .eq("user_id", user.id)
        .maybeSingle();
      if (qErr) return;

      const checklist = (current?.checklist_state as Record<string, boolean>) || {};
      checklist[step] = value;

      await supabase.from("user_onboarding").upsert({
        user_id: user.id,
        checklist_state: checklist,
        updated_at: new Date().toISOString(),
      });
    },
    "updateChecklistStep",
    undefined
  );
}

export async function markFirstQuoteCompleted() {
  await safe(
    async () => {
      const supabase = await createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      await supabase.from("user_onboarding").upsert({
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
    },
    "markFirstQuoteCompleted",
    undefined
  );
}

export async function dismissHint(hintId: string) {
  await safe(
    async () => {
      const supabase = await createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data: current, error: qErr } = await supabase
        .from("user_onboarding")
        .select("dismissed_hints")
        .eq("user_id", user.id)
        .maybeSingle();
      if (qErr) return;

      const dismissed = (current?.dismissed_hints as string[]) || [];
      if (!dismissed.includes(hintId)) dismissed.push(hintId);

      await supabase.from("user_onboarding").upsert({
        user_id: user.id,
        dismissed_hints: dismissed,
        updated_at: new Date().toISOString(),
      });
    },
    "dismissHint",
    undefined
  );
}
