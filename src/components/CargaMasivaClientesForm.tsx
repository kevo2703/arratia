"use client";

import { useState, useTransition, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Download, Upload, AlertCircle, CheckCircle2, ArrowLeft } from "lucide-react";
import { Card, Button } from "@/components/ui";
import {
  generarPlantillaClientesCSV,
  parseCSV,
  validarFilasClientes,
  type FilaClienteValidacion,
} from "@/lib/csv";
import { cargarClientesMasivo } from "@/app/clientes/actions";

export function CargaMasivaClientesForm() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [pending, start] = useTransition();
  const [validas, setValidas] = useState<FilaClienteValidacion[]>([]);
  const [conError, setConError] = useState<FilaClienteValidacion[]>([]);
  const [headersOk, setHeadersOk] = useState<boolean | null>(null);
  const [filename, setFilename] = useState("");

  function descargarPlantilla() {
    const csv = generarPlantillaClientesCSV();
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "plantilla-clientes-arratia.csv";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("Plantilla descargada");
  }

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setFilename(file.name);

    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result || "");
      const rows = parseCSV(text);
      const { validas, conError, headersOk } = validarFilasClientes(rows);
      setHeadersOk(headersOk);
      setValidas(validas);
      setConError(conError);

      if (!headersOk) {
        toast.error("Encabezados no coinciden con la plantilla. Descárgala de nuevo.");
      } else {
        toast.success(`${validas.length} válidas, ${conError.length} con errores`);
      }
    };
    reader.onerror = () => toast.error("No se pudo leer el archivo");
    reader.readAsText(file, "utf-8");
  }

  function limpiar() {
    setValidas([]);
    setConError([]);
    setHeadersOk(null);
    setFilename("");
    if (inputRef.current) inputRef.current.value = "";
  }

  function confirmar() {
    if (validas.length === 0) return;
    if (
      !confirm(
        `Cargar ${validas.length} clientes. Los RUCs que ya existen serán actualizados. ¿Continuar?`
      )
    )
      return;

    start(async () => {
      try {
        const filas = validas.map((v) => v.fila as Parameters<typeof cargarClientesMasivo>[0][number]);
        const resultado = await cargarClientesMasivo(filas);
        if (resultado.fallidos > 0) {
          toast.error(
            `${resultado.fallidos} fallidos: ${resultado.errores
              .slice(0, 2)
              .map((e) => e.mensaje)
              .join("; ")}`
          );
        }
        if (resultado.insertados > 0 || resultado.actualizados > 0) {
          toast.success(
            `✓ ${resultado.insertados} nuevos, ${resultado.actualizados} actualizados`
          );
          router.push("/clientes");
        }
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Error al cargar");
      }
    });
  }

  return (
    <div className="space-y-6">
      <Card className="p-4 md:p-6">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-full bg-[var(--primary)] text-white flex items-center justify-center font-bold shrink-0">
            1
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold mb-1">Descarga la plantilla CSV</h3>
            <p className="text-sm text-[var(--muted-foreground)] mb-3">
              Plantilla con 3 ejemplos. Ábrela en Excel o Google Sheets.
            </p>
            <Button variant="outline" onClick={descargarPlantilla}>
              <Download size={16} /> Descargar plantilla
            </Button>
          </div>
        </div>
      </Card>

      <Card className="p-4 md:p-6">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-full bg-[var(--primary)] text-white flex items-center justify-center font-bold shrink-0">
            2
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold mb-1">Llena los clientes</h3>
            <p className="text-sm text-[var(--muted-foreground)] mb-3">
              Una fila por cliente. Reglas:
            </p>
            <ul className="text-sm space-y-1 text-[var(--muted-foreground)] list-disc list-inside ml-2">
              <li>
                <code className="bg-[var(--muted)] px-1 rounded text-xs">razon_social</code>:
                obligatorio
              </li>
              <li>
                <code className="bg-[var(--muted)] px-1 rounded text-xs">ruc</code>: opcional.
                Si lo pones, debe ser 11 dígitos. Si ya existe en BD, se{" "}
                <strong>actualiza</strong>; si no, se crea.
              </li>
              <li>
                <code className="bg-[var(--muted)] px-1 rounded text-xs">correo</code>:
                opcional. Si lo pones, debe ser un email válido.
              </li>
              <li>
                Otros campos (contacto, teléfono, dirección, notas): opcionales.
              </li>
            </ul>
            <p className="text-xs text-[var(--muted-foreground)] mt-3">
              💡 En Excel guarda como <strong>CSV UTF-8 (delimitado por comas)</strong>.
            </p>
          </div>
        </div>
      </Card>

      <Card className="p-4 md:p-6">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-full bg-[var(--primary)] text-white flex items-center justify-center font-bold shrink-0">
            3
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold mb-1">Sube tu CSV</h3>
            <input
              ref={inputRef}
              type="file"
              accept=".csv,text/csv"
              onChange={handleFile}
              className="block w-full text-sm file:mr-3 file:py-2 file:px-4 file:rounded-md file:border-0 file:font-semibold file:bg-[var(--secondary)] file:text-white file:cursor-pointer cursor-pointer"
            />
            {filename && (
              <p className="text-xs text-[var(--muted-foreground)] mt-2">
                Archivo: <span className="font-mono">{filename}</span>
              </p>
            )}
          </div>
        </div>
      </Card>

      {headersOk === false && (
        <Card className="p-4 md:p-6 border-l-4 border-l-[var(--destructive)]">
          <div className="flex items-start gap-3">
            <AlertCircle className="text-[var(--destructive)] shrink-0" size={20} />
            <div>
              <h3 className="font-semibold text-[var(--destructive)] mb-1">
                Encabezados no válidos
              </h3>
              <p className="text-sm">
                Usa la plantilla exacta. Encabezados esperados: ruc, razon_social, contacto,
                telefono, correo, direccion, notas.
              </p>
            </div>
          </div>
        </Card>
      )}

      {(validas.length > 0 || conError.length > 0) && (
        <Card className="p-4 md:p-6">
          <div className="flex flex-wrap items-center gap-4 mb-4">
            <div className="flex items-center gap-2 text-green-700">
              <CheckCircle2 size={18} />
              <span className="font-semibold">{validas.length} válidas</span>
            </div>
            {conError.length > 0 && (
              <div className="flex items-center gap-2 text-[var(--destructive)]">
                <AlertCircle size={18} />
                <span className="font-semibold">{conError.length} con errores</span>
              </div>
            )}
            <Button variant="ghost" size="sm" onClick={limpiar}>
              Limpiar
            </Button>
          </div>

          {conError.length > 0 && (
            <div className="mb-4">
              <h4 className="text-sm font-semibold mb-2 text-[var(--destructive)]">
                Filas con error:
              </h4>
              <div className="border rounded-md overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs min-w-[500px]">
                    <thead className="bg-red-50 text-left">
                      <tr>
                        <th className="px-3 py-2 font-semibold">Línea</th>
                        <th className="px-3 py-2 font-semibold">RUC</th>
                        <th className="px-3 py-2 font-semibold">Razón social</th>
                        <th className="px-3 py-2 font-semibold">Errores</th>
                      </tr>
                    </thead>
                    <tbody>
                      {conError.map((v) => (
                        <tr key={v.linea} className="border-t">
                          <td className="px-3 py-2 font-mono">{v.linea}</td>
                          <td className="px-3 py-2 font-mono">{v.fila.ruc || "—"}</td>
                          <td className="px-3 py-2">{v.fila.razon_social || "—"}</td>
                          <td className="px-3 py-2 text-[var(--destructive)]">
                            {v.errores.join("; ")}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {validas.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold mb-2 text-green-700">
                Primeras 10 válidas:
              </h4>
              <div className="border rounded-md overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs min-w-[640px]">
                    <thead className="bg-[var(--muted)] text-left">
                      <tr>
                        <th className="px-3 py-2 font-semibold">RUC</th>
                        <th className="px-3 py-2 font-semibold">Razón social</th>
                        <th className="px-3 py-2 font-semibold">Contacto</th>
                        <th className="px-3 py-2 font-semibold">Teléfono</th>
                      </tr>
                    </thead>
                    <tbody>
                      {validas.slice(0, 10).map((v) => (
                        <tr key={v.linea} className="border-t">
                          <td className="px-3 py-2 font-mono">{v.fila.ruc || "—"}</td>
                          <td className="px-3 py-2 font-medium">{v.fila.razon_social}</td>
                          <td className="px-3 py-2">{v.fila.contacto || "—"}</td>
                          <td className="px-3 py-2">{v.fila.telefono || "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {validas.length > 10 && (
                  <div className="px-3 py-2 text-xs text-[var(--muted-foreground)] bg-[var(--muted)] border-t">
                    + {validas.length - 10} más...
                  </div>
                )}
              </div>
            </div>
          )}
        </Card>
      )}

      <div className="flex flex-col-reverse sm:flex-row sm:justify-between gap-3">
        <Button
          variant="outline"
          onClick={() => router.push("/clientes")}
          className="justify-center"
        >
          <ArrowLeft size={16} /> Cancelar
        </Button>
        <Button
          onClick={confirmar}
          disabled={validas.length === 0 || pending}
          className="justify-center"
        >
          <Upload size={16} />
          {pending
            ? "Cargando..."
            : validas.length > 0
              ? `Confirmar carga de ${validas.length} clientes`
              : "Sube un archivo primero"}
        </Button>
      </div>
    </div>
  );
}
