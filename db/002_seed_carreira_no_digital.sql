-- =============================================================
-- Seed: marca "Carreira No Digital" (Fatia 1)
-- Rode no SQL Editor do Supabase, DEPOIS do 001_fatia1_schema.sql.
-- UUID fixo pra você usar como brand_id ao testar /api/generate.
-- Idempotente (upsert): pode rodar de novo sem duplicar.
--
-- >>> EDITE OS BLOCOS MARCADOS COM "TODO" antes de usar em produção <<<
--   - tokens_visuais: cores/fontes/logo REAIS da marca
--   - metodo: o texto do método da escola (Camada 2 do prompt)
-- =============================================================

insert into estagiario.brands (
  id, nome, nicho, oferta, publico, tom,
  provas, objecoes, exemplos_vencedores,
  tokens_visuais, regras_design, metodo
) values (
  'a1111111-1111-4111-8111-111111111111',
  'Carreira No Digital',
  'Escola de marketing digital com cursos presenciais no RS',
  'Cursos presenciais em turmas por cidade: Formação Completa em Marketing Digital (FC), Anúncios para Negócios Locais (ANL), Imersão Mapa Digital, Imersão IA para Conteúdo.',
  'Donos de negócio local e pessoas querendo entrar no marketing digital, no interior e região metropolitana do RS (Porto Alegre, Novo Hamburgo, Canoas, Lajeado, Caxias do Sul, Santa Cruz do Sul).',
  'Prático, direto e próximo. Fala de resultado real e presencial, sem jargão. Valoriza a cidade e a comunidade local.',

  -- provas (jsonb) -- TODO: troque pelos números/depoimentos reais
  '[
    {"tipo": "depoimento", "texto": "Aluno dobrou os clientes do negócio local em 3 meses."},
    {"tipo": "presencial", "texto": "Turmas presenciais nas cidades do RS, com mentoria de perto."}
  ]'::jsonb,

  -- objecoes (jsonb) -- TODO: ajuste as objeções reais do público
  '[
    {"objecao": "É muito caro", "resposta": "Retorno vem do primeiro cliente que você fecha aplicando o método."},
    {"objecao": "Não tenho tempo", "resposta": "Aulas presenciais concentradas por turma, pensadas pra quem já toca um negócio."},
    {"objecao": "Não sei se funciona pra minha cidade", "resposta": "O método é focado em negócio local, testado nas cidades do RS."}
  ]'::jsonb,

  -- exemplos_vencedores: vazio no início; cresce com approved_examples
  '[]'::jsonb,

  -- tokens_visuais (jsonb) -- paleta REAL derivada do logo + anúncio da marca
  '{
    "cores": {
      "primaria": "#7A2BD4",
      "primaria_escura": "#3D1178",
      "destaque": "#6FE3A6",
      "creme": "#EAF7EC",
      "texto_claro": "#FFFFFF",
      "texto_escuro": "#262626",
      "barra": "#141414"
    },
    "fontes": {
      "titulo": "Anton",
      "corpo": "Poppins"
    },
    "logo": "https://SEU-BUCKET.supabase.co/storage/v1/object/public/estagiario-media/carreira-no-digital/logo.png",
    "logo_branco": "https://SEU-BUCKET.supabase.co/storage/v1/object/public/estagiario-media/carreira-no-digital/logo-branco.png",
    "espacamento": {"base": 48, "borda_card": 24}
  }'::jsonb,

  -- regras_design (jsonb) -- padrões escritos como dado (CLAUDE.md seção 12)
  '{
    "max_fontes": 2,
    "headline_max_palavras": 8,
    "logo": "canto",
    "contraste_mínimo": "AA"
  }'::jsonb,

  -- metodo (texto) -- TODO: cole aqui o método da escola (a Camada 2 que diferencia a saída)
  'PLACEHOLDER — cole aqui o método da Carreira No Digital: os passos/frameworks que a escola ensina (ex.: como estruturar um anúncio para negócio local, o passo a passo de captação, os ganchos que funcionam). Enquanto estiver em placeholder, o prompt cai em boas práticas genéricas de carrossel.'
)
on conflict (id) do update set
  nome = excluded.nome,
  nicho = excluded.nicho,
  oferta = excluded.oferta,
  publico = excluded.publico,
  tom = excluded.tom,
  provas = excluded.provas,
  objecoes = excluded.objecoes,
  exemplos_vencedores = excluded.exemplos_vencedores,
  tokens_visuais = excluded.tokens_visuais,
  regras_design = excluded.regras_design,
  metodo = excluded.metodo;

-- Confira:
-- select id, nome, metodo from estagiario.brands;
