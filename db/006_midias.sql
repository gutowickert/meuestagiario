-- =============================================================
-- MeuEstagiario — Repositório de mídias por praça (produto × cidade).
-- Rode no SQL Editor do Supabase, DEPOIS do 001.
-- Material bruto (fotos/vídeos) que a equipe sobe acompanhando a turma. Fica
-- organizado por produto+cidade (ex.: ANL Caxias) e ABASTECE a geração daquela
-- praça — o modelo usa essas fotos sem precisar re-subir.
-- =============================================================

create table if not exists estagiario.midias (
  id          uuid primary key default gen_random_uuid(),
  brand_id    uuid not null references estagiario.brands(id) on delete cascade,
  produto     text,                              -- código do produto (ex.: 'ANL') — casa com content_pieces.produto_id
  cidade      text,
  tipo        text not null default 'foto',      -- 'foto' | 'video'
  url         text not null,                     -- URL pública no Storage
  mime        text,
  nota        text,                              -- legenda/quem fez/contexto (opcional)
  criado_em   timestamptz not null default now()
);

-- Busca por praça (produto+cidade) — o eixo de organização.
create index if not exists idx_midias_praca on estagiario.midias (brand_id, produto, cidade);
create index if not exists idx_midias_brand on estagiario.midias (brand_id);

-- Confira:
-- select produto, cidade, tipo, count(*) from estagiario.midias group by 1,2,3 order by 1,2;
