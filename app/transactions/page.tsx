import { PrismaClientInitializationError } from "@prisma/client/runtime/library";

import { requireCurrentUser } from "@/lib/auth";
import {
  buildTransactionWhere,
  getFirstValue,
  parseDashboardFilters,
  type DashboardSearchParams
} from "@/lib/dashboard-filters";
import { prisma } from "@/lib/prisma";
import { DashboardFilters } from "@/components/dashboard/dashboard-filters";
import { TransactionsHistory } from "@/components/dashboard/transactions-history";
import { TransactionsPagination } from "@/components/dashboard/transactions-pagination";
import { AppHeader } from "@/components/navigation/app-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { DashboardTransactionRow } from "@/types/investments";

export const dynamic = "force-dynamic";
const PAGE_SIZE = 12;

interface TransactionsPageProps {
  searchParams?: DashboardSearchParams;
}

async function getTransactions(
  userId: string,
  filters: ReturnType<typeof parseDashboardFilters>,
  page: number
): Promise<DashboardTransactionRow[]> {
  try {
    return await prisma.transaction.findMany({
      where: buildTransactionWhere(userId, filters),
      orderBy: [
        {
          occurredAt: "desc"
        },
        {
          createdAt: "desc"
        }
      ],
      take: PAGE_SIZE,
      skip: (page - 1) * PAGE_SIZE,
      select: {
        id: true,
        occurredAt: true,
        type: true,
        quantity: true,
        value: true,
        asset: {
          select: {
            ticker: true,
            type: true
          }
        },
        user: {
          select: {
            email: true,
            name: true
          }
        }
      }
    });
  } catch (error) {
    if (error instanceof PrismaClientInitializationError) {
      return [];
    }

    throw error;
  }
}

async function getTransactionsCount(
  userId: string,
  filters: ReturnType<typeof parseDashboardFilters>
) {
  try {
    return await prisma.transaction.count({
      where: buildTransactionWhere(userId, filters)
    });
  } catch (error) {
    if (error instanceof PrismaClientInitializationError) {
      return 0;
    }

    throw error;
  }
}

export default async function TransactionsPage({ searchParams }: TransactionsPageProps) {
  const user = await requireCurrentUser();
  const filters = parseDashboardFilters(searchParams);
  const currentPage = Math.max(1, Number(getFirstValue(searchParams?.page) ?? "1") || 1);
  const [transactions, totalCount] = await Promise.all([
    getTransactions(user.id, filters, currentPage),
    getTransactionsCount(user.id, filters)
  ]);
  const totalValue = transactions.reduce((sum, transaction) => sum + Number(transaction.value), 0);
  const totalQuantity = transactions.reduce(
    (sum, transaction) => sum + Number(transaction.quantity),
    0
  );
  const uniqueTickers = new Set(transactions.map((transaction) => transaction.asset.ticker)).size;

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-8 px-6 py-10 lg:px-8">
      <section className="grid gap-8">
        <AppHeader
          currentPath="/transactions"
          description="Aqui voce acompanha o fluxo operacional da carteira com filtros dedicados para movimento e periodo."
          title="Historico completo de transacoes."
          user={user}
        />
        <Card className="border-slate-200 bg-white/90">
          <CardHeader>
            <CardTitle>Resumo operacional</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-3">
            <div>
              <p className="text-sm text-slate-500">Transacoes listadas</p>
              <p className="mt-2 text-2xl font-semibold text-slate-900">{transactions.length}</p>
            </div>
            <div>
              <p className="text-sm text-slate-500">Ativos envolvidos</p>
              <p className="mt-2 text-2xl font-semibold text-slate-900">{uniqueTickers}</p>
            </div>
            <div>
              <p className="text-sm text-slate-500">Volume financeiro</p>
              <p className="mt-2 text-2xl font-semibold text-slate-900">
                {new Intl.NumberFormat("pt-BR", {
                  style: "currency",
                  currency: "BRL"
                }).format(totalValue)}
              </p>
              <p className="mt-1 text-sm text-slate-500">
                Quantidade total:{" "}
                {new Intl.NumberFormat("pt-BR", {
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 4
                }).format(totalQuantity)}
              </p>
            </div>
          </CardContent>
        </Card>
        <DashboardFilters
          actionPath="/transactions"
          assetType={filters.assetType ?? ""}
          clearPath="/transactions"
          dateFrom={getFirstValue(searchParams?.dateFrom) ?? ""}
          dateTo={getFirstValue(searchParams?.dateTo) ?? ""}
          mode="transactions"
          ticker={filters.ticker ?? ""}
          transactionType={filters.transactionType ?? ""}
        />
      </section>
      <TransactionsHistory transactions={transactions} />
      <TransactionsPagination
        basePath="/transactions"
        currentPage={currentPage}
        pageSize={PAGE_SIZE}
        searchParams={searchParams}
        totalCount={totalCount}
      />
      {transactions.length === 0 ? (
        <section className="rounded-[2rem] border border-dashed border-slate-200 bg-white/80 p-6 text-sm text-slate-600">
          <p className="font-medium text-slate-800">Nada para mostrar com esses filtros</p>
          <p className="mt-3">
            Ajuste o periodo, ticker ou tipo de movimento para localizar transacoes especificas, ou
            volte ao dashboard para registrar novas operacoes.
          </p>
        </section>
      ) : null}
    </main>
  );
}
