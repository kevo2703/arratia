-- =====================================================================
-- MIGRACIÓN: Personalización de marca (logo + colores)
-- =====================================================================
-- Ejecutar DESPUÉS de SETUP.sql.
-- Idempotente. Agrega columnas de color + bucket de Storage para logos.
-- =====================================================================

-- 1. Columnas de color en empresa_config
alter table empresa_config
  add column if not exists color_primary text not null default '#ea580c',
  add column if not exists color_secondary text not null default '#1e293b';

-- 2. Bucket público para logos
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'logos',
  'logos',
  true,
  2097152, -- 2 MB
  array['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/svg+xml']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- 3. Políticas del bucket
-- Lectura pública (cualquiera puede ver el logo)
drop policy if exists "logos_public_read" on storage.objects;
create policy "logos_public_read" on storage.objects for select
  to public
  using (bucket_id = 'logos');

-- Usuarios autenticados pueden subir
drop policy if exists "logos_auth_upload" on storage.objects;
create policy "logos_auth_upload" on storage.objects for insert
  to authenticated
  with check (bucket_id = 'logos');

-- Usuarios autenticados pueden actualizar/reemplazar
drop policy if exists "logos_auth_update" on storage.objects;
create policy "logos_auth_update" on storage.objects for update
  to authenticated
  using (bucket_id = 'logos')
  with check (bucket_id = 'logos');

-- Usuarios autenticados pueden eliminar logos viejos
drop policy if exists "logos_auth_delete" on storage.objects;
create policy "logos_auth_delete" on storage.objects for delete
  to authenticated
  using (bucket_id = 'logos');

-- Verificación
select
  'color_primary' as columna,
  color_primary as valor
from empresa_config
union all
select 'color_secondary', color_secondary from empresa_config
union all
select 'bucket logos', case when exists (select 1 from storage.buckets where id = 'logos') then 'creado ✓' else 'falta' end;
