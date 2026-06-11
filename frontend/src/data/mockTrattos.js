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
  {
    id: 'food',
    name: 'Desafio gastronômico',
    description: 'Para bravatas alimentares, promessas de sobremesa e perícias calóricas.',
  },
  {
    id: 'fitness',
    name: 'Condicionamento',
    description: 'Metas físicas com prazo, testemunhas e baixo índice de desculpas aceitas.',
  },
  {
    id: 'culture',
    name: 'Fiscalização cultural',
    description: 'Quando alguém jurou conhecer uma obra e agora precisa sustentar a versão.',
  },
  {
    id: 'tech',
    name: 'Desafio técnico',
    description: 'Promessas de entrega, código, gambiarra ou façanhas digitais auditáveis.',
  },
  {
    id: 'habits',
    name: 'Saúde e hábitos',
    description: 'Rotinas pessoais fiscalizadas sem transformar amizade em planilha hostil.',
  },
  {
    id: 'skills',
    name: 'Habilidades duvidosas',
    description: 'Talentos declarados em voz alta que agora exigem demonstração pública.',
  },
  {
    id: 'other',
    name: 'Outro',
    description: 'Casos especiais demais para a burocracia prever sem pedir reforço.',
  },
]

export const currentUser = {
  id: 'usr-0042',
  name: 'Marcos Ferreira',
  slug: 'marcosf',
  username: '@marcosf',
  avatarUrl: '',
  theme: 'grime',
  initials: 'MF',
  reputation: 78,
  joinedAt: '2026-03-04',
}

export const mockUsers = [
  currentUser,
  { id: 'usr-0101', name: 'Julia Souza', slug: 'julias', avatarUrl: '', theme: 'cassete' },
  { id: 'usr-0102', name: 'Lara Costa', slug: 'larac', avatarUrl: '', theme: 'grime' },
  { id: 'usr-0103', name: 'Lucas Dias', slug: 'lucasd', avatarUrl: '', theme: 'cassete' },
  { id: 'usr-0104', name: 'Beto Alves', slug: 'betoa', avatarUrl: '', theme: 'grime' },
]

export const mockCommunities = [
  {
    id: 'com-001',
    name: 'República 404',
    slug: 'republica-404',
    privacy: 'private',
    creatorId: currentUser.id,
    memberCount: 7,
    activeTrattos: 2,
    description: 'Moradores, agregados e visitantes sob auditoria de tarefas domésticas.',
    members: [
      { userId: currentUser.id, role: 'creator', status: 'member' },
      { userId: 'usr-0102', role: 'admin', status: 'member' },
      { userId: 'usr-0103', role: 'member', status: 'member' },
    ],
  },
  {
    id: 'com-002',
    name: 'Clube do Sofá Atleta',
    slug: 'sofa-atleta',
    privacy: 'public',
    creatorId: 'usr-0101',
    memberCount: 18,
    activeTrattos: 4,
    description: 'Promessas fitness feitas entre uma batata frita e outra.',
    members: [
      { userId: 'usr-0101', role: 'creator', status: 'member' },
      { userId: currentUser.id, role: 'member', status: 'member' },
    ],
  },
  {
    id: 'com-003',
    name: 'Cine Conselho',
    slug: 'cine-conselho',
    privacy: 'public',
    creatorId: 'usr-0104',
    memberCount: 31,
    activeTrattos: 6,
    description: 'Julgamento popular de repertório cultural com ata e pipoca.',
    members: [{ userId: 'usr-0104', role: 'creator', status: 'member' }],
  },
]

export const mockTrattos = [
  {
    id: 'trt-0001',
    caseNumber: 'TRT-0001',
    title: 'Comer 12 pães de queijo em uma sentada',
    description:
      'Marcos declarou capacidade plena em reunião familiar. Julia contestou a alegação como estatisticamente improvável e socialmente perigosa.',
    category: 'Desafio gastronômico',
    creatorId: currentUser.id,
    communityId: null,
    participants: [
      { userId: currentUser.id, displayName: 'Marcos Ferreira', role: 'creator', inviteStatus: 'accepted' },
      { userId: 'usr-0101', displayName: 'Julia Souza', role: 'participant', inviteStatus: 'accepted' },
    ],
    status: 'active',
    consequence: 'Quem perder compra café para a outra pessoa por uma semana.',
    rules: [
      'Os pães de queijo precisam ser de tamanho normal.',
      'Não vale intervalo maior que dois minutos.',
      'As duas partes precisam estar presentes.',
      'Miniaturas não serão aceitas como prova.',
    ],
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
    creatorId: 'usr-0101',
    communityId: 'com-002',
    participants: [
      { userId: 'usr-0101', displayName: 'Carlos Reis', role: 'creator', inviteStatus: 'accepted' },
      { userId: currentUser.id, displayName: 'Marcos Ferreira', role: 'participant', inviteStatus: 'pending' },
      { userId: 'usr-0103', displayName: 'Pedro Martins', role: 'participant', inviteStatus: 'pending' },
    ],
    status: 'pending',
    consequence: 'O último a bater a meta paga um almoço coletivo.',
    rules: [
      'O tempo precisa vir de aplicativo de corrida.',
      'Percurso sem descida absurda.',
      'A prova deve ser enviada em até dez minutos.',
    ],
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
    creatorId: 'usr-0104',
    communityId: 'com-003',
    participants: [
      { userId: 'usr-0104', displayName: 'Beto Alves', role: 'judge', inviteStatus: 'accepted' },
      { userId: null, displayName: 'Rafa Brito', role: 'participant', inviteStatus: 'accepted' },
    ],
    status: 'loser-detected',
    consequence: 'Publicar pedido de desculpas cultural no grupo da família.',
    rules: [
      'Assistir ao filme inteiro, sem pular cenas.',
      'Enviar três comentários durante a sessão.',
      'Aceitar julgamento público por 48 horas.',
    ],
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
    creatorId: 'usr-0103',
    communityId: 'com-001',
    participants: [
      { userId: 'usr-0103', displayName: 'Lucas Dias', role: 'creator', inviteStatus: 'accepted' },
      { userId: 'usr-0102', displayName: 'Lara Costa', role: 'judge', inviteStatus: 'accepted' },
      { userId: currentUser.id, displayName: 'Marcos Ferreira', role: 'judge', inviteStatus: 'accepted' },
    ],
    status: 'review',
    consequence: 'Duas rodadas de bebida gelada em sábado ensolarado.',
    rules: [
      'Somente HTML, CSS e JavaScript.',
      'O cronômetro começa com o editor aberto.',
      'Precisa ter movimento, comida, pontuação e fim de jogo.',
    ],
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
        type: 'image',
        content: 'Captura da parede atravessada anexada para perícia pixelada.',
        metadata: { filename: 'bug-parede.png' },
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
    creatorId: 'usr-0101',
    communityId: null,
    participants: [
      { userId: 'usr-0101', displayName: 'Clara Mendes', role: 'creator', inviteStatus: 'accepted' },
      { userId: null, displayName: 'Diego Freitas', role: 'participant', inviteStatus: 'accepted' },
    ],
    status: 'finished',
    consequence: 'Jantar escolhido pela vencedora, pago pelo perdedor.',
    rules: [
      'Sem açúcar adicionado.',
      'Frutas liberadas.',
      'Diário alimentar obrigatório.',
      'Fiscalizações por chamada podem ocorrer.',
    ],
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

export const mockNotifications = [
  {
    id: 'ntf-001',
    type: 'invite',
    title: 'Convite para trato recebido',
    body: 'Thiago quer registrar capitais da América do Sul sem consulta externa.',
    readAt: null,
    targetUrl: '/trattos/trt-0002',
    createdAt: '2026-06-10 08:12',
  },
  {
    id: 'ntf-002',
    type: 'evidence',
    title: 'Nova evidência anexada',
    body: 'Lara adicionou uma captura de tela no caso da cobrinha.',
    readAt: null,
    targetUrl: '/trattos/trt-0004',
    createdAt: '2026-06-09 21:44',
  },
  {
    id: 'ntf-003',
    type: 'community-request',
    title: 'Pedido para entrar na República 404',
    body: '@nanda-lima solicita acesso ao cartório doméstico.',
    readAt: null,
    targetUrl: '/comunidades/republica-404',
    createdAt: '2026-06-09 19:10',
  },
  {
    id: 'ntf-004',
    type: 'mention',
    title: 'Você foi mencionado em evidência',
    body: '@marcosf foi citado como testemunha de respiração pesada.',
    readAt: '2026-06-08 12:00',
    targetUrl: '/trattos/trt-0001',
    createdAt: '2026-06-08 11:30',
  },
  {
    id: 'ntf-005',
    type: 'verdict',
    title: 'Veredito registrado',
    body: 'O caso do açúcar processado foi arquivado com dignidade aceitável.',
    readAt: '2026-06-07 10:20',
    targetUrl: '/trattos/trt-0005',
    createdAt: '2026-06-07 09:40',
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

export function getCommunityBySlug(communitySlug) {
  return mockCommunities.find((community) => community.slug === communitySlug)
}

export function getUserById(userId) {
  return mockUsers.find((user) => user.id === userId)
}

export function getParticipantNames(tratto) {
  return tratto.participants.map((participant) => participant.displayName)
}

export function getCommunityTrattos(communityId) {
  return mockTrattos.filter((tratto) => tratto.communityId === communityId)
}
