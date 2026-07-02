-- =============================================================
-- Seed: produtos da "Carreira No Digital" (Passo 1)
-- Rode DEPOIS do 003_produtos.sql. Idempotente por (brand_id, codigo).
-- >>> Os campos `metodo`, `oferta` e `meta` são PLACEHOLDER — edite pelo editor
--     de contexto (/contexto) ou aqui, com o método real de cada produto. <<<
-- =============================================================

insert into estagiario.produtos (brand_id, codigo, nome, metodo, oferta, publico, provas, objecoes, meta)
values
  (
    'a1111111-1111-4111-8111-111111111111', 'FC',
    'Formação Completa em Marketing Digital',
    'PLACEHOLDER — método específico da FC (passo a passo que a formação ensina).',
    'Curso presencial completo em turmas por cidade do RS.',
    'Quem quer entrar no marketing digital de forma completa, do zero ao avançado.',
    '[]'::jsonb, '[]'::jsonb,
    'Preencher meta de matrículas por turma.'
  ),
  (
    'a1111111-1111-4111-8111-111111111111', 'ANL',
    'Anúncios para Negócios Locais',
    'PLACEHOLDER — método específico de ANL (estruturar anúncio para negócio local).',
    'Curso presencial focado em anúncios que trazem clientes para o comércio local.',
    'Donos de negócio local que querem mais clientes com anúncios.',
    '[]'::jsonb, '[]'::jsonb,
    'Preencher meta de matrículas por turma.'
  ),
  (
    'a1111111-1111-4111-8111-111111111111', 'MAPA',
    'Imersão Mapa Digital',
    'PLACEHOLDER — método específico da Imersão Mapa Digital.',
    'Imersão presencial de posicionamento digital.',
    'Negócios que querem um mapa claro de presença digital.',
    '[]'::jsonb, '[]'::jsonb,
    'Preencher meta de matrículas.'
  ),
  (
    'a1111111-1111-4111-8111-111111111111', 'IA',
    'Imersão IA para Conteúdo',
    'PLACEHOLDER — método específico da Imersão IA para Conteúdo.',
    'Imersão presencial de uso de IA para produzir conteúdo.',
    'Quem quer usar IA para acelerar a produção de conteúdo do negócio.',
    '[]'::jsonb, '[]'::jsonb,
    'Preencher meta de matrículas.'
  )
on conflict (brand_id, codigo) where codigo is not null do update set
  nome = excluded.nome,
  oferta = excluded.oferta,
  publico = excluded.publico;
  -- NÃO sobrescreve metodo/provas/objecoes/meta em re-seed: preserva o que o curador editou.

-- Confira:
-- select codigo, nome, ativo from estagiario.produtos
--   where brand_id = 'a1111111-1111-4111-8111-111111111111' order by codigo;
