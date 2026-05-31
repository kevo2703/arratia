"use client";

import { HelpCircle } from "lucide-react";
import { useOnboarding } from "./OnboardingContext";
import { resetTour } from "@/app/onboarding/actions";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";

interface Props {
  className?: string;
  collapsed?: boolean;
}

export function TourButton({ className, collapsed }: Props) {
  const { startTour } = useOnboarding();
  const router = useRouter();
  const [pending, start] = useTransition();

  function handleClick() {
    start(async () => {
      try {
        await resetTour();
        startTour();
        router.push("/configuracion");
        toast.info("Tutorial iniciado");
      } catch {
        toast.error("No se pudo iniciar el tutorial");
      }
    });
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={pending}
      className={className}
      title="Ver tutorial paso a paso"
    >
      <HelpCircle size={18} />
      {!collapsed && (pending ? "Iniciando..." : "Ver tutorial")}
    </button>
  );
}
