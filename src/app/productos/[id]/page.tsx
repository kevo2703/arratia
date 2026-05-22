import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/AppShell";
import { PageHeader } from "@/components/ui";
import { ProductoForm } from "@/components/ProductoForm";

export const metadata = { title: "Editar producto · Arratia" };

export default async function EditarProductoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: producto }, { data: categorias }] = await Promise.all([
    supabase.from("productos").select("*").eq("id", id).single(),
    supabase.from("categorias").select("*").order("orden"),
  ]);

  if (!producto) notFound();

  return (
    <AppShell>
      <div className="p-8 max-w-3xl">
        <PageHeader
          title="Editar producto"
          description={`${producto.codigo} — ${producto.nombre}`}
        />
        <ProductoForm producto={producto} categorias={categorias || []} />
      </div>
    </AppShell>
  );
}
