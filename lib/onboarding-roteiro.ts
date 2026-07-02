// Roteiro da entrevista de onboarding (VISAO §3). Sem imports de servidor de
// propósito: é importado tanto pelo cérebro (server) quanto pela UI (client).
export interface PerguntaOnboarding {
  id: string
  titulo: string
  pergunta: string
  dica: string
}

export const ROTEIRO: PerguntaOnboarding[] = [
  {
    id: 'negocio',
    titulo: 'O negócio',
    pergunta: 'Me conta o que é o seu negócio: o que você vende, qual a promessa central e o que te diferencia dos concorrentes.',
    dica: 'Fale como se explicasse pra um amigo. Sem pressa.',
  },
  {
    id: 'tom',
    titulo: 'Tom e identidade',
    pergunta: 'Como a marca fala? Qual o tom de voz e o que ela NUNCA pode falar ou parecer?',
    dica: 'Ex.: próximo e direto; nunca arrogante; nada de promessa milagrosa.',
  },
  {
    id: 'publico',
    titulo: 'O público',
    pergunta: 'Quem é o seu público? Quais as dores, os medos e as objeções mais comuns dele — e como ele fala?',
    dica: 'Pense no cliente típico: idade, cidade, o que tira o sono dele.',
  },
  {
    id: 'produtos',
    titulo: 'Os produtos',
    pergunta: 'Fale de cada produto que você vende: o nome, o que ele entrega, a oferta, o método próprio dele e as objeções específicas. Se der, diga um código curto pra cada um (ex.: ANL, FC).',
    dica: 'Pode falar um produto de cada vez; o sistema separa depois.',
  },
  {
    id: 'provas',
    titulo: 'Provas',
    pergunta: 'Quais provas você tem? Depoimentos, números, casos de sucesso, resultados de alunos ou clientes.',
    dica: 'Números e histórias reais valem ouro aqui.',
  },
  {
    id: 'video',
    titulo: 'Aparição em vídeo',
    pergunta: 'Alguém do time aparece em vídeo? Quem, e com que frequência dá pra gravar?',
    dica: 'Define se dá pra planejar reels/vídeos com pessoa.',
  },
  {
    id: 'objetivo',
    titulo: 'Objetivo do período',
    pergunta: 'O que você quer comunicar ou vender agora? Tem alguma promoção, turma ou sazonalidade ativa?',
    dica: 'O foco do momento orienta o planejamento.',
  },
  {
    id: 'referencias',
    titulo: 'Referências',
    pergunta: 'Que marcas ou perfis você admira e quer se inspirar? E o que você quer evitar de jeito nenhum?',
    dica: 'Pode citar concorrentes e o que eles fazem de bom/ruim.',
  },
]
