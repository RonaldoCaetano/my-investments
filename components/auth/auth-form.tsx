"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { LockKeyhole, LogIn, UserPlus } from "lucide-react";

import type { AuthApiError } from "@/types/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type AuthMode = "login" | "register";

interface AuthFormValues {
  name: string;
  email: string;
  password: string;
}

interface AuthFormProps {
  defaultMode?: AuthMode;
}

const defaultValues: AuthFormValues = {
  name: "",
  email: "",
  password: ""
};

export function AuthForm({ defaultMode = "login" }: AuthFormProps) {
  const router = useRouter();
  const [mode, setMode] = useState<AuthMode>(defaultMode);
  const [values, setValues] = useState<AuthFormValues>(defaultValues);
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof AuthFormValues, string>>>({});
  const [requestError, setRequestError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function updateValue<K extends keyof AuthFormValues>(field: K, value: AuthFormValues[K]) {
    setValues((current) => ({
      ...current,
      [field]: value
    }));
    setFieldErrors((current) => ({
      ...current,
      [field]: undefined
    }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setRequestError(null);

    const endpoint = mode === "login" ? "/api/auth/login" : "/api/auth/register";
    const payload =
      mode === "login"
        ? {
            email: values.email,
            password: values.password
          }
        : {
            name: values.name,
            email: values.email,
            password: values.password
          };

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorResponse = (await response.json()) as AuthApiError;
      setRequestError(errorResponse.message);
      setFieldErrors({
        name: errorResponse.issues?.fieldErrors?.name?.[0],
        email: errorResponse.issues?.fieldErrors?.email?.[0],
        password: errorResponse.issues?.fieldErrors?.password?.[0]
      });
      return;
    }

    startTransition(() => {
      router.push("/dashboard");
      router.refresh();
    });
  }

  return (
    <Card className="w-full max-w-md border-sky-100/90 bg-white/95">
      <CardHeader className="space-y-4">
        <div className="flex items-center gap-3">
          <span className="rounded-2xl bg-sky-100 p-3 text-sky-700">
            <LockKeyhole className="h-5 w-5" />
          </span>
          <div>
            <CardTitle>{mode === "login" ? "Entrar" : "Criar conta"}</CardTitle>
            <CardDescription>
              {mode === "login"
                ? "Acesse sua carteira e registre novas transacoes."
                : "Crie sua conta para salvar sua carteira com sessao segura."}
            </CardDescription>
          </div>
        </div>
        <div className="grid grid-cols-2 rounded-2xl bg-slate-100 p-1">
          <button
            className={
              mode === "login"
                ? "rounded-2xl bg-white px-4 py-2 text-sm font-medium text-slate-900 shadow-sm"
                : "rounded-2xl px-4 py-2 text-sm font-medium text-slate-500"
            }
            onClick={() => setMode("login")}
            type="button"
          >
            Login
          </button>
          <button
            className={
              mode === "register"
                ? "rounded-2xl bg-white px-4 py-2 text-sm font-medium text-slate-900 shadow-sm"
                : "rounded-2xl px-4 py-2 text-sm font-medium text-slate-500"
            }
            onClick={() => setMode("register")}
            type="button"
          >
            Cadastro
          </button>
        </div>
      </CardHeader>
      <CardContent>
        <form className="space-y-4" onSubmit={handleSubmit}>
          {mode === "register" ? (
            <div className="space-y-2">
              <Label htmlFor="name">Nome</Label>
              <Input
                id="name"
                placeholder="Jhon Doe"
                value={values.name}
                onChange={(event) => updateValue("name", event.target.value)}
              />
              {fieldErrors.name ? <p className="text-sm text-rose-600">{fieldErrors.name}</p> : null}
            </div>
          ) : null}

          <div className="space-y-2">
            <Label htmlFor="email">E-mail</Label>
            <Input
              id="email"
              type="email"
              placeholder="voce@exemplo.com"
              value={values.email}
              onChange={(event) => updateValue("email", event.target.value)}
            />
            {fieldErrors.email ? <p className="text-sm text-rose-600">{fieldErrors.email}</p> : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Senha</Label>
            <Input
              id="password"
              type="password"
              placeholder="Sua senha"
              value={values.password}
              onChange={(event) => updateValue("password", event.target.value)}
            />
            {fieldErrors.password ? (
              <p className="text-sm text-rose-600">{fieldErrors.password}</p>
            ) : null}
          </div>

          {requestError ? (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {requestError}
            </div>
          ) : null}

          <Button className="w-full" disabled={isPending} type="submit">
            {mode === "login" ? <LogIn className="mr-2 h-4 w-4" /> : <UserPlus className="mr-2 h-4 w-4" />}
            {mode === "login" ? "Entrar na carteira" : "Criar conta"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
