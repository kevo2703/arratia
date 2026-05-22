import Link from "next/link";
import { notFound } from "next/navigation";
import { headers } from "next/headers";
import { Pencil, ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/AppShell";
import { Card, Button, Badge } from "@/components/ui";
import { EnviarCotizacion } from "@/components/EnviarCotizacion";
import { formatMoney, formatDate, addDays } from "@/lib/utils";
import type {
  Cliente,
  Cotizacion,
  CotizacionItem,
  EmpresaConfig,
  EstadoCotizacion,
} from "@/lib/supabase/types";

export const metadata = { title: "Cotización · Arratia" };
export const dynamic = "force-dynamic";

const estadoVariant: Record<
  EstadoCotizacion,
  "default" | "info" | "success" | "danger" | "warning"
> = {
  borrador: "default",
  enviada: "info",
  aceptada: "success",
  rechazada: "danger",
  expirada: "warning",
};

const estadoLabel: Record<EstadoCotizacion, string> = {
  borrador: "Borrador",
  enviada: "Enviada",
  aceptada: "Aceptada",
  rechazada: "Rechazada",
  expirada: "Expirada",
};

export default async function CotizacionDetallePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const hdrs = await headers();

  const [cotRes, itemsRes, empresaRes] = await Promise.all([
    supabase
      .from("cotizaciones")
      .select("*, cliente:clientes(*)")
      .eq("id", id)
      .single(),
    supabase
      .from("cotizacion_items")
      .select("*")
      .eq("cotizacion_id", id)
      .order("orden"),
    supabase.from("empresa_config").select("*").limit(1).single(),
  ]);

  const cot = cotRes.data as (Cotizacion & { cliente: Cliente }) | null;
  const items = (itemsRes.data || []) as CotizacionItem[];
  const empresa = empresaRes.data as EmpresaConfig | null;

  if (!cot || !empresa) notFound();
  const cliente = cot.cliente;

  // Derivar la URL base desde el request actual, no de env vars.
  // Funciona en local, en Vercel, y en cualquier dominio personalizado sin reconfigurar.
  const host = hdrs.get("x-forwarded-host") || hdrs.get("host") || "localhost:3000";
  const proto =
    hdrs.get("x-forwarded-proto") ||
    (host.startsWith("localhost") ? "http" : "https");
  const appUrl = `${proto}://${host}`;
  const pdfUrl = `${appUrl}/api/pdf-public/${cot.id}`;

  const validUntil = addDays(
    new Date(cot.fecha + "T12:00:00"),
    cot.validez_dias
  );

  return (
    <AppShell>
      <div className="p-4 md:p-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-6">
          <div className="min-w-0">
            <Link
              href="/cotizaciones"
              className="text-sm text-[var(--muted-foreground)] hover:underline inline-flex items-center gap-1"
            >
              <ArrowLeft size={14} /> Cotizaciones
            </Link>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-[var(--secondary)] mt-2 font-mono break-all">
              {cot.numero}
            </h1>
            <div className="flex flex-wrap items-center gap-2 sm:gap-3 mt-2">
              <Badge variant={estadoVariant[cot.estado]}>
                {estadoLabel[cot.estado]}
              </Badge>
              <span className="text-xs sm:text-sm text-[var(--muted-foreground)]">
                Emitida el {formatDate(cot.fecha)} · Válida hasta {formatDate(validUntil)}
              </span>
            </div>
          </div>
          <Link href={`/cotizaciones/${cot.id}/editar`} className="w-full sm:w-auto">
            <Button variant="outline" className="w-full sm:w-auto justify-center">
              <Pencil size={14} /> Editar
            </Button>
          </Link>
        </div>

        {/* Acciones de envío */}
        <Card className="p-4 mb-6">
          <EnviarCotizacion
            cotizacion={cot}
            cliente={cliente}
            empresa={empresa}
            pdfUrl={pdfUrl}
          />
        </Card>

        {/* Datos cliente + condiciones */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
          <Card className="p-5 lg:col-span-2">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)] mb-3">
              Cliente
            </h3>
            <div className="space-y-1">
              <div className="font-bold text-lg">{cliente.razon_social}</div>
              {cliente.ruc && (
                <div className="text-sm font-mono text-[var(--muted-foreground)]">
                  RUC {cliente.ruc}
                </div>
              )}
              {cliente.contacto && (
                <div className="text-sm">
                  <span className="text-[var(--muted-foreground)]">Atención: </span>
                  {cliente.contacto}
                </div>
              )}
              <div className="flex gap-4 text-sm">
                {cliente.telefono && <span>📞 {cliente.telefono}</span>}
                {cliente.correo && <span>📧 {cliente.correo}</span>}
              </div>
              {cliente.direccion && (
                <div className="text-sm text-[var(--muted-foreground)]">
                  📍 {cliente.direccion}
                </div>
              )}
            </div>
          </Card>

          <Card className="p-5">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)] mb-3">
              Condiciones
            </h3>
            <div className="space-y-2 text-xs">
              <div>
                <div className="text-[var(--muted-foreground)]">Pago</div>
                <div>{cot.condiciones_pago}</div>
              </div>
              <div>
                <div className="text-[var(--muted-foreground)]">Entrega</div>
                <div>{cot.condiciones_entrega}</div>
              </div>
              <div>
                <div className="text-[var(--muted-foreground)]">Validez</div>
                <div>{cot.validez_dias} días</div>
              </div>
            </div>
          </Card>
        </div>

        {/* Items */}
        <Card className="mb-6">
          <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[640px]">
            <thead className="bg-[var(--secondary)] text-white">
              <tr>
                <th className="px-3 py-2 text-left font-semibold w-12">#</th>
                <th className="px-3 py-2 text-left font-semibold">Producto</th>
                <th className="px-3 py-2 text-center font-semibold w-20">Cant.</th>
                <th className="px-3 py-2 text-center font-semibold w-16">Und</th>
                <th className="px-3 py-2 text-right font-semibold w-28">P. Unit.</th>
                <th className="px-3 py-2 text-right font-semibold w-20">Dscto</th>
                <th className="px-3 py-2 text-right font-semibold w-28">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {items?.map((it, idx) => (
                <tr key={it.id} className="border-t">
                  <td className="px-3 py-2 text-[var(--muted-foreground)]">{idx + 1}</td>
                  <td className="px-3 py-2">
                    <div className="font-mono text-xs text-[var(--muted-foreground)]">
                      {it.codigo}
                    </div>
                    <div className="font-medium">{it.nombre}</div>
                    {it.descripcion && (
                      <div className="text-xs text-[var(--muted-foreground)]">
                        {it.descripcion}
                      </div>
                    )}
                  </td>
                  <td className="px-3 py-2 text-center">
                    {Number(it.cantidad).toLocaleString("es-PE")}
                  </td>
                  <td className="px-3 py-2 text-center">{it.unidad}</td>
                  <td className="px-3 py-2 text-right font-mono">
                    {formatMoney(Number(it.precio_unitario), cot.moneda)}
                  </td>
                  <td className="px-3 py-2 text-right text-[var(--muted-foreground)]">
                    {Number(it.descuento_pct) > 0
                      ? `${Number(it.descuento_pct).toFixed(1)}%`
                      : "—"}
                  </td>
                  <td className="px-3 py-2 text-right font-semibold font-mono whitespace-nowrap">
                    {formatMoney(Number(it.subtotal), cot.moneda)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </Card>

        {/* Totales */}
        <div className="flex justify-end mb-6">
          <Card className="p-5 w-full sm:w-80">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-[var(--muted-foreground)]">Subtotal</span>
                <span className="font-mono">
                  {formatMoney(Number(cot.subtotal), cot.moneda)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--muted-foreground)]">IGV 18%</span>
                <span className="font-mono">
                  {formatMoney(Number(cot.igv), cot.moneda)}
                </span>
              </div>
              <div className="border-t pt-2 flex justify-between text-xl font-extrabold text-[var(--primary)]">
                <span>TOTAL</span>
                <span className="font-mono">
                  {formatMoney(Number(cot.total), cot.moneda)}
                </span>
              </div>
            </div>
          </Card>
        </div>

        {cot.notas && (
          <Card className="p-5 mb-6">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)] mb-2">
              Observaciones
            </h3>
            <p className="text-sm">{cot.notas}</p>
          </Card>
        )}
      </div>
    </AppShell>
  );
}
