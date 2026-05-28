// Endpoint server-side que consulta Decolecta (api.decolecta.com, empresa detrás de
// apis.net.pe) para obtener datos del RUC desde SUNAT.
// Frontend llama a este endpoint, no a Decolecta directamente, para que el token quede oculto.
//
// Configurar en .env.local y en Vercel:
//   SUNAT_API_TOKEN=sk_xxxxx.yyyy
//
// Sacar token en https://decolecta.com/profile/

import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

interface DecolectaResponse {
  numero_documento?: string;
  razon_social?: string;
  nombre_comercial?: string;
  estado?: string;
  condicion?: string;
  direccion?: string;
  ubigeo?: string;
  departamento?: string;
  provincia?: string;
  distrito?: string;
  tipo?: string;
  actividad_economica?: string;
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ ruc: string }> }
) {
  const { ruc } = await params;

  if (!/^\d{11}$/.test(ruc)) {
    return NextResponse.json(
      { error: "RUC inválido. Debe tener 11 dígitos numéricos." },
      { status: 400 }
    );
  }

  const token = process.env.SUNAT_API_TOKEN;
  if (!token) {
    return NextResponse.json(
      {
        error:
          "Falta configurar SUNAT_API_TOKEN. Obtén uno gratis en decolecta.com/profile.",
      },
      { status: 500 }
    );
  }

  const url = `https://api.decolecta.com/v1/sunat/ruc?numero=${ruc}`;

  try {
    const resp = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
      cache: "no-store",
      signal: AbortSignal.timeout(8000),
    });

    if (!resp.ok) {
      const text = await resp.text().catch(() => "");
      if (resp.status === 401) {
        return NextResponse.json(
          { error: "Token Decolecta inválido o expirado." },
          { status: 401 }
        );
      }
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
              "Límite de consultas alcanzado. Sube de plan en decolecta.com o intenta mañana.",
          },
          { status: 429 }
        );
      }
      return NextResponse.json(
        { error: `Error consultando SUNAT (${resp.status}): ${text}` },
        { status: 502 }
      );
    }

    const data = (await resp.json()) as DecolectaResponse;

    return NextResponse.json({
      ruc: data.numero_documento || ruc,
      razon_social: data.razon_social || "",
      nombre_comercial: data.nombre_comercial || "",
      estado: data.estado || "",
      condicion: data.condicion || "",
      direccion: data.direccion || "",
      ubigeo: data.ubigeo || "",
      departamento: data.departamento || "",
      provincia: data.provincia || "",
      distrito: data.distrito || "",
      tipo: data.tipo || "",
      actividad_economica: data.actividad_economica || "",
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Error desconocido";
    return NextResponse.json(
      { error: `No se pudo consultar SUNAT: ${msg}` },
      { status: 502 }
    );
  }
}
