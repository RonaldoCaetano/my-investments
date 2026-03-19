import type { AssetType, TransactionType } from "@prisma/client";

import { ASSET_TYPES, TRANSACTION_TYPES } from "@/types/portfolio";

export interface DashboardFiltersState {
  ticker?: string;
  assetType?: AssetType;
  transactionType?: TransactionType;
  dateFrom?: Date;
  dateTo?: Date;
}

export interface DashboardSearchParams {
  ticker?: string | string[];
  assetType?: string | string[];
  transactionType?: string | string[];
  dateFrom?: string | string[];
  dateTo?: string | string[];
  page?: string | string[];
}

export function getFirstValue(value?: string | string[]) {
  return Array.isArray(value) ? value[0] : value;
}

function parseDateBoundary(value: string | undefined, endOfDay = false) {
  if (!value) {
    return undefined;
  }

  const date = new Date(`${value}T${endOfDay ? "23:59:59.999" : "00:00:00.000"}Z`);

  return Number.isNaN(date.getTime()) ? undefined : date;
}

export function parseDashboardFilters(searchParams?: DashboardSearchParams): DashboardFiltersState {
  const ticker = getFirstValue(searchParams?.ticker)?.trim().toUpperCase();
  const assetTypeValue = getFirstValue(searchParams?.assetType);
  const transactionTypeValue = getFirstValue(searchParams?.transactionType);
  const assetType = ASSET_TYPES.includes(assetTypeValue as AssetType)
    ? (assetTypeValue as AssetType)
    : undefined;
  const transactionType = TRANSACTION_TYPES.includes(transactionTypeValue as TransactionType)
    ? (transactionTypeValue as TransactionType)
    : undefined;

  return {
    ticker: ticker || undefined,
    assetType,
    transactionType,
    dateFrom: parseDateBoundary(getFirstValue(searchParams?.dateFrom)),
    dateTo: parseDateBoundary(getFirstValue(searchParams?.dateTo), true)
  };
}

export function buildAssetWhere(userId: string, filters: DashboardFiltersState) {
  return {
    userId,
    ticker: filters.ticker
      ? {
          contains: filters.ticker,
          mode: "insensitive" as const
        }
      : undefined,
    type: filters.assetType
  };
}

export function buildTransactionWhere(userId: string, filters: DashboardFiltersState) {
  return {
    userId,
    type: filters.transactionType,
    occurredAt:
      filters.dateFrom || filters.dateTo
        ? {
            gte: filters.dateFrom,
            lte: filters.dateTo
          }
        : undefined,
    asset: {
      ticker: filters.ticker
        ? {
            contains: filters.ticker,
            mode: "insensitive" as const
          }
        : undefined,
      type: filters.assetType
    }
  };
}
