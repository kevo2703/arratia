"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function guardarCliente(formData: FormData) {
  const id = formData.get("id") as string | null;
  const payload = {
    ruc: (formData.get("ruc") as string)?.trim() || "",
    razon_social: (formData.get("razon_social") as string).trim(),
    contacto: (formData.get("contacto") as string) || "",
    telefono: (formData.get("telefono") as string) || "",
    correo: (formData.get("correo") as string) || "",
    direccion: (formData.get("direccion") as string) || "",
    notas: (formData.get("notas") as string) || "",
    updated_at: new Date().toISOString(),
  };

  const supabase = await createClient();

  if (id) {
    const { error } = await supabase.from("clientes").update(payload).eq("id", id);
    if (error) throw new Error(error.message);
  } else {
    const { error } = await supabase.from("clientes").insert(payload);
    if (error) throw new Error(error.message);
  }

  revalidatePath("/clientes");
  redirect("/clientes");
}

export async function eliminarCliente(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("clientes").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/clientes");
  redirect("/clientes");
}

export async function crearClienteRapido(payload: {
  ruc: string;
  razon_social: string;
  contacto?: string;
  telefono?: string;
  correo?: string;
  direccion?: string;
}) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("clientes")
    .insert({
      ruc: payload.ruc.trim(),
      razon_social: payload.razon_social.trim(),
      contacto: payload.contacto || "",
      telefono: payload.telefono || "",
      correo: payload.correo || "",
      direccion: payload.direccion || "",
    })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
}
