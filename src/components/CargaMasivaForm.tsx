"use client";

import { useState, useTransition, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Download, Upload, AlertCircle, CheckCircle2, ArrowLeft } from "lucide-react";
import { Card, Button } from "@/components/ui";
import {
  generarPlantillaCSV,
  parseCSV,
  validarFilas,
  type FilaValidacion,
} from "@/lib/csv";
import { cargarProductosMasivo } from "@/app/productos/actions";

export function CargaMasivaForm() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [pending, start] = useTransition();
  const [validas, setValidas] = useState<FilaValidacion[]>([]);
  const [conError, setConError] = useState<FilaValidacion[]>([]);
  const [headersOk, setHeadersOk] = useState<boolean | null>(null);
  const [filename, setFilename] = useState("");

  function descargarPlantilla() {
    const csv = generarPlantillaCSV();
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "plantilla-productos-arratia.csv";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("Plantilla descargada. Llénala en Excel y vuelve a subir.");
  }

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setFilename(file.name);

    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result || "");
      const rows = parseCSV(text);
      const { validas, conError, headersOk } = validarFilas(rows);
      setHeadersOk(headersOk);
      setValidas(validas);
      setConError(conError);

      if (!headersOk) {
        toast.error(
          "Los encabezados del CSV no coinciden con la plantilla. Descárgala de nuevo."
        );
      } else if (validas.length === 0 && conError.length === 0) {
        toast.warning("El archivo no tiene filas de datos.");
      } else {
        toast.success(
          `${validas.length} filas válidas, ${conError.length} con errores`
        );
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
        `Cargar ${validas.length} productos. Los códigos que ya existen serán actualizados. ¿Continuar?`
      )
    )
      return;

    start(async () => {
      try {
        const filas = validas.map((v) => v.fila as Parameters<typeof cargarProductosMasivo>[0][number]);
        const resultado = await cargarProductosMasivo(filas);
        if (resultado.fallidos > 0) {
          toast.error(
            `Error: ${resultado.errores.map((e) => e.mensaje).join(", ")}`
          );
        } else {
          toast.success(
            `✓ ${resultado.insertados} nuevos, ${resultado.actualizados} actualizados`
          );
          router.push("/productos");
        }
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Error al cargar");
      }
    });
  }

  return (
    <div className="space-y-6">
      {/* Paso 1: Descargar plantilla */}
      <Card className="p-4 md:p-6">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-full bg-[var(--primary)] text-white flex items-center justify-center font-bold shrink-0">
            1
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold mb-1">Descarga la plantilla CSV</h3>
            <p className="text-sm text-[var(--muted-foreground)] mb-3">
              Te descargas un archivo CSV con los encabezados y 3 productos de ejemplo. Lo
              abres en <strong>Excel</strong> o <strong>Google Sheets</strong> y reemplazas los
              ejemplos por tus productos reales.
            </p>
            <Button variant="outline" onClick={descargarPlantilla}>
              <Download size={16} /> Descargar plantilla
            </Button>
          </div>
        </div>
      </Card>

      {/* Paso 2: Llenar */}
      <Card className="p-4 md:p-6">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-full bg-[var(--primary)] text-white flex items-center justify-center font-bold shrink-0">
            2
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold mb-1">Llena los productos</h3>
            <p className="text-sm text-[var(--muted-foreground)] mb-3">
              Una fila por producto. Reglas importantes:
            </p>
            <ul className="text-sm space-y-1 text-[var(--muted-foreground)] list-disc list-inside ml-2">
              <li>
                <code className="bg-[var(--muted)] px-1 rounded text-xs">codigo</code>: único.
                Si ya existe, se actualiza el producto. Si no existe, se crea.
              </li>
              <li>
                <code className="bg-[var(--muted)] px-1 rounded text-xs">categoria</code>:
                nombre exacto. Ej: <em>Protección de cabeza</em>,{" "}
                <em>Protección de manos</em>, <em>Protección de pies</em>, etc. Si no
                coincide, queda sin categoría.
              </li>
              <li>
                <code className="bg-[var(--muted)] px-1 rounded text-xs">unidad</code>:
                UND, PAR, CJA, PQT, DOC, MT, KG, LT
              </li>
              <li>
                <code className="bg-[var(--muted)] px-1 rounded text-xs">precio</code>: en
                soles, sin IGV. Usa punto como decimal (ej: 18.50)
              </li>
              <li>
                <code className="bg-[var(--muted)] px-1 rounded text-xs">activo</code>: si /
                no (default si)
              </li>
            </ul>
            <p className="text-xs text-[var(--muted-foreground)] mt-3">
              💡 <strong>En Excel:</strong> Archivo → Guardar como → tipo{" "}
              <strong>"CSV UTF-8 (delimitado por comas)"</strong>.
            </p>
          </div>
        </div>
      </Card>

      {/* Paso 3: Subir */}
      <Card className="p-4 md:p-6">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-full bg-[var(--primary)] text-white flex items-center justify-center font-bold shrink-0">
            3
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold mb-1">Sube tu archivo CSV</h3>
            <p className="text-sm text-[var(--muted-foreground)] mb-3">
              Te mostraré una vista previa con las filas válidas y los errores antes de
              guardar nada.
            </p>
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

      {/* Preview */}
      {headersOk === false && (
        <Card className="p-4 md:p-6 border-l-4 border-l-[var(--destructive)]">
          <div className="flex items-start gap-3">
            <AlertCircle className="text-[var(--destructive)] shrink-0" size={20} />
            <div>
              <h3 className="font-semibold text-[var(--destructive)] mb-1">
                Encabezados no válidos
              </h3>
              <p className="text-sm">
                El archivo no tiene los encabezados esperados. Asegúrate de usar la plantilla
                exacta (botón de descarga arriba).
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
                Filas con error (no se cargarán):
              </h4>
              <div className="border rounded-md overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs min-w-[500px]">
                    <thead className="bg-red-50 text-left">
                      <tr>
                        <th className="px-3 py-2 font-semibold">Línea</th>
                        <th className="px-3 py-2 font-semibold">Código</th>
                        <th className="px-3 py-2 font-semibold">Nombre</th>
                        <th className="px-3 py-2 font-semibold">Errores</th>
                      </tr>
                    </thead>
                    <tbody>
                      {conError.map((v) => (
                        <tr key={v.linea} className="border-t">
                          <td className="px-3 py-2 font-mono">{v.linea}</td>
                          <td className="px-3 py-2 font-mono">{v.fila.codigo || "—"}</td>
                          <td className="px-3 py-2">{v.fila.nombre || "—"}</td>
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
                Primeras 10 filas válidas (preview):
              </h4>
              <div className="border rounded-md overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs min-w-[640px]">
                    <thead className="bg-[var(--muted)] text-left">
                      <tr>
                        <th className="px-3 py-2 font-semibold">Código</th>
                        <th className="px-3 py-2 font-semibold">Nombre</th>
                        <th className="px-3 py-2 font-semibold">Marca</th>
                        <th className="px-3 py-2 font-semibold">Und</th>
                        <th className="px-3 py-2 font-semibold text-right">Precio</th>
                        <th className="px-3 py-2 font-semibold text-right">Stock</th>
                      </tr>
                    </thead>
                    <tbody>
                      {validas.slice(0, 10).map((v) => (
                        <tr key={v.linea} className="border-t">
                          <td className="px-3 py-2 font-mono">{v.fila.codigo}</td>
                          <td className="px-3 py-2">{v.fila.nombre}</td>
                          <td className="px-3 py-2">{v.fila.marca}</td>
                          <td className="px-3 py-2">{v.fila.unidad}</td>
                          <td className="px-3 py-2 text-right font-mono">
                            S/ {(v.fila.precio || 0).toFixed(2)}
                          </td>
                          <td className="px-3 py-2 text-right">{v.fila.stock}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {validas.length > 10 && (
                  <div className="px-3 py-2 text-xs text-[var(--muted-foreground)] bg-[var(--muted)] border-t">
                    + {validas.length - 10} filas más...
                  </div>
                )}
              </div>
            </div>
          )}
        </Card>
      )}

      {/* Acciones finales */}
      <div className="flex flex-col-reverse sm:flex-row sm:justify-between gap-3">
        <Button
          variant="outline"
          onClick={() => router.push("/productos")}
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
              ? `Confirmar carga de ${validas.length} productos`
              : "Sube un archivo primero"}
        </Button>
      </div>
    </div>
  );
}
