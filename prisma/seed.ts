import { AssetType, TransactionType } from "@prisma/client";

import { registerTransaction } from "../lib/portfolio";
import { prisma } from "../lib/prisma";
import { hashPassword } from "../lib/security";

async function resetDatabase() {
  await prisma.transaction.deleteMany();
  await prisma.asset.deleteMany();
  await prisma.user.deleteMany();
}

async function seedTransactions() {
  const demoPasswordHash = hashPassword("Demo@1234");
  const ronaldo = await prisma.user.create({
    data: {
      email: "ronaldo@example.com",
      name: "Ronaldo Caetano",
      passwordHash: demoPasswordHash
    }
  });
  const ana = await prisma.user.create({
    data: {
      email: "ana@example.com",
      name: "Ana Souza",
      passwordHash: demoPasswordHash
    }
  });
  const entries = [
    {
      userId: ronaldo.id,
      ticker: "PETR4",
      assetType: AssetType.STOCK,
      type: TransactionType.BUY,
      quantity: 100,
      value: 3275,
      occurredAt: new Date("2026-01-10T10:00:00.000Z")
    },
    {
      userId: ronaldo.id,
      ticker: "MXRF11",
      assetType: AssetType.FII,
      type: TransactionType.BUY,
      quantity: 50,
      value: 525,
      occurredAt: new Date("2026-01-12T10:00:00.000Z")
    },
    {
      userId: ronaldo.id,
      ticker: "PETR4",
      assetType: AssetType.STOCK,
      type: TransactionType.BUY,
      quantity: 40,
      value: 1360,
      occurredAt: new Date("2026-02-03T10:00:00.000Z")
    },
    {
      userId: ana.id,
      ticker: "IVVB11",
      assetType: AssetType.ETF,
      type: TransactionType.BUY,
      quantity: 12,
      value: 3912,
      occurredAt: new Date("2026-02-05T10:00:00.000Z")
    },
    {
      userId: ana.id,
      ticker: "TESOURO2035",
      assetType: AssetType.BOND,
      type: TransactionType.BUY,
      quantity: 3,
      value: 4650,
      occurredAt: new Date("2026-02-14T10:00:00.000Z")
    },
    {
      userId: ronaldo.id,
      ticker: "PETR4",
      assetType: AssetType.STOCK,
      type: TransactionType.SELL,
      quantity: 20,
      value: 760,
      occurredAt: new Date("2026-03-01T10:00:00.000Z")
    },
    {
      userId: ana.id,
      ticker: "BTC",
      assetType: AssetType.CRYPTO,
      type: TransactionType.BUY,
      quantity: 0.025,
      value: 16250,
      occurredAt: new Date("2026-03-07T10:00:00.000Z")
    }
  ] as const;

  for (const entry of entries) {
    await registerTransaction(prisma, entry.userId, entry);
  }
}

async function main() {
  await resetDatabase();
  await seedTransactions();
}

main()
  .then(async () => {
    console.log("Seed concluido com sucesso.");
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error("Falha ao executar seed.", error);
    await prisma.$disconnect();
    process.exit(1);
  });
