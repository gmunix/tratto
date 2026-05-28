# Tratto

Projeto base para a atividade **Entrega Aula 11 - Configuracao Base Frontend e Backend**.

## Estrutura

```txt
tratto/
  frontend/  # React + Vite
  backend/   # Node.js + Express
```

## Frontend

```bash
cd frontend
npm install
npm run dev
```

Scripts principais:

- `npm run dev`
- `npm run build`
- `npm run preview`
- `npm run lint`
- `npm run lint:fix`
- `npm run format`
- `npm run test`

Variaveis de ambiente esperadas em `frontend/.env`:

```txt
VITE_API_URL=http://localhost:8000/api
VITE_APP_NAME=Tratto
VITE_ENV=development
```

## Backend

```bash
cd backend
npm install
npm run dev
```

Scripts principais:

- `npm run dev`
- `npm run start`
- `npm run lint`
- `npm run lint:fix`
- `npm run format`
- `npm run test`

Variaveis de ambiente esperadas em `backend/.env`:

```txt
PORT=8000
CORS_ORIGIN=http://localhost:3000
NODE_ENV=development
```

## API inicial

- `GET /api/health`

## Checklist da atividade

- Repositorio Git inicializado
- Projeto Vite criado
- Estrutura de pastas do frontend criada
- Backend Express criado
- ESLint e Prettier configurados
- Path aliases configurados no Vite
- Variaveis de ambiente exemplificadas
- Scripts principais configurados
- README documentado
