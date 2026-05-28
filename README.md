# Tratto

Tratto é um aplicativo social para criar acordos, desafios e apostas simbólicas entre amigos.

O produto não deve ser tratado como uma plataforma de apostas financeiras. A proposta é ajudar pessoas a registrar combinados informais, definir regras, coletar evidências e decidir resultados de forma transparente e divertida.

## Ideia do Produto

Usuários criam um tratto com amigos definindo:

- título e descrição
- participantes
- regras
- prazo
- consequência ou recompensa
- método de decisão
- evidências enviadas pelos participantes

O app acompanha o acordo da criação até a resolução, mantendo histórico de acordos finalizados e sinais de reputação social dos usuários.

## Estado Atual

Este repositório contém a base inicial do projeto:

- frontend com React + Vite
- backend com Node.js + Express
- roteamento básico no frontend
- endpoint inicial de health check no backend
- exemplos de variáveis de ambiente
- scripts de lint e formatação

## Estrutura

```txt
tratto/
  frontend/  # React + Vite
  backend/   # Node.js + Express
```

## Stack

Frontend:

- React
- Vite
- React Router
- Axios
- Zustand
- React Hook Form
- Zod
- ESLint
- Prettier

Backend:

- Node.js
- Express
- CORS
- Dotenv
- Nodemon
- ESLint
- Prettier

## Frontend

Para rodar o frontend:

```bash
cd frontend
npm install
npm run dev
```

Variáveis de ambiente esperadas em `frontend/.env`:

```txt
VITE_API_URL=http://localhost:8000/api
VITE_APP_NAME=Tratto
VITE_ENV=development
```

O frontend roda em `http://localhost:3000`.

## Backend

Para rodar o backend:

```bash
cd backend
npm install
npm run dev
```

Variáveis de ambiente esperadas em `backend/.env`:

```txt
PORT=8000
CORS_ORIGIN=http://localhost:3000
NODE_ENV=development
```

O backend roda em `http://localhost:8000` por padrão.

## API inicial

- `GET /api/health`

## Fluxo de Git

Use Conventional Commits:

- `feat:` novas funcionalidades
- `fix:` correções de bugs
- `docs:` alterações de documentação
- `style:` alterações apenas de formatação
- `refactor:` alterações internas sem mudança de comportamento
- `test:` alterações de testes
- `chore:` tarefas de manutenção

## Próximos Passos do Produto

- definir as primeiras cinco telas da aplicação
- criar modelos de domínio para trattos, participantes, evidências e votos
- adicionar as páginas iniciais no frontend
- expandir as rotas do backend além do health check
- conectar os serviços do frontend aos endpoints do backend
