import { Prisma, type Asset, type PrismaClient, TransactionType } from "@prisma/client";

import type { TransactionPayload } from "@/lib/validations/transaction";
import type {
  TransactionEditableSnapshot,
  TransactionMutationResult
} from "@/types/portfolio";

const ZERO = new Prisma.Decimal(0);

function calculateUpdatedAsset(
  asset: Pick<Asset, "averagePrice" | "quantity">,
  transactionType: TransactionType,
  quantity: Prisma.Decimal,
  value: Prisma.Decimal
) {
  const currentQuantity = new Prisma.Decimal(asset.quantity);
  const currentAveragePrice = new Prisma.Decimal(asset.averagePrice);

  if (transactionType === TransactionType.BUY) {
    const nextQuantity = currentQuantity.plus(quantity);
    const nextAveragePrice = currentQuantity.equals(ZERO)
      ? value.div(quantity)
      : currentAveragePrice.times(currentQuantity).plus(value).div(nextQuantity);

    return {
      averagePrice: nextAveragePrice,
      quantity: nextQuantity
    };
  }

  if (currentQuantity.lessThan(quantity)) {
    throw new Error("Quantidade de venda maior que a posicao atual.");
  }

  const nextQuantity = currentQuantity.minus(quantity);

  return {
    averagePrice: nextQuantity.equals(ZERO) ? ZERO : currentAveragePrice,
    quantity: nextQuantity
  };
}

async function resolveAsset(
  prisma: Prisma.TransactionClient,
  payload: TransactionPayload,
  userId: string
) {
  if (payload.assetId) {
    const asset = await prisma.asset.findFirst({
      where: {
        id: payload.assetId,
        userId
      }
    });

    if (!asset) {
      throw new Error("Ativo nao encontrado para o usuario informado.");
    }

    return asset;
  }

  return prisma.asset.upsert({
    where: {
      userId_ticker_type: {
        userId,
        ticker: payload.ticker!,
        type: payload.assetType!
      }
    },
    update: {},
    create: {
      userId,
      ticker: payload.ticker!,
      type: payload.assetType!,
      averagePrice: ZERO,
      quantity: ZERO
    }
  });
}

function serializeDecimal(value: Prisma.Decimal) {
  return value.toFixed(4);
}

function serializeTransactionSnapshot(transaction: {
  id: string;
  occurredAt: Date;
  type: TransactionType;
  quantity: Prisma.Decimal;
  value: Prisma.Decimal;
  asset: {
    ticker: string;
    type: Asset["type"];
  };
}): TransactionEditableSnapshot {
  return {
    id: transaction.id,
    occurredAt: transaction.occurredAt.toISOString().slice(0, 10),
    ticker: transaction.asset.ticker,
    assetType: transaction.asset.type,
    type: transaction.type,
    quantity: serializeDecimal(transaction.quantity),
    value: serializeDecimal(transaction.value)
  };
}

async function recomputeAssetPosition(prisma: Prisma.TransactionClient, assetId: string) {
  const asset = await prisma.asset.findUnique({
    where: {
      id: assetId
    },
    select: {
      id: true
    }
  });

  if (!asset) {
    return null;
  }

  const transactions = await prisma.transaction.findMany({
    where: {
      assetId
    },
    orderBy: [
      {
        occurredAt: "asc"
      },
      {
        createdAt: "asc"
      }
    ],
    select: {
      type: true,
      quantity: true,
      value: true
    }
  });

  if (transactions.length === 0) {
    await prisma.asset.delete({
      where: {
        id: assetId
      }
    });

    return null;
  }

  let currentState: Pick<Asset, "averagePrice" | "quantity"> = {
    averagePrice: ZERO,
    quantity: ZERO
  };

  for (const transaction of transactions) {
    currentState = calculateUpdatedAsset(
      currentState,
      transaction.type,
      new Prisma.Decimal(transaction.quantity),
      new Prisma.Decimal(transaction.value)
    );
  }

  return prisma.asset.update({
    where: {
      id: assetId
    },
    data: {
      averagePrice: currentState.averagePrice,
      quantity: currentState.quantity
    }
  });
}

async function recomputeAffectedAssets(prisma: Prisma.TransactionClient, assetIds: string[]) {
  const uniqueAssetIds = [...new Set(assetIds)];

  for (const assetId of uniqueAssetIds) {
    await recomputeAssetPosition(prisma, assetId);
  }
}

export async function registerTransaction(
  prismaClient: PrismaClient,
  userId: string,
  payload: TransactionPayload
): Promise<TransactionMutationResult> {
  return prismaClient.$transaction(async (transaction) => {
    const user = await transaction.user.findUnique({
      where: {
        id: userId
      }
    });

    if (!user) {
      throw new Error("Usuario autenticado nao encontrado.");
    }

    const asset = await resolveAsset(transaction, payload, user.id);
    const quantity = new Prisma.Decimal(payload.quantity);
    const value = new Prisma.Decimal(payload.value);
    const nextAsset = calculateUpdatedAsset(asset, payload.type, quantity, value);

    const savedTransaction = await transaction.transaction.create({
      data: {
        assetId: asset.id,
        userId: user.id,
        occurredAt: payload.occurredAt ?? new Date(),
        type: payload.type,
        quantity,
        value
      }
    });

    const updatedAsset = await transaction.asset.update({
      where: {
        id: asset.id
      },
      data: {
        averagePrice: nextAsset.averagePrice,
        quantity: nextAsset.quantity
      }
    });

    return {
      asset: {
        id: updatedAsset.id,
        ticker: updatedAsset.ticker,
        type: updatedAsset.type,
        averagePrice: serializeDecimal(updatedAsset.averagePrice),
        quantity: serializeDecimal(updatedAsset.quantity)
      },
      transaction: {
        id: savedTransaction.id,
        type: savedTransaction.type,
        occurredAt: savedTransaction.occurredAt.toISOString(),
        quantity: serializeDecimal(savedTransaction.quantity),
        value: serializeDecimal(savedTransaction.value)
      }
    };
  });
}

export async function updateTransaction(
  prismaClient: PrismaClient,
  userId: string,
  transactionId: string,
  payload: TransactionPayload
): Promise<{ transaction: TransactionEditableSnapshot }> {
  return prismaClient.$transaction(async (transaction) => {
    const existingTransaction = await transaction.transaction.findFirst({
      where: {
        id: transactionId,
        userId
      },
      include: {
        asset: true
      }
    });

    if (!existingTransaction) {
      throw new Error("Transacao nao encontrada.");
    }

    const targetAsset = await resolveAsset(transaction, payload, userId);
    const updatedTransaction = await transaction.transaction.update({
      where: {
        id: transactionId
      },
      data: {
        assetId: targetAsset.id,
        occurredAt: payload.occurredAt ?? existingTransaction.occurredAt,
        type: payload.type,
        quantity: new Prisma.Decimal(payload.quantity),
        value: new Prisma.Decimal(payload.value)
      },
      include: {
        asset: {
          select: {
            ticker: true,
            type: true
          }
        }
      }
    });

    await recomputeAffectedAssets(transaction, [existingTransaction.assetId, targetAsset.id]);

    return {
      transaction: serializeTransactionSnapshot(updatedTransaction)
    };
  });
}

export async function deleteTransaction(
  prismaClient: PrismaClient,
  userId: string,
  transactionId: string
): Promise<{ deletedTransactionId: string }> {
  return prismaClient.$transaction(async (transaction) => {
    const existingTransaction = await transaction.transaction.findFirst({
      where: {
        id: transactionId,
        userId
      },
      select: {
        id: true,
        assetId: true
      }
    });

    if (!existingTransaction) {
      throw new Error("Transacao nao encontrada.");
    }

    await transaction.transaction.delete({
      where: {
        id: existingTransaction.id
      }
    });

    await recomputeAffectedAssets(transaction, [existingTransaction.assetId]);

    return {
      deletedTransactionId: existingTransaction.id
    };
  });
}
