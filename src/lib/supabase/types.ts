export type EstadoCotizacion =
  | "borrador"
  | "enviada"
  | "aceptada"
  | "rechazada"
  | "expirada";

export interface EmpresaConfig {
  id: string;
  razon_social: string;
  nombre_comercial: string;
  ruc: string;
  direccion: string;
  telefono: string;
  correo: string;
  whatsapp: string;
  logo_url: string;
  color_primary: string;
  color_secondary: string;
  banco_bcp: string;
  banco_interbank: string;
  banco_bbva: string;
  cci: string;
  updated_at: string;
}

export interface Categoria {
  id: string;
  nombre: string;
  orden: number;
}

export interface Producto {
  id: string;
  codigo: string;
  nombre: string;
  descripcion: string;
  categoria_id: string | null;
  marca: string;
  unidad: string;
  precio: number;
  stock: number;
  imagen_url: string;
  activo: boolean;
  created_at: string;
  updated_at: string;
}

export interface Cliente {
  id: string;
  ruc: string;
  razon_social: string;
  contacto: string;
  telefono: string;
  correo: string;
  direccion: string;
  notas: string;
  estado: string;
  condicion: string;
  ubigeo: string;
  departamento: string;
  provincia: string;
  distrito: string;
  sunat_consultado_en: string | null;
  created_at: string;
  updated_at: string;
}

export interface CotizacionItem {
  id: string;
  cotizacion_id: string;
  producto_id: string | null;
  codigo: string;
  nombre: string;
  descripcion: string;
  unidad: string;
  cantidad: number;
  precio_unitario: number;
  descuento_pct: number;
  subtotal: number;
  orden: number;
}

export interface Cotizacion {
  id: string;
  numero: string;
  cliente_id: string;
  fecha: string;
  validez_dias: number;
  moneda: string;
  incluye_igv: boolean;
  subtotal: number;
  igv: number;
  total: number;
  condiciones_pago: string;
  condiciones_entrega: string;
  notas: string;
  estado: EstadoCotizacion;
  pdf_url: string;
  created_at: string;
  updated_at: string;
}

export interface CotizacionConCliente extends Cotizacion {
  cliente: Cliente;
  items: CotizacionItem[];
}

// Minimal DB type for Supabase typed clients
type TableDef<T> = {
  Row: T;
  Insert: Partial<T>;
  Update: Partial<T>;
  Relationships: [];
};

export type Database = {
  public: {
    Tables: {
      empresa_config: TableDef<EmpresaConfig>;
      categorias: TableDef<Categoria>;
      productos: TableDef<Producto>;
      clientes: TableDef<Cliente>;
      cotizaciones: TableDef<Cotizacion>;
      cotizacion_items: TableDef<CotizacionItem>;
    };
    Views: Record<string, never>;
    Functions: {
      next_cotizacion_numero: {
        Args: Record<string, never>;
        Returns: string;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
