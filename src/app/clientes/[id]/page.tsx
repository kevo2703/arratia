import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/AppShell";
import { PageHeader } from "@/components/ui";
import { ClienteForm } from "@/components/ClienteForm";

export const metadata = { title: "Editar cliente · Arratia" };

export default async function EditarClientePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: cliente } = await supabase
    .from("clientes")
    .select("*")
    .eq("id", id)
    .single();

  if (!cliente) notFound();

  return (
    <AppShell>
      <div className="p-8 max-w-3xl">
        <PageHeader
          title="Editar cliente"
          description={cliente.razon_social}
        />
        <ClienteForm cliente={cliente} />
      </div>
    </AppShell>
  );
}
