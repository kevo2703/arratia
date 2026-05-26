import { AppShell } from "@/components/AppShell";
import { PageHeader } from "@/components/ui";
import { CargaMasivaForm } from "@/components/CargaMasivaForm";

export const metadata = { title: "Carga masiva · Productos · Arratia" };
export const dynamic = "force-dynamic";

export default function CargaMasivaPage() {
  return (
    <AppShell>
      <div className="p-4 md:p-8 max-w-4xl">
        <PageHeader
          title="Carga masiva de productos"
          description="Carga muchos productos a la vez desde un archivo CSV"
        />
        <CargaMasivaForm />
      </div>
    </AppShell>
  );
}
