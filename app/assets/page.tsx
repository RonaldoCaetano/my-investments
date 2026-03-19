import { PrismaClientInitializationError } from "@prisma/client/runtime/library";

import { requireCurrentUser } from "@/lib/auth";
import {
  buildAssetWhere,
  getFirstValue,
  parseDashboardFilters,
  type DashboardSearchParams
} from "@/lib/dashboard-filters";
import { prisma } from "@/lib/prisma";
import { AssetsTable } from "@/components/dashboard/assets-table";
import { DashboardFilters } from "@/components/dashboard/dashboard-filters";
import { SummaryCard } from "@/components/dashboard/summary-card";
import { AppHeader } from "@/components/navigation/app-header";
import type { DashboardAssetRow } from "@/types/investments";

export const dynamic = "force-dynamic";

interface AssetsPageProps {
  searchParams?: DashboardSearchParams;
}

async function getAssets(userId: string, filters: ReturnType<typeof parseDashboardFilters>) {
  try {
    return await prisma.asset.findMany({
      where: buildAssetWhere(userId, filters),
      orderBy: [
        {
          ticker: "asc"
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
      return [] satisfies DashboardAssetRow[];
    }

    throw error;
  }
}

export default async function AssetsPage({ searchParams }: AssetsPageProps) {
  const user = await requireCurrentUser();
  const filters = parseDashboardFilters(searchParams);
  const assets = await getAssets(user.id, filters);
  const consolidatedCost = assets.reduce(
    (total, asset) => total + Number(asset.averagePrice) * Number(asset.quantity),
    0
  );
  const totalQuantity = assets.reduce((total, asset) => total + Number(asset.quantity), 0);

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-8 px-6 py-10 lg:px-8">
      <section className="grid gap-8">
        <AppHeader
          currentPath="/assets"
          description="Aqui voce tem uma visao dedicada apenas das posicoes atuais, sem misturar o historico operacional."
          title="Catalogo de ativos da carteira."
          user={user}
        />
        <SummaryCard
          totalAssets={assets.length}
          consolidatedCost={consolidatedCost}
          totalQuantity={totalQuantity}
        />
        <DashboardFilters
          actionPath="/assets"
          assetType={filters.assetType ?? ""}
          clearPath="/assets"
          dateFrom=""
          dateTo=""
          mode="assets"
          ticker={filters.ticker ?? ""}
          transactionType=""
        />
      </section>
      <AssetsTable assets={assets} />
      <section className="rounded-[2rem] border border-dashed border-slate-200 bg-white/80 p-6 text-sm text-slate-600">
        <p className="font-medium text-slate-800">Leitura dedicada para ativos</p>
        <p className="mt-3">
          Esta tela foca nas posicoes consolidadas. Use o dashboard principal quando quiser ver o
          historico de transacoes e operar a carteira.
        </p>
      </section>
    </main>
  );
}
