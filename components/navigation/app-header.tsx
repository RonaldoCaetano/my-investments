import Link from "next/link";

import type { AuthenticatedUser } from "@/lib/auth";
import { LogoutButton } from "@/components/auth/logout-button";

interface AppHeaderProps {
  currentPath: "/dashboard" | "/assets" | "/transactions";
  title: string;
  description: string;
  user: AuthenticatedUser;
}

function getLinkClass(isActive: boolean) {
  return isActive
    ? "rounded-2xl bg-slate-950 px-4 py-2 text-sm font-medium text-white"
    : "rounded-2xl px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100";
}

export function AppHeader({ currentPath, title, description, user }: AppHeaderProps) {
  return (
    <section className="grid gap-6">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div className="max-w-3xl space-y-3">
          <p className="text-sm font-medium uppercase tracking-[0.3em] text-sky-700">
            Next.js 14 + Prisma + PostgreSQL
          </p>
          <h1 className="text-4xl font-semibold tracking-tight text-slate-950">{title}</h1>
          <p className="text-base text-slate-600">
            Bem-vindo, <strong>{user.name ?? user.email}</strong>. {description}
          </p>
        </div>
        <div className="flex items-center justify-between gap-4 rounded-[2rem] border border-slate-200 bg-white/80 px-5 py-4 shadow-soft">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Sessao ativa</p>
            <p className="mt-1 text-sm font-medium text-slate-700">{user.email}</p>
          </div>
          <LogoutButton />
        </div>
      </div>
      <div className="flex flex-wrap gap-2 rounded-[2rem] border border-slate-200 bg-white/80 p-2 shadow-soft">
        <Link className={getLinkClass(currentPath === "/dashboard")} href={"/dashboard" as const}>
          Dashboard
        </Link>
        <Link className={getLinkClass(currentPath === "/assets")} href={"/assets" as const}>
          Ativos
        </Link>
        <Link
          className={getLinkClass(currentPath === "/transactions")}
          href={"/transactions" as const}
        >
          Transacoes
        </Link>
      </div>
    </section>
  );
}
