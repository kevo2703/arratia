"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import { Card, Field, Button, inputClasses } from "@/components/ui";
import type { Producto, Categoria } from "@/lib/supabase/types";
import { guardarProducto, eliminarProducto } from "@/app/productos/actions";

export function ProductoForm({
  producto,
  categorias,
}: {
  producto?: Producto;
  categorias: Categoria[];
}) {
  const router = useRouter();
  const [pending, start] = useTransition();

  async function handleSubmit(formData: FormData) {
    start(async () => {
      try {
        await guardarProducto(formData);
        toast.success(producto ? "Producto actualizado" : "Producto creado");
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Error al guardar");
      }
    });
  }

  async function handleDelete() {
    if (!producto) return;
    if (!confirm("¿Eliminar este producto? Esta acción no se puede deshacer.")) return;
    start(async () => {
      try {
        await eliminarProducto(producto.id);
        toast.success("Producto eliminado");
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Error al eliminar");
      }
    });
  }

  return (
    <form action={handleSubmit}>
      {producto && <input type="hidden" name="id" value={producto.id} />}
      <Card className="p-6 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Field label="Código" required>
            <input
              name="codigo"
              required
              defaultValue={producto?.codigo}
              placeholder="EJ: CASCO-001"
              className={inputClasses}
            />
          </Field>
          <Field label="Categoría">
            <select
              name="categoria_id"
              defaultValue={producto?.categoria_id || ""}
              className={inputClasses}
            >
              <option value="">— Sin categoría —</option>
              {categorias.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre}
                </option>
              ))}
            </select>
          </Field>
        </div>
        <Field label="Nombre" required>
          <input
            name="nombre"
            required
            defaultValue={producto?.nombre}
            placeholder="Casco de seguridad tipo I clase E"
            className={inputClasses}
          />
        </Field>
        <Field label="Descripción">
          <textarea
            name="descripcion"
            rows={3}
            defaultValue={producto?.descripcion}
            placeholder="Especificaciones, normas, características técnicas..."
            className={inputClasses}
          />
        </Field>
        <div className="grid grid-cols-3 gap-4">
          <Field label="Marca">
            <input
              name="marca"
              defaultValue={producto?.marca}
              placeholder="3M, Steelpro, Vicsa..."
              className={inputClasses}
            />
          </Field>
          <Field label="Unidad" required>
            <select
              name="unidad"
              defaultValue={producto?.unidad || "UND"}
              className={inputClasses}
            >
              <option value="UND">UND — Unidad</option>
              <option value="PAR">PAR — Par</option>
              <option value="CJA">CJA — Caja</option>
              <option value="PQT">PQT — Paquete</option>
              <option value="DOC">DOC — Docena</option>
              <option value="MT">MT — Metro</option>
              <option value="KG">KG — Kilogramo</option>
              <option value="LT">LT — Litro</option>
            </select>
          </Field>
          <Field label="Stock">
            <input
              name="stock"
              type="number"
              min="0"
              defaultValue={producto?.stock ?? 0}
              className={inputClasses}
            />
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Precio (S/) sin IGV" required hint="Se aplicará IGV 18% al cotizar">
            <input
              name="precio"
              type="number"
              step="0.01"
              min="0"
              required
              defaultValue={producto?.precio ?? 0}
              className={inputClasses}
            />
          </Field>
          <Field label="URL imagen (opcional)">
            <input
              name="imagen_url"
              defaultValue={producto?.imagen_url}
              placeholder="https://..."
              className={inputClasses}
            />
          </Field>
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            name="activo"
            defaultChecked={producto?.activo ?? true}
            className="rounded"
          />
          Producto activo (disponible para cotizar)
        </label>
      </Card>

      <div className="flex justify-between mt-6">
        <div>
          {producto && (
            <Button
              type="button"
              variant="danger"
              onClick={handleDelete}
              disabled={pending}
            >
              <Trash2 size={16} /> Eliminar
            </Button>
          )}
        </div>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/productos")}
          >
            Cancelar
          </Button>
          <Button type="submit" disabled={pending}>
            {pending ? "Guardando..." : producto ? "Guardar cambios" : "Crear producto"}
          </Button>
        </div>
      </div>
    </form>
  );
}
