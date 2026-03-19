import type { DashboardAssetRow } from "@/types/investments";
import { formatCurrency, formatDate, formatQuantity } from "@/lib/formatters";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";

interface AssetsTableProps {
  assets: DashboardAssetRow[];
}

export function AssetsTable({ assets }: AssetsTableProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Posicoes atuais</CardTitle>
        <CardDescription>
          Dados carregados no servidor com Prisma e renderizados via Server Components.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Ticker</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead className="text-right">Quantidade</TableHead>
              <TableHead className="text-right">Preco Medio</TableHead>
              <TableHead className="text-right">Custo Total</TableHead>
              <TableHead>Ultima Movimentacao</TableHead>
              <TableHead>Responsavel</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {assets.length === 0 ? (
              <TableRow>
                <TableCell className="py-10 text-center text-muted-foreground" colSpan={7}>
                  Nenhum ativo encontrado. Envie uma transacao para popular o dashboard.
                </TableCell>
              </TableRow>
            ) : (
              assets.map((asset) => {
                const averagePrice = Number(asset.averagePrice);
                const quantity = Number(asset.quantity);
                const totalCost = averagePrice * quantity;
                const lastTransaction = asset.transactions[0];

                return (
                  <TableRow key={asset.id}>
                    <TableCell className="font-medium">{asset.ticker}</TableCell>
                    <TableCell>{asset.type}</TableCell>
                    <TableCell className="text-right">{formatQuantity(quantity)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(averagePrice)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(totalCost)}</TableCell>
                    <TableCell>
                      {lastTransaction
                        ? `${lastTransaction.type} em ${formatDate(lastTransaction.occurredAt)}`
                        : "Sem transacoes"}
                    </TableCell>
                    <TableCell>{asset.user.name ?? asset.user.email}</TableCell>
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
