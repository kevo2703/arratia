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

// ----------- CARGA MASIVA -----------
export interface FilaCotizacionInput {
  numero: string;
  cliente_ruc: string;
  fecha: string;
  validez_dias: number;
  moneda: string;
  incluye_igv: boolean;
  condiciones_pago: string;
  condiciones_entrega: string;
  notas: string;
  estado: string;
}

export interface FilaItemInput {
  numero_cotizacion: string;
  codigo: string;
  nombre: string;
  descripcion: string;
  unidad: string;
  cantidad: number;
  precio_unitario: number;
  descuento_pct: number;
}

export interface ResultadoCargaCotizaciones {
  insertadas: number;
  actualizadas: number;
  fallidas: number;
  errores: { numero: string; mensaje: string }[];
  itemsHuerfanos: string[]; // numero_cotizacion que no matchearon ninguna cabecera
  clientesFaltantes: string[]; // RUCs que no se encontraron
}

export async function cargarCotizacionesMasivo(
  cotizaciones: FilaCotizacionInput[],
  items: FilaItemInput[]
): Promise<ResultadoCargaCotizaciones> {
  if (!cotizaciones.length) {
    return {
      insertadas: 0,
      actualizadas: 0,
      fallidas: 0,
      errores: [],
      itemsHuerfanos: [],
      clientesFaltantes: [],
    };
  }

  const supabase = await createClient();
  const ahora = new Date().toISOString();
  const errores: { numero: string; mensaje: string }[] = [];

  // 1. Resolver clientes por RUC
  const rucsUnicos = Array.from(new Set(cotizaciones.map((c) => c.cliente_ruc)));
  const { data: clientesData } = await supabase
    .from("clientes")
    .select("id, ruc")
    .in("ruc", rucsUnicos);
  const mapaClientes = new Map(
    ((clientesData || []) as { id: string; ruc: string }[]).map((c) => [c.ruc, c.id])
  );

  const clientesFaltantes = rucsUnicos.filter((r) => !mapaClientes.has(r));

  // Filtrar cotizaciones que tienen cliente válido
  const cotizacionesValidas = cotizaciones.filter((c) =>
    mapaClientes.has(c.cliente_ruc)
  );
  for (const c of cotizaciones.filter((c) => !mapaClientes.has(c.cliente_ruc))) {
    errores.push({
      numero: c.numero,
      mensaje: `Cliente con RUC ${c.cliente_ruc} no existe en BD. Crea el cliente primero.`,
    });
  }

  // 2. Detectar cotizaciones existentes (por numero)
  const numerosUnicos = cotizacionesValidas.map((c) => c.numero);
  const { data: existentes } = await supabase
    .from("cotizaciones")
    .select("id, numero")
    .in("numero", numerosUnicos);
  const mapaExistentes = new Map(
    ((existentes || []) as { id: string; numero: string }[]).map((c) => [
      c.numero,
      c.id,
    ])
  );

  // 3. Cargar productos por código para resolver producto_id en items
  const codigosUnicos = Array.from(
    new Set(items.map((i) => i.codigo).filter((c) => c !== ""))
  );
  const { data: productosData } = await supabase
    .from("productos")
    .select("id, codigo")
    .in("codigo", codigosUnicos);
  const mapaProductos = new Map(
    ((productosData || []) as { id: string; codigo: string }[]).map((p) => [
      p.codigo,
      p.id,
    ])
  );

  // 4. Agrupar items por número de cotización
  const itemsPorNumero = new Map<string, FilaItemInput[]>();
  for (const item of items) {
    const arr = itemsPorNumero.get(item.numero_cotizacion) || [];
    arr.push(item);
    itemsPorNumero.set(item.numero_cotizacion, arr);
  }

  // Items huérfanos (no matchean ninguna cabecera del archivo)
  const numerosEnCabeceras = new Set(cotizaciones.map((c) => c.numero));
  const itemsHuerfanos = Array.from(itemsPorNumero.keys()).filter(
    (n) => !numerosEnCabeceras.has(n)
  );

  let insertadas = 0;
  let actualizadas = 0;

  // 5. Procesar cada cotización
  for (const cot of cotizacionesValidas) {
    const itemsDeCot = itemsPorNumero.get(cot.numero) || [];

    // Calcular subtotales por item y total cabecera
    const itemsCalc = itemsDeCot.map((it, idx) => {
      const sub = it.cantidad * it.precio_unitario;
      const desc = sub * (it.descuento_pct / 100);
      return {
        producto_id: it.codigo ? mapaProductos.get(it.codigo) || null : null,
        codigo: it.codigo,
        nombre: it.nombre,
        descripcion: it.descripcion,
        unidad: it.unidad,
        cantidad: it.cantidad,
        precio_unitario: it.precio_unitario,
        descuento_pct: it.descuento_pct,
        subtotal: +(sub - desc).toFixed(2),
        orden: idx,
      };
    });

    const subtotalBruto = itemsCalc.reduce((acc, it) => acc + it.subtotal, 0);
    let subtotal: number, igv: number, total: number;
    if (cot.incluye_igv) {
      subtotal = +subtotalBruto.toFixed(2);
      igv = +(subtotal * 0.18).toFixed(2);
      total = +(subtotal + igv).toFixed(2);
    } else {
      total = +subtotalBruto.toFixed(2);
      subtotal = +(total / 1.18).toFixed(2);
      igv = +(total - subtotal).toFixed(2);
    }

    const payloadCabecera = {
      numero: cot.numero,
      cliente_id: mapaClientes.get(cot.cliente_ruc)!,
      fecha: cot.fecha,
      validez_dias: cot.validez_dias,
      moneda: cot.moneda,
      incluye_igv: cot.incluye_igv,
      subtotal,
      igv,
      total,
      condiciones_pago: cot.condiciones_pago,
      condiciones_entrega: cot.condiciones_entrega,
      notas: cot.notas,
      estado: cot.estado,
      updated_at: ahora,
    };

    const existingId = mapaExistentes.get(cot.numero);
    let cotId: string | null = null;

    if (existingId) {
      // Update cabecera
      const { error: errUpd } = await supabase
        .from("cotizaciones")
        .update(payloadCabecera)
        .eq("id", existingId);
      if (errUpd) {
        errores.push({ numero: cot.numero, mensaje: errUpd.message });
        continue;
      }
      cotId = existingId;
      actualizadas++;

      // Borrar items anteriores
      await supabase.from("cotizacion_items").delete().eq("cotizacion_id", cotId);
    } else {
      // Insert cabecera
      const { data: nueva, error: errIns } = await supabase
        .from("cotizaciones")
        .insert(payloadCabecera)
        .select("id")
        .single();
      if (errIns || !nueva) {
        errores.push({
          numero: cot.numero,
          mensaje: errIns?.message || "Error al insertar",
        });
        continue;
      }
      cotId = (nueva as { id: string }).id;
      insertadas++;
    }

    // Insertar items frescos
    if (itemsCalc.length > 0 && cotId) {
      const itemsPayload = itemsCalc.map((it) => ({
        ...it,
        cotizacion_id: cotId,
      }));
      const { error: errItems } = await supabase
        .from("cotizacion_items")
        .insert(itemsPayload);
      if (errItems) {
        errores.push({
          numero: cot.numero,
          mensaje: `Cabecera OK pero items fallaron: ${errItems.message}`,
        });
      }
    }
  }

  revalidatePath("/cotizaciones");

  return {
    insertadas,
    actualizadas,
    fallidas: errores.length,
    errores,
    itemsHuerfanos,
    clientesFaltantes,
  };
}
