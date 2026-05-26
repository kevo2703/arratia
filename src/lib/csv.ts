// Utilidades CSV — sin dependencias externas.
// Soporta campos quoted ("campo, con coma"), comillas escapadas (""), BOM UTF-8 para Excel.

const UNIDADES_VALIDAS = ["UND", "PAR", "CJA", "PQT", "DOC", "MT", "KG", "LT"];

export const HEADERS_PLANTILLA = [
  "codigo",
  "nombre",
  "descripcion",
  "categoria",
  "marca",
  "unidad",
  "precio",
  "stock",
  "activo",
];

export interface FilaProducto {
  codigo: string;
  nombre: string;
  descripcion: string;
  categoria: string;
  marca: string;
  unidad: string;
  precio: number;
  stock: number;
  activo: boolean;
}

export interface FilaValidacion {
  linea: number; // 1-indexed (línea 2 = primera fila de datos, porque línea 1 es headers)
  fila: Partial<FilaProducto>;
  errores: string[];
  ok: boolean;
}

// ----------- GENERAR PLANTILLA -----------
export function generarPlantillaCSV(): string {
  const ejemplos: FilaProducto[] = [
    {
      codigo: "CAS-001",
      nombre: "Casco de seguridad amarillo tipo I",
      descripcion: "ANSI Z89.1, ajuste ratchet 4 puntos",
      categoria: "Protección de cabeza",
      marca: "Steelpro",
      unidad: "UND",
      precio: 18.5,
      stock: 50,
      activo: true,
    },
    {
      codigo: "GUA-001",
      nombre: 'Guante vaqueta 10"',
      descripcion: "Cuero vacuno, palma reforzada",
      categoria: "Protección de manos",
      marca: "Vicsa",
      unidad: "PAR",
      precio: 6.5,
      stock: 200,
      activo: true,
    },
    {
      codigo: "BOT-001",
      nombre: "Bota seguridad punta acero",
      descripcion: "Suela poliuretano antideslizante, talla 41-45",
      categoria: "Protección de pies",
      marca: "Steelpro Maraisa",
      unidad: "PAR",
      precio: 95,
      stock: 30,
      activo: true,
    },
  ];

  const lineas = [HEADERS_PLANTILLA.join(",")];
  for (const e of ejemplos) {
    lineas.push(
      [
        e.codigo,
        e.nombre,
        e.descripcion,
        e.categoria,
        e.marca,
        e.unidad,
        e.precio.toString(),
        e.stock.toString(),
        e.activo ? "si" : "no",
      ]
        .map(escapeCsvField)
        .join(",")
    );
  }
  // BOM UTF-8 al inicio para que Excel respete acentos
  return "﻿" + lineas.join("\r\n") + "\r\n";
}

function escapeCsvField(value: string): string {
  if (value == null) return "";
  const s = String(value);
  if (s.includes(",") || s.includes('"') || s.includes("\n") || s.includes("\r")) {
    return '"' + s.replace(/"/g, '""') + '"';
  }
  return s;
}

// ----------- PARSEAR CSV -----------
// Parser simple que soporta quoted fields y comillas escapadas
export function parseCSV(text: string): string[][] {
  // Quitar BOM
  if (text.charCodeAt(0) === 0xfeff) text = text.slice(1);

  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;
  let i = 0;

  while (i < text.length) {
    const c = text[i];

    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i += 2;
        } else {
          inQuotes = false;
          i++;
        }
      } else {
        field += c;
        i++;
      }
    } else {
      if (c === '"') {
        inQuotes = true;
        i++;
      } else if (c === ",") {
        row.push(field);
        field = "";
        i++;
      } else if (c === "\r") {
        // ignora, se cierra con \n
        i++;
      } else if (c === "\n") {
        row.push(field);
        rows.push(row);
        row = [];
        field = "";
        i++;
      } else {
        field += c;
        i++;
      }
    }
  }
  // última fila si no terminó con \n
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  // limpiar filas completamente vacías
  return rows.filter((r) => r.some((c) => c.trim() !== ""));
}

// ----------- VALIDAR FILAS -----------
function parseBool(v: string): boolean {
  const s = (v || "").trim().toLowerCase();
  if (!s) return true; // default activo
  return ["si", "sí", "yes", "y", "true", "1", "x"].includes(s);
}

function parseNum(v: string): number | null {
  const s = (v || "").trim().replace(",", ".");
  if (s === "") return 0;
  const n = parseFloat(s);
  return Number.isFinite(n) ? n : null;
}

export function validarFilas(rows: string[][]): {
  validas: FilaValidacion[];
  conError: FilaValidacion[];
  headersOk: boolean;
} {
  if (rows.length === 0) {
    return { validas: [], conError: [], headersOk: false };
  }

  const headers = rows[0].map((h) => h.trim().toLowerCase());
  const headersOk = HEADERS_PLANTILLA.every((h) => headers.includes(h));
  if (!headersOk) return { validas: [], conError: [], headersOk: false };

  const idx = (col: string) => headers.indexOf(col);
  const I = {
    codigo: idx("codigo"),
    nombre: idx("nombre"),
    descripcion: idx("descripcion"),
    categoria: idx("categoria"),
    marca: idx("marca"),
    unidad: idx("unidad"),
    precio: idx("precio"),
    stock: idx("stock"),
    activo: idx("activo"),
  };

  const validas: FilaValidacion[] = [];
  const conError: FilaValidacion[] = [];
  const codigosVistos = new Set<string>();

  for (let r = 1; r < rows.length; r++) {
    const row = rows[r];
    const errores: string[] = [];

    const codigo = (row[I.codigo] || "").trim().toUpperCase();
    const nombre = (row[I.nombre] || "").trim();
    const descripcion = (row[I.descripcion] || "").trim();
    const categoria = (row[I.categoria] || "").trim();
    const marca = (row[I.marca] || "").trim();
    const unidadRaw = (row[I.unidad] || "UND").trim().toUpperCase();
    const precioRaw = row[I.precio] || "0";
    const stockRaw = row[I.stock] || "0";
    const activoRaw = row[I.activo] || "si";

    if (!codigo) errores.push("código vacío");
    if (!nombre) errores.push("nombre vacío");
    if (codigo && codigosVistos.has(codigo))
      errores.push(`código duplicado en la plantilla: ${codigo}`);
    codigosVistos.add(codigo);

    const unidad = UNIDADES_VALIDAS.includes(unidadRaw) ? unidadRaw : null;
    if (!unidad)
      errores.push(
        `unidad inválida "${unidadRaw}" — usa: ${UNIDADES_VALIDAS.join("/")}`
      );

    const precio = parseNum(precioRaw);
    if (precio === null || precio < 0)
      errores.push(`precio inválido "${precioRaw}"`);

    const stockNum = parseNum(stockRaw);
    const stock = stockNum === null ? 0 : Math.max(0, Math.floor(stockNum));

    const fila: Partial<FilaProducto> = {
      codigo,
      nombre,
      descripcion,
      categoria,
      marca,
      unidad: unidad || unidadRaw,
      precio: precio ?? 0,
      stock,
      activo: parseBool(activoRaw),
    };

    const v: FilaValidacion = {
      linea: r + 1,
      fila,
      errores,
      ok: errores.length === 0,
    };

    if (v.ok) validas.push(v);
    else conError.push(v);
  }

  return { validas, conError, headersOk };
}
