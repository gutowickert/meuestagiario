-- =============================================================
-- MeuEstagiario — Passo 1 (modelo de contexto): tabela `produtos`
-- Rode no SQL Editor do Supabase, DEPOIS do 001_fatia1_schema.sql.
-- Cada produto tem SEU PRÓPRIO contexto (método, oferta, provas, objeções) —
-- é a base do anúncio (VISAO-PRODUTO.md §3). A marca continua sendo a base do orgânico.
-- Não toca em nada do CRM (public.*).
-- =============================================================

create table if not exists estagiario.produtos (
  id             uuid primary key default gen_random_uuid(),
  brand_id       uuid not null references estagiario.brands(id) on delete cascade,
  codigo         text,                                       -- ex.: 'ANL','FC' — casa com o CRM/utm; legível no relatório
  nome           text not null,
  metodo         text,                                       -- método próprio do produto (Camada 2 específica)
  oferta         text,
  publico        text,
  provas         jsonb not null default '[]'::jsonb,
  objecoes       jsonb not null default '[]'::jsonb,
  meta           text,                                       -- meta de matrículas / objetivo do produto
  ativo          boolean not null default true,
  criado_em      timestamptz not null default now(),
  atualizado_em  timestamptz not null default now()
);

create index if not exists idx_produtos_brand on estagiario.produtos (brand_id);
-- codigo único por marca (quando preenchido) — evita dois "ANL" na mesma marca
create unique index if not exists uq_produtos_brand_codigo
  on estagiario.produtos (brand_id, codigo)
  where codigo is not null;

-- Reaproveita o trigger de atualizado_em criado no 001.
drop trigger if exists trg_produtos_atualizado_em on estagiario.produtos;
create trigger trg_produtos_atualizado_em
  before update on estagiario.produtos
  for each row execute function estagiario.set_atualizado_em();
