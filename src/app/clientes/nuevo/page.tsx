import { AppShell } from "@/components/AppShell";
import { PageHeader } from "@/components/ui";
import { ClienteForm } from "@/components/ClienteForm";

export const metadata = { title: "Nuevo cliente · Arratia" };

export default function NuevoClientePage() {
  return (
    <AppShell>
      <div className="p-8 max-w-3xl">
        <PageHeader title="Nuevo cliente" description="Agrega una empresa a tu base" />
        <ClienteForm />
      </div>
    </AppShell>
  );
}
