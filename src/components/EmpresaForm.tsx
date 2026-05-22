"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Card, Field, Button, inputClasses } from "@/components/ui";
import type { EmpresaConfig } from "@/lib/supabase/types";
import { guardarEmpresa } from "@/app/configuracion/actions";

export function EmpresaForm({ empresa }: { empresa: EmpresaConfig }) {
  const [pending, start] = useTransition();

  async function handleSubmit(formData: FormData) {
    start(async () => {
      try {
        await guardarEmpresa(formData);
        toast.success("Configuración guardada");
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Error");
      }
    });
  }

  return (
    <form action={handleSubmit} className="space-y-6">
      <input type="hidden" name="id" value={empresa.id} />

      <Card className="p-6 space-y-4">
        <h3 className="font-semibold text-sm uppercase tracking-wide text-[var(--muted-foreground)]">
          Datos de la empresa
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Razón social" required>
            <input
              name="razon_social"
              required
              defaultValue={empresa.razon_social}
              className={inputClasses}
            />
          </Field>
          <Field label="Nombre comercial">
            <input
              name="nombre_comercial"
              defaultValue={empresa.nombre_comercial}
              className={inputClasses}
            />
          </Field>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Field label="RUC">
            <input
              name="ruc"
              defaultValue={empresa.ruc}
              placeholder="20XXXXXXXXX"
              className={inputClasses + " font-mono"}
            />
          </Field>
          <Field label="Teléfono">
            <input
              name="telefono"
              defaultValue={empresa.telefono}
              placeholder="+51 ..."
              className={inputClasses}
            />
          </Field>
          <Field label="WhatsApp">
            <input
              name="whatsapp"
              defaultValue={empresa.whatsapp}
              placeholder="51 9XX XXX XXX"
              className={inputClasses}
            />
          </Field>
        </div>
        <Field label="Correo">
          <input
            name="correo"
            type="email"
            defaultValue={empresa.correo}
            placeholder="ventas@arratia.com"
            className={inputClasses}
          />
        </Field>
        <Field label="Dirección">
          <input
            name="direccion"
            defaultValue={empresa.direccion}
            placeholder="Av. ... — distrito — Lima"
            className={inputClasses}
          />
        </Field>
        <Field
          label="Logo (URL de imagen)"
          hint="Sube tu logo a Supabase Storage (bucket público) o usa cualquier URL pública"
        >
          <input
            name="logo_url"
            defaultValue={empresa.logo_url}
            placeholder="https://..."
            className={inputClasses}
          />
        </Field>
      </Card>

      <Card className="p-6 space-y-4">
        <h3 className="font-semibold text-sm uppercase tracking-wide text-[var(--muted-foreground)]">
          Cuentas bancarias
        </h3>
        <p className="text-xs text-[var(--muted-foreground)]">
          Aparecerán en el pie de cada cotización para facilitar el pago.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Cuenta BCP">
            <input
              name="banco_bcp"
              defaultValue={empresa.banco_bcp}
              placeholder="194-..."
              className={inputClasses + " font-mono"}
            />
          </Field>
          <Field label="Cuenta Interbank">
            <input
              name="banco_interbank"
              defaultValue={empresa.banco_interbank}
              placeholder="200-..."
              className={inputClasses + " font-mono"}
            />
          </Field>
          <Field label="Cuenta BBVA">
            <input
              name="banco_bbva"
              defaultValue={empresa.banco_bbva}
              placeholder="0011-..."
              className={inputClasses + " font-mono"}
            />
          </Field>
          <Field label="CCI">
            <input
              name="cci"
              defaultValue={empresa.cci}
              placeholder="002-194-..."
              className={inputClasses + " font-mono"}
            />
          </Field>
        </div>
      </Card>

      <div className="flex justify-end">
        <Button type="submit" disabled={pending} className="w-full sm:w-auto justify-center">
          {pending ? "Guardando..." : "Guardar configuración"}
        </Button>
      </div>
    </form>
  );
}
