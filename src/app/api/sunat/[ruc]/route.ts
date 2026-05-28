// Endpoint server-side que consulta apis.net.pe para obtener datos del RUC desde SUNAT.
// Frontend llama a este endpoint, no a apis.net.pe directamente, para que el token quede oculto.
//
// Configurar en .env.local (opcional pero recomendado):
//   SUNAT_API_TOKEN=tu_token_de_apis.net.pe
//
// Sin token: ~10 consultas/día. Con token gratis (registro en apis.net.pe): 500/día.

import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

interface SunatResponseRaw {
  numeroDocumento?: string;
  razonSocial?: string;
  nombreComercial?: string;
  estado?: string;
  condicion?: string;
  direccion?: string;
  ubigeo?: string;
  departamento?: string;
  provincia?: string;
  distrito?: string;
  tipo?: string;
  actividadEconomica?: string;
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ ruc: string }> }
) {
  const { ruc } = await params;

  // Validación: RUC debe ser 11 dígitos
  if (!/^\d{11}$/.test(ruc)) {
    return NextResponse.json(
      { error: "RUC inválido. Debe tener 11 dígitos numéricos." },
      { status: 400 }
    );
  }

  const token = process.env.SUNAT_API_TOKEN;
  const url = `https://api.apis.net.pe/v2/sunat/ruc?numero=${ruc}`;

  try {
    const resp = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      // No cachear — datos pueden cambiar
      cache: "no-store",
      // Timeout corto para no colgar el form
      signal: AbortSignal.timeout(8000),
    });

    if (!resp.ok) {
      const text = await resp.text().catch(() => "");
      if (resp.status === 404) {
        return NextResponse.json(
          { error: "RUC no encontrado en SUNAT" },
          { status: 404 }
        );
      }
      if (resp.status === 429) {
        return NextResponse.json(
          {
            error:
              "Límite de consultas diarias alcanzado. Configura SUNAT_API_TOKEN o intenta mañana.",
          },
          { status: 429 }
        );
      }
      return NextResponse.json(
        { error: `Error consultando SUNAT (${resp.status}): ${text}` },
        { status: 502 }
      );
    }

    const data = (await resp.json()) as SunatResponseRaw;

    return NextResponse.json({
      ruc: data.numeroDocumento || ruc,
      razon_social: data.razonSocial || "",
      nombre_comercial: data.nombreComercial || "",
      estado: data.estado || "",
      condicion: data.condicion || "",
      direccion: data.direccion || "",
      ubigeo: data.ubigeo || "",
      departamento: data.departamento || "",
      provincia: data.provincia || "",
      distrito: data.distrito || "",
      tipo: data.tipo || "",
      actividad_economica: data.actividadEconomica || "",
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Error desconocido";
    return NextResponse.json(
      { error: `No se pudo consultar SUNAT: ${msg}` },
      { status: 502 }
    );
  }
}
