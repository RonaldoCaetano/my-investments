import test, { after } from "node:test";
import assert from "node:assert/strict";

import { AssetType, TransactionType } from "@prisma/client";

import { deleteTransaction, registerTransaction, updateTransaction } from "../lib/portfolio";
import { prisma } from "../lib/prisma";
import { hashPassword } from "../lib/security";

interface TestContext {
  userId: string;
  email: string;
}

async function createTestContext(name: string): Promise<TestContext> {
  const email = `${name}-${Date.now()}-${Math.random().toString(16).slice(2)}@local.dev`;
  const user = await prisma.user.create({
    data: {
      email,
      name,
      passwordHash: hashPassword("Demo@1234")
    },
    select: {
      id: true,
      email: true
    }
  });

  return {
    userId: user.id,
    email: user.email
  };
}

async function cleanupTestContext(userId: string) {
  await prisma.session.deleteMany({
    where: {
      userId
    }
  });
  await prisma.transaction.deleteMany({
    where: {
      userId
    }
  });
  await prisma.asset.deleteMany({
    where: {
      userId
    }
  });
  await prisma.user.delete({
    where: {
      id: userId
    }
  });
}

test("registerTransaction recalcula preco medio corretamente em compras sucessivas", async () => {
  const context = await createTestContext("portfolio-buy-average");

  try {
    await registerTransaction(prisma, context.userId, {
      ticker: "PETR4",
      assetType: AssetType.STOCK,
      type: TransactionType.BUY,
      quantity: 10,
      value: 1000,
      occurredAt: new Date("2026-03-01T00:00:00.000Z")
    });

    await registerTransaction(prisma, context.userId, {
      ticker: "PETR4",
      assetType: AssetType.STOCK,
      type: TransactionType.BUY,
      quantity: 5,
      value: 600,
      occurredAt: new Date("2026-03-02T00:00:00.000Z")
    });

    const asset = await prisma.asset.findFirstOrThrow({
      where: {
        userId: context.userId,
        ticker: "PETR4"
      },
      select: {
        quantity: true,
        averagePrice: true
      }
    });

    assert.equal(asset.quantity.toFixed(4), "15.0000");
    assert.equal(asset.averagePrice.toFixed(4), "106.6667");
  } finally {
    await cleanupTestContext(context.userId);
  }
});

test("registerTransaction bloqueia venda acima da posicao atual", async () => {
  const context = await createTestContext("portfolio-invalid-sell");

  try {
    await registerTransaction(prisma, context.userId, {
      ticker: "VALE3",
      assetType: AssetType.STOCK,
      type: TransactionType.BUY,
      quantity: 3,
      value: 180,
      occurredAt: new Date("2026-03-01T00:00:00.000Z")
    });

    await assert.rejects(
      () =>
        registerTransaction(prisma, context.userId, {
          ticker: "VALE3",
          assetType: AssetType.STOCK,
          type: TransactionType.SELL,
          quantity: 5,
          value: 350,
          occurredAt: new Date("2026-03-03T00:00:00.000Z")
        }),
      /Quantidade de venda maior que a posicao atual\./
    );
  } finally {
    await cleanupTestContext(context.userId);
  }
});

test("updateTransaction recalcula o ativo ao alterar quantidade e valor", async () => {
  const context = await createTestContext("portfolio-update");

  try {
    const created = await registerTransaction(prisma, context.userId, {
      ticker: "ITSA4",
      assetType: AssetType.STOCK,
      type: TransactionType.BUY,
      quantity: 10,
      value: 1000,
      occurredAt: new Date("2026-03-01T00:00:00.000Z")
    });

    await updateTransaction(prisma, context.userId, created.transaction.id, {
      ticker: "ITSA4",
      assetType: AssetType.STOCK,
      type: TransactionType.BUY,
      quantity: 5,
      value: 650,
      occurredAt: new Date("2026-03-04T00:00:00.000Z")
    });

    const asset = await prisma.asset.findFirstOrThrow({
      where: {
        userId: context.userId,
        ticker: "ITSA4"
      },
      select: {
        quantity: true,
        averagePrice: true
      }
    });

    assert.equal(asset.quantity.toFixed(4), "5.0000");
    assert.equal(asset.averagePrice.toFixed(4), "130.0000");
  } finally {
    await cleanupTestContext(context.userId);
  }
});

test("updateTransaction movendo uma transacao para outro ativo recalcula origem e destino", async () => {
  const context = await createTestContext("portfolio-move-asset");

  try {
    const first = await registerTransaction(prisma, context.userId, {
      ticker: "ABEV3",
      assetType: AssetType.STOCK,
      type: TransactionType.BUY,
      quantity: 8,
      value: 120,
      occurredAt: new Date("2026-03-01T00:00:00.000Z")
    });

    await registerTransaction(prisma, context.userId, {
      ticker: "WEGE3",
      assetType: AssetType.STOCK,
      type: TransactionType.BUY,
      quantity: 2,
      value: 90,
      occurredAt: new Date("2026-03-02T00:00:00.000Z")
    });

    await updateTransaction(prisma, context.userId, first.transaction.id, {
      ticker: "WEGE3",
      assetType: AssetType.STOCK,
      type: TransactionType.BUY,
      quantity: 3,
      value: 150,
      occurredAt: new Date("2026-03-03T00:00:00.000Z")
    });

    const oldAsset = await prisma.asset.findFirst({
      where: {
        userId: context.userId,
        ticker: "ABEV3"
      }
    });
    const newAsset = await prisma.asset.findFirstOrThrow({
      where: {
        userId: context.userId,
        ticker: "WEGE3"
      },
      select: {
        quantity: true,
        averagePrice: true
      }
    });

    assert.equal(oldAsset, null);
    assert.equal(newAsset.quantity.toFixed(4), "5.0000");
    assert.equal(newAsset.averagePrice.toFixed(4), "48.0000");
  } finally {
    await cleanupTestContext(context.userId);
  }
});

test("deleteTransaction remove o ativo quando a ultima transacao e excluida", async () => {
  const context = await createTestContext("portfolio-delete-last");

  try {
    const created = await registerTransaction(prisma, context.userId, {
      ticker: "HGLG11",
      assetType: AssetType.FII,
      type: TransactionType.BUY,
      quantity: 4,
      value: 640,
      occurredAt: new Date("2026-03-01T00:00:00.000Z")
    });

    await deleteTransaction(prisma, context.userId, created.transaction.id);

    const assetCount = await prisma.asset.count({
      where: {
        userId: context.userId,
        ticker: "HGLG11"
      }
    });
    const transactionCount = await prisma.transaction.count({
      where: {
        userId: context.userId
      }
    });

    assert.equal(assetCount, 0);
    assert.equal(transactionCount, 0);
  } finally {
    await cleanupTestContext(context.userId);
  }
});

after(async () => {
  await prisma.$disconnect();
});
