import { ArrowUpRight, Wallet } from "lucide-react";

import { formatCurrency, formatQuantity } from "@/lib/formatters";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface SummaryCardProps {
  totalAssets: number;
  consolidatedCost: number;
  totalQuantity: number;
}

export function SummaryCard({
  totalAssets,
  consolidatedCost,
  totalQuantity
}: SummaryCardProps) {
  return (
    <Card className="overflow-hidden border-transparent bg-slate-950 text-slate-50">
      <CardHeader className="relative">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(56,189,248,0.32),transparent_36%),radial-gradient(circle_at_bottom_left,rgba(59,130,246,0.28),transparent_32%)]" />
        <div className="relative flex items-start justify-between">
          <div className="space-y-2">
            <CardDescription className="text-slate-300">Visao consolidada da carteira</CardDescription>
            <CardTitle className="text-2xl">Dashboard de investimentos</CardTitle>
          </div>
          <span className="rounded-full bg-white/10 p-3">
            <Wallet className="h-5 w-5" />
          </span>
        </div>
      </CardHeader>
      <CardContent className="relative grid gap-4 md:grid-cols-3">
        <div>
          <p className="text-sm text-slate-300">Custo total</p>
          <p className="mt-2 text-2xl font-semibold">{formatCurrency(consolidatedCost)}</p>
        </div>
        <div>
          <p className="text-sm text-slate-300">Ativos em carteira</p>
          <p className="mt-2 text-2xl font-semibold">{totalAssets}</p>
        </div>
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-sm text-slate-300">Quantidade total</p>
            <p className="mt-2 text-2xl font-semibold">{formatQuantity(totalQuantity)}</p>
          </div>
          <span className="inline-flex items-center gap-2 rounded-full bg-emerald-400/15 px-3 py-1 text-sm text-emerald-200">
            <ArrowUpRight className="h-4 w-4" />
            Pronto para escalar
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
