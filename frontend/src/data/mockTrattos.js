export const statusLabels = {
  active: 'Ativo',
  pending: 'Pendente',
  review: 'Em julgamento',
  finished: 'Finalizado',
  cancelled: 'Cancelado',
  'loser-detected': 'Perdedor identificado',
  compliance: 'Aguardando cumprimento',
}

export const decisionMethodLabels = {
  mutual: 'Confirmação mútua',
  vote: 'Votação do grupo',
  judge: 'Juiz escolhido',
}

export const trattoCategories = [
  'Desafio gastronômico',
  'Condicionamento',
  'Fiscalização cultural',
  'Desafio técnico',
  'Saúde e hábitos',
  'Habilidades duvidosas',
  'Outro',
]

export const currentUser = {
  id: 'usr-0042',
  name: 'Marcos Ferreira',
  username: '@marcosf',
  initials: 'MF',
  reputation: 78,
  joinedAt: '2026-03-04',
}

export const mockTrattos = [
  {
    id: 'trt-0001',
    caseNumber: 'TRT-0001',
    title: 'Comer 12 pães de queijo em uma sentada',
    description:
      'Marcos declarou capacidade plena em reunião familiar. Julia contestou a alegação como estatisticamente improvável e socialmente perigosa.',
    category: 'Desafio gastronômico',
    participants: ['Marcos Ferreira', 'Julia Souza'],
    status: 'active',
    consequence: 'Quem perder compra café para a outra pessoa por uma semana.',
    rules:
      '1. Os pães de queijo precisam ser de tamanho normal.\n2. Não vale intervalo maior que dois minutos.\n3. As duas partes precisam estar presentes.\n4. Miniaturas não serão aceitas como prova.',
    deadline: '2026-06-15',
    createdAt: '2026-05-01',
    decisionMethod: 'vote',
    judge: '',
    progress: 42,
    evidence: [
      {
        id: 'ev-001',
        author: 'Marcos Ferreira',
        type: 'text',
        content: 'Treino concluído com 8 unidades. Nível de confiança: perigosamente alto.',
        createdAt: '2026-05-10 14:23',
      },
      {
        id: 'ev-002',
        author: 'Julia Souza',
        type: 'text',
        content: 'Contraevidência: após a sexta unidade já havia respiração pesada e silêncio estratégico.',
        createdAt: '2026-05-12 09:45',
      },
    ],
    comments: [
      {
        id: 'cm-001',
        author: 'Beto Lima',
        content: 'Solicito acompanhamento médico e ata registrada.',
        createdAt: '2026-05-12 10:02',
      },
    ],
  },
  {
    id: 'trt-0002',
    caseNumber: 'TRT-0002',
    title: 'Primeiro a correr 5 km abaixo de 30 minutos',
    description:
      'Três amigos registraram o objetivo. Até o momento, a maior movimentação foi comprar tênis novo.',
    category: 'Condicionamento',
    participants: ['Carlos Reis', 'Ana Paula', 'Pedro Martins'],
    status: 'pending',
    consequence: 'O último a bater a meta paga um almoço coletivo.',
    rules:
      '1. O tempo precisa vir de aplicativo de corrida.\n2. Percurso sem descida absurda.\n3. A prova deve ser enviada em até dez minutos.',
    deadline: '2026-07-01',
    createdAt: '2026-05-15',
    decisionMethod: 'mutual',
    judge: '',
    progress: 0,
    evidence: [],
    comments: [],
  },
  {
    id: 'trt-0003',
    caseNumber: 'TRT-0003',
    title: 'Assistir ao filme clássico que jurou conhecer',
    description:
      'Rafa afirmou dominar todos os filmes importantes. Em interrogatório informal, admitiu lacuna grave no repertório.',
    category: 'Fiscalização cultural',
    participants: ['Rafa Brito', 'Beto Alves'],
    status: 'loser-detected',
    consequence: 'Publicar pedido de desculpas cultural no grupo da família.',
    rules:
      '1. Assistir ao filme inteiro, sem pular cenas.\n2. Enviar três comentários durante a sessão.\n3. Aceitar julgamento público por 48 horas.',
    deadline: '2026-05-01',
    createdAt: '2026-04-01',
    decisionMethod: 'mutual',
    judge: 'Beto Alves',
    progress: 100,
    evidence: [
      {
        id: 'ev-003',
        author: 'Rafa Brito',
        type: 'text',
        content: 'Confesso a falha. Solicito que conste nos autos que eu era jovem.',
        createdAt: '2026-04-03 20:00',
      },
      {
        id: 'ev-004',
        author: 'Beto Alves',
        type: 'text',
        content: 'O conselho aceita a confissão. Perdedor identificado. Dignidade em análise.',
        createdAt: '2026-04-04 10:00',
      },
    ],
    comments: [],
  },
  {
    id: 'trt-0004',
    caseNumber: 'TRT-0004',
    title: 'Programar um jogo da cobrinha em menos de uma hora',
    description:
      'Lucas disse que faria sem biblioteca, sem drama e sem pedir ajuda. Lara classificou a fala como tecnicamente audaciosa.',
    category: 'Desafio técnico',
    participants: ['Lucas Dias', 'Lara Costa'],
    status: 'review',
    consequence: 'Duas rodadas de bebida gelada em sábado ensolarado.',
    rules:
      '1. Somente HTML, CSS e JavaScript.\n2. O cronômetro começa com o editor aberto.\n3. Precisa ter movimento, comida, pontuação e fim de jogo.',
    deadline: '2026-05-20',
    createdAt: '2026-05-05',
    decisionMethod: 'judge',
    judge: 'Lara Costa',
    progress: 80,
    evidence: [
      {
        id: 'ev-005',
        author: 'Lucas Dias',
        type: 'link',
        content: 'github.com/lucasd/snake-challenge - entregue em 53 minutos. Peço deferimento.',
        createdAt: '2026-05-18 22:17',
      },
      {
        id: 'ev-006',
        author: 'Lara Costa',
        type: 'text',
        content: 'Funciona, mas a colisão atravessou a parede uma vez. Veredito pendente.',
        createdAt: '2026-05-19 09:00',
      },
    ],
    comments: [],
  },
  {
    id: 'trt-0005',
    caseNumber: 'TRT-0005',
    title: 'Ficar 30 dias sem açúcar processado',
    description:
      'Clara lançou o desafio. Diego aceitou dizendo que seria fácil. O dia 3 demonstrou complexidade operacional.',
    category: 'Saúde e hábitos',
    participants: ['Clara Mendes', 'Diego Freitas'],
    status: 'finished',
    consequence: 'Jantar escolhido pela vencedora, pago pelo perdedor.',
    rules:
      '1. Sem açúcar adicionado.\n2. Frutas liberadas.\n3. Diário alimentar obrigatório.\n4. Fiscalizações por chamada podem ocorrer.',
    deadline: '2026-04-30',
    createdAt: '2026-03-31',
    decisionMethod: 'mutual',
    judge: '',
    progress: 100,
    evidence: [
      {
        id: 'ev-007',
        author: 'Diego Freitas',
        type: 'text',
        content: 'Dia 3. Encarei um brigadeiro por 20 minutos. Não houve contato físico.',
        createdAt: '2026-04-03 21:00',
      },
      {
        id: 'ev-008',
        author: 'Clara Mendes',
        type: 'text',
        content: 'Dia 30 confirmado. Diego cumpriu. Estou surpresa e juridicamente satisfeita.',
        createdAt: '2026-04-30 23:59',
      },
    ],
    comments: [],
  },
]

export const pendingInvites = [
  {
    id: 'inv-001',
    from: 'Thiago Klein',
    title: 'Nomear todas as capitais da América do Sul sem consultar nada',
    consequence: 'Jantar pago por quem errar primeiro.',
    deadline: '2026-06-20',
  },
  {
    id: 'inv-002',
    from: 'Fernanda Lima',
    title: 'Acordar às 6h por duas semanas consecutivas',
    consequence: 'Um mês lavando a louça da república.',
    deadline: '2026-06-10',
  },
]

export const userProfile = {
  ...currentUser,
  wins: 12,
  losses: 3,
  active: 2,
  pending: 1,
  disputed: 1,
  badges: [
    {
      id: 'badge-001',
      name: 'Cumpridor de Tratos',
      description: 'Resolveu combinados sem precisar de pressão pública.',
    },
    {
      id: 'badge-002',
      name: 'Provas Insuficientes',
      description: 'Já tentou defender uma tese com material duvidoso.',
    },
    {
      id: 'badge-003',
      name: 'Juiz de Sofá',
      description: 'Participou de decisões com seriedade desnecessária.',
    },
    {
      id: 'badge-004',
      name: 'Perdeu Mas Pagou',
      description: 'Histórico aceitável de cumprimento de consequências.',
    },
  ],
}

export function getTrattoById(trattoId) {
  return mockTrattos.find((tratto) => tratto.id === trattoId)
}
