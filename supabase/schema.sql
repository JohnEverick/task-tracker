-- Focal — planned Supabase schema. NOT wired up yet: the POC stores data in localStorage.
-- Run this in the Supabase SQL editor once your project exists.

create type public.task_bucket as enum ('inbox', 'three', 'next', 'later', 'dropped', 'archived');

-- Projects ------------------------------------------------------------------
create table public.projects (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name        text not null check (char_length(name) between 1 and 80),
  color       text not null default '#5B6068',
  created_at  timestamptz not null default now()
);

-- Tasks ---------------------------------------------------------------------
create table public.tasks (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null default auth.uid() references auth.users (id) on delete cascade,
  project_id     uuid references public.projects (id) on delete set null,
  title          text not null check (char_length(title) between 1 and 280),
  why            text,
  estimate_mins  integer not null default 30 check (estimate_mins between 5 and 480),
  bucket         public.task_bucket not null default 'inbox',
  done           boolean not null default false,
  position       double precision not null default 0,
  source         text,
  created_at     timestamptz not null default now(),
  completed_at   timestamptz
);

create index tasks_user_bucket_position_idx on public.tasks (user_id, bucket, position);

-- Steps (checklist inside a task) ---------------------------------------------
create table public.task_steps (
  id        uuid primary key default gen_random_uuid(),
  task_id   uuid not null references public.tasks (id) on delete cascade,
  user_id   uuid not null default auth.uid() references auth.users (id) on delete cascade,
  text      text not null check (char_length(text) between 1 and 280),
  done      boolean not null default false,
  position  double precision not null default 0
);

create index task_steps_task_idx on public.task_steps (task_id, position);

-- The rule: at most three tasks in 'three' per user ---------------------------
create or replace function public.enforce_max_three()
returns trigger
language plpgsql
as $$
begin
  if new.bucket = 'three' and (tg_op = 'INSERT' or old.bucket is distinct from 'three') then
    if (
      select count(*) from public.tasks
      where user_id = new.user_id and bucket = 'three' and id <> new.id
    ) >= 3 then
      raise exception 'Only three priorities allowed. Swap one out first.'
        using errcode = 'check_violation';
    end if;
  end if;
  return new;
end;
$$;

create trigger tasks_max_three
  before insert or update of bucket on public.tasks
  for each row execute function public.enforce_max_three();

-- Swap a task into the three in one transaction (outgoing leaves first, so the
-- trigger never sees four). Call with supabase.rpc('swap_into_three', {...}).
create or replace function public.swap_into_three(incoming uuid, outgoing uuid)
returns void
language plpgsql
security invoker
as $$
declare
  slot      double precision;
  top_next  double precision;
begin
  select position into slot
  from public.tasks
  where id = outgoing and user_id = auth.uid() and bucket = 'three';

  if not found then
    raise exception 'Outgoing task is not in your three';
  end if;

  select coalesce(min(position), 0) - 1 into top_next
  from public.tasks
  where user_id = auth.uid() and bucket = 'next';

  update public.tasks set bucket = 'next', position = top_next
  where id = outgoing and user_id = auth.uid();

  update public.tasks set bucket = 'three', done = false, position = slot
  where id = incoming and user_id = auth.uid();
end;
$$;

-- Row level security: everyone sees only their own rows -----------------------
alter table public.projects   enable row level security;
alter table public.tasks      enable row level security;
alter table public.task_steps enable row level security;

create policy "Own projects" on public.projects
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "Own tasks" on public.tasks
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "Own steps" on public.task_steps
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());
