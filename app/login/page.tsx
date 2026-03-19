import { redirect } from "next/navigation";

import { AuthForm } from "@/components/auth/auth-form";
import { getCurrentUser } from "@/lib/auth";

export default async function LoginPage() {
  const user = await getCurrentUser();

  if (user) {
    redirect("/dashboard");
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col items-center justify-center gap-10 px-6 py-10 lg:flex-row lg:px-8">
      <section className="max-w-xl space-y-5">
        <p className="text-sm font-medium uppercase tracking-[0.3em] text-sky-700">
          Auth + Session Cookie
        </p>
        <h1 className="text-4xl font-semibold tracking-tight text-slate-950">
          Entre na sua carteira com autenticacao real no servidor.
        </h1>
        <p className="text-base text-slate-600">
          O app agora usa sessao com cookie <code>httpOnly</code>, senha com hash no servidor e
          escopo de dados por usuario autenticado.
        </p>
        <div className="rounded-[2rem] border border-dashed border-sky-200 bg-sky-50/70 p-6">
          <p className="text-sm font-medium text-sky-800">Credenciais de demonstração após seed</p>
          <div className="mt-3 space-y-2 text-sm text-slate-600">
            <p>
              <strong>Ronaldo:</strong> ronaldo@example.com / Demo@1234
            </p>
            <p>
              <strong>Ana:</strong> ana@example.com / Demo@1234
            </p>
          </div>
        </div>
      </section>
      <AuthForm />
    </main>
  );
}
