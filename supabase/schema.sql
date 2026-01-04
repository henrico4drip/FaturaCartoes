-- Tables for transactions and payments
create table if not exists public.transacoes (
  id bigint generated always as identity primary key,
  data date not null,
  descricao text not null,
  valor numeric(12,2) not null,
  parcela_atual int,
  parcela_total int,
  hash_unico text,
  fatura_mes_ref char(7) not null, -- YYYY-MM
  dono text check (dono in ('eu','dinda','pendente')) default 'pendente',
  categoria text,
  created_at timestamp with time zone default now()
);

alter table public.transacoes drop constraint if exists transacoes_hash_unico;
drop index if exists transacoes_hash_unico_idx;
alter table public.transacoes add constraint transacoes_hash_unico unique (hash_unico);
create index if not exists transacoes_mes_idx on public.transacoes(fatura_mes_ref);
create index if not exists transacoes_data_idx on public.transacoes(data);

create table if not exists public.pagamentos (
  id bigint generated always as identity primary key,
  data date not null,
  valor numeric(12,2) not null,
  quem_pagou text check (quem_pagou in ('eu','dinda')) not null,
  mes_referencia char(7) not null,
  observacao text,
  created_at timestamp with time zone default now()
);

create index if not exists pagamentos_mes_idx on public.pagamentos(mes_referencia);
create index if not exists pagamentos_data_idx on public.pagamentos(data);

create table if not exists public.saques (
  id bigint generated always as identity primary key,
  data date not null,
  valor numeric(12,2) not null,
  quem_pagou text check (quem_pagou in ('eu','dinda')) not null,
  mes_referencia char(7) not null,
  observacao text,
  created_at timestamp with time zone default now()
);

create index if not exists saques_mes_idx on public.saques(mes_referencia);
create index if not exists saques_data_idx on public.saques(data);

create table if not exists public.fechamentos (
  id bigint generated always as identity primary key,
  mes char(7) not null,
  usuario text check (usuario in ('eu','dinda')) not null,
  saldo_final numeric(12,2) not null default 0,
  created_at timestamp with time zone default now()
);

create unique index if not exists fechamentos_unq on public.fechamentos(mes, usuario);

create table if not exists public.regras_classificacao (
  id bigint generated always as identity primary key,
  descricao_padrao text not null,
  dono_sugerido text check (dono_sugerido in ('eu','dinda','pendente')) default 'pendente',
  categoria text,
  created_at timestamp with time zone default now()
);

-- New Table for Invoice Metadata (Due Date)
create table if not exists public.faturas (
  mes_referencia char(7) primary key,
  data_vencimento date,
  status text default 'aberta',
  created_at timestamp with time zone default now()
);

-- RLS
alter table public.transacoes enable row level security;
alter table public.pagamentos enable row level security;
alter table public.saques enable row level security;
alter table public.fechamentos enable row level security;
alter table public.regras_classificacao enable row level security;
alter table public.faturas enable row level security;

drop policy if exists "read all" on public.transacoes;
drop policy if exists "insert all" on public.transacoes;
drop policy if exists "update all" on public.transacoes;
drop policy if exists "delete all" on public.transacoes;
create policy "read all" on public.transacoes for select using (true);
create policy "insert all" on public.transacoes for insert with check (true);
create policy "update all" on public.transacoes for update using (true);
create policy "delete all" on public.transacoes for delete using (true);

drop policy if exists "read all" on public.pagamentos;
drop policy if exists "insert all" on public.pagamentos;
drop policy if exists "delete all" on public.pagamentos;
create policy "read all" on public.pagamentos for select using (true);
create policy "insert all" on public.pagamentos for insert with check (true);
create policy "delete all" on public.pagamentos for delete using (true);

drop policy if exists "read all" on public.saques;
drop policy if exists "insert all" on public.saques;
drop policy if exists "delete all" on public.saques;
create policy "read all" on public.saques for select using (true);
create policy "insert all" on public.saques for insert with check (true);
create policy "delete all" on public.saques for delete using (true);

drop policy if exists "read all" on public.fechamentos;
drop policy if exists "insert all" on public.fechamentos;
drop policy if exists "update all" on public.fechamentos;
create policy "read all" on public.fechamentos for select using (true);
create policy "insert all" on public.fechamentos for insert with check (true);
create policy "update all" on public.fechamentos for update using (true);

drop policy if exists "read all" on public.regras_classificacao;
drop policy if exists "insert all" on public.regras_classificacao;
create policy "read all" on public.regras_classificacao for select using (true);
create policy "insert all" on public.regras_classificacao for insert with check (true);

drop policy if exists "read all" on public.faturas;
drop policy if exists "insert all" on public.faturas;
drop policy if exists "update all" on public.faturas;
create policy "read all" on public.faturas for select using (true);
create policy "insert all" on public.faturas for insert with check (true);
create policy "update all" on public.faturas for update using (true);
