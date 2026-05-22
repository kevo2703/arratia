"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, Trash2, GripVertical } from "lucide-react";
import { Card, Field, Button, inputClasses, PageHeader } from "@/components/ui";
import { formatMoney, calcularTotales } from "@/lib/utils";
import type { Cliente, Producto, Cotizacion, CotizacionItem } from "@/lib/supabase/types";
import { guardarCotizacion, type ItemInput } from "@/app/cotizaciones/actions";

interface Props {
  cotizacion?: Cotizacion & { items: CotizacionItem[] };
  clientes: Cliente[];
  productos: Producto[];
}

export function CotizacionForm({ cotizacion, clientes, productos }: Props) {
  const router = useRouter();
  const [pending, start] = useTransition();

  const [clienteId, setClienteId] = useState(cotizacion?.cliente_id || "");
  const [fecha, setFecha] = useState(
    cotizacion?.fecha || new Date().toISOString().slice(0, 10)
  );
  const [validezDias, setValidezDias] = useState(cotizacion?.validez_dias ?? 15);
  const [moneda, setMoneda] = useState(cotizacion?.moneda || "PEN");
  const [incluyeIgv, setIncluyeIgv] = useState(cotizacion?.incluye_igv ?? true);
  const [condicionesPago, setCondicionesPago] = useState(
    cotizacion?.condiciones_pago || "Contado contra entrega"
  );
  const [condicionesEntrega, setCondicionesEntrega] = useState(
    cotizacion?.condiciones_entrega ||
      "Entrega en almacén Lima Metropolitana, 2-3 días útiles"
  );
  const [notas, setNotas] = useState(cotizacion?.notas || "");

  const [items, setItems] = useState<ItemInput[]>(
    cotizacion?.items.map((it) => ({
      producto_id: it.producto_id,
      codigo: it.codigo,
      nombre: it.nombre,
      descripcion: it.descripcion,
      unidad: it.unidad,
      cantidad: Number(it.cantidad),
      precio_unitario: Number(it.precio_unitario),
      descuento_pct: Number(it.descuento_pct),
    })) || []
  );

  const totales = useMemo(
    () => calcularTotales(items, incluyeIgv),
    [items, incluyeIgv]
  );

  function agregarProducto(productoId: string) {
    if (!productoId) return;
    const p = productos.find((x) => x.id === productoId);
    if (!p) return;
    setItems((prev) => [
      ...prev,
      {
        producto_id: p.id,
        codigo: p.codigo,
        nombre: p.nombre,
        descripcion: p.descripcion,
        unidad: p.unidad,
        cantidad: 1,
        precio_unitario: Number(p.precio),
        descuento_pct: 0,
      },
    ]);
  }

  function agregarItemLibre() {
    setItems((prev) => [
      ...prev,
      {
        producto_id: null,
        codigo: "",
        nombre: "",
        descripcion: "",
        unidad: "UND",
        cantidad: 1,
        precio_unitario: 0,
        descuento_pct: 0,
      },
    ]);
  }

  function actualizarItem(idx: number, patch: Partial<ItemInput>) {
    setItems((prev) =>
      prev.map((it, i) => (i === idx ? { ...it, ...patch } : it))
    );
  }

  function quitarItem(idx: number) {
    setItems((prev) => prev.filter((_, i) => i !== idx));
  }

  function moverItem(idx: number, delta: number) {
    setItems((prev) => {
      const next = [...prev];
      const target = idx + delta;
      if (target < 0 || target >= next.length) return prev;
      [next[idx], next[target]] = [next[target], next[idx]];
      return next;
    });
  }

  function handleSubmit() {
    if (!clienteId) {
      toast.error("Selecciona un cliente");
      return;
    }
    if (items.length === 0) {
      toast.error("Agrega al menos un producto");
      return;
    }
    for (const it of items) {
      if (!it.nombre.trim()) {
        toast.error("Todos los ítems necesitan nombre");
        return;
      }
    }

    start(async () => {
      try {
        await guardarCotizacion({
          id: cotizacion?.id,
          cliente_id: clienteId,
          fecha,
          validez_dias: validezDias,
          moneda,
          incluye_igv: incluyeIgv,
          condiciones_pago: condicionesPago,
          condiciones_entrega: condicionesEntrega,
          notas,
          items,
        });
        toast.success(cotizacion ? "Cotización actualizada" : "Cotización creada");
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Error al guardar");
      }
    });
  }

  return (
    <div>
      <PageHeader
        title={cotizacion ? `Editar ${cotizacion.numero}` : "Nueva cotización"}
        description="Selecciona cliente, agrega productos y define condiciones"
        actions={
          <>
            <Button
              variant="outline"
              onClick={() => router.push("/cotizaciones")}
            >
              Cancelar
            </Button>
            <Button onClick={handleSubmit} disabled={pending}>
              {pending ? "Guardando..." : cotizacion ? "Guardar cambios" : "Crear cotización"}
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-3 gap-6">
        {/* COLUMNA IZQUIERDA: Datos cabecera */}
        <div className="col-span-1 space-y-4">
          <Card className="p-5 space-y-4">
            <h3 className="font-semibold text-sm uppercase tracking-wide text-[var(--muted-foreground)]">
              Datos generales
            </h3>
            <Field label="Cliente" required>
              <select
                value={clienteId}
                onChange={(e) => setClienteId(e.target.value)}
                className={inputClasses}
              >
                <option value="">— Selecciona cliente —</option>
                {clientes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.razon_social} {c.ruc && `· ${c.ruc}`}
                  </option>
                ))}
              </select>
            </Field>
            <div className="text-xs">
              <a
                href="/clientes/nuevo"
                target="_blank"
                rel="noreferrer"
                className="text-[var(--primary)] hover:underline"
              >
                + Crear cliente nuevo en otra pestaña
              </a>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Fecha" required>
                <input
                  type="date"
                  value={fecha}
                  onChange={(e) => setFecha(e.target.value)}
                  className={inputClasses}
                />
              </Field>
              <Field label="Validez (días)">
                <input
                  type="number"
                  min="1"
                  value={validezDias}
                  onChange={(e) => setValidezDias(parseInt(e.target.value) || 15)}
                  className={inputClasses}
                />
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Moneda">
                <select
                  value={moneda}
                  onChange={(e) => setMoneda(e.target.value)}
                  className={inputClasses}
                >
                  <option value="PEN">PEN — Soles</option>
                  <option value="USD">USD — Dólares</option>
                </select>
              </Field>
              <Field label="IGV">
                <select
                  value={incluyeIgv ? "1" : "0"}
                  onChange={(e) => setIncluyeIgv(e.target.value === "1")}
                  className={inputClasses}
                >
                  <option value="1">Sumar 18% al precio</option>
                  <option value="0">Precios ya incluyen IGV</option>
                </select>
              </Field>
            </div>
          </Card>

          <Card className="p-5 space-y-4">
            <h3 className="font-semibold text-sm uppercase tracking-wide text-[var(--muted-foreground)]">
              Condiciones
            </h3>
            <Field label="Forma de pago">
              <textarea
                rows={2}
                value={condicionesPago}
                onChange={(e) => setCondicionesPago(e.target.value)}
                className={inputClasses}
              />
            </Field>
            <Field label="Entrega">
              <textarea
                rows={2}
                value={condicionesEntrega}
                onChange={(e) => setCondicionesEntrega(e.target.value)}
                className={inputClasses}
              />
            </Field>
            <Field label="Notas adicionales (opcional)">
              <textarea
                rows={3}
                value={notas}
                onChange={(e) => setNotas(e.target.value)}
                placeholder="Observaciones, garantías, descuentos especiales..."
                className={inputClasses}
              />
            </Field>
          </Card>
        </div>

        {/* COLUMNA DERECHA: Items */}
        <div className="col-span-2 space-y-4">
          <Card className="p-5">
            <div className="flex items-end justify-between mb-4">
              <div>
                <h3 className="font-semibold text-sm uppercase tracking-wide text-[var(--muted-foreground)]">
                  Productos cotizados
                </h3>
                <div className="text-xs text-[var(--muted-foreground)] mt-1">
                  {items.length} {items.length === 1 ? "ítem" : "ítems"}
                </div>
              </div>
              <div className="flex gap-2">
                <select
                  onChange={(e) => {
                    agregarProducto(e.target.value);
                    e.target.value = "";
                  }}
                  className={inputClasses + " max-w-xs"}
                  defaultValue=""
                >
                  <option value="">+ Agregar del catálogo...</option>
                  {productos
                    .filter((p) => p.activo)
                    .map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.codigo} — {p.nombre} ({formatMoney(Number(p.precio))})
                      </option>
                    ))}
                </select>
                <Button variant="outline" size="sm" onClick={agregarItemLibre}>
                  <Plus size={14} /> Ítem libre
                </Button>
              </div>
            </div>

            <div className="space-y-3">
              {items.length === 0 && (
                <div className="text-center py-12 text-[var(--muted-foreground)] text-sm border-2 border-dashed rounded-lg">
                  Selecciona un producto del catálogo o agrega un ítem libre para empezar
                </div>
              )}

              {items.map((it, idx) => {
                const sub = it.cantidad * it.precio_unitario;
                const desc = sub * (it.descuento_pct / 100);
                const subFinal = sub - desc;
                return (
                  <div
                    key={idx}
                    className="border rounded-lg p-3 bg-[var(--muted)]/30 space-y-2"
                  >
                    <div className="flex items-start gap-2">
                      <div className="flex flex-col">
                        <button
                          type="button"
                          onClick={() => moverItem(idx, -1)}
                          className="text-[var(--muted-foreground)] hover:text-[var(--foreground)] disabled:opacity-30"
                          disabled={idx === 0}
                          title="Subir"
                        >
                          ▲
                        </button>
                        <GripVertical size={14} className="text-[var(--muted-foreground)] my-0.5" />
                        <button
                          type="button"
                          onClick={() => moverItem(idx, 1)}
                          className="text-[var(--muted-foreground)] hover:text-[var(--foreground)] disabled:opacity-30"
                          disabled={idx === items.length - 1}
                          title="Bajar"
                        >
                          ▼
                        </button>
                      </div>
                      <div className="flex-1 grid grid-cols-6 gap-2">
                        <input
                          value={it.codigo}
                          onChange={(e) => actualizarItem(idx, { codigo: e.target.value })}
                          placeholder="Código"
                          className={inputClasses + " col-span-1 font-mono text-xs"}
                        />
                        <input
                          value={it.nombre}
                          onChange={(e) => actualizarItem(idx, { nombre: e.target.value })}
                          placeholder="Nombre del producto"
                          className={inputClasses + " col-span-5 font-medium"}
                          required
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => quitarItem(idx)}
                        className="text-[var(--destructive)] hover:bg-red-50 p-2 rounded"
                        title="Quitar ítem"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                    <input
                      value={it.descripcion}
                      onChange={(e) =>
                        actualizarItem(idx, { descripcion: e.target.value })
                      }
                      placeholder="Descripción adicional (opcional)"
                      className={inputClasses + " text-xs"}
                    />
                    <div className="grid grid-cols-12 gap-2 items-end">
                      <div className="col-span-2">
                        <label className="block text-xs text-[var(--muted-foreground)]">
                          Cantidad
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={it.cantidad}
                          onChange={(e) =>
                            actualizarItem(idx, {
                              cantidad: parseFloat(e.target.value) || 0,
                            })
                          }
                          className={inputClasses}
                        />
                      </div>
                      <div className="col-span-2">
                        <label className="block text-xs text-[var(--muted-foreground)]">
                          Unidad
                        </label>
                        <select
                          value={it.unidad}
                          onChange={(e) =>
                            actualizarItem(idx, { unidad: e.target.value })
                          }
                          className={inputClasses}
                        >
                          <option value="UND">UND</option>
                          <option value="PAR">PAR</option>
                          <option value="CJA">CJA</option>
                          <option value="PQT">PQT</option>
                          <option value="DOC">DOC</option>
                          <option value="MT">MT</option>
                          <option value="KG">KG</option>
                          <option value="LT">LT</option>
                        </select>
                      </div>
                      <div className="col-span-3">
                        <label className="block text-xs text-[var(--muted-foreground)]">
                          P. unitario
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={it.precio_unitario}
                          onChange={(e) =>
                            actualizarItem(idx, {
                              precio_unitario: parseFloat(e.target.value) || 0,
                            })
                          }
                          className={inputClasses}
                        />
                      </div>
                      <div className="col-span-2">
                        <label className="block text-xs text-[var(--muted-foreground)]">
                          Desc. %
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          max="100"
                          value={it.descuento_pct}
                          onChange={(e) =>
                            actualizarItem(idx, {
                              descuento_pct: parseFloat(e.target.value) || 0,
                            })
                          }
                          className={inputClasses}
                        />
                      </div>
                      <div className="col-span-3 text-right">
                        <div className="text-xs text-[var(--muted-foreground)]">Subtotal</div>
                        <div className="font-bold text-lg">
                          {formatMoney(subFinal, moneda)}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* TOTALES */}
          <Card className="p-5">
            <div className="flex justify-end">
              <div className="w-72 space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-[var(--muted-foreground)]">Subtotal</span>
                  <span className="font-mono">{formatMoney(totales.subtotal, moneda)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--muted-foreground)]">IGV 18%</span>
                  <span className="font-mono">{formatMoney(totales.igv, moneda)}</span>
                </div>
                <div className="border-t pt-2 flex justify-between text-lg font-extrabold text-[var(--primary)]">
                  <span>TOTAL</span>
                  <span className="font-mono">{formatMoney(totales.total, moneda)}</span>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
