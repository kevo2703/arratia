import Link from "next/link";
import { Plus, Pencil } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/AppShell";
import { PageHeader, Card, Button, Badge } from "@/components/ui";
import { formatMoney } from "@/lib/utils";

export const metadata = { title: "Productos · Arratia" };
export const dynamic = "force-dynamic";

export default async function ProductosPage() {
  const supabase = await createClient();
  const { data: productos } = await supabase
    .from("productos")
    .select("*, categoria:categorias(nombre)")
    .order("nombre");

  return (
    <AppShell>
      <div className="p-8">
        <PageHeader
          title="Productos"
          description="Catálogo de EPP disponible para cotizar"
          actions={
            <Link href="/productos/nuevo">
              <Button>
                <Plus size={16} /> Nuevo producto
              </Button>
            </Link>
          }
        />
        <Card>
          <table className="w-full text-sm">
            <thead className="bg-[var(--muted)] text-left">
              <tr>
                <th className="px-4 py-3 font-semibold">Código</th>
                <th className="px-4 py-3 font-semibold">Nombre</th>
                <th className="px-4 py-3 font-semibold">Categoría</th>
                <th className="px-4 py-3 font-semibold">Marca</th>
                <th className="px-4 py-3 font-semibold">Unidad</th>
                <th className="px-4 py-3 font-semibold text-right">Precio</th>
                <th className="px-4 py-3 font-semibold text-center">Estado</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {productos?.length === 0 && (
                <tr>
                  <td
                    colSpan={8}
                    className="px-4 py-10 text-center text-[var(--muted-foreground)]"
                  >
                    Aún no hay productos. Crea el primero para empezar a cotizar.
                  </td>
                </tr>
              )}
              {productos?.map((p) => (
                <tr key={p.id} className="border-t hover:bg-[var(--muted)]/50">
                  <td className="px-4 py-3 font-mono text-xs">{p.codigo}</td>
                  <td className="px-4 py-3 font-medium">{p.nombre}</td>
                  <td className="px-4 py-3 text-[var(--muted-foreground)]">
                    {(p.categoria as { nombre: string } | null)?.nombre || "—"}
                  </td>
                  <td className="px-4 py-3">{p.marca || "—"}</td>
                  <td className="px-4 py-3">{p.unidad}</td>
                  <td className="px-4 py-3 text-right font-semibold">
                    {formatMoney(Number(p.precio))}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {p.activo ? (
                      <Badge variant="success">Activo</Badge>
                    ) : (
                      <Badge variant="default">Inactivo</Badge>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/productos/${p.id}`}
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
