import type { AssetType, Prisma, TransactionType } from "@prisma/client";

export interface DashboardAssetRow {
  id: string;
  ticker: string;
  type: AssetType;
  averagePrice: Prisma.Decimal;
  quantity: Prisma.Decimal;
  updatedAt: Date;
  user: {
    email: string;
    name: string | null;
  };
  transactions: Array<{
    id: string;
    type: TransactionType;
    quantity: Prisma.Decimal;
    value: Prisma.Decimal;
    occurredAt: Date;
  }>;
}

export interface DashboardTransactionRow {
  id: string;
  occurredAt: Date;
  type: TransactionType;
  quantity: Prisma.Decimal;
  value: Prisma.Decimal;
  asset: {
    ticker: string;
    type: AssetType;
  };
  user: {
    email: string;
    name: string | null;
  };
}
