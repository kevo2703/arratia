import Link from "next/link";
import { Plus, Pencil, Upload, Users } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/AppShell";
import { PageHeader, Card, ButtonLink } from "@/components/ui";
import { EmptyState } from "@/components/EmptyState";

export const metadata = { title: "Clientes · Arratia" };
export const dynamic = "force-dynamic";

export default async function ClientesPage() {
  const supabase = await createClient();
  const { data: clientes } = await supabase
    .from("clientes")
    .select("*")
    .order("razon_social");

  return (
    <AppShell>
      <div className="p-4 md:p-8">
        <PageHeader
          title="Clientes"
          description="Base de empresas a las que cotizas"
          actions={
            <>
              <ButtonLink
                href="/clientes/carga-masiva"
                variant="outline"
                className="w-full sm:w-auto justify-center"
              >
                <Upload size={16} /> Carga masiva
              </ButtonLink>
              <ButtonLink
                href="/clientes/nuevo"
                className="w-full sm:w-auto justify-center"
              >
                <Plus size={16} /> Nuevo cliente
              </ButtonLink>
            </>
          }
        />
        {(!clientes || clientes.length === 0) ? (
          <Card>
            <EmptyState
              Icon={Users}
              title="Aún no tienes clientes"
              description="Crea tu primer cliente. Si es una empresa peruana, basta con el RUC — los datos los traemos automáticamente desde SUNAT."
              ctaHref="/clientes/nuevo"
              ctaLabel="Crear primer cliente"
              secondaryHref="/clientes/carga-masiva"
              secondaryLabel="Importar lista (CSV)"
            />
          </Card>
        ) : (
        <Card>
          <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[720px]">
            <thead className="bg-[var(--muted)] text-left">
              <tr>
                <th className="px-4 py-3 font-semibold">RUC</th>
                <th className="px-4 py-3 font-semibold">Razón social</th>
                <th className="px-4 py-3 font-semibold">Contacto</th>
                <th className="px-4 py-3 font-semibold">Teléfono</th>
                <th className="px-4 py-3 font-semibold">Correo</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {clientes?.map((c) => (
                <tr key={c.id} className="border-t hover:bg-[var(--muted)]/50">
                  <td className="px-4 py-3 font-mono text-xs">{c.ruc || "—"}</td>
                  <td className="px-4 py-3 font-medium">{c.razon_social}</td>
                  <td className="px-4 py-3">{c.contacto || "—"}</td>
                  <td className="px-4 py-3">{c.telefono || "—"}</td>
                  <td className="px-4 py-3 text-[var(--muted-foreground)]">
                    {c.correo || "—"}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/clientes/${c.id}`}
                      className="inline-flex items-center gap-1 text-[var(--primary)] hover:underline text-xs font-medium"
                    >
                      <Pencil size={14} /> Editar
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </Card>
        )}
      </div>
    </AppShell>
  );
}
