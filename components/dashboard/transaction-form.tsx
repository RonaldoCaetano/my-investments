"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { LoaderCircle, PlusCircle } from "lucide-react";

import { formatCurrencyInput, parseCurrencyInput } from "@/lib/formatters";
import { transactionPayloadSchema } from "@/lib/validations/transaction";
import {
  ASSET_TYPES,
  type KnownAssetReference,
  TRANSACTION_TYPES,
  type TransactionApiError
} from "@/types/portfolio";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { useToast } from "@/components/ui/toast-provider";

interface TransactionFormProps {
  assets: KnownAssetReference[];
}

interface FormValues {
  ticker: string;
  assetType: (typeof ASSET_TYPES)[number];
  type: (typeof TRANSACTION_TYPES)[number];
  quantity: string;
  value: string;
  occurredAt: string;
}

type FieldErrors = Partial<Record<keyof FormValues | "assetId", string>>;

const defaultFormValues: FormValues = {
  ticker: "",
  assetType: "STOCK",
  type: "BUY",
  quantity: "",
  value: "",
  occurredAt: new Date().toISOString().slice(0, 10)
};

export function TransactionForm({ assets }: TransactionFormProps) {
  const router = useRouter();
  const { showToast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [values, setValues] = useState<FormValues>(defaultFormValues);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [requestError, setRequestError] = useState<string | null>(null);
  const [requestSuccess, setRequestSuccess] = useState<string | null>(null);

  function updateValue<K extends keyof FormValues>(field: K, nextValue: FormValues[K]) {
    setValues((current) => ({
      ...current,
      [field]: nextValue
    }));
    setFieldErrors((current) => ({
      ...current,
      [field]: undefined
    }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setRequestError(null);
    setRequestSuccess(null);

    const parsedPayload = transactionPayloadSchema.safeParse({
      ...values,
      ticker: values.ticker.trim().toUpperCase(),
      value: parseCurrencyInput(values.value),
      occurredAt: values.occurredAt || undefined
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

    setFieldErrors({});

    try {
      const response = await fetch("/api/transactions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(parsedPayload.data)
      });

      if (!response.ok) {
        const errorResponse = (await response.json()) as TransactionApiError;
        setRequestError(errorResponse.message);
        showToast({
          title: "Falha ao salvar transacao",
          description: errorResponse.message,
          variant: "error"
        });
        setFieldErrors((current) => ({
          ...current,
          ticker: errorResponse.issues?.fieldErrors?.ticker?.[0] ?? current.ticker,
          assetType: errorResponse.issues?.fieldErrors?.assetType?.[0] ?? current.assetType,
          quantity: errorResponse.issues?.fieldErrors?.quantity?.[0] ?? current.quantity,
          value: errorResponse.issues?.fieldErrors?.value?.[0] ?? current.value,
          assetId: errorResponse.issues?.fieldErrors?.assetId?.[0] ?? current.assetId
        }));
        return;
      }

      setRequestSuccess("Transacao registrada. Atualizando dashboard...");
      setValues(defaultFormValues);
      startTransition(() => {
        router.refresh();
      });
      showToast({
        title: "Transacao registrada",
        description: "A carteira foi atualizada com sucesso."
      });
    } catch {
      setRequestError("Nao foi possivel salvar a transacao agora.");
      showToast({
        title: "Falha ao salvar transacao",
        description: "Nao foi possivel salvar a transacao agora.",
        variant: "error"
      });
    }
  }

  return (
    <Card className="border-sky-100/90 bg-white/95">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <PlusCircle className="h-5 w-5 text-sky-600" />
          Nova transacao
        </CardTitle>
        <CardDescription>
          O preco medio e recalculado no servidor a cada compra, enquanto vendas validam a
          posicao atual antes de persistir.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <form className="grid gap-4 md:grid-cols-2" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <Label htmlFor="ticker">Ticker</Label>
            <Input
              id="ticker"
              placeholder="PETR4"
              value={values.ticker}
              onChange={(event) => updateValue("ticker", event.target.value.toUpperCase())}
            />
            {fieldErrors.ticker ? <p className="text-sm text-rose-600">{fieldErrors.ticker}</p> : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="assetType">Tipo do ativo</Label>
            <Select
              id="assetType"
              value={values.assetType}
              onChange={(event) =>
                updateValue("assetType", event.target.value as FormValues["assetType"])
              }
            >
              {ASSET_TYPES.map((assetType) => (
                <option key={assetType} value={assetType}>
                  {assetType}
                </option>
              ))}
            </Select>
            {fieldErrors.assetType ? (
              <p className="text-sm text-rose-600">{fieldErrors.assetType}</p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="type">Tipo de transacao</Label>
            <Select
              id="type"
              value={values.type}
              onChange={(event) => updateValue("type", event.target.value as FormValues["type"])}
            >
              {TRANSACTION_TYPES.map((transactionType) => (
                <option key={transactionType} value={transactionType}>
                  {transactionType}
                </option>
              ))}
            </Select>
            {fieldErrors.type ? <p className="text-sm text-rose-600">{fieldErrors.type}</p> : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="occurredAt">Data</Label>
            <Input
              id="occurredAt"
              type="date"
              value={values.occurredAt}
              onChange={(event) => updateValue("occurredAt", event.target.value)}
            />
            {fieldErrors.occurredAt ? (
              <p className="text-sm text-rose-600">{fieldErrors.occurredAt}</p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="quantity">Quantidade</Label>
            <Input
              id="quantity"
              type="number"
              step="0.0001"
              placeholder="100"
              value={values.quantity}
              onChange={(event) => updateValue("quantity", event.target.value)}
            />
            {fieldErrors.quantity ? (
              <p className="text-sm text-rose-600">{fieldErrors.quantity}</p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="value">Valor total da transacao</Label>
            <Input
              id="value"
              inputMode="numeric"
              placeholder="R$ 0,00"
              value={values.value}
              onChange={(event) => updateValue("value", formatCurrencyInput(event.target.value))}
            />
            {fieldErrors.value ? <p className="text-sm text-rose-600">{fieldErrors.value}</p> : null}
          </div>

          {fieldErrors.assetId ? (
            <p className="text-sm text-rose-600 md:col-span-2">{fieldErrors.assetId}</p>
          ) : null}

          {requestError ? (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 md:col-span-2">
              {requestError}
            </div>
          ) : null}

          {requestSuccess ? (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 md:col-span-2">
              {requestSuccess}
            </div>
          ) : null}

          <div className="md:col-span-2 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-slate-500">
              Para venda, informe o mesmo <strong>ticker</strong> e <strong>tipo</strong> usados na
              compra dentro da sua conta.
            </p>
            <Button className="min-w-44" disabled={isPending} type="submit">
              {isPending ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : null}
              Salvar transacao
            </Button>
          </div>
        </form>

        <div className="space-y-3 rounded-3xl bg-slate-50 p-4">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-medium text-slate-700">Ativos ja carregados</p>
            <span className="text-xs uppercase tracking-[0.2em] text-slate-400">
              {assets.length} ativos
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {assets.length === 0 ? (
              <span className="text-sm text-slate-500">
                Sua primeira transacao vai criar o ativo automaticamente.
              </span>
            ) : (
              assets.map((asset) => (
                <span
                  key={asset.id}
                  className="rounded-full border border-slate-200 bg-white px-3 py-1 text-sm text-slate-600"
                >
                  {asset.ticker} · {asset.type}
                </span>
              ))
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
