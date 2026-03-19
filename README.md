# My Investments MVP

## Estrutura

```text
.
├── app
│   ├── api/auth
│   ├── api/transactions/route.ts
│   ├── dashboard/page.tsx
│   ├── globals.css
│   ├── layout.tsx
│   ├── login/page.tsx
│   └── page.tsx
├── components
│   ├── auth
│   ├── dashboard
│   │   ├── assets-table.tsx
│   │   └── summary-card.tsx
│   └── ui
│       ├── card.tsx
│       └── table.tsx
├── lib
│   ├── formatters.ts
│   ├── portfolio.ts
│   ├── prisma.ts
│   ├── utils.ts
│   └── validations/transaction.ts
├── prisma
│   ├── migrations
│   ├── schema.prisma
│   └── seed.ts
├── types
│   └── investments.ts
├── .env.example
├── docker-compose.yml
├── next.config.mjs
├── package.json
├── postcss.config.js
├── tailwind.config.ts
└── tsconfig.json
```

## Como rodar

1. Suba o banco: `docker compose up -d`
2. Copie `.env.example` para `.env`
3. Instale dependencias: `npm install`
4. Gere o client do Prisma: `npx prisma generate`
5. Rode a migration inicial: `npx prisma migrate dev --name init`
6. Popule dados de exemplo: `npm run prisma:seed`
7. Inicie o app: `npm run dev`
8. Acesse `http://localhost:3000/login`
9. Rode os testes: `npm test`

## Exemplo de payload

```json
{
  "ticker": "PETR4",
  "assetType": "STOCK",
  "type": "BUY",
  "quantity": 100,
  "value": 3275.00
}
```

`value` representa o valor financeiro total da transacao. O preco medio do ativo e recalculado no servidor com base em `quantity` e `value`. A rota requer usuario autenticado e usa a sessao para vincular a transacao ao dono da carteira.

## Seed

O projeto inclui um seed em TypeScript em `prisma/seed.ts`, com:

- 2 investidores de exemplo
- ativos de acoes, FII, ETF, renda fixa e cripto
- compras e vendas para validar o calculo de preco medio

Credenciais demo:

- `ronaldo@example.com` / `Demo@1234`
- `ana@example.com` / `Demo@1234`

## Autenticacao

- Sessao com cookie `httpOnly`
- Senha com hash no servidor
- Dashboard e transacoes isolados por usuario autenticado

## Testes

- A suíte roda com `npm test`
- Os testes atuais cobrem a regra de carteira em `lib/portfolio.ts`
- A suíte também cobre as rotas HTTP de autenticação e transações com sessão real via cookie
- Como são testes de integração com Prisma, o PostgreSQL local precisa estar ativo

## Proximos passos

- Edicao e exclusao de transacoes com recálculo da carteira
- Testes automatizados da regra de preco medio e das rotas de API
- Indicadores mais ricos no dashboard, com alocacao e desempenho
- Hardening de senha para producao: migrar do uso direto de `scrypt` para `argon2id` ou `bcrypt`, com parametros e politica de rotacao mais explicitos
