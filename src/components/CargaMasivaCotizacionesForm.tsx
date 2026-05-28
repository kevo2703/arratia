"use client";

import { useState, useTransition, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Download,
  Upload,
  AlertCircle,
  CheckCircle2,
  ArrowLeft,
  FileText,
} from "lucide-react";
import { Card, Button } from "@/components/ui";
import {
  generarPlantillaCotizacionesCSV,
  generarPlantillaCotizacionItemsCSV,
  parseCSV,
  validarFilasCotizaciones,
  validarFilasCotizacionItems,
  type FilaCotizacionValidacion,
  type FilaItemValidacion,
} from "@/lib/csv";
import { cargarCotizacionesMasivo } from "@/app/cotizaciones/actions";

export function CargaMasivaCotizacionesForm() {
  const router = useRouter();
  const inputCabRef = useRef<HTMLInputElement>(null);
  const inputItemsRef = useRef<HTMLInputElement>(null);
  const [pending, start] = useTransition();

  const [cabValidas, setCabValidas] = useState<FilaCotizacionValidacion[]>([]);
  const [cabError, setCabError] = useState<FilaCotizacionValidacion[]>([]);
  const [cabHeadersOk, setCabHeadersOk] = useState<boolean | null>(null);
  const [cabFilename, setCabFilename] = useState("");

  const [itValidas, setItValidas] = useState<FilaItemValidacion[]>([]);
  const [itError, setItError] = useState<FilaItemValidacion[]>([]);
  const [itHeadersOk, setItHeadersOk] = useState<boolean | null>(null);
  const [itFilename, setItFilename] = useState("");

  function descargarPlantillaCabeceras() {
    const csv = generarPlantillaCotizacionesCSV();
    descargar(csv, "plantilla-cotizaciones-cabeceras.csv");
  }

  function descargarPlantillaItems() {
    const csv = generarPlantillaCotizacionItemsCSV();
    descargar(csv, "plantilla-cotizaciones-items.csv");
  }

  function descargar(csv: string, nombre: string) {
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = nombre;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success(`${nombre} descargada`);
  }

  function handleCabeceras(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setCabFilename(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      const rows = parseCSV(String(reader.result || ""));
      const { validas, conError, headersOk } = validarFilasCotizaciones(rows);
      setCabHeadersOk(headersOk);
      setCabValidas(validas);
      setCabError(conError);
      if (!headersOk) toast.error("Encabezados del CSV de cabeceras no válidos");
      else toast.success(`Cabeceras: ${validas.length} válidas, ${conError.length} con errores`);
    };
    reader.readAsText(file, "utf-8");
  }

  function handleItems(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setItFilename(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      const rows = parseCSV(String(reader.result || ""));
      const { validas, conError, headersOk } = validarFilasCotizacionItems(rows);
      setItHeadersOk(headersOk);
      setItValidas(validas);
      setItError(conError);
      if (!headersOk) toast.error("Encabezados del CSV de ítems no válidos");
      else toast.success(`Ítems: ${validas.length} válidos, ${conError.length} con errores`);
    };
    reader.readAsText(file, "utf-8");
  }

  function limpiar() {
    setCabValidas([]); setCabError([]); setCabHeadersOk(null); setCabFilename("");
    setItValidas([]); setItError([]); setItHeadersOk(null); setItFilename("");
    if (inputCabRef.current) inputCabRef.current.value = "";
    if (inputItemsRef.current) inputItemsRef.current.value = "";
  }

  function confirmar() {
    if (cabValidas.length === 0) {
      toast.error("Sube al menos un CSV de cabeceras con filas válidas");
      return;
    }
    if (
      !confirm(
        `Cargar ${cabValidas.length} cotizaciones con ${itValidas.length} ítems totales. ` +
          `Las cotizaciones existentes (por número) serán reemplazadas. ¿Continuar?`
      )
    )
      return;

    start(async () => {
      try {
        const cabs = cabValidas.map(
          (v) => v.fila as Parameters<typeof cargarCotizacionesMasivo>[0][number]
        );
        const items = itValidas.map(
          (v) => v.fila as Parameters<typeof cargarCotizacionesMasivo>[1][number]
        );
        const r = await cargarCotizacionesMasivo(cabs, items);

        const msgs: string[] = [];
        if (r.insertadas > 0) msgs.push(`✓ ${r.insertadas} nuevas`);
        if (r.actualizadas > 0) msgs.push(`✓ ${r.actualizadas} actualizadas`);
        if (msgs.length) toast.success(msgs.join(", "));

        if (r.clientesFaltantes.length > 0) {
          toast.warning(
            `${r.clientesFaltantes.length} RUCs no existen en BD: ${r.clientesFaltantes.slice(0, 3).join(", ")}${r.clientesFaltantes.length > 3 ? "..." : ""}`
          );
        }
        if (r.itemsHuerfanos.length > 0) {
          toast.warning(
            `${r.itemsHuerfanos.length} cotizaciones en ítems no están en cabeceras: ${r.itemsHuerfanos.slice(0, 3).join(", ")}`
          );
        }
        if (r.fallidas > 0) {
          toast.error(
            `${r.fallidas} fallidas: ${r.errores.slice(0, 2).map((e) => e.mensaje).join("; ")}`
          );
        }

        if (r.insertadas > 0 || r.actualizadas > 0) {
          router.push("/cotizaciones");
        }
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Error al cargar");
      }
    });
  }

  return (
    <div className="space-y-6">
      {/* Paso 1: Descargar ambas plantillas */}
      <Card className="p-4 md:p-6">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-full bg-[var(--primary)] text-white flex items-center justify-center font-bold shrink-0">
            1
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold mb-1">Descarga las 2 plantillas</h3>
            <p className="text-sm text-[var(--muted-foreground)] mb-3">
              Una para las cotizaciones (cabeceras) y otra para los ítems. Se relacionan por
              el campo <code className="bg-[var(--muted)] px-1 rounded text-xs">numero</code>.
            </p>
            <div className="flex flex-col sm:flex-row gap-2">
              <Button variant="outline" onClick={descargarPlantillaCabeceras}>
                <Download size={16} /> Plantilla cabeceras
              </Button>
              <Button variant="outline" onClick={descargarPlantillaItems}>
                <Download size={16} /> Plantilla ítems
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* Paso 2: Instrucciones */}
      <Card className="p-4 md:p-6">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-full bg-[var(--primary)] text-white flex items-center justify-center font-bold shrink-0">
            2
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold mb-1">Reglas importantes</h3>
            <ul className="text-sm space-y-1 text-[var(--muted-foreground)] list-disc list-inside ml-2">
              <li>
                <strong>Numeración:</strong> el campo{" "}
                <code className="bg-[var(--muted)] px-1 rounded text-xs">numero</code> es
                único. Si ya existe en BD, se reemplaza la cotización completa (cabecera +
                ítems).
              </li>
              <li>
                <strong>Clientes:</strong>{" "}
                <code className="bg-[var(--muted)] px-1 rounded text-xs">cliente_ruc</code>{" "}
                debe coincidir con un cliente ya creado. Si no existe, esa cotización se
                omite (carga clientes primero).
              </li>
              <li>
                <strong>Productos:</strong>{" "}
                <code className="bg-[var(--muted)] px-1 rounded text-xs">codigo</code> en
                ítems es opcional. Si coincide con un producto, se enlaza. Si no, queda como
                ítem libre.
              </li>
              <li>
                <strong>Fecha:</strong> formato{" "}
                <code className="bg-[var(--muted)] px-1 rounded text-xs">YYYY-MM-DD</code>.
              </li>
              <li>
                <strong>Estados:</strong> borrador, enviada, aceptada, rechazada, expirada.
              </li>
              <li>
                <strong>incluye_igv:</strong> si/no. Si <em>si</em>, los precios son netos y
                se le suma 18%. Si <em>no</em>, los precios ya incluyen IGV.
              </li>
              <li>
                Subtotales y totales se calculan automáticamente — no los pongas en la
                plantilla.
              </li>
            </ul>
          </div>
        </div>
      </Card>

      {/* Paso 3: Subir cabeceras */}
      <Card className="p-4 md:p-6">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-full bg-[var(--primary)] text-white flex items-center justify-center font-bold shrink-0">
            3
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold mb-1">Sube CSV de cabeceras</h3>
            <input
              ref={inputCabRef}
              type="file"
              accept=".csv,text/csv"
              onChange={handleCabeceras}
              className="block w-full text-sm file:mr-3 file:py-2 file:px-4 file:rounded-md file:border-0 file:font-semibold file:bg-[var(--secondary)] file:text-white file:cursor-pointer cursor-pointer"
            />
            {cabFilename && (
              <p className="text-xs text-[var(--muted-foreground)] mt-2">
                <FileText size={12} className="inline mr-1" />
                {cabFilename}
              </p>
            )}
          </div>
        </div>
      </Card>

      {/* Paso 4: Subir items */}
      <Card className="p-4 md:p-6">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-full bg-[var(--primary)] text-white flex items-center justify-center font-bold shrink-0">
            4
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold mb-1">Sube CSV de ítems</h3>
            <input
              ref={inputItemsRef}
              type="file"
              accept=".csv,text/csv"
              onChange={handleItems}
              className="block w-full text-sm file:mr-3 file:py-2 file:px-4 file:rounded-md file:border-0 file:font-semibold file:bg-[var(--secondary)] file:text-white file:cursor-pointer cursor-pointer"
            />
            {itFilename && (
              <p className="text-xs text-[var(--muted-foreground)] mt-2">
                <FileText size={12} className="inline mr-1" />
                {itFilename}
              </p>
            )}
          </div>
        </div>
      </Card>

      {/* Estado de validación */}
      {(cabValidas.length > 0 ||
        cabError.length > 0 ||
        itValidas.length > 0 ||
        itError.length > 0) && (
        <Card className="p-4 md:p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div className="border rounded-md p-3">
              <div className="text-xs font-semibold text-[var(--muted-foreground)] uppercase mb-2">
                Cabeceras (cotizaciones)
              </div>
              <div className="flex items-center gap-3">
                <span className="inline-flex items-center gap-1 text-green-700 text-sm">
                  <CheckCircle2 size={14} /> {cabValidas.length} válidas
                </span>
                {cabError.length > 0 && (
                  <span className="inline-flex items-center gap-1 text-[var(--destructive)] text-sm">
                    <AlertCircle size={14} /> {cabError.length} con errores
                  </span>
                )}
              </div>
            </div>
            <div className="border rounded-md p-3">
              <div className="text-xs font-semibold text-[var(--muted-foreground)] uppercase mb-2">
                Ítems
              </div>
              <div className="flex items-center gap-3">
                <span className="inline-flex items-center gap-1 text-green-700 text-sm">
                  <CheckCircle2 size={14} /> {itValidas.length} válidos
                </span>
                {itError.length > 0 && (
                  <span className="inline-flex items-center gap-1 text-[var(--destructive)] text-sm">
                    <AlertCircle size={14} /> {itError.length} con errores
                  </span>
                )}
              </div>
            </div>
          </div>

          <Button variant="ghost" size="sm" onClick={limpiar} className="mb-4">
            Limpiar todo
          </Button>

          {(cabError.length > 0 || itError.length > 0) && (
            <div className="border-l-4 border-l-[var(--destructive)] bg-red-50 p-3 mb-4 text-xs">
              <div className="font-semibold mb-1">Errores detectados (no se cargarán):</div>
              {cabError.slice(0, 3).map((v) => (
                <div key={"cab-" + v.linea}>
                  Cabecera línea {v.linea} ({v.fila.numero || "—"}):{" "}
                  {v.errores.join("; ")}
                </div>
              ))}
              {itError.slice(0, 3).map((v) => (
                <div key={"it-" + v.linea}>
                  Ítem línea {v.linea} ({v.fila.numero_cotizacion || "—"}):{" "}
                  {v.errores.join("; ")}
                </div>
              ))}
              {cabError.length + itError.length > 6 && (
                <div className="text-[var(--muted-foreground)] mt-1">
                  + {cabError.length + itError.length - 6} más...
                </div>
              )}
            </div>
          )}

          {cabValidas.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-xs min-w-[640px] border rounded">
                <thead className="bg-[var(--muted)] text-left">
                  <tr>
                    <th className="px-3 py-2 font-semibold">Número</th>
                    <th className="px-3 py-2 font-semibold">RUC cliente</th>
                    <th className="px-3 py-2 font-semibold">Fecha</th>
                    <th className="px-3 py-2 font-semibold">Estado</th>
                    <th className="px-3 py-2 font-semibold text-right">Ítems</th>
                  </tr>
                </thead>
                <tbody>
                  {cabValidas.slice(0, 10).map((v) => {
                    const itemsCount = itValidas.filter(
                      (i) => i.fila.numero_cotizacion === v.fila.numero
                    ).length;
                    return (
                      <tr key={v.linea} className="border-t">
                        <td className="px-3 py-2 font-mono">{v.fila.numero}</td>
                        <td className="px-3 py-2 font-mono">{v.fila.cliente_ruc}</td>
                        <td className="px-3 py-2">{v.fila.fecha}</td>
                        <td className="px-3 py-2">{v.fila.estado}</td>
                        <td className="px-3 py-2 text-right font-mono">{itemsCount}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {/* Acciones */}
      <div className="flex flex-col-reverse sm:flex-row sm:justify-between gap-3">
        <Button
          variant="outline"
          onClick={() => router.push("/cotizaciones")}
          className="justify-center"
        >
          <ArrowLeft size={16} /> Cancelar
        </Button>
        <Button
          onClick={confirmar}
          disabled={cabValidas.length === 0 || pending}
          className="justify-center"
        >
          <Upload size={16} />
          {pending
            ? "Cargando..."
            : cabValidas.length > 0
              ? `Confirmar carga de ${cabValidas.length} cotizaciones`
              : "Sube los CSVs primero"}
        </Button>
      </div>
    </div>
  );
}
