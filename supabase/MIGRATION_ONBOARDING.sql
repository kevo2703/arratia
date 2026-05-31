-- =====================================================================
-- MIGRACIÓN: Sistema de onboarding (tour interactivo + checklist + ayuda)
-- =====================================================================
-- Ejecutar DESPUÉS de SETUP.sql.
-- Una fila por usuario (FK a auth.users). Persistencia del tour, checklist
-- de primera cotización y tooltips descartados.
-- =====================================================================

create table if not exists user_onboarding (
  user_id uuid primary key references auth.users(id) on delete cascade,
  tour_completed boolean not null default false,
  tour_skipped_at timestamptz,
  first_quote_completed boolean not null default false,
  checklist_state jsonb not null default '{}'::jsonb,
  dismissed_hints jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table user_onboarding is 'Estado de onboarding por usuario. Decide si dispara tour, checklist o tooltips.';
comment on column user_onboarding.tour_completed is 'TRUE cuando completó los 5 pasos del tour o lo marcó como visto.';
comment on column user_onboarding.checklist_state is 'JSON {cliente: bool, items: bool, condiciones: bool, guardar: bool} para asistente primera cotización.';
comment on column user_onboarding.dismissed_hints is 'JSON [string] con IDs de tooltips/banners que el usuario cerró.';

-- RLS: cada usuario solo lee/escribe su propia fila
alter table user_onboarding enable row level security;

drop policy if exists "auth_own_read" on user_onboarding;
create policy "auth_own_read" on user_onboarding for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "auth_own_insert" on user_onboarding;
create policy "auth_own_insert" on user_onboarding for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "auth_own_update" on user_onboarding;
create policy "auth_own_update" on user_onboarding for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Verificación
select 'user_onboarding' as tabla, count(*) as filas from user_onboarding;
