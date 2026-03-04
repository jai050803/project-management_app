create table if not exists public.projects (
  id text primary key,
  name text not null,
  code text not null unique,
  created_at timestamptz not null default now()
);

create table if not exists public.members (
  id text primary key,
  name text not null,
  created_at timestamptz not null default now(),
  project_id text not null references public.projects(id) on delete cascade
);

create table if not exists public.tasks (
  id text primary key,
  title text not null,
  description text not null,
  status text not null check (status in ('TODO','IN_PROGRESS','BLOCKED','DONE')) default 'TODO',
  priority text not null check (priority in ('LOW','MEDIUM','HIGH','CRITICAL')) default 'MEDIUM',
  progress integer not null default 0 check (progress >= 0 and progress <= 100),
  deadline timestamptz null,
  notes text not null default '',
  dependencies text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  project_id text not null references public.projects(id) on delete cascade,
  assignee_id text null references public.members(id) on delete set null
);

create table if not exists public.attachments (
  id text primary key,
  type text not null,
  name text not null,
  url text not null,
  created_at timestamptz not null default now(),
  task_id text not null references public.tasks(id) on delete cascade
);

create table if not exists public.task_updates (
  id text primary key,
  author text not null,
  message text not null,
  created_at timestamptz not null default now(),
  task_id text not null references public.tasks(id) on delete cascade
);

alter table public.projects disable row level security;
alter table public.members disable row level security;
alter table public.tasks disable row level security;
alter table public.attachments disable row level security;
alter table public.task_updates disable row level security;

