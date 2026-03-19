"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { LoaderCircle, Pencil, Trash2, X } from "lucide-react";

import { formatCurrency, formatCurrencyInput, parseCurrencyInput } from "@/lib/formatters";
import { transactionPayloadSchema } from "@/lib/validations/transaction";
import type {
  TransactionApiError,
  TransactionEditableSnapshot
} from "@/types/portfolio";
import { ASSET_TYPES, TRANSACTION_TYPES } from "@/types/portfolio";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { useToast } from "@/components/ui/toast-provider";

interface TransactionActionsProps {
  transaction: TransactionEditableSnapshot;
}

interface FormValues {
  ticker: string;
  assetType: TransactionEditableSnapshot["assetType"];
  type: TransactionEditableSnapshot["type"];
  quantity: string;
  value: string;
  occurredAt: string;
}

type FieldErrors = Partial<Record<keyof FormValues | "assetId", string>>;

function createInitialValues(transaction: TransactionEditableSnapshot): FormValues {
  return {
    ticker: transaction.ticker,
    assetType: transaction.assetType,
    type: transaction.type,
    quantity: transaction.quantity,
    value: formatCurrency(transaction.value),
    occurredAt: transaction.occurredAt
  };
}

export function TransactionActions({ transaction }: TransactionActionsProps) {
  const router = useRouter();
  const { showToast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [values, setValues] = useState<FormValues>(createInitialValues(transaction));
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [requestError, setRequestError] = useState<string | null>(null);

  function updateValue<K extends keyof FormValues>(field: K, value: FormValues[K]) {
    setValues((current) => ({
      ...current,
      [field]: value
    }));
    setFieldErrors((current) => ({
      ...current,
      [field]: undefined
    }));
  }

  function resetForm() {
    setValues(createInitialValues(transaction));
    setFieldErrors({});
    setRequestError(null);
    setIsEditing(false);
  }

  async function handleUpdate() {
    setRequestError(null);

    const parsedPayload = transactionPayloadSchema.safeParse({
      ...values,
      ticker: values.ticker.trim().toUpperCase(),
      value: parseCurrencyInput(values.value)
    });

    if (!parsedPayload.success) {
      const flattened = parsedPayload.error.flatten();
      setFieldErrors({
        ticker: flattened.fieldErrors.ticker?.[0],
        assetType: flattened.fieldErrors.assetType?.[0],
        type: flattened.fieldErrors.type?.[0],
        quantity: flattened.fieldErrors.quantity?.[0],
        value: flattened.fieldErrors.value?.[0],
        occurredAt: flattened.fieldErrors.occurredAt?.[0],
        assetId: flattened.fieldErrors.assetId?.[0]
      });
      return;
    }

    const response = await fetch(`/api/transactions/${transaction.id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(parsedPayload.data)
    });

    if (!response.ok) {
      const errorResponse = (await response.json()) as TransactionApiError;
      setRequestError(errorResponse.message);
      showToast({
        title: "Falha ao atualizar transacao",
        description: errorResponse.message,
        variant: "error"
      });
      return;
    }

    startTransition(() => {
      setIsEditing(false);
      router.refresh();
    });
    showToast({
      title: "Transacao atualizada",
      description: `${values.ticker} foi atualizada com sucesso.`
    });
  }

  async function handleDelete() {
    const confirmed = window.confirm("Deseja realmente excluir esta transacao?");

    if (!confirmed) {
      return;
    }

    setRequestError(null);

    const response = await fetch(`/api/transactions/${transaction.id}`, {
      method: "DELETE"
    });

    if (!response.ok) {
      const errorResponse = (await response.json()) as TransactionApiError;
      setRequestError(errorResponse.message);
      showToast({
        title: "Falha ao excluir transacao",
        description: errorResponse.message,
        variant: "error"
      });
      return;
    }

    startTransition(() => {
      router.refresh();
    });
    showToast({
      title: "Transacao excluida",
      description: `${transaction.ticker} foi removido do historico.`
    });
  }

  return (
    <div className="min-w-[240px] space-y-3">
      <div className="flex flex-wrap justify-end gap-2">
        <Button disabled={isPending} onClick={() => setIsEditing((current) => !current)} size="sm" type="button" variant="outline">
          <Pencil className="mr-2 h-4 w-4" />
          Editar
        </Button>
        <Button disabled={isPending} onClick={handleDelete} size="sm" type="button" variant="outline">
          {isPending ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
          Excluir
        </Button>
      </div>

      {isEditing ? (
        <div className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <div className="grid gap-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor={`ticker-${transaction.id}`}>Ticker</Label>
                <Input
                  id={`ticker-${transaction.id}`}
                  value={values.ticker}
                  onChange={(event) => updateValue("ticker", event.target.value.toUpperCase())}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor={`assetType-${transaction.id}`}>Tipo</Label>
                <Select
                  id={`assetType-${transaction.id}`}
                  value={values.assetType}
                  onChange={(event) =>
                    updateValue("assetType", event.target.value as FormValues["assetType"])
                  }
                >
                  {ASSET_TYPES.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </Select>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor={`type-${transaction.id}`}>Movimento</Label>
                <Select
                  id={`type-${transaction.id}`}
                  value={values.type}
                  onChange={(event) => updateValue("type", event.target.value as FormValues["type"])}
                >
                  {TRANSACTION_TYPES.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor={`occurredAt-${transaction.id}`}>Data</Label>
                <Input
                  id={`occurredAt-${transaction.id}`}
                  type="date"
                  value={values.occurredAt}
                  onChange={(event) => updateValue("occurredAt", event.target.value)}
                />
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor={`quantity-${transaction.id}`}>Quantidade</Label>
                <Input
                  id={`quantity-${transaction.id}`}
                  step="0.0001"
                  type="number"
                  value={values.quantity}
                  onChange={(event) => updateValue("quantity", event.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor={`value-${transaction.id}`}>Valor</Label>
                <Input
                  id={`value-${transaction.id}`}
                  inputMode="numeric"
                  value={values.value}
                  onChange={(event) => updateValue("value", formatCurrencyInput(event.target.value))}
                />
              </div>
            </div>
          </div>

          {Object.values(fieldErrors).find(Boolean) ? (
            <div className="space-y-1">
              {Object.values(fieldErrors)
                .filter(Boolean)
                .map((error) => (
                  <p key={error} className="text-sm text-rose-600">
                    {error}
                  </p>
                ))}
            </div>
          ) : null}

          {requestError ? (
            <p className="text-sm text-rose-600">{requestError}</p>
          ) : null}

          <div className="flex flex-wrap justify-end gap-2">
            <Button disabled={isPending} onClick={resetForm} size="sm" type="button" variant="outline">
              <X className="mr-2 h-4 w-4" />
              Cancelar
            </Button>
            <Button disabled={isPending} onClick={handleUpdate} size="sm" type="button">
              {isPending ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : <Pencil className="mr-2 h-4 w-4" />}
              Salvar
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
