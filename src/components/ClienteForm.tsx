"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Trash2, Search, CheckCircle2 } from "lucide-react";
import { Card, Field, Button, inputClasses } from "@/components/ui";
import type { Cliente } from "@/lib/supabase/types";
import { guardarCliente, eliminarCliente } from "@/app/clientes/actions";

interface DatosSunat {
  ruc?: string;
  razon_social?: string;
  estado?: string;
  condicion?: string;
  direccion?: string;
  ubigeo?: string;
  departamento?: string;
  provincia?: string;
  distrito?: string;
}

export function ClienteForm({ cliente }: { cliente?: Cliente }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [consultando, setConsultando] = useState(false);

  // Controlados para que la consulta a SUNAT pueda actualizarlos
  const [ruc, setRuc] = useState(cliente?.ruc || "");
  const [razonSocial, setRazonSocial] = useState(cliente?.razon_social || "");
  const [direccion, setDireccion] = useState(cliente?.direccion || "");
  const [estado, setEstado] = useState(cliente?.estado || "");
  const [condicion, setCondicion] = useState(cliente?.condicion || "");
  const [ubigeo, setUbigeo] = useState(cliente?.ubigeo || "");
  const [departamento, setDepartamento] = useState(cliente?.departamento || "");
  const [provincia, setProvincia] = useState(cliente?.provincia || "");
  const [distrito, setDistrito] = useState(cliente?.distrito || "");
  const [sunatConsultadoEn, setSunatConsultadoEn] = useState<string>(
    cliente?.sunat_consultado_en || ""
  );

  async function consultarRuc() {
    const rucLimpio = ruc.replace(/\s+/g, "");
    if (!/^\d{11}$/.test(rucLimpio)) {
      toast.error("El RUC debe tener exactamente 11 dígitos");
      return;
    }

    setConsultando(true);
    try {
      const resp = await fetch(`/api/sunat/${rucLimpio}`);
      const data = await resp.json();
      if (!resp.ok) {
        toast.error(data.error || "No se pudo consultar SUNAT");
        return;
      }

      const d = data as DatosSunat;
      setRazonSocial(d.razon_social || "");
      setDireccion(d.direccion || "");
      setEstado(d.estado || "");
      setCondicion(d.condicion || "");
      setUbigeo(d.ubigeo || "");
      setDepartamento(d.departamento || "");
      setProvincia(d.provincia || "");
      setDistrito(d.distrito || "");
      setSunatConsultadoEn(new Date().toISOString());

      toast.success(`✓ Datos cargados: ${d.razon_social || "(sin razón social)"}`);
    } catch {
      toast.error("Error de red al consultar SUNAT");
    } finally {
      setConsultando(false);
    }
  }

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
      <input type="hidden" name="estado" value={estado} />
      <input type="hidden" name="condicion" value={condicion} />
      <input type="hidden" name="ubigeo" value={ubigeo} />
      <input type="hidden" name="departamento" value={departamento} />
      <input type="hidden" name="provincia" value={provincia} />
      <input type="hidden" name="distrito" value={distrito} />
      <input
        type="hidden"
        name="sunat_consultado_en"
        value={sunatConsultadoEn}
      />

      <Card className="p-6 space-y-4">
        <h3 className="font-semibold text-sm uppercase tracking-wide text-[var(--muted-foreground)]">
          Identificación
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Field label="RUC" hint="11 dígitos. Después clic en 'Buscar en SUNAT'">
            <input
              name="ruc"
              value={ruc}
              onChange={(e) => setRuc(e.target.value.replace(/\D/g, "").slice(0, 11))}
              placeholder="20XXXXXXXXX"
              inputMode="numeric"
              maxLength={11}
              className={inputClasses + " font-mono"}
            />
          </Field>
          <div className="sm:col-span-2 flex items-end">
            <Button
              type="button"
              variant="outline"
              onClick={consultarRuc}
              disabled={consultando || ruc.length !== 11}
              className="w-full sm:w-auto justify-center"
            >
              <Search size={16} />
              {consultando ? "Consultando..." : "Buscar en SUNAT"}
            </Button>
            {sunatConsultadoEn && (
              <span className="ml-3 text-xs text-green-700 inline-flex items-center gap-1">
                <CheckCircle2 size={14} /> Datos SUNAT cargados
              </span>
            )}
          </div>
        </div>

        <Field label="Razón social" required>
          <input
            name="razon_social"
            required
            value={razonSocial}
            onChange={(e) => setRazonSocial(e.target.value)}
            placeholder="Empresa S.A.C."
            className={inputClasses}
          />
        </Field>

        <Field label="Dirección fiscal">
          <input
            name="direccion"
            value={direccion}
            onChange={(e) => setDireccion(e.target.value)}
            placeholder="Av. ... — distrito — Lima"
            className={inputClasses}
          />
        </Field>

        {(estado || condicion || ubigeo) && (
          <div className="border-t pt-3 mt-2">
            <div className="text-xs font-semibold text-[var(--muted-foreground)] uppercase mb-2">
              Datos SUNAT
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              {estado && (
                <div>
                  <div className="text-[var(--muted-foreground)]">Estado</div>
                  <div className="font-semibold">{estado}</div>
                </div>
              )}
              {condicion && (
                <div>
                  <div className="text-[var(--muted-foreground)]">Condición</div>
                  <div className="font-semibold">{condicion}</div>
                </div>
              )}
              {ubigeo && (
                <div>
                  <div className="text-[var(--muted-foreground)]">Ubigeo</div>
                  <div className="font-mono">{ubigeo}</div>
                </div>
              )}
              {distrito && (
                <div>
                  <div className="text-[var(--muted-foreground)]">Distrito</div>
                  <div>{distrito}</div>
                </div>
              )}
              {provincia && (
                <div>
                  <div className="text-[var(--muted-foreground)]">Provincia</div>
                  <div>{provincia}</div>
                </div>
              )}
              {departamento && (
                <div>
                  <div className="text-[var(--muted-foreground)]">Departamento</div>
                  <div>{departamento}</div>
                </div>
              )}
            </div>
          </div>
        )}
      </Card>

      <Card className="p-6 space-y-4 mt-6">
        <h3 className="font-semibold text-sm uppercase tracking-wide text-[var(--muted-foreground)]">
          Contacto
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

      <div className="flex flex-col-reverse sm:flex-row sm:justify-between gap-3 mt-6">
        <div className="flex">
          {cliente && (
            <Button
              type="button"
              variant="danger"
              onClick={handleDelete}
              disabled={pending}
              className="w-full sm:w-auto justify-center"
            >
              <Trash2 size={16} /> Eliminar
            </Button>
          )}
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/clientes")}
            className="justify-center"
          >
            Cancelar
          </Button>
          <Button type="submit" disabled={pending} className="justify-center">
            {pending ? "Guardando..." : cliente ? "Guardar cambios" : "Crear cliente"}
          </Button>
        </div>
      </div>
    </form>
  );
}
