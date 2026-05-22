import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/AppShell";
import { PageHeader } from "@/components/ui";
import { EmpresaForm } from "@/components/EmpresaForm";

export const metadata = { title: "Configuración · Arratia" };
export const dynamic = "force-dynamic";

export default async function ConfiguracionPage() {
  const supabase = await createClient();
  const { data: empresa } = await supabase
    .from("empresa_config")
    .select("*")
    .limit(1)
    .single();

  if (!empresa) {
    return (
      <AppShell>
        <div className="p-8">
          <p>No se encontró configuración inicial. Ejecuta el SQL de setup.</p>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="p-8 max-w-4xl">
        <PageHeader
          title="Configuración"
          description="Datos de Arratia que aparecen en cada cotización"
        />
        <EmpresaForm empresa={empresa} />
      </div>
    </AppShell>
  );
}
