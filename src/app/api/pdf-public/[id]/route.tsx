import { createClient } from "@supabase/supabase-js";
import { renderToBuffer } from "@react-pdf/renderer";
import { CotizacionPDF } from "@/components/pdf/CotizacionPDF";
import type {
  Cliente,
  Cotizacion,
  CotizacionItem,
  EmpresaConfig,
} from "@/lib/supabase/types";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = adminClient();

  const [cotRes, itemsRes, empresaRes] = await Promise.all([
    supabase
      .from("cotizaciones")
      .select("*, cliente:clientes(*)")
      .eq("id", id)
      .single(),
    supabase
      .from("cotizacion_items")
      .select("*")
      .eq("cotizacion_id", id)
      .order("orden"),
    supabase.from("empresa_config").select("*").limit(1).single(),
  ]);

  const cot = cotRes.data as unknown as (Cotizacion & { cliente: Cliente }) | null;
  const items = (itemsRes.data || []) as CotizacionItem[];
  const empresa = empresaRes.data as unknown as EmpresaConfig | null;

  if (!cot || !empresa) {
    return new Response("Cotización no encontrada", { status: 404 });
  }

  const pdfBuffer = await renderToBuffer(
    <CotizacionPDF
      cotizacion={cot}
      items={items}
      cliente={cot.cliente}
      empresa={empresa}
    />
  );

  return new Response(pdfBuffer as unknown as BodyInit, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${cot.numero}.pdf"`,
      "Cache-Control": "private, max-age=0, must-revalidate",
    },
  });
}
