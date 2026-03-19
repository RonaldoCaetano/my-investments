import { ArrowDownLeft, ArrowUpRight } from "lucide-react";

import { formatCurrency, formatDate, formatQuantity } from "@/lib/formatters";
import type { DashboardTransactionRow } from "@/types/investments";
import { TransactionActions } from "@/components/dashboard/transaction-actions";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";

interface TransactionsHistoryProps {
  transactions: DashboardTransactionRow[];
  title?: string;
  description?: string;
  emptyMessage?: string;
}

export function TransactionsHistory({
  transactions,
  title = "Historico de transacoes",
  description = "Ultimas movimentacoes persistidas no PostgreSQL, carregadas diretamente com Prisma.",
  emptyMessage = "Nenhuma transacao registrada ainda."
}: TransactionsHistoryProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Data</TableHead>
              <TableHead>Movimento</TableHead>
              <TableHead>Ativo</TableHead>
              <TableHead className="text-right">Quantidade</TableHead>
              <TableHead className="text-right">Valor</TableHead>
              <TableHead>Investidor</TableHead>
              <TableHead className="text-right">Acoes</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {transactions.length === 0 ? (
              <TableRow>
                <TableCell className="py-10 text-center text-muted-foreground" colSpan={7}>
                  {emptyMessage}
                </TableCell>
              </TableRow>
            ) : (
              transactions.map((transaction) => {
                const isBuy = transaction.type === "BUY";
                const quantity = Number(transaction.quantity);
                const value = Number(transaction.value);

                return (
                  <TableRow key={transaction.id}>
                    <TableCell>{formatDate(transaction.occurredAt)}</TableCell>
                    <TableCell>
                      <span
                        className={
                          isBuy
                            ? "inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700"
                            : "inline-flex items-center gap-2 rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700"
                        }
                      >
                        {isBuy ? (
                          <ArrowDownLeft className="h-4 w-4" />
                        ) : (
                          <ArrowUpRight className="h-4 w-4" />
                        )}
                        {transaction.type}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{transaction.asset.ticker}</div>
                      <div className="text-xs text-muted-foreground">{transaction.asset.type}</div>
                    </TableCell>
                    <TableCell className="text-right">
                      {formatQuantity(quantity)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(value)}
                    </TableCell>
                    <TableCell>{transaction.user.name ?? transaction.user.email}</TableCell>
                    <TableCell className="align-top">
                      <TransactionActions
                        transaction={{
                          id: transaction.id,
                          occurredAt: transaction.occurredAt.toISOString().slice(0, 10),
                          ticker: transaction.asset.ticker,
                          assetType: transaction.asset.type,
                          type: transaction.type,
                          quantity: transaction.quantity.toFixed(4),
                          value: transaction.value.toFixed(4)
                        }}
                      />
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
