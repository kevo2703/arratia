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

// =====================================================================
// CLIENTES
// =====================================================================

export const HEADERS_CLIENTES = [
  "ruc",
  "razon_social",
  "contacto",
  "telefono",
  "correo",
  "direccion",
  "notas",
];

export interface FilaCliente {
  ruc: string;
  razon_social: string;
  contacto: string;
  telefono: string;
  correo: string;
  direccion: string;
  notas: string;
}

export interface FilaClienteValidacion {
  linea: number;
  fila: Partial<FilaCliente>;
  errores: string[];
  ok: boolean;
}

export function generarPlantillaClientesCSV(): string {
  const ejemplos: FilaCliente[] = [
    {
      ruc: "20100123456",
      razon_social: "Constructora Andina S.A.C.",
      contacto: "Ing. Carlos Rojas",
      telefono: "+51 987 654 321",
      correo: "crojas@constructoraandina.pe",
      direccion: "Av. Javier Prado Este 1450, San Isidro, Lima",
      notas: "Cliente recurrente",
    },
    {
      ruc: "20200234567",
      razon_social: "Minera Sur Perú S.R.L.",
      contacto: "Patricia Mendoza",
      telefono: "+51 956 123 789",
      correo: "compras@minerasurperu.com",
      direccion: "Las Begonias 545, San Isidro, Lima",
      notas: "Crédito 30 días",
    },
    {
      ruc: "",
      razon_social: "Persona Natural Sin RUC",
      contacto: "Juan Pérez",
      telefono: "999888777",
      correo: "juan@ejemplo.com",
      direccion: "Av. Lima 123",
      notas: "Cliente individual",
    },
  ];

  const lineas = [HEADERS_CLIENTES.join(",")];
  for (const e of ejemplos) {
    lineas.push(
      [
        e.ruc,
        e.razon_social,
        e.contacto,
        e.telefono,
        e.correo,
        e.direccion,
        e.notas,
      ]
        .map(escapeCsvField)
        .join(",")
    );
  }
  return "﻿" + lineas.join("\r\n") + "\r\n";
}

export function validarFilasClientes(rows: string[][]): {
  validas: FilaClienteValidacion[];
  conError: FilaClienteValidacion[];
  headersOk: boolean;
} {
  if (rows.length === 0) return { validas: [], conError: [], headersOk: false };

  const headers = rows[0].map((h) => h.trim().toLowerCase());
  const headersOk = HEADERS_CLIENTES.every((h) => headers.includes(h));
  if (!headersOk) return { validas: [], conError: [], headersOk: false };

  const idx = (col: string) => headers.indexOf(col);
  const I = {
    ruc: idx("ruc"),
    razon_social: idx("razon_social"),
    contacto: idx("contacto"),
    telefono: idx("telefono"),
    correo: idx("correo"),
    direccion: idx("direccion"),
    notas: idx("notas"),
  };

  const validas: FilaClienteValidacion[] = [];
  const conError: FilaClienteValidacion[] = [];
  const rucsVistos = new Set<string>();
  const razonesVistas = new Set<string>();

  for (let r = 1; r < rows.length; r++) {
    const row = rows[r];
    const errores: string[] = [];

    const ruc = (row[I.ruc] || "").trim();
    const razon_social = (row[I.razon_social] || "").trim();
    const contacto = (row[I.contacto] || "").trim();
    const telefono = (row[I.telefono] || "").trim();
    const correo = (row[I.correo] || "").trim();
    const direccion = (row[I.direccion] || "").trim();
    const notas = (row[I.notas] || "").trim();

    if (!razon_social) errores.push("razón social vacía");
    if (ruc && !/^\d{11}$/.test(ruc))
      errores.push(`RUC inválido "${ruc}" — debe ser 11 dígitos numéricos`);
    if (ruc && rucsVistos.has(ruc))
      errores.push(`RUC duplicado en la plantilla: ${ruc}`);
    if (!ruc && razon_social && razonesVistas.has(razon_social.toLowerCase()))
      errores.push(`razón social duplicada (y sin RUC): ${razon_social}`);
    if (correo && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo))
      errores.push(`correo inválido "${correo}"`);

    if (ruc) rucsVistos.add(ruc);
    if (razon_social) razonesVistas.add(razon_social.toLowerCase());

    const fila: Partial<FilaCliente> = {
      ruc,
      razon_social,
      contacto,
      telefono,
      correo,
      direccion,
      notas,
    };

    const v: FilaClienteValidacion = {
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

// =====================================================================
// COTIZACIONES — Cabeceras
// =====================================================================

const MONEDAS_VALIDAS = ["PEN", "USD"];
const ESTADOS_VALIDOS = ["borrador", "enviada", "aceptada", "rechazada", "expirada"];

export const HEADERS_COTIZACIONES = [
  "numero",
  "cliente_ruc",
  "fecha",
  "validez_dias",
  "moneda",
  "incluye_igv",
  "condiciones_pago",
  "condiciones_entrega",
  "notas",
  "estado",
];

export interface FilaCotizacion {
  numero: string;
  cliente_ruc: string;
  fecha: string; // YYYY-MM-DD
  validez_dias: number;
  moneda: string;
  incluye_igv: boolean;
  condiciones_pago: string;
  condiciones_entrega: string;
  notas: string;
  estado: string;
}

export interface FilaCotizacionValidacion {
  linea: number;
  fila: Partial<FilaCotizacion>;
  errores: string[];
  ok: boolean;
}

export function generarPlantillaCotizacionesCSV(): string {
  const ejemplos: FilaCotizacion[] = [
    {
      numero: "COT-2024-0001",
      cliente_ruc: "20100123456",
      fecha: "2024-11-15",
      validez_dias: 15,
      moneda: "PEN",
      incluye_igv: true,
      condiciones_pago: "Contado contra entrega",
      condiciones_entrega: "Lima Metropolitana 2-3 días útiles",
      notas: "Cotización histórica importada",
      estado: "aceptada",
    },
    {
      numero: "COT-2024-0002",
      cliente_ruc: "20200234567",
      fecha: "2024-12-10",
      validez_dias: 30,
      moneda: "PEN",
      incluye_igv: true,
      condiciones_pago: "Crédito 30 días con OC",
      condiciones_entrega: "Almacén faena minera",
      notas: "",
      estado: "rechazada",
    },
  ];

  const lineas = [HEADERS_COTIZACIONES.join(",")];
  for (const e of ejemplos) {
    lineas.push(
      [
        e.numero,
        e.cliente_ruc,
        e.fecha,
        e.validez_dias.toString(),
        e.moneda,
        e.incluye_igv ? "si" : "no",
        e.condiciones_pago,
        e.condiciones_entrega,
        e.notas,
        e.estado,
      ]
        .map(escapeCsvField)
        .join(",")
    );
  }
  return "﻿" + lineas.join("\r\n") + "\r\n";
}

export function validarFilasCotizaciones(rows: string[][]): {
  validas: FilaCotizacionValidacion[];
  conError: FilaCotizacionValidacion[];
  headersOk: boolean;
} {
  if (rows.length === 0) return { validas: [], conError: [], headersOk: false };

  const headers = rows[0].map((h) => h.trim().toLowerCase());
  const headersOk = HEADERS_COTIZACIONES.every((h) => headers.includes(h));
  if (!headersOk) return { validas: [], conError: [], headersOk: false };

  const idx = (col: string) => headers.indexOf(col);
  const I = {
    numero: idx("numero"),
    cliente_ruc: idx("cliente_ruc"),
    fecha: idx("fecha"),
    validez_dias: idx("validez_dias"),
    moneda: idx("moneda"),
    incluye_igv: idx("incluye_igv"),
    condiciones_pago: idx("condiciones_pago"),
    condiciones_entrega: idx("condiciones_entrega"),
    notas: idx("notas"),
    estado: idx("estado"),
  };

  const validas: FilaCotizacionValidacion[] = [];
  const conError: FilaCotizacionValidacion[] = [];
  const numerosVistos = new Set<string>();

  for (let r = 1; r < rows.length; r++) {
    const row = rows[r];
    const errores: string[] = [];

    const numero = (row[I.numero] || "").trim();
    const cliente_ruc = (row[I.cliente_ruc] || "").trim();
    const fecha = (row[I.fecha] || "").trim();
    const validezRaw = (row[I.validez_dias] || "15").trim();
    const moneda = (row[I.moneda] || "PEN").trim().toUpperCase();
    const incluyeIgvRaw = (row[I.incluye_igv] || "si").trim();
    const condiciones_pago = (row[I.condiciones_pago] || "").trim();
    const condiciones_entrega = (row[I.condiciones_entrega] || "").trim();
    const notas = (row[I.notas] || "").trim();
    const estado = (row[I.estado] || "borrador").trim().toLowerCase();

    if (!numero) errores.push("número vacío");
    if (numero && numerosVistos.has(numero))
      errores.push(`número duplicado: ${numero}`);
    numerosVistos.add(numero);

    if (!cliente_ruc) errores.push("cliente_ruc vacío");
    if (cliente_ruc && !/^\d{11}$/.test(cliente_ruc))
      errores.push(`cliente_ruc debe ser 11 dígitos: "${cliente_ruc}"`);

    if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha))
      errores.push(`fecha inválida "${fecha}" — usa formato YYYY-MM-DD`);

    const validez = parseInt(validezRaw);
    if (!Number.isFinite(validez) || validez < 1)
      errores.push(`validez_dias inválido "${validezRaw}"`);

    if (!MONEDAS_VALIDAS.includes(moneda))
      errores.push(`moneda inválida "${moneda}" — usa: ${MONEDAS_VALIDAS.join("/")}`);

    if (!ESTADOS_VALIDOS.includes(estado))
      errores.push(
        `estado inválido "${estado}" — usa: ${ESTADOS_VALIDOS.join("/")}`
      );

    const fila: Partial<FilaCotizacion> = {
      numero,
      cliente_ruc,
      fecha,
      validez_dias: validez,
      moneda,
      incluye_igv: parseBool(incluyeIgvRaw),
      condiciones_pago,
      condiciones_entrega,
      notas,
      estado,
    };

    const v: FilaCotizacionValidacion = {
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

// =====================================================================
// COTIZACIONES — Items
// =====================================================================

export const HEADERS_COTIZACION_ITEMS = [
  "numero_cotizacion",
  "codigo",
  "nombre",
  "descripcion",
  "unidad",
  "cantidad",
  "precio_unitario",
  "descuento_pct",
];

export interface FilaItemCotizacion {
  numero_cotizacion: string;
  codigo: string;
  nombre: string;
  descripcion: string;
  unidad: string;
  cantidad: number;
  precio_unitario: number;
  descuento_pct: number;
}

export interface FilaItemValidacion {
  linea: number;
  fila: Partial<FilaItemCotizacion>;
  errores: string[];
  ok: boolean;
}

export function generarPlantillaCotizacionItemsCSV(): string {
  const ejemplos: FilaItemCotizacion[] = [
    {
      numero_cotizacion: "COT-2024-0001",
      codigo: "CAS-001",
      nombre: "Casco de seguridad amarillo tipo I",
      descripcion: "ANSI Z89.1",
      unidad: "UND",
      cantidad: 50,
      precio_unitario: 18.5,
      descuento_pct: 0,
    },
    {
      numero_cotizacion: "COT-2024-0001",
      codigo: "GUA-001",
      nombre: "Guante de vaqueta reforzado",
      descripcion: "",
      unidad: "PAR",
      cantidad: 50,
      precio_unitario: 6.5,
      descuento_pct: 5,
    },
    {
      numero_cotizacion: "COT-2024-0002",
      codigo: "BOT-001",
      nombre: "Bota de seguridad punta acero",
      descripcion: "Talla 41-45",
      unidad: "PAR",
      cantidad: 30,
      precio_unitario: 95,
      descuento_pct: 0,
    },
  ];

  const lineas = [HEADERS_COTIZACION_ITEMS.join(",")];
  for (const e of ejemplos) {
    lineas.push(
      [
        e.numero_cotizacion,
        e.codigo,
        e.nombre,
        e.descripcion,
        e.unidad,
        e.cantidad.toString(),
        e.precio_unitario.toString(),
        e.descuento_pct.toString(),
      ]
        .map(escapeCsvField)
        .join(",")
    );
  }
  return "﻿" + lineas.join("\r\n") + "\r\n";
}

export function validarFilasCotizacionItems(rows: string[][]): {
  validas: FilaItemValidacion[];
  conError: FilaItemValidacion[];
  headersOk: boolean;
} {
  if (rows.length === 0) return { validas: [], conError: [], headersOk: false };

  const headers = rows[0].map((h) => h.trim().toLowerCase());
  const headersOk = HEADERS_COTIZACION_ITEMS.every((h) => headers.includes(h));
  if (!headersOk) return { validas: [], conError: [], headersOk: false };

  const idx = (col: string) => headers.indexOf(col);
  const I = {
    numero_cotizacion: idx("numero_cotizacion"),
    codigo: idx("codigo"),
    nombre: idx("nombre"),
    descripcion: idx("descripcion"),
    unidad: idx("unidad"),
    cantidad: idx("cantidad"),
    precio_unitario: idx("precio_unitario"),
    descuento_pct: idx("descuento_pct"),
  };

  const validas: FilaItemValidacion[] = [];
  const conError: FilaItemValidacion[] = [];

  for (let r = 1; r < rows.length; r++) {
    const row = rows[r];
    const errores: string[] = [];

    const numero_cotizacion = (row[I.numero_cotizacion] || "").trim();
    const codigo = (row[I.codigo] || "").trim();
    const nombre = (row[I.nombre] || "").trim();
    const descripcion = (row[I.descripcion] || "").trim();
    const unidadRaw = (row[I.unidad] || "UND").trim().toUpperCase();

    if (!numero_cotizacion) errores.push("numero_cotizacion vacío");
    if (!nombre) errores.push("nombre del ítem vacío");

    const unidad = UNIDADES_VALIDAS.includes(unidadRaw) ? unidadRaw : null;
    if (!unidad)
      errores.push(`unidad inválida "${unidadRaw}" — usa: ${UNIDADES_VALIDAS.join("/")}`);

    const cantidad = parseNum(row[I.cantidad] || "0");
    if (cantidad === null || cantidad <= 0)
      errores.push(`cantidad inválida (debe ser > 0): "${row[I.cantidad]}"`);

    const precio = parseNum(row[I.precio_unitario] || "0");
    if (precio === null || precio < 0)
      errores.push(`precio_unitario inválido: "${row[I.precio_unitario]}"`);

    const descuento = parseNum(row[I.descuento_pct] || "0");
    if (descuento === null || descuento < 0 || descuento > 100)
      errores.push(`descuento_pct fuera de rango 0-100: "${row[I.descuento_pct]}"`);

    const fila: Partial<FilaItemCotizacion> = {
      numero_cotizacion,
      codigo,
      nombre,
      descripcion,
      unidad: unidad || unidadRaw,
      cantidad: cantidad ?? 0,
      precio_unitario: precio ?? 0,
      descuento_pct: descuento ?? 0,
    };

    const v: FilaItemValidacion = {
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
