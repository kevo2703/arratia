"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function guardarProducto(formData: FormData) {
  const id = formData.get("id") as string | null;
  const payload = {
    codigo: (formData.get("codigo") as string).trim().toUpperCase(),
    nombre: (formData.get("nombre") as string).trim(),
    descripcion: (formData.get("descripcion") as string) || "",
    categoria_id: (formData.get("categoria_id") as string) || null,
    marca: (formData.get("marca") as string) || "",
    unidad: (formData.get("unidad") as string) || "UND",
    precio: parseFloat((formData.get("precio") as string) || "0"),
    stock: parseInt((formData.get("stock") as string) || "0"),
    imagen_url: (formData.get("imagen_url") as string) || "",
    activo: formData.get("activo") === "on",
    updated_at: new Date().toISOString(),
  };

  const supabase = await createClient();

  if (id) {
    const { error } = await supabase.from("productos").update(payload).eq("id", id);
    if (error) throw new Error(error.message);
  } else {
    const { error } = await supabase.from("productos").insert(payload);
    if (error) throw new Error(error.message);
  }

  revalidatePath("/productos");
  redirect("/productos");
}

export async function eliminarProducto(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("productos").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/productos");
  redirect("/productos");
}
