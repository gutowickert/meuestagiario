-- =============================================================
-- MeuEstagiario — Fatia 1 — Schema inicial
-- Rode este arquivo no SQL Editor do Supabase (mesmo projeto do CRM).
-- Cria o schema `estagiario` e as tabelas `brands` e `content_pieces`.
-- Não toca em nada do CRM (public.*).
-- =============================================================

create schema if not exists estagiario;

-- -------------------------------------------------------------
-- brands — perfil de marca (contexto que gera assertividade)
-- -------------------------------------------------------------
create table if not exists estagiario.brands (
  id                   uuid primary key default gen_random_uuid(),
  nome                 text not null,
  nicho                text,
  oferta               text,
  publico              text,
  tom                  text,
  provas               jsonb not null default '[]'::jsonb,
  objecoes             jsonb not null default '[]'::jsonb,
  exemplos_vencedores  jsonb not null default '[]'::jsonb,
  tokens_visuais       jsonb not null default '{}'::jsonb,  -- fonte única da verdade visual
  regras_design        jsonb not null default '{}'::jsonb,  -- ex.: "máx 2 fontes", "headline <= 8 palavras"
  metodo               text,                                -- método da escola (Camada 2 do prompt)
  criado_em            timestamptz not null default now(),
  atualizado_em        timestamptz not null default now()
);

-- -------------------------------------------------------------
-- content_pieces — cada peça gerada
-- content_id é o elo de atribuição: vira utm_content no anúncio
-- -------------------------------------------------------------
create table if not exists estagiario.content_pieces (
  id           uuid primary key default gen_random_uuid(),
  content_id   text not null unique,                        -- vira utm_content
  brand_id     uuid not null references estagiario.brands(id) on delete cascade,
  produto_id   text,                                        -- referencia produto do CRM (last-touch)
  turma_id     text,                                        -- referencia turma do CRM
  cidade       text,
  tipo         text not null
                 check (tipo in ('carrossel','anuncio_imagem','reel','organico')),
  spec         jsonb not null default '{}'::jsonb,          -- JSON estruturado devolvido pelo Claude
  atributos    jsonb not null default '{}'::jsonb,          -- angulo, gancho, formato, cta, oferta
  assets       jsonb not null default '{}'::jsonb,          -- URLs no Storage
  status       text not null default 'rascunho',
  criado_em    timestamptz not null default now()
);

-- Índices para a leitura de performance (JOIN por content_id) e filtros comuns
create index if not exists idx_content_pieces_content_id on estagiario.content_pieces (content_id);
create index if not exists idx_content_pieces_brand      on estagiario.content_pieces (brand_id);
create index if not exists idx_content_pieces_prod_cid   on estagiario.content_pieces (produto_id, cidade);

-- -------------------------------------------------------------
-- Trigger: mantém brands.atualizado_em em dia
-- -------------------------------------------------------------
create or replace function estagiario.set_atualizado_em()
returns trigger as $$
begin
  new.atualizado_em = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_brands_atualizado_em on estagiario.brands;
create trigger trg_brands_atualizado_em
  before update on estagiario.brands
  for each row execute function estagiario.set_atualizado_em();
