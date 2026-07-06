// =============================================================
// Cérebro de ROTEIRO DE VÍDEO (copy falada + legenda). NÃO renderiza pixel nem
// edita vídeo (isso é Fatia 4) — é o texto: o que falar, em blocos com tempo,
// gancho nos 3 primeiros segundos, + a legenda do post. Reaproveita as camadas
// de contexto de generate.ts (marca, produto, etapa do funil, exemplos aprovados)
// pra manter a mesma inteligência/estratégia.
// =============================================================
import { getAnthropic, MODEL_ESTRATEGIA } from './anthropic'
import type { Brand, Produto } from './data'
import {
  blocoMarca,
  blocoProduto,
  blocoExemplos,
  blocoEtapa,
  blocoEtapaOrganico,
  blocoInteligencia,
  diretrizOrganico,
  CTA_INSTRUCAO,
  type Atributos,
  type EtapaFunil,
  type ObjetivoPeca,
} from './generate'

// ---- Saída ----
export interface RoteiroBloco {
  tempo: string // ex.: "0-3s"
  papel: 'gancho' | 'desenvolvimento' | 'cta'
  fala: string // o que a pessoa FALA nesse trecho
}

export interface RoteiroSpec {
  duracao: string // duração estimada, ex.: "~30s"
  blocos: RoteiroBloco[]
  legenda: string
  hashtags: string[]
  atributos: Atributos
}

export interface RoteiroInput {
  produto?: Produto | null
  produto_id?: string | null
  cidade?: string | null
  briefing: string
  situacao?: string | null // cena/situação que o usuário tem em mente (opcional)
  ctaObjetivo?: string | null
  etapa?: EtapaFunil | null
  mostrarPreco?: boolean
  exemplosAprovados?: { gancho: string; legenda: string }[]
  inteligencia?: unknown | null // Camada 3: dossiê "voz do cliente" do CRM
  objetivo?: ObjetivoPeca | null // 'anuncio' (padrão) | 'organico'
}

// ---- Schema (structured output) ----
const ROTEIRO_SCHEMA: Record<string, unknown> = {
  type: 'object',
  additionalProperties: false,
  properties: {
    duracao: { type: 'string', description: 'Duração estimada do vídeo, ex.: "~30s".' },
    blocos: {
      type: 'array',
      description: 'Os blocos falados na ordem. O primeiro é o gancho; o último é o CTA.',
      items: {
        type: 'object',
        additionalProperties: false,
        properties: {
          tempo: { type: 'string', description: 'Janela de tempo, ex.: "0-3s", "4-12s".' },
          papel: { type: 'string', enum: ['gancho', 'desenvolvimento', 'cta'] },
          fala: { type: 'string', description: 'O que falar nesse trecho (fala natural, pt-BR falado).' },
        },
        required: ['tempo', 'papel', 'fala'],
      },
    },
    legenda: { type: 'string', description: 'Legenda do post/anúncio, com CTA ao final.' },
    hashtags: { type: 'array', items: { type: 'string' }, description: '3 a 6 hashtags relevantes.' },
    atributos: {
      type: 'object',
      additionalProperties: false,
      properties: {
        angulo: { type: 'string' },
        gancho: { type: 'string', description: 'A frase de gancho (resumo do que segura nos 3s).' },
        formato: { type: 'string', description: 'Sempre "reel".' },
        cta: { type: 'string' },
        oferta: { type: 'string' },
        categoria: { type: 'string', description: 'Framework de copy (dor_solucao, prova_social, ...).' },
      },
      required: ['angulo', 'gancho', 'formato', 'cta', 'oferta', 'categoria'],
    },
  },
  required: ['duracao', 'blocos', 'legenda', 'hashtags', 'atributos'],
}

function instrucaoSistema(organico: boolean): string {
  if (organico) {
    return [
      'Você é um CRIADOR DE CONTEÚDO (não um vendedor) que escreve roteiros de Reels ORGÂNICOS pra escola.',
      'Escreve roteiro FALADO: o que a pessoa diz na câmera, natural, humano, em pt-BR falado.',
      'Regras de ouro do orgânico:',
      '- O GANCHO (primeiros ~3s) prende por curiosidade, emoção, história ou valor — NUNCA por gancho de anúncio/venda.',
      '- Ritmo natural, frases curtas, uma ideia por bloco. 20-60s.',
      '- Entregue algo que valha assistir mesmo pra quem nunca vai comprar. Termine com um convite LEVE de relacionamento (ou sem CTA duro).',
      '- A LEGENDA complementa e aprofunda com a mesma voz humana — não é anúncio.',
      'Devolva SEMPRE no schema estruturado.',
    ].join('\n')
  }
  return [
    'Você é um ROTEIRISTA de vídeos curtos verticais (Reels/anúncios) e copywriter sênior de resposta direta.',
    'Escreve roteiro FALADO: o que a pessoa diz na câmera, natural, em pt-BR falado (não travado, não corporativo).',
    'Regras de ouro do vídeo:',
    '- O GANCHO (primeiros ~3s) é tudo: pare o scroll com uma frase que fala com o público certo e cria tensão/curiosidade. Nada de "fala galera", nada de aquecer devagar.',
    '- Ritmo rápido, frases curtas, uma ideia por bloco. 15-45s no total.',
    '- Termine com UM CTA claro e único.',
    '- A LEGENDA é copy de verdade (dor -> valor -> prova -> CTA), não um resumo do vídeo.',
    'Devolva SEMPRE no schema estruturado.',
  ].join('\n')
}

function mensagemUsuario(input: RoteiroInput): string {
  const organico = input.objetivo === 'organico'
  return [
    organico ? 'Crie um ROTEIRO de vídeo vertical curto (Reel) de CONTEÚDO ORGÂNICO.' : 'Crie um ROTEIRO de vídeo vertical curto (Reel) para ANÚNCIO.',
    organico ? diretrizOrganico() : '',
    input.etapa ? (organico ? blocoEtapaOrganico(input.etapa) : blocoEtapa(input.etapa)) : '',
    input.cidade ? `Cidade/turma alvo: ${input.cidade}.` : '',
    input.produto ? `Produto alvo: ${input.produto.nome} (veja "PRODUTO EM FOCO").` : '',
    organico
      ? 'CTA: apenas de RELACIONAMENTO (seguir, salvar, comentar, marcar alguém) ou sem chamada dura. NÃO mande pro site/inscrição/WhatsApp.'
      : input.ctaObjetivo
        ? `OBJETIVO DO CTA: leve a pessoa a ${CTA_INSTRUCAO[input.ctaObjetivo] ?? input.ctaObjetivo}.`
        : '',
    '',
    'BRIEFING:',
    input.briefing,
    '',
    input.situacao && input.situacao.trim()
      ? `CENA/SITUAÇÃO que o usuário tem pra gravar (o roteiro DEVE caber nisso): ${input.situacao.trim()}`
      : 'CENA: o usuário não descreveu — proponha um formato simples e realista de gravar (ex.: falando direto pra câmera). A fala tem que funcionar sozinha, sem depender de imagem específica.',
    '',
    `FORMATO DA SAÍDA: blocos falados com janela de tempo (o 1º é o gancho, o último é o ${organico ? 'convite leve/fecho' : 'CTA'}) + a legenda. NÃO descreva cenas/planos/edição — só a FALA e o tempo.`,
    input.mostrarPreco
      ? 'PREÇO: pode citar preço/valores se fizer sentido pra oferta.'
      : 'PREÇO: NÃO cite preço, valores, "R$" nem parcelas. Foque em valor, resultado e transformação.',
    'Preencha atributos.formato com "reel".',
  ]
    .filter(Boolean)
    .join('\n')
}

/** Gera o roteiro de vídeo a partir da marca + briefing. Não renderiza nem persiste. */
export async function gerarRoteiro(brand: Brand, input: RoteiroInput): Promise<RoteiroSpec> {
  const anthropic = getAnthropic()

  const system: { type: 'text'; text: string; cache_control?: { type: 'ephemeral' } }[] = [
    { type: 'text', text: instrucaoSistema(input.objetivo === 'organico') },
    { type: 'text', text: blocoMarca(brand), cache_control: { type: 'ephemeral' } },
  ]
  const prod = blocoProduto(input.produto)
  if (prod) system.push({ type: 'text', text: prod })
  const intel = blocoInteligencia(input.inteligencia)
  if (intel) system.push({ type: 'text', text: intel, cache_control: { type: 'ephemeral' } })
  const ex = blocoExemplos(input.exemplosAprovados)
  if (ex) system.push({ type: 'text', text: ex })

  const message = await anthropic.messages.create({
    model: MODEL_ESTRATEGIA,
    max_tokens: 4000,
    system,
    messages: [{ role: 'user', content: mensagemUsuario(input) }],
    output_config: { format: { type: 'json_schema', schema: ROTEIRO_SCHEMA } },
  })

  const textBlock = message.content.find((b) => b.type === 'text')
  if (!textBlock || textBlock.type !== 'text') {
    throw new Error('O roteirista não retornou conteúdo (possível refusal).')
  }
  return JSON.parse(textBlock.text) as RoteiroSpec
}
