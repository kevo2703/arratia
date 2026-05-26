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

// ----------- CARGA MASIVA -----------
export interface FilaProductoInput {
  codigo: string;
  nombre: string;
  descripcion: string;
  categoria: string; // nombre, no id
  marca: string;
  unidad: string;
  precio: number;
  stock: number;
  activo: boolean;
}

export interface ResultadoCargaMasiva {
  insertados: number;
  actualizados: number;
  fallidos: number;
  errores: { codigo: string; mensaje: string }[];
}

export async function cargarProductosMasivo(
  filas: FilaProductoInput[]
): Promise<ResultadoCargaMasiva> {
  if (!filas.length) {
    return { insertados: 0, actualizados: 0, fallidos: 0, errores: [] };
  }

  const supabase = await createClient();

  // 1. Cargar categorías existentes para resolver nombre → id
  const { data: categorias } = await supabase.from("categorias").select("id, nombre");
  const catMap = new Map<string, string>();
  for (const c of (categorias || []) as { id: string; nombre: string }[]) {
    catMap.set(c.nombre.toLowerCase().trim(), c.id);
  }

  // 2. Cargar códigos ya existentes para distinguir insert vs update
  const codigos = filas.map((f) => f.codigo);
  const { data: existentes } = await supabase
    .from("productos")
    .select("codigo")
    .in("codigo", codigos);
  const codigosExistentes = new Set(
    ((existentes || []) as { codigo: string }[]).map((p) => p.codigo)
  );

  // 3. Preparar payload
  const ahora = new Date().toISOString();
  const payload = filas.map((f) => ({
    codigo: f.codigo,
    nombre: f.nombre,
    descripcion: f.descripcion || "",
    categoria_id: f.categoria ? catMap.get(f.categoria.toLowerCase().trim()) || null : null,
    marca: f.marca || "",
    unidad: f.unidad || "UND",
    precio: f.precio,
    stock: f.stock,
    activo: f.activo,
    updated_at: ahora,
  }));

  // 4. Upsert por código (PK lógica)
  const { error } = await supabase
    .from("productos")
    .upsert(payload, { onConflict: "codigo" });

  if (error) {
    return {
      insertados: 0,
      actualizados: 0,
      fallidos: filas.length,
      errores: [{ codigo: "—", mensaje: error.message }],
    };
  }

  const actualizados = payload.filter((p) => codigosExistentes.has(p.codigo)).length;
  const insertados = payload.length - actualizados;

  revalidatePath("/productos");

  return {
    insertados,
    actualizados,
    fallidos: 0,
    errores: [],
  };
}
