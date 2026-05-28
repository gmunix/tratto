PRAGMA foreign_keys = ON;

DELETE FROM votes;
DELETE FROM comments;
DELETE FROM evidences;
DELETE FROM tratto_verdicts;
DELETE FROM tratto_participants;
DELETE FROM trattos;

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
