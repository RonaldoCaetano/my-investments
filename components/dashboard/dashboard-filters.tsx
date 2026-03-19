import Link from "next/link";

import { ASSET_TYPES, TRANSACTION_TYPES } from "@/types/portfolio";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";

interface DashboardFiltersProps {
  ticker: string;
  assetType: string;
  transactionType: string;
  dateFrom: string;
  dateTo: string;
  actionPath?: string;
  clearPath?: "/dashboard" | "/assets" | "/transactions";
  mode?: "dashboard" | "assets" | "transactions";
}

export function DashboardFilters({
  ticker,
  assetType,
  transactionType,
  dateFrom,
  dateTo,
  actionPath,
  clearPath = "/dashboard",
  mode = "dashboard"
}: DashboardFiltersProps) {
  const showTransactionFields = mode === "dashboard" || mode === "transactions";

  return (
    <Card>
      <CardHeader>
        <CardTitle>Filtros</CardTitle>
        <CardDescription>
          {showTransactionFields
            ? "Filtre a carteira por ticker e tipo. Os campos de movimento e periodo refinam o historico de transacoes."
            : "Filtre seus ativos por ticker e tipo para isolar rapidamente as posicoes desejadas."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={actionPath} className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <div className="space-y-2">
            <Label htmlFor="ticker">Ticker</Label>
            <Input defaultValue={ticker} id="ticker" name="ticker" placeholder="PETR4" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="assetType">Tipo do ativo</Label>
            <Select defaultValue={assetType} id="assetType" name="assetType">
              <option value="">Todos</option>
              {ASSET_TYPES.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </Select>
          </div>

          {showTransactionFields ? (
            <div className="space-y-2">
              <Label htmlFor="transactionType">Movimento</Label>
              <Select defaultValue={transactionType} id="transactionType" name="transactionType">
                <option value="">Todos</option>
                {TRANSACTION_TYPES.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </Select>
            </div>
          ) : null}

          {showTransactionFields ? (
            <div className="space-y-2">
              <Label htmlFor="dateFrom">De</Label>
              <Input defaultValue={dateFrom} id="dateFrom" name="dateFrom" type="date" />
            </div>
          ) : null}

          {showTransactionFields ? (
            <div className="space-y-2">
              <Label htmlFor="dateTo">Ate</Label>
              <Input defaultValue={dateTo} id="dateTo" name="dateTo" type="date" />
            </div>
          ) : null}

          <div className="flex flex-col gap-3 md:col-span-2 xl:col-span-5 xl:flex-row xl:justify-between">
            <p className="text-sm text-slate-500">
              Os filtros sao aplicados no servidor e enviados como query string no App Router.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button type="submit" variant="default">
                Aplicar filtros
              </Button>
              <Button asChild type="button" variant="outline">
                <Link href={clearPath}>Limpar</Link>
              </Button>
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
