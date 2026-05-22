"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { calcularTotales } from "@/lib/utils";
import type { EstadoCotizacion } from "@/lib/supabase/types";

export interface ItemInput {
  producto_id: string | null;
  codigo: string;
  nombre: string;
  descripcion: string;
  unidad: string;
  cantidad: number;
  precio_unitario: number;
  descuento_pct: number;
}

export interface CotizacionInput {
  id?: string;
  cliente_id: string;
  fecha: string;
  validez_dias: number;
  moneda: string;
  incluye_igv: boolean;
  condiciones_pago: string;
  condiciones_entrega: string;
  notas: string;
  items: ItemInput[];
}

export async function guardarCotizacion(input: CotizacionInput) {
  const supabase = await createClient();

  if (!input.items.length) {
    throw new Error("La cotización debe tener al menos un ítem");
  }

  const itemsCalc = input.items.map((it) => {
    const sub = it.cantidad * it.precio_unitario;
    const desc = sub * (it.descuento_pct / 100);
    return { ...it, subtotal: +(sub - desc).toFixed(2) };
  });

  const totales = calcularTotales(input.items, input.incluye_igv);

  if (input.id) {
    // Editar: actualizar cabecera y reemplazar items
    const { error: errUpd } = await supabase
      .from("cotizaciones")
      .update({
        cliente_id: input.cliente_id,
        fecha: input.fecha,
        validez_dias: input.validez_dias,
        moneda: input.moneda,
        incluye_igv: input.incluye_igv,
        condiciones_pago: input.condiciones_pago,
        condiciones_entrega: input.condiciones_entrega,
        notas: input.notas,
        subtotal: totales.subtotal,
        igv: totales.igv,
        total: totales.total,
        updated_at: new Date().toISOString(),
      })
      .eq("id", input.id);
    if (errUpd) throw new Error(errUpd.message);

    const { error: errDel } = await supabase
      .from("cotizacion_items")
      .delete()
      .eq("cotizacion_id", input.id);
    if (errDel) throw new Error(errDel.message);

    const { error: errIns } = await supabase.from("cotizacion_items").insert(
      itemsCalc.map((it, idx) => ({
        cotizacion_id: input.id!,
        producto_id: it.producto_id,
        codigo: it.codigo,
        nombre: it.nombre,
        descripcion: it.descripcion,
        unidad: it.unidad,
        cantidad: it.cantidad,
        precio_unitario: it.precio_unitario,
        descuento_pct: it.descuento_pct,
        subtotal: it.subtotal,
        orden: idx,
      }))
    );
    if (errIns) throw new Error(errIns.message);

    revalidatePath(`/cotizaciones/${input.id}`);
    revalidatePath("/cotizaciones");
    redirect(`/cotizaciones/${input.id}`);
  }

  // Crear nueva: obtener número
  const { data: numeroData, error: errNum } = await supabase.rpc(
    "next_cotizacion_numero"
  );
  if (errNum) throw new Error(errNum.message);
  const numero = numeroData as unknown as string;

  const { data: cot, error: errInsCot } = await supabase
    .from("cotizaciones")
    .insert({
      numero,
      cliente_id: input.cliente_id,
      fecha: input.fecha,
      validez_dias: input.validez_dias,
      moneda: input.moneda,
      incluye_igv: input.incluye_igv,
      condiciones_pago: input.condiciones_pago,
      condiciones_entrega: input.condiciones_entrega,
      notas: input.notas,
      subtotal: totales.subtotal,
      igv: totales.igv,
      total: totales.total,
      estado: "borrador" as EstadoCotizacion,
    })
    .select()
    .single();
  if (errInsCot) throw new Error(errInsCot.message);

  const { error: errInsItems } = await supabase.from("cotizacion_items").insert(
    itemsCalc.map((it, idx) => ({
      cotizacion_id: cot.id,
      producto_id: it.producto_id,
      codigo: it.codigo,
      nombre: it.nombre,
      descripcion: it.descripcion,
      unidad: it.unidad,
      cantidad: it.cantidad,
      precio_unitario: it.precio_unitario,
      descuento_pct: it.descuento_pct,
      subtotal: it.subtotal,
      orden: idx,
    }))
  );
  if (errInsItems) throw new Error(errInsItems.message);

  revalidatePath("/cotizaciones");
  redirect(`/cotizaciones/${cot.id}`);
}

export async function cambiarEstado(id: string, estado: EstadoCotizacion) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("cotizaciones")
    .update({ estado, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath(`/cotizaciones/${id}`);
  revalidatePath("/cotizaciones");
}

export async function eliminarCotizacion(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("cotizaciones").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/cotizaciones");
  redirect("/cotizaciones");
}
