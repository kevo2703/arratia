-- =====================================================================
-- ARRATIA COTIZADOR — Schema completo
-- =====================================================================
-- Ejecutar en Supabase SQL Editor de una vez. Idempotente.
-- =====================================================================

-- ----------- EXTENSIONES -----------
create extension if not exists "uuid-ossp";

-- ----------- 1. EMPRESA (config global, fila única) -----------
create table if not exists empresa_config (
  id uuid primary key default uuid_generate_v4(),
  razon_social text not null default 'Arratia E.I.R.L.',
  nombre_comercial text not null default 'Arratia',
  ruc text not null default '',
  direccion text default '',
  telefono text default '',
  correo text default '',
  whatsapp text default '',
  logo_url text default '',
  banco_bcp text default '',
  banco_interbank text default '',
  banco_bbva text default '',
  cci text default '',
  updated_at timestamptz default now()
);

-- Sembrar fila única si no existe
insert into empresa_config (razon_social, nombre_comercial)
select 'Arratia E.I.R.L.', 'Arratia'
where not exists (select 1 from empresa_config);

-- ----------- 2. CATEGORÍAS DE PRODUCTO -----------
create table if not exists categorias (
  id uuid primary key default uuid_generate_v4(),
  nombre text not null unique,
  orden int default 0,
  created_at timestamptz default now()
);

insert into categorias (nombre, orden) values
  ('Protección de cabeza', 10),
  ('Protección facial y visual', 20),
  ('Protección auditiva', 30),
  ('Protección respiratoria', 40),
  ('Protección de manos', 50),
  ('Protección de pies', 60),
  ('Ropa de seguridad', 70),
  ('Protección anticaídas', 80),
  ('Señalización y emergencia', 90),
  ('Otros', 999)
on conflict (nombre) do nothing;

-- ----------- 3. PRODUCTOS -----------
create table if not exists productos (
  id uuid primary key default uuid_generate_v4(),
  codigo text not null unique,
  nombre text not null,
  descripcion text default '',
  categoria_id uuid references categorias(id) on delete set null,
  marca text default '',
  unidad text not null default 'UND',
  precio numeric(10, 2) not null default 0,
  stock int default 0,
  imagen_url text default '',
  activo boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_productos_codigo on productos (codigo);
create index if not exists idx_productos_categoria on productos (categoria_id);
create index if not exists idx_productos_activo on productos (activo);

-- ----------- 4. CLIENTES -----------
create table if not exists clientes (
  id uuid primary key default uuid_generate_v4(),
  ruc text default '',
  razon_social text not null,
  contacto text default '',
  telefono text default '',
  correo text default '',
  direccion text default '',
  notas text default '',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_clientes_razon_social on clientes (razon_social);
create index if not exists idx_clientes_ruc on clientes (ruc);

-- ----------- 5. COTIZACIONES -----------
-- numero formato: COT-YYYY-NNNN (autoincrementado por año)
create table if not exists cotizaciones (
  id uuid primary key default uuid_generate_v4(),
  numero text not null unique,
  cliente_id uuid not null references clientes(id) on delete restrict,
  fecha date not null default current_date,
  validez_dias int not null default 15,
  moneda text not null default 'PEN',
  incluye_igv boolean not null default true,
  subtotal numeric(12, 2) not null default 0,
  igv numeric(12, 2) not null default 0,
  total numeric(12, 2) not null default 0,
  condiciones_pago text default 'Contado contra entrega',
  condiciones_entrega text default 'Entrega en almacén Lima Metropolitana, 2-3 días útiles',
  notas text default '',
  estado text not null default 'borrador' check (estado in ('borrador', 'enviada', 'aceptada', 'rechazada', 'expirada')),
  pdf_url text default '',
  created_by uuid references auth.users(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_cotizaciones_cliente on cotizaciones (cliente_id);
create index if not exists idx_cotizaciones_fecha on cotizaciones (fecha desc);
create index if not exists idx_cotizaciones_estado on cotizaciones (estado);

-- ----------- 6. ITEMS DE COTIZACIÓN -----------
create table if not exists cotizacion_items (
  id uuid primary key default uuid_generate_v4(),
  cotizacion_id uuid not null references cotizaciones(id) on delete cascade,
  producto_id uuid references productos(id) on delete set null,
  codigo text not null,
  nombre text not null,
  descripcion text default '',
  unidad text not null default 'UND',
  cantidad numeric(10, 2) not null default 1,
  precio_unitario numeric(10, 2) not null default 0,
  descuento_pct numeric(5, 2) not null default 0,
  subtotal numeric(12, 2) not null default 0,
  orden int default 0,
  created_at timestamptz default now()
);

create index if not exists idx_items_cotizacion on cotizacion_items (cotizacion_id);

-- ----------- 7. FUNCIÓN: siguiente número de cotización -----------
create or replace function next_cotizacion_numero()
returns text
language plpgsql
as $$
declare
  v_year text := to_char(current_date, 'YYYY');
  v_next int;
begin
  select coalesce(max((regexp_match(numero, 'COT-' || v_year || '-(\d+)'))[1]::int), 0) + 1
    into v_next
  from cotizaciones
  where numero like 'COT-' || v_year || '-%';

  return 'COT-' || v_year || '-' || lpad(v_next::text, 4, '0');
end;
$$;

-- ----------- 8. RLS — Admin único (cualquier usuario autenticado tiene acceso total) -----------
alter table empresa_config enable row level security;
alter table categorias enable row level security;
alter table productos enable row level security;
alter table clientes enable row level security;
alter table cotizaciones enable row level security;
alter table cotizacion_items enable row level security;

drop policy if exists "auth_all_empresa" on empresa_config;
create policy "auth_all_empresa" on empresa_config for all to authenticated using (true) with check (true);

drop policy if exists "auth_all_categorias" on categorias;
create policy "auth_all_categorias" on categorias for all to authenticated using (true) with check (true);

drop policy if exists "auth_all_productos" on productos;
create policy "auth_all_productos" on productos for all to authenticated using (true) with check (true);

drop policy if exists "auth_all_clientes" on clientes;
create policy "auth_all_clientes" on clientes for all to authenticated using (true) with check (true);

drop policy if exists "auth_all_cotizaciones" on cotizaciones;
create policy "auth_all_cotizaciones" on cotizaciones for all to authenticated using (true) with check (true);

drop policy if exists "auth_all_items" on cotizacion_items;
create policy "auth_all_items" on cotizacion_items for all to authenticated using (true) with check (true);

-- Lectura pública opcional para PDFs (sólo si en el futuro quieres links de cotización compartibles sin login)
-- Por ahora cerrado.

-- ----------- 9. STORAGE BUCKET (logos + PDFs) -----------
-- Ejecutar manualmente en Supabase Storage si quieres adjuntos:
-- - bucket `arratia-public` con acceso público (logo empresa, PDFs de cotización)
-- - bucket `arratia-private` con acceso autenticado (catálogo interno)

-- =====================================================================
-- FIN SCHEMA
-- =====================================================================
