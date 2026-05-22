"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import { Card, Field, Button, inputClasses } from "@/components/ui";
import type { Cliente } from "@/lib/supabase/types";
import { guardarCliente, eliminarCliente } from "@/app/clientes/actions";

export function ClienteForm({ cliente }: { cliente?: Cliente }) {
  const router = useRouter();
  const [pending, start] = useTransition();

  async function handleSubmit(formData: FormData) {
    start(async () => {
      try {
        await guardarCliente(formData);
        toast.success(cliente ? "Cliente actualizado" : "Cliente creado");
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Error al guardar");
      }
    });
  }

  async function handleDelete() {
    if (!cliente) return;
    if (!confirm("¿Eliminar este cliente? Solo si no tiene cotizaciones asociadas.")) return;
    start(async () => {
      try {
        await eliminarCliente(cliente.id);
        toast.success("Cliente eliminado");
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Error al eliminar");
      }
    });
  }

  return (
    <form action={handleSubmit}>
      {cliente && <input type="hidden" name="id" value={cliente.id} />}
      <Card className="p-6 space-y-4">
        <div className="grid grid-cols-3 gap-4">
          <Field label="RUC">
            <input
              name="ruc"
              defaultValue={cliente?.ruc}
              placeholder="20XXXXXXXXX"
              className={inputClasses}
            />
          </Field>
          <div className="col-span-2">
            <Field label="Razón social" required>
              <input
                name="razon_social"
                required
                defaultValue={cliente?.razon_social}
                placeholder="Empresa S.A.C."
                className={inputClasses}
              />
            </Field>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Persona de contacto">
            <input
              name="contacto"
              defaultValue={cliente?.contacto}
              placeholder="Nombre y cargo"
              className={inputClasses}
            />
          </Field>
          <Field label="Teléfono / WhatsApp">
            <input
              name="telefono"
              defaultValue={cliente?.telefono}
              placeholder="+51 9XX XXX XXX"
              className={inputClasses}
            />
          </Field>
        </div>
        <Field label="Correo electrónico">
          <input
            name="correo"
            type="email"
            defaultValue={cliente?.correo}
            placeholder="compras@empresa.com"
            className={inputClasses}
          />
        </Field>
        <Field label="Dirección">
          <input
            name="direccion"
            defaultValue={cliente?.direccion}
            placeholder="Av. ... — distrito — Lima"
            className={inputClasses}
          />
        </Field>
        <Field label="Notas internas">
          <textarea
            name="notas"
            rows={3}
            defaultValue={cliente?.notas}
            placeholder="Detalles del cliente: ramos, condiciones especiales, historial..."
            className={inputClasses}
          />
        </Field>
      </Card>

      <div className="flex justify-between mt-6">
        <div>
          {cliente && (
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
            onClick={() => router.push("/clientes")}
          >
            Cancelar
          </Button>
          <Button type="submit" disabled={pending}>
            {pending ? "Guardando..." : cliente ? "Guardar cambios" : "Crear cliente"}
          </Button>
        </div>
      </div>
    </form>
  );
}
