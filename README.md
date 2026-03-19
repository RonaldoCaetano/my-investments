# My Investments MVP

## Structure

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

## Running Locally

1. Start the database: `docker compose up -d`
2. Copy `.env.example` to `.env`
3. Install dependencies: `npm install`
4. Generate the Prisma client: `npx prisma generate`
5. Run the initial migration: `npx prisma migrate dev --name init`
6. Seed demo data: `npm run prisma:seed`
7. Start the app: `npm run dev`
8. Open `http://localhost:3000/login`
9. Run the test suite: `npm test`

## Example Payload

```json
{
  "ticker": "PETR4",
  "assetType": "STOCK",
  "type": "BUY",
  "quantity": 100,
  "value": 3275.0
}
```

`value` represents the total monetary amount of the transaction. The asset average price is recalculated on the server based on `quantity` and `value`. The route requires an authenticated user and uses the active session to link the transaction to the portfolio owner.

## Seed Data

The project includes a TypeScript seed in `prisma/seed.ts` with:

- 2 demo investors
- stock, REIT, ETF, bond, and crypto assets
- buy and sell operations to validate average price calculations

Demo credentials:

- `jhon.doe@example.com` / `Demo@1234`
- `jane.doe@example.com` / `Demo@1234`

## Authentication

- `httpOnly` cookie-based session
- Password hashing on the server
- Dashboard and transactions scoped to the authenticated user

## Tests

- The suite runs with `npm test`
- Current tests cover portfolio rules in `lib/portfolio.ts`
- The suite also covers HTTP authentication and transaction routes using real cookie-based sessions
- Because these are Prisma integration tests, local PostgreSQL must be running

## Next Steps

- Richer dashboard indicators for allocation and performance
- Production password hardening: migrate direct `scrypt` usage to `argon2id` or `bcrypt`, with explicit parameters and a rotation policy
