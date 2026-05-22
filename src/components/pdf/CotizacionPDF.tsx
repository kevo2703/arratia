import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
} from "@react-pdf/renderer";
import type {
  Cotizacion,
  CotizacionItem,
  Cliente,
  EmpresaConfig,
} from "@/lib/supabase/types";

const styles = StyleSheet.create({
  page: {
    padding: 36,
    fontSize: 9,
    fontFamily: "Helvetica",
    color: "#0f172a",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingBottom: 12,
    borderBottomWidth: 2,
    borderBottomColor: "#ea580c",
    marginBottom: 18,
  },
  logo: { width: 90, height: 36, objectFit: "contain" },
  brandBlock: { width: "55%" },
  brandName: {
    fontSize: 22,
    fontFamily: "Helvetica-Bold",
    color: "#ea580c",
    letterSpacing: 2,
  },
  brandRazon: { fontSize: 8, color: "#475569", marginTop: 2 },
  brandLine: { fontSize: 8, color: "#64748b" },
  cotBox: {
    width: "40%",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    padding: 8,
    backgroundColor: "#f8fafc",
  },
  cotTitle: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    color: "#1e293b",
    marginBottom: 4,
  },
  cotRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 2 },
  cotLabel: { color: "#64748b" },
  cotValue: { fontFamily: "Helvetica-Bold" },
  sectionTitle: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: "#ea580c",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 4,
    marginTop: 12,
  },
  twoCols: { flexDirection: "row", gap: 12 },
  card: {
    flex: 1,
    backgroundColor: "#f8fafc",
    padding: 8,
    borderRadius: 3,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  cardLine: { marginBottom: 2 },
  cardLabel: { color: "#64748b", fontSize: 7 },
  cardValue: { fontFamily: "Helvetica-Bold", fontSize: 9 },
  table: { marginTop: 6 },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#1e293b",
    color: "#ffffff",
    paddingVertical: 5,
    paddingHorizontal: 4,
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 0.5,
    borderBottomColor: "#e2e8f0",
    paddingVertical: 5,
    paddingHorizontal: 4,
  },
  th: { fontSize: 8, fontFamily: "Helvetica-Bold" },
  td: { fontSize: 8 },
  colItem: { width: "5%" },
  colCodigo: { width: "12%" },
  colDesc: { width: "40%" },
  colCant: { width: "8%", textAlign: "right" },
  colUnid: { width: "7%", textAlign: "center" },
  colPrecio: { width: "12%", textAlign: "right" },
  colDesc2: { width: "6%", textAlign: "right" },
  colSubtotal: { width: "10%", textAlign: "right" },
  totalsBox: {
    alignSelf: "flex-end",
    width: 200,
    marginTop: 8,
    padding: 8,
    backgroundColor: "#f1f5f9",
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 2,
  },
  totalLabel: { color: "#64748b", fontSize: 9 },
  totalValue: { fontFamily: "Helvetica-Bold", fontSize: 9 },
  totalFinal: {
    borderTopWidth: 1,
    borderTopColor: "#0f172a",
    paddingTop: 4,
    marginTop: 4,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  totalFinalLabel: { fontFamily: "Helvetica-Bold", fontSize: 11, color: "#ea580c" },
  totalFinalValue: { fontFamily: "Helvetica-Bold", fontSize: 12, color: "#ea580c" },
  condiciones: {
    marginTop: 18,
    padding: 8,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    backgroundColor: "#fffbeb",
  },
  condTitle: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    marginBottom: 4,
    color: "#92400e",
  },
  condText: { fontSize: 8, color: "#334155", lineHeight: 1.4, marginBottom: 4 },
  footer: {
    position: "absolute",
    bottom: 24,
    left: 36,
    right: 36,
    flexDirection: "row",
    justifyContent: "space-between",
    fontSize: 7,
    color: "#94a3b8",
    borderTopWidth: 0.5,
    borderTopColor: "#e2e8f0",
    paddingTop: 6,
  },
});

function fm(value: number, currency: string) {
  const sym = currency === "PEN" ? "S/" : currency === "USD" ? "$" : currency;
  return `${sym} ${value.toLocaleString("es-PE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function formatFecha(date: string) {
  const d = new Date(date + "T12:00:00");
  return d.toLocaleDateString("es-PE", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

export function CotizacionPDF({
  cotizacion,
  items,
  cliente,
  empresa,
}: {
  cotizacion: Cotizacion;
  items: CotizacionItem[];
  cliente: Cliente;
  empresa: EmpresaConfig;
}) {
  const validUntil = new Date(cotizacion.fecha + "T12:00:00");
  validUntil.setDate(validUntil.getDate() + cotizacion.validez_dias);

  return (
    <Document
      title={`Cotización ${cotizacion.numero} — Arratia`}
      author={empresa.razon_social}
    >
      <Page size="A4" style={styles.page}>
        {/* CABECERA */}
        <View style={styles.header}>
          <View style={styles.brandBlock}>
            {empresa.logo_url ? (
              <Image src={empresa.logo_url} style={styles.logo} />
            ) : (
              <Text style={styles.brandName}>ARRATIA</Text>
            )}
            <Text style={styles.brandRazon}>{empresa.razon_social}</Text>
            {empresa.ruc && <Text style={styles.brandLine}>RUC: {empresa.ruc}</Text>}
            {empresa.direccion && <Text style={styles.brandLine}>{empresa.direccion}</Text>}
            {empresa.telefono && (
              <Text style={styles.brandLine}>Tel: {empresa.telefono}</Text>
            )}
            {empresa.correo && (
              <Text style={styles.brandLine}>{empresa.correo}</Text>
            )}
          </View>
          <View style={styles.cotBox}>
            <Text style={styles.cotTitle}>COTIZACIÓN</Text>
            <View style={styles.cotRow}>
              <Text style={styles.cotLabel}>N°</Text>
              <Text style={styles.cotValue}>{cotizacion.numero}</Text>
            </View>
            <View style={styles.cotRow}>
              <Text style={styles.cotLabel}>Fecha</Text>
              <Text style={styles.cotValue}>{formatFecha(cotizacion.fecha)}</Text>
            </View>
            <View style={styles.cotRow}>
              <Text style={styles.cotLabel}>Válida hasta</Text>
              <Text style={styles.cotValue}>
                {validUntil.toLocaleDateString("es-PE", {
                  day: "2-digit",
                  month: "long",
                  year: "numeric",
                })}
              </Text>
            </View>
            <View style={styles.cotRow}>
              <Text style={styles.cotLabel}>Moneda</Text>
              <Text style={styles.cotValue}>{cotizacion.moneda}</Text>
            </View>
          </View>
        </View>

        {/* DATOS CLIENTE */}
        <Text style={styles.sectionTitle}>Cliente</Text>
        <View style={styles.twoCols}>
          <View style={styles.card}>
            <View style={styles.cardLine}>
              <Text style={styles.cardLabel}>Razón social</Text>
              <Text style={styles.cardValue}>{cliente.razon_social}</Text>
            </View>
            {cliente.ruc && (
              <View style={styles.cardLine}>
                <Text style={styles.cardLabel}>RUC</Text>
                <Text style={styles.cardValue}>{cliente.ruc}</Text>
              </View>
            )}
            {cliente.direccion && (
              <View style={styles.cardLine}>
                <Text style={styles.cardLabel}>Dirección</Text>
                <Text style={styles.cardValue}>{cliente.direccion}</Text>
              </View>
            )}
          </View>
          <View style={styles.card}>
            {cliente.contacto && (
              <View style={styles.cardLine}>
                <Text style={styles.cardLabel}>Atención</Text>
                <Text style={styles.cardValue}>{cliente.contacto}</Text>
              </View>
            )}
            {cliente.telefono && (
              <View style={styles.cardLine}>
                <Text style={styles.cardLabel}>Teléfono</Text>
                <Text style={styles.cardValue}>{cliente.telefono}</Text>
              </View>
            )}
            {cliente.correo && (
              <View style={styles.cardLine}>
                <Text style={styles.cardLabel}>Correo</Text>
                <Text style={styles.cardValue}>{cliente.correo}</Text>
              </View>
            )}
          </View>
        </View>

        {/* TABLA ITEMS */}
        <Text style={styles.sectionTitle}>Detalle de productos</Text>
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.th, styles.colItem]}>#</Text>
            <Text style={[styles.th, styles.colCodigo]}>Código</Text>
            <Text style={[styles.th, styles.colDesc]}>Descripción</Text>
            <Text style={[styles.th, styles.colCant]}>Cant.</Text>
            <Text style={[styles.th, styles.colUnid]}>Und</Text>
            <Text style={[styles.th, styles.colPrecio]}>P. Unit.</Text>
            <Text style={[styles.th, styles.colDesc2]}>Dscto</Text>
            <Text style={[styles.th, styles.colSubtotal]}>Subtotal</Text>
          </View>
          {items.map((it, idx) => (
            <View key={it.id} style={styles.tableRow} wrap={false}>
              <Text style={[styles.td, styles.colItem]}>{idx + 1}</Text>
              <Text style={[styles.td, styles.colCodigo]}>{it.codigo || "—"}</Text>
              <View style={styles.colDesc}>
                <Text style={[styles.td, { fontFamily: "Helvetica-Bold" }]}>
                  {it.nombre}
                </Text>
                {it.descripcion && (
                  <Text style={[styles.td, { color: "#64748b", fontSize: 7 }]}>
                    {it.descripcion}
                  </Text>
                )}
              </View>
              <Text style={[styles.td, styles.colCant]}>
                {Number(it.cantidad).toLocaleString("es-PE")}
              </Text>
              <Text style={[styles.td, styles.colUnid]}>{it.unidad}</Text>
              <Text style={[styles.td, styles.colPrecio]}>
                {fm(Number(it.precio_unitario), cotizacion.moneda)}
              </Text>
              <Text style={[styles.td, styles.colDesc2]}>
                {Number(it.descuento_pct) > 0
                  ? `${Number(it.descuento_pct).toFixed(1)}%`
                  : "—"}
              </Text>
              <Text
                style={[
                  styles.td,
                  styles.colSubtotal,
                  { fontFamily: "Helvetica-Bold" },
                ]}
              >
                {fm(Number(it.subtotal), cotizacion.moneda)}
              </Text>
            </View>
          ))}
        </View>

        {/* TOTALES */}
        <View style={styles.totalsBox}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Subtotal</Text>
            <Text style={styles.totalValue}>
              {fm(Number(cotizacion.subtotal), cotizacion.moneda)}
            </Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>IGV (18%)</Text>
            <Text style={styles.totalValue}>
              {fm(Number(cotizacion.igv), cotizacion.moneda)}
            </Text>
          </View>
          <View style={styles.totalFinal}>
            <Text style={styles.totalFinalLabel}>TOTAL</Text>
            <Text style={styles.totalFinalValue}>
              {fm(Number(cotizacion.total), cotizacion.moneda)}
            </Text>
          </View>
        </View>

        {/* CONDICIONES */}
        <View style={styles.condiciones}>
          <Text style={styles.condTitle}>FORMA DE PAGO</Text>
          <Text style={styles.condText}>{cotizacion.condiciones_pago || "—"}</Text>
          <Text style={styles.condTitle}>ENTREGA</Text>
          <Text style={styles.condText}>
            {cotizacion.condiciones_entrega || "—"}
          </Text>
          <Text style={styles.condTitle}>VALIDEZ</Text>
          <Text style={styles.condText}>
            Esta cotización es válida por {cotizacion.validez_dias} días desde la
            fecha de emisión. Precios sujetos a confirmación de stock.
          </Text>
          {cotizacion.notas && (
            <>
              <Text style={styles.condTitle}>OBSERVACIONES</Text>
              <Text style={styles.condText}>{cotizacion.notas}</Text>
            </>
          )}
          {(empresa.banco_bcp || empresa.banco_interbank || empresa.banco_bbva) && (
            <>
              <Text style={styles.condTitle}>CUENTAS BANCARIAS</Text>
              {empresa.banco_bcp && (
                <Text style={styles.condText}>BCP: {empresa.banco_bcp}</Text>
              )}
              {empresa.banco_interbank && (
                <Text style={styles.condText}>
                  Interbank: {empresa.banco_interbank}
                </Text>
              )}
              {empresa.banco_bbva && (
                <Text style={styles.condText}>BBVA: {empresa.banco_bbva}</Text>
              )}
              {empresa.cci && (
                <Text style={styles.condText}>CCI: {empresa.cci}</Text>
              )}
            </>
          )}
        </View>

        {/* FOOTER */}
        <View style={styles.footer} fixed>
          <Text>
            {empresa.razon_social}
            {empresa.ruc ? ` · RUC ${empresa.ruc}` : ""}
          </Text>
          <Text
            render={({ pageNumber, totalPages }) =>
              `${cotizacion.numero}  ·  pág. ${pageNumber} de ${totalPages}`
            }
          />
        </View>
      </Page>
    </Document>
  );
}
