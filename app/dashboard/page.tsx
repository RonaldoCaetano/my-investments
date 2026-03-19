import { PrismaClientInitializationError } from "@prisma/client/runtime/library";

import { requireCurrentUser } from "@/lib/auth";
import {
  buildAssetWhere,
  buildTransactionWhere,
  getFirstValue,
  parseDashboardFilters,
  type DashboardFiltersState,
  type DashboardSearchParams
} from "@/lib/dashboard-filters";
import { prisma } from "@/lib/prisma";
import { AssetsTable } from "@/components/dashboard/assets-table";
import { DashboardFilters } from "@/components/dashboard/dashboard-filters";
import { SummaryCard } from "@/components/dashboard/summary-card";
import { TransactionForm } from "@/components/dashboard/transaction-form";
import { TransactionsHistory } from "@/components/dashboard/transactions-history";
import { AppHeader } from "@/components/navigation/app-header";
import type { DashboardAssetRow, DashboardTransactionRow } from "@/types/investments";
import type { KnownAssetReference } from "@/types/portfolio";

export const dynamic = "force-dynamic";

interface DashboardPageProps {
  searchParams?: DashboardSearchParams;
}

async function getDashboardData(
  userId: string,
  filters: DashboardFiltersState
): Promise<DashboardAssetRow[]> {
  try {
    return await prisma.asset.findMany({
      where: buildAssetWhere(userId, filters),
      orderBy: [
        {
          updatedAt: "desc"
        }
      ],
      select: {
        id: true,
        ticker: true,
        type: true,
        averagePrice: true,
        quantity: true,
        updatedAt: true,
        user: {
          select: {
            email: true,
            name: true
          }
        },
        transactions: {
          orderBy: {
            occurredAt: "desc"
          },
          take: 1,
          select: {
            id: true,
            type: true,
            quantity: true,
            value: true,
            occurredAt: true
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

async function getDashboardTransactions(
  userId: string,
  filters: DashboardFiltersState
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
      take: 12,
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

async function getKnownAssets(userId: string): Promise<KnownAssetReference[]> {
  try {
    return await prisma.asset.findMany({
      where: {
        userId
      },
      orderBy: [
        {
          ticker: "asc"
        }
      ],
      select: {
        id: true,
        ticker: true,
        type: true
      }
    });
  } catch (error) {
    if (error instanceof PrismaClientInitializationError) {
      return [];
    }

    throw error;
  }
}

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const user = await requireCurrentUser();
  const filters = parseDashboardFilters(searchParams);
  const [assets, transactions, knownAssets] = await Promise.all([
    getDashboardData(user.id, filters),
    getDashboardTransactions(user.id, filters),
    getKnownAssets(user.id)
  ]);
  const consolidatedCost = assets.reduce(
    (total, asset) => total + Number(asset.averagePrice) * Number(asset.quantity),
    0
  );
  const totalQuantity = assets.reduce((total, asset) => total + Number(asset.quantity), 0);

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-8 px-6 py-10 lg:px-8">
      <section className="grid gap-8">
        <AppHeader
          currentPath="/dashboard"
          description="Seus dados agora ficam isolados por conta autenticada, mantendo o deploy portavel so pela troca de DATABASE_URL."
          title="Carteira autenticada com sessao segura no servidor."
          user={user}
        />
        <SummaryCard
          totalAssets={assets.length}
          consolidatedCost={consolidatedCost}
          totalQuantity={totalQuantity}
        />
        <DashboardFilters
          assetType={filters.assetType ?? ""}
          dateFrom={getFirstValue(searchParams?.dateFrom) ?? ""}
          dateTo={getFirstValue(searchParams?.dateTo) ?? ""}
          ticker={filters.ticker ?? ""}
          transactionType={filters.transactionType ?? ""}
          mode="dashboard"
        />
      </section>
      <section className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <TransactionForm assets={knownAssets} />
        <div className="rounded-[2rem] border border-dashed border-sky-200 bg-sky-50/70 p-6">
          <p className="text-sm font-medium uppercase tracking-[0.28em] text-sky-700">
            Fluxo atual
          </p>
          <div className="mt-4 space-y-4 text-sm text-slate-600">
            <p>
              1. O formulario valida os dados com Zod antes do envio para a API REST autenticada.
            </p>
            <p>
              2. O servidor grava a transacao dentro de uma transacao Prisma e recalcula o preco
              medio com seguranca.
            </p>
            <p>
              3. O dashboard recarrega como Server Component, refletindo a carteira atualizada sem
              misturar dados entre usuarios nem montar queries SQL manualmente.
            </p>
          </div>
        </div>
      </section>
      <AssetsTable assets={assets} />
      <TransactionsHistory transactions={transactions} />
    </main>
  );
}
