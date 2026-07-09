-- Esquema de sincronización de Alimentos Vampíricos para Supabase.
-- Ejecuta este script en: Supabase → SQL Editor → New query → Run.
--
-- Modelo: sin cuentas visibles. Cada dispositivo usa "anonymous auth" (invisible
-- para el usuario) y se une a un HOGAR con una clave secreta. En el servidor solo
-- se guarda el hash de la clave. Los datos viven en una tabla genérica `documents`
-- (una fila por entidad) protegida por RLS y publicada en realtime.

create extension if not exists pgcrypto;

-- Hogares (solo el hash de la clave, nunca la clave en claro).
create table if not exists public.households (
  id uuid primary key default gen_random_uuid(),
  secret_hash text unique not null,
  created_at timestamptz not null default now()
);

-- Pertenencia de cada dispositivo (usuario anónimo) a un hogar.
create table if not exists public.memberships (
  household_id uuid not null references public.households(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (household_id, user_id)
);

-- Documentos: una fila por entidad (producto, categoría, receta, ...) como JSON.
create table if not exists public.documents (
  household_id uuid not null references public.households(id) on delete cascade,
  entity_type text not null,
  entity_id text not null,
  doc jsonb not null,
  updated_at bigint not null,
  revision int not null default 1,
  primary key (household_id, entity_type, entity_id)
);

alter table public.households enable row level security;
alter table public.memberships enable row level security;
alter table public.documents enable row level security;

-- households no tiene políticas: solo se accede vía la función join_household.

-- El usuario solo puede ver sus propias pertenencias.
drop policy if exists memberships_select_own on public.memberships;
create policy memberships_select_own on public.memberships
  for select using (user_id = auth.uid());

-- Acceso total a los documentos del hogar al que pertenece el usuario.
drop policy if exists documents_rw_own_household on public.documents;
create policy documents_rw_own_household on public.documents
  for all
  using (
    household_id in (select m.household_id from public.memberships m where m.user_id = auth.uid())
  )
  with check (
    household_id in (select m.household_id from public.memberships m where m.user_id = auth.uid())
  );

-- Une (o crea) un hogar a partir de la clave secreta y vincula al usuario actual.
-- SECURITY DEFINER: puede leer/crear en households (que está cerrado por RLS).
create or replace function public.join_household(secret text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  h_id uuid;
  h_hash text;
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;
  h_hash := encode(digest(secret, 'sha256'), 'hex');
  select id into h_id from public.households where secret_hash = h_hash;
  if h_id is null then
    insert into public.households (secret_hash) values (h_hash) returning id into h_id;
  end if;
  insert into public.memberships (household_id, user_id)
    values (h_id, auth.uid())
    on conflict do nothing;
  return h_id;
end;
$$;

grant execute on function public.join_household(text) to anon, authenticated;

-- Publica la tabla de documentos en realtime (para recibir cambios al instante).
alter publication supabase_realtime add table public.documents;

-- IMPORTANTE (una vez, en el panel):
--   Authentication → Providers → Anonymous sign-ins: ACTÍVALO.
