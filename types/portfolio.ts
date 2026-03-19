export const ASSET_TYPES = ["STOCK", "FII", "ETF", "BOND", "CRYPTO", "CASH"] as const;

export const TRANSACTION_TYPES = ["BUY", "SELL"] as const;

export type AssetTypeValue = (typeof ASSET_TYPES)[number];

export type TransactionTypeValue = (typeof TRANSACTION_TYPES)[number];

export interface TransactionMutationResult {
  asset: {
    id: string;
    ticker: string;
    type: AssetTypeValue;
    averagePrice: string;
    quantity: string;
  };
  transaction: {
    id: string;
    type: TransactionTypeValue;
    occurredAt: string;
    quantity: string;
    value: string;
  };
}

export interface TransactionEditableSnapshot {
  id: string;
  occurredAt: string;
  ticker: string;
  assetType: AssetTypeValue;
  type: TransactionTypeValue;
  quantity: string;
  value: string;
}

export interface TransactionApiError {
  message: string;
  issues?: {
    fieldErrors?: Record<string, string[] | undefined>;
    formErrors?: string[];
  };
}

export interface KnownAssetReference {
  id: string;
  ticker: string;
  type: AssetTypeValue;
}
