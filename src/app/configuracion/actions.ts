"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

function isHexColor(v: string): boolean {
  return /^#[0-9a-fA-F]{6}$/.test(v);
}

export async function guardarEmpresa(formData: FormData) {
  const id = formData.get("id") as string;
  const colorPrimary = (formData.get("color_primary") as string) || "#ea580c";
  const colorSecondary = (formData.get("color_secondary") as string) || "#1e293b";

  const payload = {
    razon_social: (formData.get("razon_social") as string).trim(),
    nombre_comercial: (formData.get("nombre_comercial") as string).trim(),
    ruc: ((formData.get("ruc") as string) || "").trim(),
    direccion: (formData.get("direccion") as string) || "",
    telefono: (formData.get("telefono") as string) || "",
    correo: (formData.get("correo") as string) || "",
    whatsapp: (formData.get("whatsapp") as string) || "",
    logo_url: (formData.get("logo_url") as string) || "",
    color_primary: isHexColor(colorPrimary) ? colorPrimary : "#ea580c",
    color_secondary: isHexColor(colorSecondary) ? colorSecondary : "#1e293b",
    banco_bcp: (formData.get("banco_bcp") as string) || "",
    banco_interbank: (formData.get("banco_interbank") as string) || "",
    banco_bbva: (formData.get("banco_bbva") as string) || "",
    cci: (formData.get("cci") as string) || "",
    updated_at: new Date().toISOString(),
  };

  const supabase = await createClient();
  const { error } = await supabase.from("empresa_config").update(payload).eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath("/configuracion");
  revalidatePath("/", "layout");
}
