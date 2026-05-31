"use client";

import { useState, useEffect } from "react";
import { CheckCircle2, Circle, X, Sparkles } from "lucide-react";
import { useOnboarding } from "./OnboardingContext";
import { dismissHint, updateChecklistStep } from "@/app/onboarding/actions";
import { cn } from "@/lib/utils";

const HINT_ID = "asistente-primera-cotizacion";

interface Props {
  clienteId: string;
  itemsCount: number;
  condicionesPago: string;
}

export function AsistentePrimeraCotizacion({
  clienteId,
  itemsCount,
  condicionesPago,
}: Props) {
  const { state } = useOnboarding();
  const [dismissed, setDismissed] = useState(false);

  const yaCompletado = state?.first_quote_completed === true;
  const yaDescartado = state?.dismissed_hints?.includes(HINT_ID) === true;

  const steps = [
    { id: "cliente", label: "Elegiste un cliente", done: !!clienteId },
    { id: "items", label: "Agregaste al menos 1 producto", done: itemsCount > 0 },
    {
      id: "condiciones",
      label: "Revisaste las condiciones de pago y entrega",
      done: !!condicionesPago,
    },
    { id: "guardar", label: 'Solo falta hacer clic en "Crear cotización"', done: false },
  ];

  const completados = steps.filter((s) => s.done).length;

  // Cuando el usuario completa un paso, marcarlo en BD (silenciosamente)
  useEffect(() => {
    if (yaCompletado || yaDescartado || dismissed) return;
    for (const s of steps) {
      const wasCompleted = state?.checklist_state?.[s.id] === true;
      if (s.done && !wasCompleted) {
        updateChecklistStep(s.id, true).catch(() => {});
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clienteId, itemsCount, condicionesPago]);

  if (yaCompletado || yaDescartado || dismissed) return null;

  function handleDismiss() {
    setDismissed(true);
    dismissHint(HINT_ID).catch(() => {});
  }

  return (
    <div className="relative bg-gradient-to-br from-orange-50 to-amber-50 border border-[var(--primary)]/30 rounded-lg p-4 mb-6">
      <button
        type="button"
        onClick={handleDismiss}
        className="absolute top-2 right-2 p-1 rounded hover:bg-white/60 text-[var(--muted-foreground)] cursor-pointer"
        title="Descartar"
        aria-label="Descartar guía"
      >
        <X size={16} />
      </button>

      <div className="flex items-start gap-3">
        <Sparkles size={20} className="text-[var(--primary)] shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-sm text-[var(--secondary)]">
              Tu primera cotización
            </h3>
            <span className="text-xs px-2 py-0.5 rounded-full bg-[var(--primary)]/10 text-[var(--primary)] font-semibold">
              {completados}/{steps.length}
            </span>
          </div>
          <p className="text-xs text-[var(--muted-foreground)] mb-3">
            Te guío para que armes tu primera cotización sin perderte. Marca los pasos al
            completarlos.
          </p>
          <ul className="space-y-1.5">
            {steps.map((s) => (
              <li key={s.id} className="flex items-center gap-2 text-sm">
                {s.done ? (
                  <CheckCircle2 size={16} className="text-green-600 shrink-0" />
                ) : (
                  <Circle size={16} className="text-[var(--muted-foreground)] shrink-0" />
                )}
                <span
                  className={cn(
                    s.done && "line-through text-[var(--muted-foreground)]"
                  )}
                >
                  {s.label}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
