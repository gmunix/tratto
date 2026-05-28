# Tratto Backend

Backend base do projeto Tratto, criado com Node.js + Express para a atividade de configuracao base.

## Scripts

- `npm run dev`
- `npm run start`
- `npm run lint`
- `npm run lint:fix`
- `npm run format`
- `npm run test`
- `npm run db:migrate`
- `npm run db:seed`
- `npm run db:reset`

## Banco de dados

O backend usa SQLite com SQL direto e migrations simples.

Variável de ambiente:

```txt
DATABASE_PATH=./data/tratto.sqlite
```

Arquivos versionados:

- `database/migrations/001_init.sql`
- `database/seeds/development.sql`

Arquivos locais ignorados pelo git:

- `data/*.sqlite`
- `data/*.sqlite-wal`
- `data/*.sqlite-shm`
- `data/*.db`

O schema inicial ainda não possui usuários, porque autenticação não foi implementada. Participantes são identidade local de cada trato por enquanto.

`npm run db:seed` executa as migrations antes de inserir os dados de desenvolvimento.

## Estrutura

- `src/config`
- `src/controllers`
- `src/middlewares`
- `src/models`
- `src/database`
- `src/routes`
- `src/services`
- `src/utils`

## Rota inicial

- `GET /api/health`
