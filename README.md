# My Investments MVP

This project was built using Codex, on GPT 5.4.
I generated the prompt using Gemini.

```
# Project AI Prompt: Investment Tracker MVP

This section contains the master prompt used to generate the core architecture of this application.

## 🚀 Tech Stack Specifications
* **Language:** TypeScript (Strict Mode).
* **Framework:** Next.js 14+ (App Router).
* **Database:** PostgreSQL (Running via Docker/OrbStack).
* **ORM:** Prisma.
* **Validation:** Zod.
* **UI:** Tailwind CSS + Shadcn/UI.

## 📝 The Prompt

> Act as a Senior Fullstack Developer specialized in **TypeScript** and Next.js. I need to build an MVP for a personal investment tracking application.
>
> **Mandatory Tech Stack:**
> * **Language:** TypeScript (Strict Mode) throughout the entire project.
> * **Framework:** Next.js 14+ (App Router).
> * **Database:** PostgreSQL running via Docker (I am using OrbStack).
> * **ORM:** Prisma (with automatically generated type definitions).
> * **Validation:** Zod for API schemas and form data.
> * **UI:** Tailwind CSS + Shadcn/UI (for a modern and user-friendly interface).
>
> **Technical Requirements:**
> 1. Provide a `docker-compose.yml` file to spin up the PostgreSQL database locally.
> 2. Define a `schema.prisma` with the following entities: `User`, `Asset` (Ticker, Type [Stocks/FIIs/Crypto], Average Price, Quantity), and `Transaction` (Date, Operation Type [Buy/Sell], Unit Value, Asset ID).
> 3. Create a **RESTful API Route** in TypeScript to save transactions. The API must validate the request body using **Zod** and ensure all financial calculations (like average price updates) are handled on the server side.
> 4. Implement a Dashboard page using **Server Components** to fetch data via Prisma and display it in a type-safe table.
>
> **Security and Scalability:**
> * Keep interfaces and types organized in a dedicated folder or file.
> * Ensure all Prisma queries are secure against SQL injection by using the ORM's standard methods.
> * Set up the project so that switching the `DATABASE_URL` in the `.env` file is the only step required to migrate from local development to Oracle Cloud.
>
> Please provide the folder structure and the code for the core files: `docker-compose.yml`, `prisma/schema.prisma`, `lib/prisma.ts`, and the main Transaction API route.
```

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
