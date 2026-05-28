import { AppShell } from "@/components/AppShell";
import { PageHeader } from "@/components/ui";
import { CargaMasivaCotizacionesForm } from "@/components/CargaMasivaCotizacionesForm";

export const metadata = { title: "Carga masiva · Cotizaciones · Arratia" };
export const dynamic = "force-dynamic";

export default function CargaMasivaCotizacionesPage() {
  return (
    <AppShell>
      <div className="p-4 md:p-8 max-w-4xl">
        <PageHeader
          title="Carga masiva de cotizaciones"
          description="Importa cotizaciones históricas desde 2 archivos CSV (cabeceras + ítems)"
        />
        <CargaMasivaCotizacionesForm />
      </div>
    </AppShell>
  );
}
