// =============================================================
// Leitor de LISTA DE TURMAS. O usuário cola o texto cru que ele mesmo mantém
// (código + datas + horário + preço + professor + local, formatos ANL e FC).
// O modelo (Sonnet, structured output) transforma cada turma numa linha
// estruturada + um briefing pronto pra virar anúncio. Depois o front dispara
// 3 ângulos por turma no /api/generate. Não decide preço aqui — isso é o toggle
// mostrar_preco na hora de gerar (VISAO: preço é decisão do dono antes).
// =============================================================
import { getAnthropic, MODEL_CONVERSA } from './anthropic'
import type { Brand, Produto } from './data'

/** Uma turma lida da lista, pronta pra gerar. */
export interface TurmaLida {
  codigo: string // ex.: 'anllajeado072601' — vira âncora de utm/atribuição
  produto_codigo: string // 'ANL' | 'FC' | ... (casa com produtos.codigo)
  produto_nome: string // nome legível que o modelo inferiu
  cidade: string
  periodo: string // 'noite' | 'tarde' | 'manhã' | 'misto' | ''
  datas: string // legível: "23, 24 e 25 de julho"
  horario: string // "19h às 22h15"
  preco: string // "R$ 797,00" ou '' se não tiver
  professor: string
  local: string // sala/prédio/parceiro
  briefing: string // resumo pronto pra o copywriter/gerador usar
}

function hojeBR(): string {
  return new Intl.DateTimeFormat('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(new Date())
}

function sistema(brand: Brand, produtos: Produto[]): string {
  const catalogo = produtos
    .map((p) => `- ${p.codigo ?? '(sem código)'} → ${p.nome}`)
    .join('\n')

  return [
    `Você lê uma LISTA CRUA de turmas de um curso presencial e a estrutura. A escola é "${brand.nome}" (${brand.nicho}).`,
    `HOJE É: ${hojeBR()}. Estamos no BRASIL (Rio Grande do Sul). Use isso pra saber que datas são futuras.`,
    '',
    'PRODUTOS DA MARCA (case o prefixo do código com estes):',
    catalogo,
    '',
    'COMO LER O CÓDIGO DA TURMA (ex.: "anllajeado072601", "FCPORTOALEGRE082602"):',
    '- Prefixo = produto: "anl" → ANL (Anúncios para Negócios Locais), "fc" → FC (Formação Completa). Case-insensitive.',
    '- Depois vem a cidade grudada: lajeado, portoalegre, caxiasdosul, novohamburgo (às vezes escrito "novogamburgo"), santacruz.',
    '- Os dígitos são MMAA + sequência (ex.: "0826 01" = agosto/2026, turma 01). Não invente ano; se ambíguo, use o texto.',
    '',
    'REGRAS:',
    '- Uma entrada da saída = UMA turma (um bloco de código). Preserve o código EXATAMENTE como veio (minúsculas/maiúsculas incluídas).',
    '- ANL costuma ser workshop de ~3 dias. FC é a formação com 4 módulos (Estratégia Digital, Design Digital, Videomaker Mobile, Gestor de Tráfego), cada um com suas datas/professor — resuma as datas do módulo inicial ao final em "datas".',
    '- "cidade" em nome próprio legível (ex.: "Porto Alegre", "Novo Hamburgo", "Caxias do Sul", "Santa Cruz do Sul", "Lajeado").',
    '- "preco": só o que estiver escrito, formatado "R$ X,XX". Vazio se não houver. NÃO invente.',
    '- "professor"/"local": vazio se não constar. Não invente.',
    '- "briefing": 2-4 frases que um copywriter usaria pra criar o anúncio dessa turma. Inclua produto, cidade, datas, horário, período, professor e local quando existirem, e deixe claro que o objetivo é captar matrículas dessa turma específica. NÃO cite preço no briefing (a decisão de mostrar preço é feita depois).',
    '- Ignore linhas soltas de cabeçalho de cidade (ex.: "LAJEADO" sozinho) — elas só contextualizam as turmas seguintes.',
    '- Se algo estiver ilegível, faça o melhor palpite conservador; nunca fabrique datas/preços que não estão no texto.',
  ].join('\n')
}

const TURMAS_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['turmas'],
  properties: {
    turmas: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: [
          'codigo',
          'produto_codigo',
          'produto_nome',
          'cidade',
          'periodo',
          'datas',
          'horario',
          'preco',
          'professor',
          'local',
          'briefing',
        ],
        properties: {
          codigo: { type: 'string' },
          produto_codigo: { type: 'string', description: 'ANL, FC, etc. Vazio se não casar.' },
          produto_nome: { type: 'string' },
          cidade: { type: 'string' },
          periodo: { type: 'string' },
          datas: { type: 'string' },
          horario: { type: 'string' },
          preco: { type: 'string' },
          professor: { type: 'string' },
          local: { type: 'string' },
          briefing: { type: 'string' },
        },
      },
    },
  },
} as const

/** Lê o texto cru e devolve as turmas estruturadas. */
export async function lerTurmas(
  brand: Brand,
  produtos: Produto[],
  texto: string,
): Promise<TurmaLida[]> {
  const anthropic = getAnthropic()

  const message = await anthropic.messages.create({
    model: MODEL_CONVERSA,
    max_tokens: 8000,
    system: [{ type: 'text', text: sistema(brand, produtos) }],
    messages: [
      {
        role: 'user',
        content: `Estruture esta lista de turmas:\n\n${texto}`,
      },
    ],
    output_config: { format: { type: 'json_schema', schema: TURMAS_SCHEMA } },
  })

  const textBlock = message.content.find((b) => b.type === 'text')
  if (!textBlock || textBlock.type !== 'text') {
    throw new Error('O leitor não retornou conteúdo (possível refusal).')
  }
  const parsed = JSON.parse(textBlock.text) as { turmas: TurmaLida[] }
  return parsed.turmas ?? []
}
