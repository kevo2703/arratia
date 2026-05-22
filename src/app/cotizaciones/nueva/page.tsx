import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/AppShell";
import { CotizacionForm } from "@/components/CotizacionForm";

export const metadata = { title: "Nueva cotización · Arratia" };
export const dynamic = "force-dynamic";

export default async function NuevaCotizacionPage() {
  const supabase = await createClient();
  const [{ data: clientes }, { data: productos }] = await Promise.all([
    supabase.from("clientes").select("*").order("razon_social"),
    supabase.from("productos").select("*").eq("activo", true).order("nombre"),
  ]);

  return (
    <AppShell>
      <div className="p-8">
        <CotizacionForm clientes={clientes || []} productos={productos || []} />
      </div>
    </AppShell>
  );
}
