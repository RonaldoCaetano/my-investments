import { z } from "zod";

import { ASSET_TYPES, TRANSACTION_TYPES } from "@/types/portfolio";

export const transactionPayloadSchema = z
  .object({
    assetId: z.string().cuid().optional(),
    ticker: z.string().trim().toUpperCase().min(1).max(12).optional(),
    assetType: z.enum(ASSET_TYPES).optional(),
    occurredAt: z.coerce.date().optional(),
    type: z.enum(TRANSACTION_TYPES),
    quantity: z.coerce
      .number()
      .positive("A quantidade precisa ser maior que zero."),
    value: z.coerce.number().positive("O valor precisa ser maior que zero.")
  })
  .superRefine((payload, ctx) => {
    const hasAssetReference = Boolean(payload.assetId);
    const hasAssetDefinition = Boolean(payload.ticker && payload.assetType);

    if (!hasAssetReference && !hasAssetDefinition) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["assetId"],
        message: "Informe assetId ou ticker + assetType para localizar o ativo."
      });
    }
  });

export type TransactionPayload = z.infer<typeof transactionPayloadSchema>;
