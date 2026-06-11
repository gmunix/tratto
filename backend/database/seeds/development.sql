PRAGMA foreign_keys = ON;

DELETE FROM votes;
DELETE FROM comments;
DELETE FROM evidences;
DELETE FROM tratto_verdicts;
DELETE FROM tratto_participants;
DELETE FROM trattos;
DELETE FROM community_memberships;
DELETE FROM communities;
DELETE FROM auth_tokens;
DELETE FROM users;

INSERT INTO users (
  id,
  email,
  password_hash,
  display_name,
  slug,
  avatar_url,
  theme,
  created_at,
  updated_at
) VALUES
  ('usr-marcos', 'marcos@example.com', 'scrypt:16384:8:1:74726174746f2d736565642d6d6172636f73:0f81bbab29249d1309373935a3a86486328d41f3b3c3927f66ec0544b4be362bdcb54b31b94934b3a8e1ccb7c649f25eb794ff4ce94ccf113ef48b596c991c9b', 'Marcos Ferreira', 'marcosf', NULL, 'grime', '2026-05-01T12:00:00.000Z', '2026-05-01T12:00:00.000Z'),
  ('usr-julia', 'julia@example.com', 'scrypt:16384:8:1:74726174746f2d736565642d6a756c6961:b871d0592b23f71da643db0d5f5b04e8baf67e8d587395e3d3ffbf361e91cd0564604b9551a10b3f09095434a776236b3e2087b45b5a369ca30730e447265afa', 'Julia Souza', 'julias', NULL, 'grime', '2026-05-01T12:05:00.000Z', '2026-05-01T12:05:00.000Z'),
  ('usr-carlos', 'carlos@example.com', 'scrypt:16384:8:1:74726174746f2d736565642d6361726c6f73:d3c5a03c6dbdccfc7fd77cb1948348a4a45b2074862088946b48d4d53a9b5223290da1bd2b6c351b8cd873bb2be549b872a3f51b13685c244ffdc5d8276c2b3b', 'Carlos Reis', 'carlosr', NULL, 'grime', '2026-05-15T12:00:00.000Z', '2026-05-15T12:00:00.000Z'),
  ('usr-ana', 'ana@example.com', 'scrypt:16384:8:1:74726174746f2d736565642d616e61:b377797e7deab68e8a60d7ac87a563b4f67287e1f55f5a1d7a240ab004b005d6626231b8327a170994dee13b784c605f898d1dfdfcda68e79803cecd1bb6e36d', 'Ana Paula', 'anapaula', NULL, 'grime', '2026-05-15T12:00:00.000Z', '2026-05-15T12:00:00.000Z'),
  ('usr-pedro', 'pedro@example.com', 'scrypt:16384:8:1:74726174746f2d736565642d706564726f:0b8098008b2eeb7e088d38745a557341b7e37eb036ca4f71badbd79d48969ed7c1a1409a5dc4c120f04abda5d3472f2e4a8c3050188c2fae11319d6c14c552b5', 'Pedro Martins', 'pedrom', NULL, 'grime', '2026-05-15T12:00:00.000Z', '2026-05-15T12:00:00.000Z'),
  ('usr-rafa', 'rafa@example.com', 'scrypt:16384:8:1:74726174746f2d736565642d72616661:085c3cdbe52aeb1c107dc40b9d2fdf059466208412cd947fe79d8b9c6914da2a2e5a092b02839a94927c460a888ad283d124d2a730957e29b8afad83d674995d', 'Rafa Brito', 'rafab', NULL, 'grime', '2026-04-01T12:00:00.000Z', '2026-04-01T12:00:00.000Z'),
  ('usr-beto', 'beto@example.com', 'scrypt:16384:8:1:74726174746f2d736565642d6265746f:fddf7f98850f51bf18551d4a1952cd8e0f27a4141315540a977fabbfc6f1410960fa923dc96ac4faab77df96c1db85f87f7f94e3bc1fbb9221e989a1a3cdbfa4', 'Beto Alves', 'betoalves', NULL, 'grime', '2026-04-01T12:10:00.000Z', '2026-04-01T12:10:00.000Z'),
  ('usr-lucas', 'lucas@example.com', 'scrypt:16384:8:1:74726174746f2d736565642d6c75636173:a913628dd1eb81807581f6f747e2684311f52fa0af2077f7c8219d8d7ba82565b54408d8d027e4dd75bb5882bc84eaf144404f2ad177bc6b4626f21e2c5b2720', 'Lucas Dias', 'lucasd', NULL, 'grime', '2026-05-05T12:00:00.000Z', '2026-05-05T12:00:00.000Z'),
  ('usr-lara', 'lara@example.com', 'scrypt:16384:8:1:74726174746f2d736565642d6c617261:ec61ac1562114efd0ed6ef3d14ebbff586ed034662ca787b72dcc46d1ed84b3e3d6eb984d765ec576884e24e4fda9fc807238d78e309e908fde6928568ba2821', 'Lara Costa', 'larac', NULL, 'grime', '2026-05-05T12:15:00.000Z', '2026-05-05T12:15:00.000Z'),
  ('usr-clara', 'clara@example.com', 'scrypt:16384:8:1:74726174746f2d736565642d636c617261:35fe99521833723ea1a4e96e7845d2fdfcff36254f9a649e8b29ddb29faaa2dfd4aca2beb145fc2ad74cef958fd422255cfa03b5e5a4e12638c6f8a3bda59e94', 'Clara Mendes', 'claram', NULL, 'grime', '2026-03-31T12:00:00.000Z', '2026-03-31T12:00:00.000Z'),
  ('usr-diego', 'diego@example.com', 'scrypt:16384:8:1:74726174746f2d736565642d646965676f:25675a9abf243a1502073cd47a9928203adb7eacb3daab1b4ed2547650b114459ebd5839506365ad2272d284d770bb50b38d2de9467a73a9fc104cafe97dbd64', 'Diego Freitas', 'diegof', NULL, 'grime', '2026-03-31T12:08:00.000Z', '2026-03-31T12:08:00.000Z');

INSERT INTO communities (
  id,
  name,
  slug,
  description,
  privacy,
  creator_id,
  created_at,
  updated_at
) VALUES
  (
    'com-republica-404',
    'República 404',
    'republica-404',
    'Acordos domésticos com rigor desnecessário.',
    'private',
    'usr-marcos',
    '2026-05-02T12:00:00.000Z',
    '2026-05-02T12:00:00.000Z'
  ),
  (
    'com-desafios-de-domingo',
    'Desafios de Domingo',
    'desafios-de-domingo',
    'Comunidade pública para desafios leves, apostas bobas e placares dramáticos.',
    'public',
    'usr-julia',
    '2026-05-03T12:00:00.000Z',
    '2026-05-03T12:00:00.000Z'
  ),
  (
    'com-cine-tribunal',
    'Cine Tribunal',
    'cine-tribunal',
    'Sessões culturais com direito a defesa, réplica e consequência.',
    'public',
    'usr-rafa',
    '2026-05-04T12:00:00.000Z',
    '2026-05-04T12:00:00.000Z'
  );

INSERT INTO community_memberships (
  id,
  community_id,
  user_id,
  role,
  status,
  requested_at,
  decided_at,
  created_at,
  updated_at
) VALUES
  ('mem-republica-marcos', 'com-republica-404', 'usr-marcos', 'creator', 'member', '2026-05-02T12:00:00.000Z', '2026-05-02T12:00:00.000Z', '2026-05-02T12:00:00.000Z', '2026-05-02T12:00:00.000Z'),
  ('mem-republica-julia', 'com-republica-404', 'usr-julia', 'admin', 'member', '2026-05-02T12:05:00.000Z', '2026-05-02T12:05:00.000Z', '2026-05-02T12:05:00.000Z', '2026-05-02T12:05:00.000Z'),
  ('mem-republica-carlos', 'com-republica-404', 'usr-carlos', 'member', 'pending', '2026-05-06T12:00:00.000Z', NULL, '2026-05-06T12:00:00.000Z', '2026-05-06T12:00:00.000Z'),
  ('mem-domingo-julia', 'com-desafios-de-domingo', 'usr-julia', 'creator', 'member', '2026-05-03T12:00:00.000Z', '2026-05-03T12:00:00.000Z', '2026-05-03T12:00:00.000Z', '2026-05-03T12:00:00.000Z'),
  ('mem-domingo-marcos', 'com-desafios-de-domingo', 'usr-marcos', 'member', 'member', '2026-05-03T12:10:00.000Z', '2026-05-03T12:10:00.000Z', '2026-05-03T12:10:00.000Z', '2026-05-03T12:10:00.000Z'),
  ('mem-cine-rafa', 'com-cine-tribunal', 'usr-rafa', 'creator', 'member', '2026-05-04T12:00:00.000Z', '2026-05-04T12:00:00.000Z', '2026-05-04T12:00:00.000Z', '2026-05-04T12:00:00.000Z'),
  ('mem-cine-beto', 'com-cine-tribunal', 'usr-beto', 'admin', 'member', '2026-05-04T12:15:00.000Z', '2026-05-04T12:15:00.000Z', '2026-05-04T12:15:00.000Z', '2026-05-04T12:15:00.000Z');

INSERT INTO trattos (
  id,
  case_number,
  title,
  description,
  category,
  consequence,
  rules,
  status,
  deadline,
  decision_method,
  created_at,
  updated_at,
  resolved_at
) VALUES
  (
    'trt-0001',
    'TRT-0001',
    'Comer 12 pães de queijo em uma sentada',
    'Marcos declarou capacidade plena em reunião familiar. Julia contestou a alegação como estatisticamente improvável e socialmente perigosa.',
    'Desafio gastronômico',
    'Quem perder compra café para a outra pessoa por uma semana.',
    '1. Os pães de queijo precisam ser de tamanho normal.\n2. Não vale intervalo maior que dois minutos.\n3. As duas partes precisam estar presentes.\n4. Miniaturas não serão aceitas como prova.',
    'active',
    '2026-06-15',
    'vote',
    '2026-05-01T12:00:00.000Z',
    '2026-05-12T09:45:00.000Z',
    NULL
  ),
  (
    'trt-0002',
    'TRT-0002',
    'Primeiro a correr 5 km abaixo de 30 minutos',
    'Três amigos registraram o objetivo. Até o momento, a maior movimentação foi comprar tênis novo.',
    'Condicionamento',
    'O último a bater a meta paga um almoço coletivo.',
    '1. O tempo precisa vir de aplicativo de corrida.\n2. Percurso sem descida absurda.\n3. A prova deve ser enviada em até dez minutos.',
    'pending',
    '2026-07-01',
    'mutual',
    '2026-05-15T12:00:00.000Z',
    '2026-05-15T12:00:00.000Z',
    NULL
  ),
  (
    'trt-0003',
    'TRT-0003',
    'Assistir ao filme clássico que jurou conhecer',
    'Rafa afirmou dominar todos os filmes importantes. Em interrogatório informal, admitiu lacuna grave no repertório.',
    'Fiscalização cultural',
    'Publicar pedido de desculpas cultural no grupo da família.',
    '1. Assistir ao filme inteiro, sem pular cenas.\n2. Enviar três comentários durante a sessão.\n3. Aceitar julgamento público por 48 horas.',
    'loser-detected',
    '2026-05-01',
    'mutual',
    '2026-04-01T12:00:00.000Z',
    '2026-04-04T10:00:00.000Z',
    '2026-04-04T10:00:00.000Z'
  ),
  (
    'trt-0004',
    'TRT-0004',
    'Programar um jogo da cobrinha em menos de uma hora',
    'Lucas disse que faria sem biblioteca, sem drama e sem pedir ajuda. Lara classificou a fala como tecnicamente audaciosa.',
    'Desafio técnico',
    'Duas rodadas de bebida gelada em sábado ensolarado.',
    '1. Somente HTML, CSS e JavaScript.\n2. O cronômetro começa com o editor aberto.\n3. Precisa ter movimento, comida, pontuação e fim de jogo.',
    'review',
    '2026-05-20',
    'judge',
    '2026-05-05T12:00:00.000Z',
    '2026-05-19T09:00:00.000Z',
    NULL
  ),
  (
    'trt-0005',
    'TRT-0005',
    'Ficar 30 dias sem açúcar processado',
    'Clara lançou o desafio. Diego aceitou dizendo que seria fácil. O dia 3 demonstrou complexidade operacional.',
    'Saúde e hábitos',
    'Jantar escolhido pela vencedora, pago pelo perdedor.',
    '1. Sem açúcar adicionado.\n2. Frutas liberadas.\n3. Diário alimentar obrigatório.\n4. Fiscalizações por chamada podem ocorrer.',
    'finished',
    '2026-04-30',
    'mutual',
    '2026-03-31T12:00:00.000Z',
    '2026-04-30T23:59:00.000Z',
    '2026-04-30T23:59:00.000Z'
  );

INSERT INTO tratto_participants (
  id,
  tratto_id,
  display_name,
  role,
  invite_status,
  accepted_at,
  created_at
) VALUES
  ('trt-0001-marcos', 'trt-0001', 'Marcos Ferreira', 'creator', 'accepted', '2026-05-01T12:00:00.000Z', '2026-05-01T12:00:00.000Z'),
  ('trt-0001-julia', 'trt-0001', 'Julia Souza', 'participant', 'accepted', '2026-05-01T12:05:00.000Z', '2026-05-01T12:00:00.000Z'),
  ('trt-0002-carlos', 'trt-0002', 'Carlos Reis', 'creator', 'accepted', '2026-05-15T12:00:00.000Z', '2026-05-15T12:00:00.000Z'),
  ('trt-0002-ana', 'trt-0002', 'Ana Paula', 'participant', 'pending', NULL, '2026-05-15T12:00:00.000Z'),
  ('trt-0002-pedro', 'trt-0002', 'Pedro Martins', 'participant', 'pending', NULL, '2026-05-15T12:00:00.000Z'),
  ('trt-0003-rafa', 'trt-0003', 'Rafa Brito', 'creator', 'accepted', '2026-04-01T12:00:00.000Z', '2026-04-01T12:00:00.000Z'),
  ('trt-0003-beto', 'trt-0003', 'Beto Alves', 'judge', 'accepted', '2026-04-01T12:10:00.000Z', '2026-04-01T12:00:00.000Z'),
  ('trt-0004-lucas', 'trt-0004', 'Lucas Dias', 'creator', 'accepted', '2026-05-05T12:00:00.000Z', '2026-05-05T12:00:00.000Z'),
  ('trt-0004-lara', 'trt-0004', 'Lara Costa', 'judge', 'accepted', '2026-05-05T12:15:00.000Z', '2026-05-05T12:00:00.000Z'),
  ('trt-0005-clara', 'trt-0005', 'Clara Mendes', 'creator', 'accepted', '2026-03-31T12:00:00.000Z', '2026-03-31T12:00:00.000Z'),
  ('trt-0005-diego', 'trt-0005', 'Diego Freitas', 'participant', 'accepted', '2026-03-31T12:08:00.000Z', '2026-03-31T12:00:00.000Z');

INSERT INTO evidences (
  id,
  tratto_id,
  author_participant_id,
  author_display_name,
  type,
  content,
  created_at
) VALUES
  ('ev-001', 'trt-0001', 'trt-0001-marcos', 'Marcos Ferreira', 'text', 'Treino concluído com 8 unidades. Nível de confiança: perigosamente alto.', '2026-05-10T14:23:00.000Z'),
  ('ev-002', 'trt-0001', 'trt-0001-julia', 'Julia Souza', 'text', 'Contraevidência: após a sexta unidade já havia respiração pesada e silêncio estratégico.', '2026-05-12T09:45:00.000Z'),
  ('ev-003', 'trt-0003', 'trt-0003-rafa', 'Rafa Brito', 'text', 'Confesso a falha. Solicito que conste nos autos que eu era jovem.', '2026-04-03T20:00:00.000Z'),
  ('ev-004', 'trt-0003', 'trt-0003-beto', 'Beto Alves', 'text', 'O conselho aceita a confissão. Perdedor identificado. Dignidade em análise.', '2026-04-04T10:00:00.000Z'),
  ('ev-005', 'trt-0004', 'trt-0004-lucas', 'Lucas Dias', 'link', 'github.com/lucasd/snake-challenge - entregue em 53 minutos. Peço deferimento.', '2026-05-18T22:17:00.000Z'),
  ('ev-006', 'trt-0004', 'trt-0004-lara', 'Lara Costa', 'text', 'Funciona, mas a colisão atravessou a parede uma vez. Veredito pendente.', '2026-05-19T09:00:00.000Z'),
  ('ev-007', 'trt-0005', 'trt-0005-diego', 'Diego Freitas', 'text', 'Dia 3. Encarei um brigadeiro por 20 minutos. Não houve contato físico.', '2026-04-03T21:00:00.000Z'),
  ('ev-008', 'trt-0005', 'trt-0005-clara', 'Clara Mendes', 'text', 'Dia 30 confirmado. Diego cumpriu. Estou surpresa e juridicamente satisfeita.', '2026-04-30T23:59:00.000Z');

INSERT INTO comments (
  id,
  tratto_id,
  author_participant_id,
  author_display_name,
  content,
  created_at
) VALUES
  ('cm-001', 'trt-0001', NULL, 'Beto Lima', 'Solicito acompanhamento médico e ata registrada.', '2026-05-12T10:02:00.000Z');

INSERT INTO tratto_verdicts (
  id,
  tratto_id,
  decision_method,
  decided_by_participant_id,
  winner_participant_id,
  loser_participant_id,
  summary,
  created_at
) VALUES
  (
    'verdict-0003',
    'trt-0003',
    'mutual',
    'trt-0003-beto',
    'trt-0003-beto',
    'trt-0003-rafa',
    'Perdedor identificado por confissão cultural registrada.',
    '2026-04-04T10:00:00.000Z'
  ),
  (
    'verdict-0005',
    'trt-0005',
    'mutual',
    'trt-0005-clara',
    'trt-0005-diego',
    NULL,
    'Trato cumprido e arquivado sem recurso.',
    '2026-04-30T23:59:00.000Z'
  );
