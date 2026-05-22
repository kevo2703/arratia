import { AppShell } from "@/components/AppShell";
import { PageHeader } from "@/components/ui";
import { ClienteForm } from "@/components/ClienteForm";

export const metadata = { title: "Nuevo cliente · Arratia" };
export const dynamic = "force-dynamic";

export default function NuevoClientePage() {
  return (
    <AppShell>
      <div className="p-4 md:p-8 max-w-3xl">
        <PageHeader title="Nuevo cliente" description="Agrega una empresa a tu base" />
        <ClienteForm />
      </div>
    </AppShell>
  );
}
