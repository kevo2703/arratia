import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Detecta si una excepción es el NEXT_REDIRECT interno de Next.js (no es un error real).
 * Next usa esta excepción para interrumpir la ejecución y forzar la redirección desde
 * Server Actions. El cliente NO debe atraparla como error: debe re-arrojarla para que
 * Next la maneje normalmente.
 *
 * Uso:
 *   try { await miServerAction() } catch (e) {
 *     if (isNextRedirect(e)) throw e;
 *     toast.error("...");
 *   }
 */
export function isNextRedirect(err: unknown): boolean {
  return (
    err !== null &&
    typeof err === "object" &&
    "digest" in err &&
    typeof (err as { digest: unknown }).digest === "string" &&
    (err as { digest: string }).digest.startsWith("NEXT_REDIRECT")
  );
}

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatMoney(value: number, currency = "PEN"): string {
  const symbol = currency === "PEN" ? "S/" : currency === "USD" ? "$" : currency;
  return `${symbol} ${value.toLocaleString("es-PE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function formatDate(value: string | Date): string {
  const d = typeof value === "string" ? new Date(value) : value;
  return d.toLocaleDateString("es-PE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

export function calcularTotales(
  items: { cantidad: number; precio_unitario: number; descuento_pct: number }[],
  incluyeIgv: boolean
) {
  const subtotalBruto = items.reduce((acc, it) => {
    const sub = it.cantidad * it.precio_unitario;
    const desc = sub * (it.descuento_pct / 100);
    return acc + (sub - desc);
  }, 0);

  if (incluyeIgv) {
    // Precios netos: agregar 18% encima
    const subtotal = +subtotalBruto.toFixed(2);
    const igv = +(subtotal * 0.18).toFixed(2);
    const total = +(subtotal + igv).toFixed(2);
    return { subtotal, igv, total };
  }

  // Precios incluyen IGV: descomponer
  const total = +subtotalBruto.toFixed(2);
  const subtotal = +(total / 1.18).toFixed(2);
  const igv = +(total - subtotal).toFixed(2);
  return { subtotal, igv, total };
}
