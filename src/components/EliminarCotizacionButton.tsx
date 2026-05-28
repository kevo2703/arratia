"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import { eliminarCotizacion } from "@/app/cotizaciones/actions";
import { cn } from "@/lib/utils";

interface Props {
  id: string;
  numero: string;
  variant?: "icon" | "full";
  redirectTo?: string;
  className?: string;
}

export function EliminarCotizacionButton({
  id,
  numero,
  variant = "icon",
  redirectTo,
  className,
}: Props) {
  const router = useRouter();
  const [pending, start] = useTransition();

  function handleClick(e: React.MouseEvent) {
    e.stopPropagation();
    e.preventDefault();
    if (
      !confirm(
        `¿Eliminar la cotización ${numero}? Esta acción no se puede deshacer.`
      )
    )
      return;

    start(async () => {
      try {
        await eliminarCotizacion(id);
        toast.success(`Cotización ${numero} eliminada`);
        if (redirectTo) router.push(redirectTo);
        else router.refresh();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Error al eliminar");
      }
    });
  }

  if (variant === "icon") {
    return (
      <button
        type="button"
        onClick={handleClick}
        disabled={pending}
        title="Eliminar cotización"
        aria-label="Eliminar cotización"
        className={cn(
          "p-1.5 rounded text-[var(--muted-foreground)] hover:text-[var(--destructive)] hover:bg-red-50 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed",
          className
        )}
      >
        <Trash2 size={16} />
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={pending}
      className={cn(
        "rounded-md font-semibold transition-opacity inline-flex items-center gap-2 cursor-pointer select-none px-4 py-2 text-sm bg-[var(--destructive)] text-white hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed",
        className
      )}
    >
      <Trash2 size={16} /> {pending ? "Eliminando..." : "Eliminar cotización"}
    </button>
  );
}
