-- =============================================================
-- MeuEstagiario — Feedback / memória viva (VISAO §11 b, CLAUDE.md §12)
-- Rode no SQL Editor do Supabase, DEPOIS do 001.
-- Aprovar uma peça -> vira exemplo (few-shot das próximas). Rejeitar -> sinal negativo.
-- =============================================================

create table if not exists estagiario.approved_examples (
  id                uuid primary key default gen_random_uuid(),
  brand_id          uuid not null references estagiario.brands(id) on delete cascade,
  content_piece_id  uuid references estagiario.content_pieces(id) on delete cascade,
  tipo              text,
  atributos         jsonb not null default '{}'::jsonb,
  nota_curadoria    text,
  aprovado_em       timestamptz not null default now()
);

create index if not exists idx_approved_brand on estagiario.approved_examples (brand_id);
create index if not exists idx_approved_piece on estagiario.approved_examples (content_piece_id);

-- Rejeição: motivo fica na própria peça (status já existe em content_pieces).
alter table estagiario.content_pieces add column if not exists motivo text;

-- Confira:
-- select id, status, motivo from estagiario.content_pieces order by criado_em desc limit 5;
-- select * from estagiario.approved_examples order by aprovado_em desc limit 5;
