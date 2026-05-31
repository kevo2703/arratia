"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useOnboarding, nextStep } from "./OnboardingContext";
import { markTourCompleted, markTourSkipped } from "@/app/onboarding/actions";
import type { OnboardingStepId } from "@/lib/supabase/types";

interface SubStep {
  element?: string;
  popover: {
    title: string;
    description: string;
    side?: "left" | "right" | "top" | "bottom";
    align?: "start" | "center" | "end";
  };
}

interface StepConfig {
  path: string;
  steps: SubStep[];
}

const STEPS_CONFIG: Record<OnboardingStepId, StepConfig> = {
  marca: {
    path: "/configuracion",
    steps: [
      {
        popover: {
          title: "👋 ¡Bienvenido a Arratia!",
          description:
            "Te muestro lo esencial en 5 pasos cortos. Puedes saltarte el tour cuando quieras. Empezamos por personalizar tu cotizador.",
        },
      },
      {
        element: "[data-tour='logo-uploader']",
        popover: {
          title: "1. Sube tu logo",
          description: "Aparece en el sidebar, topbar móvil y en cada PDF que envíes.",
        },
      },
      {
        element: "[data-tour='color-pickers']",
        popover: {
          title: "Elige tus colores",
          description:
            "Personaliza los 2 colores principales. Aplican a botones, menú y PDFs.",
        },
      },
      {
        element: "[data-tour='guardar-config']",
        popover: {
          title: "Guarda los cambios",
          description: "Después de guardar, sigamos con tus clientes.",
        },
      },
    ],
  },
  cliente: {
    path: "/clientes/nuevo",
    steps: [
      {
        popover: {
          title: "2. Tu primer cliente",
          description:
            "Si trabajas con empresas peruanas, te ahorramos escribir los datos: pones el RUC y los traemos de SUNAT.",
        },
      },
      {
        element: "[data-tour='ruc-input']",
        popover: {
          title: "Escribe el RUC",
          description: "11 dígitos. Después clic en el botón de la derecha.",
        },
      },
      {
        element: "[data-tour='buscar-sunat']",
        popover: {
          title: "Buscar en SUNAT",
          description:
            "En 1 segundo se autocompletan razón social, dirección, distrito y más. Como magia.",
        },
      },
    ],
  },
  producto: {
    path: "/productos/nuevo",
    steps: [
      {
        popover: {
          title: "3. Tu primer producto",
          description:
            "Llena el formulario o usa 'Carga masiva' desde /productos para subir muchos productos con un CSV de Excel.",
        },
      },
      {
        element: "[data-tour='producto-form']",
        popover: {
          title: "Formulario de producto",
          description:
            "Código único, nombre, marca, unidad, precio (sin IGV). Lo demás es opcional.",
        },
      },
    ],
  },
  cotizacion: {
    path: "/cotizaciones/nueva",
    steps: [
      {
        popover: {
          title: "4. Tu primera cotización",
          description:
            "Aquí está el corazón del sistema. A la izquierda los datos generales, a la derecha los productos.",
        },
      },
      {
        element: "[data-tour='cot-cliente']",
        popover: {
          title: "Elige el cliente",
          description: "El que acabas de crear (o cualquier otro de tu lista).",
        },
      },
      {
        element: "[data-tour='cot-agregar-item']",
        popover: {
          title: "Agrega productos",
          description:
            "Selecciona del catálogo o crea un ítem libre. Puedes poner cantidad, descuento, etc.",
        },
      },
      {
        element: "[data-tour='cot-guardar']",
        popover: {
          title: "Crea la cotización",
          description:
            "Al guardar, se genera un número automático COT-2026-XXXX y vamos al detalle.",
        },
      },
    ],
  },
  envio: {
    path: "/cotizaciones",
    steps: [
      {
        popover: {
          title: "5. ¡Listo para enviar!",
          description:
            "Desde el detalle de cada cotización, generas el PDF profesional y lo mandas por WhatsApp o correo en 1 clic. El cliente recibe el link al PDF.",
        },
      },
      {
        popover: {
          title: "🎉 Eso es todo",
          description:
            "Tu cotizador está listo. Puedes volver a ver este tour desde el botón 'Ver tutorial' en el menú lateral cuando quieras.",
        },
      },
    ],
  },
};

export function OnboardingTour() {
  const { tourActive, currentStep, advanceTo, endTour } = useOnboarding();
  const pathname = usePathname();
  const router = useRouter();
  const driverRef = useRef<{ destroy: () => void } | null>(null);

  useEffect(() => {
    if (!tourActive) return;

    const config = STEPS_CONFIG[currentStep];
    if (!config) return;

    // Si no estamos en la ruta correcta, navegar
    if (pathname !== config.path) {
      router.push(config.path);
      return;
    }

    let cancelled = false;
    let driverInstance: { drive: () => void; destroy: () => void } | null = null;

    (async () => {
      try {
        const driverMod = await import("driver.js");
        await import("driver.js/dist/driver.css");

        if (cancelled) return;

        // Espera un tick para asegurar que los elementos del DOM estén montados
        await new Promise((r) => setTimeout(r, 300));

        const next = nextStep(currentStep);

        driverInstance = driverMod.driver({
          showProgress: true,
          showButtons: ["next", "previous", "close"],
          nextBtnText: "Siguiente →",
          prevBtnText: "← Anterior",
          doneBtnText: next ? "Siguiente paso" : "¡Terminar!",
          progressText: "Paso {{current}} de {{total}}",
          allowClose: true,
          overlayColor: "rgba(15, 23, 42, 0.65)",
          stagePadding: 6,
          stageRadius: 8,
          steps: config.steps,
          onDestroyStarted: () => {
            // Si el usuario cerró con la X antes de terminar, marcamos skip
            if (!driverInstance) return;
            const activeIdx = driverInstance && (driverInstance as unknown as { getActiveIndex?: () => number }).getActiveIndex?.();
            const total = config.steps.length;
            if (activeIdx !== undefined && activeIdx < total - 1) {
              // No llegó al final → skip
              endTour(true);
              markTourSkipped();
            }
            driverInstance?.destroy();
          },
          onDestroyed: () => {
            // Llegó al final del paso completo
            if (next) {
              advanceTo(next);
            } else {
              endTour(false);
              markTourCompleted();
            }
          },
        });

        driverRef.current = driverInstance;
        driverInstance.drive();
      } catch (e) {
        console.error("Error iniciando tour:", e);
      }
    })();

    return () => {
      cancelled = true;
      if (driverInstance) {
        try {
          driverInstance.destroy();
        } catch {
          // ignore
        }
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tourActive, currentStep, pathname]);

  return null;
}
