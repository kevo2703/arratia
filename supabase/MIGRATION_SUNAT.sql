-- =====================================================================
-- MIGRACIÓN: Datos SUNAT en clientes
-- =====================================================================
-- Ejecutar DESPUÉS de SETUP.sql.
-- Agrega columnas opcionales que se llenan automáticamente al consultar
-- el RUC en SUNAT vía apis.net.pe.
-- =====================================================================

alter table clientes
  add column if not exists estado text default '',         -- ACTIVO / SUSPENSION / BAJA
  add column if not exists condicion text default '',      -- HABIDO / NO HABIDO / etc.
  add column if not exists ubigeo text default '',         -- código departamento+provincia+distrito
  add column if not exists departamento text default '',
  add column if not exists provincia text default '',
  add column if not exists distrito text default '',
  add column if not exists sunat_consultado_en timestamptz;

-- Verificación
select column_name, data_type, column_default
from information_schema.columns
where table_name = 'clientes'
  and column_name in ('estado', 'condicion', 'ubigeo', 'departamento', 'provincia', 'distrito', 'sunat_consultado_en')
order by column_name;
