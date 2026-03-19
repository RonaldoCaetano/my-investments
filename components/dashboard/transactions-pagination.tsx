import type { DashboardSearchParams } from "@/lib/dashboard-filters";

interface TransactionsPaginationProps {
  currentPage: number;
  pageSize: number;
  totalCount: number;
  basePath: "/transactions";
  searchParams?: DashboardSearchParams;
}

function buildPageHref(
  basePath: string,
  searchParams: TransactionsPaginationProps["searchParams"],
  nextPage: number
) {
  const params = new URLSearchParams();

  if (searchParams) {
    for (const [key, value] of Object.entries(searchParams)) {
      if (!value || key === "page") {
        continue;
      }

      if (Array.isArray(value)) {
        for (const item of value) {
          params.append(key, item);
        }
      } else {
        params.set(key, value);
      }
    }
  }

  if (nextPage > 1) {
    params.set("page", String(nextPage));
  }

  const query = params.toString();

  return query ? `${basePath}?${query}` : basePath;
}

function getButtonClass(disabled: boolean) {
  return disabled
    ? "cursor-not-allowed rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-300"
    : "rounded-2xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50";
}

export function TransactionsPagination({
  currentPage,
  pageSize,
  totalCount,
  basePath,
  searchParams
}: TransactionsPaginationProps) {
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const previousPage = Math.max(1, currentPage - 1);
  const nextPage = Math.min(totalPages, currentPage + 1);

  return (
    <div className="flex flex-col gap-4 rounded-[2rem] border border-slate-200 bg-white/80 px-5 py-4 shadow-soft sm:flex-row sm:items-center sm:justify-between">
      <div className="text-sm text-slate-500">
        Pagina <strong>{currentPage}</strong> de <strong>{totalPages}</strong> com{" "}
        <strong>{totalCount}</strong> transacoes.
      </div>
      <div className="flex gap-3">
        {currentPage > 1 ? (
          <a className={getButtonClass(false)} href={buildPageHref(basePath, searchParams, previousPage)}>
            Anterior
          </a>
        ) : (
          <span className={getButtonClass(true)}>Anterior</span>
        )}
        {currentPage < totalPages ? (
          <a className={getButtonClass(false)} href={buildPageHref(basePath, searchParams, nextPage)}>
            Proxima
          </a>
        ) : (
          <span className={getButtonClass(true)}>Proxima</span>
        )}
      </div>
    </div>
  );
}
