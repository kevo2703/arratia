"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Card, Field, Button, inputClasses } from "@/components/ui";
import type { EmpresaConfig } from "@/lib/supabase/types";
import { guardarEmpresa } from "@/app/configuracion/actions";
import { LogoUploader } from "./LogoUploader";

const DEFAULT_PRIMARY = "#ea580c";
const DEFAULT_SECONDARY = "#1e293b";

export function EmpresaForm({ empresa }: { empresa: EmpresaConfig }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [logoUrl, setLogoUrl] = useState(empresa.logo_url || "");
  const [colorPrimary, setColorPrimary] = useState(
    empresa.color_primary || DEFAULT_PRIMARY
  );
  const [colorSecondary, setColorSecondary] = useState(
    empresa.color_secondary || DEFAULT_SECONDARY
  );

  async function handleSubmit(formData: FormData) {
    formData.set("logo_url", logoUrl);
    formData.set("color_primary", colorPrimary);
    formData.set("color_secondary", colorSecondary);
    start(async () => {
      try {
        await guardarEmpresa(formData);
        toast.success("Configuración guardada");
        router.refresh();
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Error");
      }
    });
  }

  function resetColors() {
    setColorPrimary(DEFAULT_PRIMARY);
    setColorSecondary(DEFAULT_SECONDARY);
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
      </Card>

      {/* Logo */}
      <Card className="p-6 space-y-4">
        <h3 className="font-semibold text-sm uppercase tracking-wide text-[var(--muted-foreground)]">
          Logo de la empresa
        </h3>
        <p className="text-xs text-[var(--muted-foreground)]">
          Aparece en la barra superior, en el menú lateral y en cada PDF de cotización.
        </p>
        <LogoUploader currentUrl={logoUrl} onChange={setLogoUrl} />
      </Card>

      {/* Colores */}
      <Card className="p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <h3 className="font-semibold text-sm uppercase tracking-wide text-[var(--muted-foreground)]">
              Colores de la plataforma
            </h3>
            <p className="text-xs text-[var(--muted-foreground)] mt-1">
              Personaliza los 2 colores principales. Aplican a botones, menú y PDF.
            </p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={resetColors}
            className="self-start"
          >
            Restaurar por defecto
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Color primario" hint="Usado en botones principales, totales y enlaces">
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={colorPrimary}
                onChange={(e) => setColorPrimary(e.target.value)}
                className="h-10 w-16 rounded border cursor-pointer bg-white"
              />
              <input
                type="text"
                value={colorPrimary}
                onChange={(e) => setColorPrimary(e.target.value)}
                pattern="^#[0-9a-fA-F]{6}$"
                placeholder="#ea580c"
                className={inputClasses + " font-mono uppercase"}
              />
            </div>
          </Field>
          <Field label="Color secundario" hint="Usado en menú lateral y encabezados">
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={colorSecondary}
                onChange={(e) => setColorSecondary(e.target.value)}
                className="h-10 w-16 rounded border cursor-pointer bg-white"
              />
              <input
                type="text"
                value={colorSecondary}
                onChange={(e) => setColorSecondary(e.target.value)}
                pattern="^#[0-9a-fA-F]{6}$"
                placeholder="#1e293b"
                className={inputClasses + " font-mono uppercase"}
              />
            </div>
          </Field>
        </div>

        {/* Preview */}
        <div className="border rounded-md p-4 bg-[var(--muted)]">
          <div className="text-xs text-[var(--muted-foreground)] mb-2 font-semibold uppercase">
            Vista previa
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div
              className="px-4 py-2 rounded-md text-white text-sm font-semibold"
              style={{ backgroundColor: colorPrimary }}
            >
              Botón primario
            </div>
            <div
              className="px-4 py-2 rounded-md text-white text-sm font-semibold"
              style={{ backgroundColor: colorSecondary }}
            >
              Menú lateral
            </div>
            <div
              className="text-sm font-bold"
              style={{ color: colorPrimary }}
            >
              Total: S/ 1,234.56
            </div>
          </div>
        </div>
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
        <Button
          type="submit"
          disabled={pending}
          className="w-full sm:w-auto justify-center"
        >
          {pending ? "Guardando..." : "Guardar configuración"}
        </Button>
      </div>
    </form>
  );
}
