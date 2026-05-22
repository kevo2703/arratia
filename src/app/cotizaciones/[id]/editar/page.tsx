import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/AppShell";
import { CotizacionForm } from "@/components/CotizacionForm";

export const metadata = { title: "Editar cotización · Arratia" };
export const dynamic = "force-dynamic";

export default async function EditarCotizacionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: cot }, { data: items }, { data: clientes }, { data: productos }] =
    await Promise.all([
      supabase.from("cotizaciones").select("*").eq("id", id).single(),
      supabase
        .from("cotizacion_items")
        .select("*")
        .eq("cotizacion_id", id)
        .order("orden"),
      supabase.from("clientes").select("*").order("razon_social"),
      supabase
        .from("productos")
        .select("*")
        .eq("activo", true)
        .order("nombre"),
    ]);

  if (!cot) notFound();

  return (
    <AppShell>
      <div className="p-8">
        <CotizacionForm
          cotizacion={{ ...cot, items: items || [] }}
          clientes={clientes || []}
          productos={productos || []}
        />
      </div>
    </AppShell>
  );
}
