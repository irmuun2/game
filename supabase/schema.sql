-- «Дэлхийн гадарга» тоглоом: Supabase өгөгдлийн сан ба хамгаалалтын дүрэм.
-- Supabase → SQL Editor → New query дээр энэ файлыг бүтнээр нь буулгаад Run дарна.

-- 1) Багш нар (админ). role = 'owner' (үүсгэгч) эсвэл 'admin'.
create table if not exists public.teachers (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null default 'admin' check (role in ('owner', 'admin')),
  created_at timestamptz not null default now()
);

-- 2) Тоглоомын бүх мэдээлэл: «цуглуулга/баримт» замтай JSON баримтууд.
--    players/<хэрэглэгч>  — сурагчийн бүрэн ахиц (хувийн)
--    board/<хэрэглэгч>    — нэр, аватар, оноо (өрсөлдөгчдийн самбар)
--    results/<хэрэглэгч>  — тоглолт бүрийн хариулт, алдаа (багшийн тайлан)
--    roomsby/<хэрэглэгч>  — тухайн хүний үүсгэсэн өрөөнүүд
--    approvals, staff, settings, admin — багшийн удирдлага
create table if not exists public.docs (
  path text primary key,
  col text not null,
  doc_id text not null,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  constraint docs_path_ok check (path = col || '/' || doc_id),
  constraint docs_col_ok check (col in ('players', 'board', 'results', 'roomsby', 'approvals', 'staff', 'settings', 'admin')),
  constraint docs_size_ok check (octet_length(data::text) < 262144)
);
create index if not exists docs_col_idx on public.docs (col);

-- Нэвтэрсэн хүн багш эсэх (дүрмүүдэд ашиглана).
create or replace function public.is_teacher() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.teachers where user_id = auth.uid());
$$;

-- 3) Хамгаалалтын дүрэм (Row Level Security)
alter table public.teachers enable row level security;
drop policy if exists teachers_read on public.teachers;
create policy teachers_read on public.teachers for select to authenticated
  using (user_id = auth.uid() or public.is_teacher());

alter table public.docs enable row level security;

-- Унших: самбар, өрөө, зөвшөөрөл, тохиргоог нэвтэрсэн хүн бүр; хувийн ахиц, тайланг зөвхөн өөрөө; бүгдийг багш.
drop policy if exists docs_read on public.docs;
create policy docs_read on public.docs for select to authenticated using (
  col in ('board', 'approvals', 'staff', 'roomsby', 'settings')
  or (col in ('players', 'results') and doc_id = auth.uid()::text)
  or public.is_teacher()
);

-- Бичих: сурагч зөвхөн өөрийн ахиц, самбар, тайлан, өрөөгөө; багш бүгдийг.
drop policy if exists docs_insert on public.docs;
create policy docs_insert on public.docs for insert to authenticated with check (
  (col in ('players', 'board', 'results', 'roomsby') and doc_id = auth.uid()::text)
  or public.is_teacher()
);
drop policy if exists docs_update on public.docs;
create policy docs_update on public.docs for update to authenticated
  using ((col in ('players', 'board', 'results', 'roomsby') and doc_id = auth.uid()::text) or public.is_teacher())
  with check ((col in ('players', 'board', 'results', 'roomsby') and doc_id = auth.uid()::text) or public.is_teacher());
drop policy if exists docs_delete on public.docs;
create policy docs_delete on public.docs for delete to authenticated
  using ((col in ('players', 'board', 'results', 'roomsby') and doc_id = auth.uid()::text) or public.is_teacher());

-- 4) Бусдын өөрчлөлтийг шууд харуулах (Realtime)
do $$ begin
  alter publication supabase_realtime add table public.docs;
exception when duplicate_object then null; end $$;

-- 5) Өөрийгөө үүсгэгч багш болгох: эхлээд сайтад имэйлээрээ нэвтэрч ороод, доорх мөрийг
--    өөрийн имэйлээр сольж тусад нь ажиллуулна.
-- insert into public.teachers (user_id, role)
--   select id, 'owner' from auth.users where email = 'таны@имэйл.mn'
--   on conflict (user_id) do update set role = excluded.role;
