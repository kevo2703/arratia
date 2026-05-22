import Link from "next/link";
import { Plus, Pencil } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/AppShell";
import { PageHeader, Card, Button } from "@/components/ui";

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
      <div className="p-8">
        <PageHeader
          title="Clientes"
          description="Base de empresas a las que cotizas"
          actions={
            <Link href="/clientes/nuevo">
              <Button>
                <Plus size={16} /> Nuevo cliente
              </Button>
            </Link>
          }
        />
        <Card>
          <table className="w-full text-sm">
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
              {clientes?.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-10 text-center text-[var(--muted-foreground)]"
                  >
                    Aún no hay clientes registrados.
                  </td>
                </tr>
              )}
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
        </Card>
      </div>
    </AppShell>
  );
}
