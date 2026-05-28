import Link from "next/link";
import { Plus, FileText, Upload } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/AppShell";
import { PageHeader, Card, ButtonLink, Badge } from "@/components/ui";
import { EliminarCotizacionButton } from "@/components/EliminarCotizacionButton";
import { formatMoney, formatDate } from "@/lib/utils";
import type { Cotizacion, EstadoCotizacion } from "@/lib/supabase/types";

type CotizacionListItem = Cotizacion & {
  cliente: { razon_social: string; ruc: string } | null;
};

export const metadata = { title: "Cotizaciones · Arratia" };
export const dynamic = "force-dynamic";

const estadoVariant: Record<EstadoCotizacion, "default" | "info" | "success" | "danger" | "warning"> = {
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

export default async function CotizacionesPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("cotizaciones")
    .select("*, cliente:clientes(razon_social, ruc)")
    .order("created_at", { ascending: false });
  const cotizaciones = (data || []) as CotizacionListItem[];

  return (
    <AppShell>
      <div className="p-4 md:p-8">
        <PageHeader
          title="Cotizaciones"
          description="Historial de cotizaciones emitidas"
          actions={
            <>
              <ButtonLink
                href="/cotizaciones/carga-masiva"
                variant="outline"
                className="w-full sm:w-auto justify-center"
              >
                <Upload size={16} /> Carga masiva
              </ButtonLink>
              <ButtonLink
                href="/cotizaciones/nueva"
                className="w-full sm:w-auto justify-center"
              >
                <Plus size={16} /> Nueva cotización
              </ButtonLink>
            </>
          }
        />
        <Card>
          <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[720px]">
            <thead className="bg-[var(--muted)] text-left">
              <tr>
                <th className="px-4 py-3 font-semibold">Número</th>
                <th className="px-4 py-3 font-semibold">Fecha</th>
                <th className="px-4 py-3 font-semibold">Cliente</th>
                <th className="px-4 py-3 font-semibold text-right">Total</th>
                <th className="px-4 py-3 font-semibold text-center">Estado</th>
                <th className="px-4 py-3"></th>
                <th className="px-4 py-3 w-12"></th>
              </tr>
            </thead>
            <tbody>
              {cotizaciones?.length === 0 && (
                <tr>
                  <td
                    colSpan={7}
                    className="px-4 py-10 text-center text-[var(--muted-foreground)]"
                  >
                    <FileText className="mx-auto mb-2 opacity-30" size={32} />
                    Aún no hay cotizaciones. Crea la primera para empezar.
                  </td>
                </tr>
              )}
              {cotizaciones?.map((c) => (
                <tr key={c.id} className="border-t hover:bg-[var(--muted)]/50">
                  <td className="px-4 py-3 font-mono text-xs font-semibold">
                    {c.numero}
                  </td>
                  <td className="px-4 py-3">{formatDate(c.fecha)}</td>
                  <td className="px-4 py-3">
                    <div className="font-medium">{c.cliente?.razon_social}</div>
                    {c.cliente?.ruc && (
                      <div className="text-xs text-[var(--muted-foreground)] font-mono">
                        {c.cliente.ruc}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right font-semibold">
                    {formatMoney(Number(c.total), c.moneda)}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <Badge variant={estadoVariant[c.estado]}>
                      {estadoLabel[c.estado]}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/cotizaciones/${c.id}`}
                      className="text-[var(--primary)] hover:underline text-xs font-medium"
                    >
                      Ver detalle →
                    </Link>
                  </td>
                  <td className="px-2 py-3 text-center">
                    <EliminarCotizacionButton id={c.id} numero={c.numero} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </Card>
      </div>
    </AppShell>
  );
}
