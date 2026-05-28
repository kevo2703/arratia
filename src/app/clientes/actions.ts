"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function guardarCliente(formData: FormData) {
  const id = formData.get("id") as string | null;
  const sunatRaw = formData.get("sunat_consultado_en") as string | null;
  const payload: Record<string, string | null> = {
    ruc: (formData.get("ruc") as string)?.trim() || "",
    razon_social: (formData.get("razon_social") as string).trim(),
    contacto: (formData.get("contacto") as string) || "",
    telefono: (formData.get("telefono") as string) || "",
    correo: (formData.get("correo") as string) || "",
    direccion: (formData.get("direccion") as string) || "",
    notas: (formData.get("notas") as string) || "",
    estado: (formData.get("estado") as string) || "",
    condicion: (formData.get("condicion") as string) || "",
    ubigeo: (formData.get("ubigeo") as string) || "",
    departamento: (formData.get("departamento") as string) || "",
    provincia: (formData.get("provincia") as string) || "",
    distrito: (formData.get("distrito") as string) || "",
    sunat_consultado_en: sunatRaw && sunatRaw.length > 0 ? sunatRaw : null,
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

// ----------- CARGA MASIVA -----------
export interface FilaClienteInput {
  ruc: string;
  razon_social: string;
  contacto: string;
  telefono: string;
  correo: string;
  direccion: string;
  notas: string;
}

export interface ResultadoCargaClientes {
  insertados: number;
  actualizados: number;
  fallidos: number;
  errores: { ruc: string; mensaje: string }[];
}

export async function cargarClientesMasivo(
  filas: FilaClienteInput[]
): Promise<ResultadoCargaClientes> {
  if (!filas.length) {
    return { insertados: 0, actualizados: 0, fallidos: 0, errores: [] };
  }

  const supabase = await createClient();
  const ahora = new Date().toISOString();

  // Filas con RUC vs filas sin RUC (no se pueden upsertear por RUC porque BD no tiene UNIQUE en RUC)
  const conRuc = filas.filter((f) => f.ruc.trim() !== "");
  const sinRuc = filas.filter((f) => f.ruc.trim() === "");

  let insertados = 0;
  let actualizados = 0;
  const errores: { ruc: string; mensaje: string }[] = [];

  // 1. Para los con RUC: buscar cuáles ya existen
  if (conRuc.length > 0) {
    const rucs = conRuc.map((f) => f.ruc);
    const { data: existentes } = await supabase
      .from("clientes")
      .select("id, ruc")
      .in("ruc", rucs);
    const mapaExistentes = new Map(
      ((existentes || []) as { id: string; ruc: string }[]).map((c) => [c.ruc, c.id])
    );

    for (const f of conRuc) {
      const existingId = mapaExistentes.get(f.ruc);
      const payload = {
        ruc: f.ruc,
        razon_social: f.razon_social,
        contacto: f.contacto,
        telefono: f.telefono,
        correo: f.correo,
        direccion: f.direccion,
        notas: f.notas,
        updated_at: ahora,
      };

      if (existingId) {
        const { error } = await supabase
          .from("clientes")
          .update(payload)
          .eq("id", existingId);
        if (error) {
          errores.push({ ruc: f.ruc, mensaje: error.message });
        } else {
          actualizados++;
        }
      } else {
        const { error } = await supabase.from("clientes").insert(payload);
        if (error) {
          errores.push({ ruc: f.ruc, mensaje: error.message });
        } else {
          insertados++;
        }
      }
    }
  }

  // 2. Para los sin RUC: solo insertar (no upsert)
  if (sinRuc.length > 0) {
    const payload = sinRuc.map((f) => ({
      ruc: "",
      razon_social: f.razon_social,
      contacto: f.contacto,
      telefono: f.telefono,
      correo: f.correo,
      direccion: f.direccion,
      notas: f.notas,
      updated_at: ahora,
    }));
    const { error } = await supabase.from("clientes").insert(payload);
    if (error) {
      errores.push({ ruc: "(sin RUC)", mensaje: error.message });
    } else {
      insertados += sinRuc.length;
    }
  }

  revalidatePath("/clientes");

  return {
    insertados,
    actualizados,
    fallidos: errores.length,
    errores,
  };
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
