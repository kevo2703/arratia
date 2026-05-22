import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

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
