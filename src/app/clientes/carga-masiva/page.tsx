import { AppShell } from "@/components/AppShell";
import { PageHeader } from "@/components/ui";
import { CargaMasivaClientesForm } from "@/components/CargaMasivaClientesForm";

export const metadata = { title: "Carga masiva · Clientes · Arratia" };
export const dynamic = "force-dynamic";

export default function CargaMasivaClientesPage() {
  return (
    <AppShell>
      <div className="p-4 md:p-8 max-w-4xl">
        <PageHeader
          title="Carga masiva de clientes"
          description="Importa clientes desde un archivo CSV"
        />
        <CargaMasivaClientesForm />
      </div>
    </AppShell>
  );
}
