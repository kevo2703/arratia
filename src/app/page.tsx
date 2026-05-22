import Link from "next/link";
import { FileText, Users, Package, TrendingUp, Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/AppShell";
import { Card, Button, Badge } from "@/components/ui";
import { formatMoney, formatDate } from "@/lib/utils";
import type { Cotizacion } from "@/lib/supabase/types";

type Recent = Cotizacion & { cliente: { razon_social: string } | null };
type MonthCot = Pick<Cotizacion, "total" | "estado">;

export const metadata = { title: "Arratia Cotizador" };
export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const supabase = await createClient();

  const inicioMes = new Date();
  inicioMes.setDate(1);
  inicioMes.setHours(0, 0, 0, 0);

  const [
    mesRes,
    { count: totalProductos },
    { count: totalClientes },
    recientesRes,
  ] = await Promise.all([
    supabase
      .from("cotizaciones")
      .select("total, estado")
      .gte("fecha", inicioMes.toISOString().slice(0, 10)),
    supabase.from("productos").select("*", { count: "exact", head: true }).eq("activo", true),
    supabase.from("clientes").select("*", { count: "exact", head: true }),
    supabase
      .from("cotizaciones")
      .select("*, cliente:clientes(razon_social)")
      .order("created_at", { ascending: false })
      .limit(5),
  ]);

  const cotizacionesMes = (mesRes.data || []) as MonthCot[];
  const recientes = (recientesRes.data || []) as Recent[];

  const totalMes = cotizacionesMes.reduce((acc, c) => acc + Number(c.total), 0);
  const aceptadasMes = cotizacionesMes.filter((c) => c.estado === "aceptada");
  const totalAceptado = aceptadasMes.reduce((acc, c) => acc + Number(c.total), 0);

  return (
    <AppShell>
      <div className="p-8">
        <div className="flex justify-between items-end mb-8">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-[var(--secondary)]">
              Bienvenido a Arratia
            </h1>
            <p className="text-sm text-[var(--muted-foreground)] mt-1">
              Resumen de actividad y accesos rápidos
            </p>
          </div>
          <Link href="/cotizaciones/nueva">
            <Button>
              <Plus size={16} /> Nueva cotización
            </Button>
          </Link>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          <Card className="p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs uppercase tracking-wide text-[var(--muted-foreground)]">
                Cotizado este mes
              </span>
              <TrendingUp size={16} className="text-[var(--primary)]" />
            </div>
            <div className="text-2xl font-extrabold">{formatMoney(totalMes)}</div>
            <div className="text-xs text-[var(--muted-foreground)] mt-1">
              {cotizacionesMes?.length || 0} cotizaciones
            </div>
          </Card>
          <Card className="p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs uppercase tracking-wide text-[var(--muted-foreground)]">
                Aceptado este mes
              </span>
              <FileText size={16} className="text-green-600" />
            </div>
            <div className="text-2xl font-extrabold text-green-600">
              {formatMoney(totalAceptado)}
            </div>
            <div className="text-xs text-[var(--muted-foreground)] mt-1">
              {aceptadasMes.length} aceptadas
            </div>
          </Card>
          <Card className="p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs uppercase tracking-wide text-[var(--muted-foreground)]">
                Productos
              </span>
              <Package size={16} className="text-[var(--primary)]" />
            </div>
            <div className="text-2xl font-extrabold">{totalProductos || 0}</div>
            <Link
              href="/productos"
              className="text-xs text-[var(--primary)] hover:underline mt-1 inline-block"
            >
              Gestionar catálogo →
            </Link>
          </Card>
          <Card className="p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs uppercase tracking-wide text-[var(--muted-foreground)]">
                Clientes
              </span>
              <Users size={16} className="text-[var(--primary)]" />
            </div>
            <div className="text-2xl font-extrabold">{totalClientes || 0}</div>
            <Link
              href="/clientes"
              className="text-xs text-[var(--primary)] hover:underline mt-1 inline-block"
            >
              Ver clientes →
            </Link>
          </Card>
        </div>

        {/* Cotizaciones recientes */}
        <Card>
          <div className="px-5 py-4 border-b flex justify-between items-center">
            <h2 className="font-semibold">Cotizaciones recientes</h2>
            <Link
              href="/cotizaciones"
              className="text-sm text-[var(--primary)] hover:underline"
            >
              Ver todas →
            </Link>
          </div>
          <table className="w-full text-sm">
            <tbody>
              {recientes?.length === 0 && (
                <tr>
                  <td className="px-5 py-8 text-center text-[var(--muted-foreground)]">
                    Aún no hay cotizaciones.{" "}
                    <Link
                      href="/cotizaciones/nueva"
                      className="text-[var(--primary)] hover:underline"
                    >
                      Crea la primera
                    </Link>
                    .
                  </td>
                </tr>
              )}
              {recientes?.map((c) => (
                <tr key={c.id} className="border-t hover:bg-[var(--muted)]/50">
                  <td className="px-5 py-3 font-mono text-xs font-semibold">
                    <Link href={`/cotizaciones/${c.id}`} className="hover:underline">
                      {c.numero}
                    </Link>
                  </td>
                  <td className="px-5 py-3">{c.cliente?.razon_social}</td>
                  <td className="px-5 py-3 text-[var(--muted-foreground)]">
                    {formatDate(c.fecha)}
                  </td>
                  <td className="px-5 py-3">
                    <Badge
                      variant={
                        c.estado === "aceptada"
                          ? "success"
                          : c.estado === "rechazada"
                            ? "danger"
                            : c.estado === "expirada"
                              ? "warning"
                              : c.estado === "enviada"
                                ? "info"
                                : "default"
                      }
                    >
                      {c.estado}
                    </Badge>
                  </td>
                  <td className="px-5 py-3 text-right font-mono font-semibold">
                    {formatMoney(Number(c.total), c.moneda)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </div>
    </AppShell>
  );
}
