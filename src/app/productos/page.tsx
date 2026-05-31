import Link from "next/link";
import { Plus, Pencil, Upload, Package } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/AppShell";
import { PageHeader, Card, ButtonLink, Badge } from "@/components/ui";
import { EmptyState } from "@/components/EmptyState";
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
      <div className="p-4 md:p-8">
        <PageHeader
          title="Productos"
          description="Catálogo de EPP disponible para cotizar"
          actions={
            <>
              <ButtonLink
                href="/productos/carga-masiva"
                variant="outline"
                className="w-full sm:w-auto justify-center"
              >
                <Upload size={16} /> Carga masiva
              </ButtonLink>
              <ButtonLink
                href="/productos/nuevo"
                className="w-full sm:w-auto justify-center"
              >
                <Plus size={16} /> Nuevo producto
              </ButtonLink>
            </>
          }
        />
        {(!productos || productos.length === 0) ? (
          <Card>
            <EmptyState
              Icon={Package}
              title="Aún no tienes productos en tu catálogo"
              description="Agrega tus productos uno por uno o sube muchos a la vez con una hoja CSV. Después podrás incluirlos en cualquier cotización con un par de clics."
              ctaHref="/productos/nuevo"
              ctaLabel="Crear primer producto"
              secondaryHref="/productos/carga-masiva"
              secondaryLabel="Carga masiva (CSV)"
            />
          </Card>
        ) : (
        <Card>
          <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[800px]">
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
          </div>
        </Card>
        )}
      </div>
    </AppShell>
  );
}
