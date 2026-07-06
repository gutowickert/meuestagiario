// =============================================================
// O cérebro (Fatia 1): compõe as 3 camadas de contexto e chama o Claude
// com structured output pra devolver a `spec` do carrossel + atributos.
// CLAUDE.md seções 6 e 8.
// =============================================================
import { getAnthropic, MODEL_ESTRATEGIA } from './anthropic'
import type { Brand, Produto } from './data'
import { getFormato, getTipoAtivo, type FormatoId, type TipoPeca } from './formats'

// ---- Tipos da saída ----

export type PapelSlide = 'gancho' | 'desenvolvimento' | 'prova' | 'cta'

export interface Slide {
  ordem: number
  papel: PapelSlide
  titulo: string
  corpo: string
  topicos: string[] // se for lista/enumeração, cada item aqui; senão [] e usa corpo
  destaque: string // frase/estatística curta a realçar visualmente (vazio se não houver)
  foto_idx: number // índice da foto anexada a usar neste slide (-1 = sem foto)
  direcao_visual: string // instrução de imagem/layout pro template (não gera pixel)
}

export interface Atributos {
  angulo: string
  gancho: string
  formato: string
  cta: string
  oferta: string
  categoria: string // framework de copy usado (dor_solucao, prova_social, ...)
}

export interface Spec {
  legenda: string
  hashtags: string[]
  slides: Slide[]
  atributos: Atributos
}

export interface GerarInput {
  produto_id?: string | null
  produto?: Produto | null // contexto rico do produto (método/oferta/provas próprios)
  turma_id?: string | null
  cidade?: string | null
  briefing: string
  tipo: TipoPeca
  formato: FormatoId
  ctaObjetivo?: string | null // pra onde o CTA chama (whatsapp/site/inscricao/perfil/direct)
  exemplosAprovados?: { gancho: string; legenda: string }[] // few-shot da memória viva
  tendencia?: string | null // brief de newsjacking (surfar o que está em alta)
  fotos?: string[] // fotos reais anexadas (URLs) — o modelo VÊ e casa foto<->slide
  mostrarPreco?: boolean // se pode citar preço/valores na peça (padrão: NÃO)
  etapa?: EtapaFunil | null // onde no funil essa peça entra — muda a estratégia da copy
  inteligencia?: unknown | null // Camada 3: dossiê "voz do cliente" do CRM (produto×cidade)
  objetivo?: ObjetivoPeca | null // 'anuncio' (padrão) | 'organico' — muda tom, gancho e CTA
}

// ---- Etapa do funil (estratégia de campanha) ----
// A mesma turma pede peças diferentes conforme a temperatura do público:
// descoberta (frio) -> aquecimento (esquentar) -> remarketing (fechar).
export type EtapaFunil = 'descoberta' | 'aquecimento' | 'remarketing'

export const ETAPAS_FUNIL: Record<EtapaFunil, { nome: string; resumo: string }> = {
  descoberta: { nome: 'Descoberta', resumo: 'Público frio, primeiro impacto. Fala com o público-alvo e mostra o tema.' },
  aquecimento: { nome: 'Aquecimento', resumo: 'Já teve contato. Educa, prova, quebra objeção, mostra o método.' },
  remarketing: { nome: 'Remarketing', resumo: 'Já visitou/engajou. Urgência da turma, oferta e fechamento.' },
}

export function isEtapaValida(e: unknown): e is EtapaFunil {
  return e === 'descoberta' || e === 'aquecimento' || e === 'remarketing'
}

// Estratégia de copy por etapa — o coração do funil. Injetado no prompt de geração.
export function blocoEtapa(etapa: EtapaFunil): string {
  if (etapa === 'descoberta') {
    return [
      'ETAPA DO FUNIL: DESCOBERTA (topo — público FRIO, NÃO conhece a escola). É o PRIMEIRO IMPACTO.',
      '- A HEADLINE precisa fazer DUAS coisas em 1 segundo: (1) falar direto com o público-alvo — dono de negócio local / quem quer trabalhar com marketing digital no interior e região metropolitana do RS — e (2) deixar claro o ASSUNTO: anúncios / tráfego pago para negócios locais. A pessoa tem que pensar "isso é pra mim" e entender o tema na hora.',
      '- Promessa grande, concreta e crível (mais clientes e vendas para o negócio local; virar o profissional que faz isso). Fale a dor/desejo de quem ainda NÃO conhece a solução.',
      '- NÃO pressuponha que conhece a marca, o método ou a turma. NADA de "última turma", "poucas vagas", "garanta já" — é cedo demais e soa desesperado. CTA leve: chamar no WhatsApp pra entender / saber mais.',
      '- Prova e oferta entram só de leve, como reforço. O herói é o reconhecimento do público + o tema (anúncios pra negócio local).',
    ].join('\n')
  }
  if (etapa === 'aquecimento') {
    return [
      'ETAPA DO FUNIL: AQUECIMENTO (meio — já teve contato, precisa ESQUENTAR).',
      '- Objetivo: educar, provar e quebrar objeção antes de vender. Construir desejo e confiança.',
      '- Mostre COMO funciona, o MÉTODO da escola, resultados reais de alunos, por que presencial, por que na cidade dele. Conteúdo de VALOR, não oferta dura.',
      '- Ataque a objeção mais forte do público. CTA de consideração: ver como funciona, tirar dúvida no WhatsApp.',
    ].join('\n')
  }
  return [
    'ETAPA DO FUNIL: REMARKETING / FECHAMENTO (fundo — já visitou o site ou engajou, JÁ conhece a oferta).',
    '- Objetivo: FECHAR. Falar com quem já considerou e não deu o passo.',
    '- Urgência REAL e específica da turma: datas, cidade, vagas limitadas, começa em breve. Oferta clara. Quebre a ÚLTIMA objeção (tempo, dinheiro, medo de não dar conta).',
    '- Pode retomar o contato ("você viu a turma de {cidade} e ainda dá tempo"). CTA DIRETO e forte: garantir a vaga agora no WhatsApp.',
  ].join('\n')
}

// Objetivo da peça: ANÚNCIO (venda/resposta direta) ou ORGÂNICO (valor/conexão).
export type ObjetivoPeca = 'anuncio' | 'organico'

// Diretriz que transforma a peça em CONTEÚDO ORGÂNICO — muda tom, gancho e CTA.
export function diretrizOrganico(): string {
  return [
    'ESTA PEÇA É CONTEÚDO ORGÂNICO — NÃO é anúncio. O objetivo é gerar VALOR, conexão e autoridade; construir audiência e relação — NÃO vender direto.',
    '- PROIBIDO gancho de anúncio ("seu cliente está te procurando", "pare de perder vendas", "você paga e ninguém vem") e PROIBIDO oferta/urgência de venda ("garanta sua vaga", "últimas vagas", "acesse o site", "link na bio").',
    '- Fale como GENTE DE VERDADE / dono da escola: história, bastidores, celebração, ensino, opinião, prova contada como CASO/HISTÓRIA. Autêntico, caloroso, humano — não vendedor.',
    '- O GANCHO prende por curiosidade, emoção ou valor (não por dor de venda). Entregue algo que valha assistir/ler mesmo pra quem nunca vai comprar.',
    '- CTA é LEVE e de RELACIONAMENTO: seguir pra acompanhar, salvar, comentar, marcar alguém — ou nenhuma chamada dura. NUNCA mande pro site/inscrição/WhatsApp de venda.',
    '- Pode citar cursos/turmas com naturalidade (contexto da história), sem vender.',
  ].join('\n')
}

// Etapa do funil relida pra ORGÂNICO (sem a moldura de anúncio da blocoEtapa).
export function blocoEtapaOrganico(etapa: EtapaFunil): string {
  if (etapa === 'descoberta') {
    return 'ETAPA (orgânico): TOPO/DESCOBERTA — atrair gente nova com conteúdo que gera identificação, curiosidade ou valor rápido. Foco em alcance e primeira conexão. Zero venda.'
  }
  if (etapa === 'aquecimento') {
    return 'ETAPA (orgânico): MEIO/AQUECIMENTO — aprofundar relação: ensinar de verdade, mostrar o método e os bastidores, provar com casos reais contados como história. Constrói autoridade e desejo, ainda sem vender.'
  }
  return 'ETAPA (orgânico): FUNDO — raro no orgânico. Reforço leve: depoimento/prova forte ou um convite natural pra quem já acompanha. Nada de oferta agressiva.'
}

// Pra onde a chamada final leva — orienta a copy do CTA (evita retrabalho).
export const CTA_INSTRUCAO: Record<string, string> = {
  whatsapp: 'chamar no WhatsApp (ex.: "Chama no WhatsApp", "Manda um oi no zap")',
  site: 'acessar o site / link na bio (ex.: "Acesse o site", "Link na bio")',
  inscricao: 'se inscrever / garantir a vaga na turma (ex.: "Garanta sua vaga", "Inscreva-se")',
  perfil: 'seguir o perfil e ativar as notificações',
  direct: 'chamar no direct do Instagram (ex.: "Chama no direct")',
}

// ---- Schema do structured output ----
// Restrições dos structured outputs: todo objeto precisa de additionalProperties:false
// e required; nada de minItems/minLength (controlamos a contagem via prompt).

const SPEC_SCHEMA: Record<string, unknown> = {
  type: 'object',
  additionalProperties: false,
  properties: {
    legenda: { type: 'string', description: 'Legenda do post (caption), com CTA ao final.' },
    hashtags: { type: 'array', items: { type: 'string' }, description: '3 a 6 hashtags relevantes ao público/cidade.' },
    slides: {
      type: 'array',
      description: 'Slides na ordem de leitura.',
      items: {
        type: 'object',
        additionalProperties: false,
        properties: {
          ordem: { type: 'integer', description: 'Posição do slide (1 = primeiro).' },
          papel: { type: 'string', enum: ['gancho', 'desenvolvimento', 'prova', 'cta'] },
          titulo: { type: 'string', description: 'Headline curta do slide.' },
          corpo: { type: 'string', description: 'Texto de apoio em PROSA. Use quando NÃO for uma lista. Se preencher "topicos", deixe curto ou vazio.' },
          topicos: {
            type: 'array',
            items: { type: 'string' },
            description:
              'Se o slide for uma enumeração (ex.: "Dia 1: ...", "Dia 2: ...", passos, itens), coloque cada item como uma string curta AQUI (um por linha). Senão, array vazio []. Não repita isso no corpo.',
          },
          destaque: {
            type: 'string',
            description:
              'Frase OU estatística MUITO curta (2-5 palavras) pra realçar visualmente neste slide, ex.: "R$40 vira R$65 mil", "3 dias presenciais", "sai vendendo". Puxe do CORPO e NÃO repita o título. Só letras, números e pontuação comum (sem setas/emojis). Vazio ("") se o título já for a frase de impacto ou não houver nada forte a destacar.',
          },
          foto_idx: {
            type: 'integer',
            description:
              'Índice (0..N-1) da foto anexada que MELHOR combina com este slide, olhando o que a foto mostra e o papel do slide. -1 se o slide fica melhor só com texto ou não há fotos.',
          },
          direcao_visual: {
            type: 'string',
            description: 'Direção de imagem/layout pro template (ex.: "foto da turma sorrindo, logo no canto"). Não descreve pixels finais.',
          },
        },
        required: ['ordem', 'papel', 'titulo', 'corpo', 'topicos', 'destaque', 'foto_idx', 'direcao_visual'],
      },
    },
    atributos: {
      type: 'object',
      additionalProperties: false,
      properties: {
        angulo: { type: 'string', description: 'Ângulo estratégico da peça.' },
        gancho: { type: 'string', description: 'Tipo/estilo do gancho usado.' },
        formato: { type: 'string', description: 'Formato da peça (será normalizado pelo sistema).' },
        cta: { type: 'string', description: 'Chamada para ação principal.' },
        oferta: { type: 'string', description: 'Oferta destacada.' },
        categoria: {
          type: 'string',
          description:
            'Framework de copy usado: dor_solucao | prova_social | quebra_objecao | oferta_urgencia | storytelling | comparacao | educativo.',
        },
      },
      required: ['angulo', 'gancho', 'formato', 'cta', 'oferta', 'categoria'],
    },
  },
  required: ['legenda', 'hashtags', 'slides', 'atributos'],
}

// ---- Composição do prompt (3 camadas) ----

export function blocoMarca(brand: Brand): string {
  // Camada 1 (marca) + Camada 2 primária (metodo). Estável por marca -> cacheável.
  return [
    'PERFIL DA MARCA (fonte de assertividade — respeite tom, provas e objeções):',
    JSON.stringify(
      {
        nome: brand.nome,
        nicho: brand.nicho,
        oferta: brand.oferta,
        publico: brand.publico,
        tom: brand.tom,
        provas: brand.provas,
        objecoes: brand.objecoes,
        exemplos_vencedores: brand.exemplos_vencedores,
        regras_design: brand.regras_design,
      },
      null,
      2,
    ),
    '',
    'MÉTODO DA ESCOLA (use como framework de marketing — Camada 2):',
    brand.metodo ?? '(método não preenchido — use boas práticas de carrossel/anúncio.)',
  ].join('\n')
}

export function blocoProduto(produto: Produto | null | undefined): string | null {
  // Camada 2 específica: cada produto tem seu método/oferta/objeções próprios (VISAO §3).
  if (!produto) return null
  return [
    'PRODUTO EM FOCO (a peça é sobre este produto — priorize o método, a oferta e as objeções DELE):',
    JSON.stringify(
      {
        nome: produto.nome,
        metodo: produto.metodo,
        oferta: produto.oferta,
        publico: produto.publico,
        provas: produto.provas,
        objecoes: produto.objecoes,
        meta: produto.meta,
      },
      null,
      2,
    ),
  ].join('\n')
}

export function blocoExemplos(exemplos: GerarInput['exemplosAprovados']): string | null {
  // Camada de exemplos aprovados (§12): copy que o curador já aprovou -> few-shot.
  if (!exemplos || exemplos.length === 0) return null
  const itens = exemplos
    .map((e, i) => `${i + 1}. Gancho: ${e.gancho}\n   Legenda: ${e.legenda}`)
    .join('\n')
  return [
    'EXEMPLOS APROVADOS (peças que o dono da marca JÁ aprovou — siga este padrão de gancho e voz; inspire-se, não copie literalmente):',
    itens,
  ].join('\n')
}

function blocoTendencia(tendencia: string | null | undefined): string | null {
  if (!tendencia || !tendencia.trim()) return null
  return [
    'TENDÊNCIA PRA SURFAR (newsjacking — puxe este assunto quente e conecte ao negócio de forma inteligente e natural, sem forçar):',
    tendencia.trim(),
  ].join('\n')
}

// Camada 3 (o que VENDE): dossiê da voz real do cliente, destilado das conversas
// do CRM por produto × cidade. É a maior fonte de assertividade.
export function blocoInteligencia(dossie: unknown): string | null {
  if (!dossie || typeof dossie !== 'object' || Object.keys(dossie as object).length === 0) return null
  return [
    'INTELIGÊNCIA DO CLIENTE (VOZ REAL — destilada das conversas do CRM DESTE produto/praça). É a Camada 3: o que de fato VENDE.',
    'USE assim: fale as DORES e DESEJOS reais nas palavras deles (aproveite as FRASES LITERAIS); acione os GATILHOS de compra que converteram; PREEMPTE as objeções reais; evite os MOTIVOS DE PERDA; priorize os ÂNGULOS que funcionaram (respeitando orgânico × anúncio). Não invente nada além do que está aqui — se um campo estiver vazio, ignore-o.',
    JSON.stringify(dossie, null, 2),
  ].join('\n')
}

function instrucaoSistema(): string {
  return [
    'Você é um COPYWRITER SÊNIOR de resposta direta, especialista em negócios locais. Sua copy faz a pessoa parar o dedo e agir.',
    '',
    'PRINCÍPIOS DE COPY (siga à risca):',
    '- O 1º slide é um SCROLL-STOPPER: tensão, pergunta afiada, número ou verdade inconveniente. Nada de saudação ("Você sabia?") nem clichê.',
    '- Uma ideia por slide. Frases curtas, ritmo, voz de quem fala na região (pt-BR informal, direto). Fale "você".',
    '- Seja ESPECÍFICO: números, cidade, situações reais > adjetivo vago. Prova concreta vence promessa.',
    '- PROIBIDO clichê de guru: "transforme sua vida", "descomplicar", "o segredo que ninguém te conta", "mude seu mindset", emoji em excesso.',
    '- Nada de métrica ou depoimento inventado — use só o que veio no contexto (provas/oferta). Se não tem prova, não invente.',
    '',
    'FRAMEWORK: escolha o mais adequado ao briefing e ESTRUTURE a peça por ele. Registre qual usou em atributos.categoria:',
    '- "dor_solucao" (PAS): dor → agita → vira a chave pra solução.',
    '- "prova_social": resultados/casos reais que geram desejo e confiança.',
    '- "quebra_objecao": pega a objeção mais forte e desmonta.',
    '- "oferta_urgencia": oferta clara + motivo real pra agir agora (turma, vagas).',
    '- "storytelling": um caso/jornada que ilustra a virada.',
    '- "comparacao": nós x eles / jeito antigo x jeito certo.',
    '- "educativo": ensina algo útil de verdade e posiciona como autoridade.',
    '',
    'A "direcao_visual" orienta o template com FOTOS REAIS — não descreva geração de imagem.',
    'Devolva SEMPRE no schema estruturado pedido.',
  ].join('\n')
}

function mensagemUsuario(brand: Brand, input: GerarInput): string {
  const tipo = getTipoAtivo(input.tipo)
  const formato = getFormato(input.formato)
  const nslides =
    tipo.minSlides === tipo.maxSlides
      ? `${tipo.minSlides} slide(s)`
      : `entre ${tipo.minSlides} e ${tipo.maxSlides} slides`

  const ehAnuncioImagem = input.tipo === 'anuncio_imagem'
  const organico = input.objetivo === 'organico'

  // Regra específica de imagem única: pouco texto forte na arte, copy na legenda.
  const regraAnuncio = organico
    ? [
        'ESTA É UMA IMAGEM DE POST ORGÂNICO (peça única). O texto NA ARTE tem que ser MÍNIMO e com apelo de CONTEÚDO (não de venda):',
        '- "titulo": uma frase curta e forte (idealmente ≤ 6 palavras) que dá vontade de ler — curiosidade/valor/emoção, não oferta.',
        '- "corpo": no MÁXIMO uma linha curta (≤ 10 palavras) — ou vazio. NADA de parágrafo.',
        '- "topicos": VAZIO. "destaque": vazio.',
        '- O conteúdo/história e o convite leve vão na LEGENDA, com voz humana (não é anúncio).',
        'Use papel "gancho" no slide único.',
      ].join('\n')
    : [
        'ESTA É UMA IMAGEM DE ANÚNCIO (peça única). O texto NA ARTE tem que ser MÍNIMO e IMPACTANTE:',
        '- "titulo": uma HEADLINE curta e forte (idealmente ≤ 6 palavras) — a coisa que a pessoa PRECISA ver.',
        '- "corpo": no MÁXIMO uma linha curta (≤ 10 palavras) de apoio/oferta — ou vazio. NADA de parágrafo.',
        '- "topicos": VAZIO. "destaque": vazio (não é usado na arte de anúncio).',
        '- Toda a persuasão (dor, oferta, prova, urgência e o CTA) vai na LEGENDA, que deve ser uma COPY DE ANÚNCIO completa e forte.',
        'Use papel "gancho" no slide único.',
      ].join('\n')

  const regraCarrossel = [
    'Estruture os slides com papéis claros (gancho -> desenvolvimento/prova -> cta). O primeiro slide é o gancho.',
    'Termine com EXATAMENTE UM slide de papel "cta" (o último). NÃO faça dois slides de CTA seguidos.',
    'Em cada slide, escolha um "destaque" curto (a frase ou número mais forte) pra ser realçado no layout — ou deixe vazio se o slide não tiver um ponto forte único.',
    'Quando o slide for uma lista (dias, passos, itens), use "topicos" (um item por entrada) em vez de jogar tudo no corpo — o layout formata como lista.',
  ].join('\n')

  const n = input.fotos?.length ?? 0
  const regraFotos =
    n > 0
      ? [
          `FOTOS ANEXADAS: ${n} foto(s) reais seguem como blocos de imagem, na ordem (índice 0 a ${n - 1}). VOCÊ AS VÊ.`,
          'Para CADA slide, escolha em "foto_idx" o índice da foto que melhor combina com a MENSAGEM e o PAPEL do slide (a capa/gancho normalmente pede a foto mais forte/representativa). Use -1 quando o slide fica melhor só com texto.',
          'A copy e a "direcao_visual" devem CASAR com o que a foto escolhida REALMENTE mostra (pessoas, cenário, objeto). Não descreva algo que não está na foto.',
          'Evite repetir a mesma foto em vários slides sem motivo. Se uma foto for ruim (escura, cortada, fora de contexto), não use (-1).',
        ].join('\n')
      : 'Não há fotos anexadas: preencha "foto_idx" com -1 em TODOS os slides.'

  return [
    `Gere uma peça do tipo "${tipo.nome}" (${nslides}) no formato ${formato.nome} (${formato.proporcao}, ${formato.largura}x${formato.altura}px).`,
    organico ? diretrizOrganico() : '',
    input.etapa ? (organico ? blocoEtapaOrganico(input.etapa) : blocoEtapa(input.etapa)) : '',
    input.cidade ? `Cidade/turma alvo: ${input.cidade}.` : '',
    input.produto ? `Produto alvo: ${input.produto.nome} (veja "PRODUTO EM FOCO" no contexto).` : '',
    organico
      ? 'CTA: só de RELACIONAMENTO (seguir, salvar, comentar, marcar alguém) ou sem chamada dura. NUNCA "acesse o site / link na bio / garanta sua vaga".'
      : input.ctaObjetivo
        ? `OBJETIVO DO CTA: a chamada (na arte quando fizer sentido, e no fim da legenda) deve levar a pessoa a ${CTA_INSTRUCAO[input.ctaObjetivo] ?? input.ctaObjetivo}.`
        : '',
    '',
    'BRIEFING:',
    input.briefing,
    '',
    ehAnuncioImagem ? regraAnuncio : regraCarrossel,
    '',
    regraFotos,
    input.mostrarPreco
      ? 'PREÇO: pode citar preço/valores/parcelas se fizer sentido pra oferta.'
      : 'PREÇO: NÃO mencione preço, valores, "R$", parcelas nem "de X por Y". Foque em valor, resultado e transformação. Nem na arte nem na legenda.',
    `Preencha atributos.formato exatamente com "${formato.id}".`,
  ]
    .filter(Boolean)
    .join('\n')
}

// Conteúdo do turno do usuário: o texto + as fotos como blocos de imagem (o
// modelo VÊ as fotos pra casar foto<->slide e a copy com o que aparece).
type BlocoUsuario =
  | { type: 'text'; text: string }
  | { type: 'image'; source: { type: 'url'; url: string } }

function conteudoUsuario(brand: Brand, input: GerarInput): BlocoUsuario[] {
  const blocos: BlocoUsuario[] = [{ type: 'text', text: mensagemUsuario(brand, input) }]
  for (const url of input.fotos ?? []) {
    blocos.push({ type: 'image', source: { type: 'url', url } })
  }
  return blocos
}

// ---- Chamada principal ----

/** Gera a spec do carrossel/imagem a partir da marca + briefing. Não renderiza nem persiste. */
export async function gerarSpec(brand: Brand, input: GerarInput): Promise<Spec> {
  const anthropic = getAnthropic()

  const system: { type: 'text'; text: string; cache_control?: { type: 'ephemeral' } }[] = [
    { type: 'text', text: instrucaoSistema() },
    // Bloco da marca é estável por marca -> prompt caching (CLAUDE.md seção 8).
    { type: 'text', text: blocoMarca(brand), cache_control: { type: 'ephemeral' } },
  ]
  const produtoBloco = blocoProduto(input.produto)
  // Contexto do produto: estável por produto -> segundo breakpoint de cache.
  if (produtoBloco) system.push({ type: 'text', text: produtoBloco, cache_control: { type: 'ephemeral' } })
  // Inteligência do cliente (Camada 3): estável por produto×cidade -> cacheável.
  const inteligenciaBloco = blocoInteligencia(input.inteligencia)
  if (inteligenciaBloco) system.push({ type: 'text', text: inteligenciaBloco, cache_control: { type: 'ephemeral' } })
  // Exemplos aprovados: mudam a cada aprovação -> sem cache.
  const exemplosBloco = blocoExemplos(input.exemplosAprovados)
  if (exemplosBloco) system.push({ type: 'text', text: exemplosBloco })
  // Tendência (newsjacking): muda a cada peça -> sem cache.
  const tendenciaBloco = blocoTendencia(input.tendencia)
  if (tendenciaBloco) system.push({ type: 'text', text: tendenciaBloco })

  const message = await anthropic.messages.create({
    model: MODEL_ESTRATEGIA,
    max_tokens: 8000,
    thinking: { type: 'adaptive' },
    system,
    messages: [{ role: 'user', content: conteudoUsuario(brand, input) }],
    output_config: { format: { type: 'json_schema', schema: SPEC_SCHEMA } },
  })

  const textBlock = message.content.find((b) => b.type === 'text')
  if (!textBlock || textBlock.type !== 'text') {
    throw new Error('O Claude não retornou conteúdo de texto (possível refusal).')
  }

  const spec = JSON.parse(textBlock.text) as Spec

  // Normaliza o formato: a fonte da verdade é o input, não o que o modelo escreveu.
  spec.atributos.formato = input.formato
  // Garante ordenação dos slides por segurança.
  spec.slides.sort((a, b) => a.ordem - b.ordem)

  return spec
}
