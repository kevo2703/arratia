import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/AppShell";
import { PageHeader } from "@/components/ui";
import { ProductoForm } from "@/components/ProductoForm";

export const metadata = { title: "Nuevo producto · Arratia" };
export const dynamic = "force-dynamic";

export default async function NuevoProductoPage() {
  const supabase = await createClient();
  const { data: categorias } = await supabase
    .from("categorias")
    .select("*")
    .order("orden");

  return (
    <AppShell>
      <div className="p-4 md:p-8 max-w-3xl">
        <PageHeader title="Nuevo producto" description="Agrega un EPP al catálogo" />
        <ProductoForm categorias={categorias || []} />
      </div>
    </AppShell>
  );
}
