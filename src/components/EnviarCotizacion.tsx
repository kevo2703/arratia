"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  MessageCircle,
  Mail,
  Download,
  ChevronDown,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { useTransition } from "react";
import { Button } from "@/components/ui";
import { formatMoney, formatDate, addDays } from "@/lib/utils";
import type {
  Cotizacion,
  Cliente,
  EmpresaConfig,
  EstadoCotizacion,
} from "@/lib/supabase/types";
import { cambiarEstado } from "@/app/cotizaciones/actions";

function normalizarTelefono(tel: string): string {
  const digits = tel.replace(/\D/g, "");
  if (!digits) return "";
  // Si no empieza con 51 y tiene 9 dígitos, asumimos Perú
  if (digits.length === 9 && digits.startsWith("9")) return "51" + digits;
  return digits;
}

export function EnviarCotizacion({
  cotizacion,
  cliente,
  empresa,
  pdfUrl,
}: {
  cotizacion: Cotizacion;
  cliente: Cliente;
  empresa: EmpresaConfig;
  pdfUrl: string;
}) {
  const [pending, start] = useTransition();
  const [showEstados, setShowEstados] = useState(false);

  const validUntil = addDays(
    new Date(cotizacion.fecha + "T12:00:00"),
    cotizacion.validez_dias
  );

  const mensaje = `Hola${cliente.contacto ? " " + cliente.contacto : ""}, te comparto la cotización ${cotizacion.numero} de ${empresa.nombre_comercial || "Arratia"}.

📄 Total: ${formatMoney(Number(cotizacion.total), cotizacion.moneda)} (incluye IGV)
📅 Validez: hasta ${formatDate(validUntil)}

Puedes ver el PDF aquí: ${pdfUrl}

Cualquier consulta estoy a tu disposición.

Saludos,
${empresa.nombre_comercial || "Arratia"}`;

  function enviarWhatsApp() {
    const telLimpio = normalizarTelefono(cliente.telefono);
    if (!telLimpio) {
      toast.error("Este cliente no tiene teléfono registrado");
      return;
    }
    const url = `https://wa.me/${telLimpio}?text=${encodeURIComponent(mensaje)}`;
    window.open(url, "_blank");
    marcarComoEnviada();
  }

  function enviarCorreo() {
    if (!cliente.correo) {
      toast.error("Este cliente no tiene correo registrado");
      return;
    }
    const subject = `Cotización ${cotizacion.numero} — ${empresa.nombre_comercial || "Arratia"}`;
    const body = mensaje;
    window.location.href = `mailto:${cliente.correo}?subject=${encodeURIComponent(
      subject
    )}&body=${encodeURIComponent(body)}`;
    marcarComoEnviada();
  }

  function descargarPDF() {
    window.open(pdfUrl, "_blank");
  }

  function copiarLink() {
    navigator.clipboard.writeText(pdfUrl);
    toast.success("Link copiado al portapapeles");
  }

  function marcarComoEnviada() {
    if (cotizacion.estado === "borrador") {
      start(async () => {
        try {
          await cambiarEstado(cotizacion.id, "enviada");
          toast.success("Marcada como enviada");
        } catch {
          // silent
        }
      });
    }
  }

  function cambiarA(estado: EstadoCotizacion) {
    setShowEstados(false);
    start(async () => {
      try {
        await cambiarEstado(cotizacion.id, estado);
        toast.success("Estado actualizado");
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Error");
      }
    });
  }

  return (
    <div className="flex flex-wrap gap-2 items-center no-print">
      <Button variant="primary" onClick={enviarWhatsApp} disabled={pending}>
        <MessageCircle size={16} /> Enviar por WhatsApp
      </Button>
      <Button variant="secondary" onClick={enviarCorreo} disabled={pending}>
        <Mail size={16} /> Enviar por correo
      </Button>
      <Button variant="outline" onClick={descargarPDF}>
        <Download size={16} /> Ver / Descargar PDF
      </Button>
      <Button variant="ghost" size="sm" onClick={copiarLink}>
        Copiar link
      </Button>

      <div className="relative ml-auto">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowEstados((v) => !v)}
        >
          Cambiar estado <ChevronDown size={14} />
        </Button>
        {showEstados && (
          <div className="absolute right-0 mt-1 bg-white border rounded-md shadow-lg w-44 z-10 py-1 text-sm">
            <button
              type="button"
              className="w-full text-left px-3 py-2 hover:bg-[var(--muted)]"
              onClick={() => cambiarA("borrador")}
            >
              📝 Borrador
            </button>
            <button
              type="button"
              className="w-full text-left px-3 py-2 hover:bg-[var(--muted)]"
              onClick={() => cambiarA("enviada")}
            >
              📤 Enviada
            </button>
            <button
              type="button"
              className="w-full text-left px-3 py-2 hover:bg-[var(--muted)] text-green-700"
              onClick={() => cambiarA("aceptada")}
            >
              <CheckCircle2 size={14} className="inline mr-1" /> Aceptada
            </button>
            <button
              type="button"
              className="w-full text-left px-3 py-2 hover:bg-[var(--muted)] text-red-700"
              onClick={() => cambiarA("rechazada")}
            >
              <XCircle size={14} className="inline mr-1" /> Rechazada
            </button>
            <button
              type="button"
              className="w-full text-left px-3 py-2 hover:bg-[var(--muted)] text-amber-700"
              onClick={() => cambiarA("expirada")}
            >
              ⏰ Expirada
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
