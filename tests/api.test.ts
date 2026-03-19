import { after, before, test } from "node:test";
import assert from "node:assert/strict";
import { spawn, type ChildProcessWithoutNullStreams } from "node:child_process";
import { setTimeout as delay } from "node:timers/promises";

import { prisma } from "../lib/prisma";
import { hashPassword } from "../lib/security";

const TEST_PORT = 3101;
const BASE_URL = `http://127.0.0.1:${TEST_PORT}`;

let serverProcess: ChildProcessWithoutNullStreams | null = null;

async function waitForServerReady() {
  for (let attempt = 0; attempt < 60; attempt += 1) {
    try {
      const response = await fetch(`${BASE_URL}/login`, {
        redirect: "manual"
      });

      if (response.status === 200) {
        return;
      }
    } catch {
      // Server still booting.
    }

    await delay(500);
  }

  throw new Error("Servidor de teste nao iniciou a tempo.");
}

function extractCookie(response: Response) {
  const setCookie = response.headers.get("set-cookie");

  if (!setCookie) {
    throw new Error("Resposta sem cookie de sessao.");
  }

  return setCookie.split(";")[0];
}

async function cleanupUserByEmail(email: string) {
  const user = await prisma.user.findUnique({
    where: {
      email
    },
    select: {
      id: true
    }
  });

  if (!user) {
    return;
  }

  await prisma.session.deleteMany({
    where: {
      userId: user.id
    }
  });
  await prisma.transaction.deleteMany({
    where: {
      userId: user.id
    }
  });
  await prisma.asset.deleteMany({
    where: {
      userId: user.id
    }
  });
  await prisma.user.delete({
    where: {
      id: user.id
    }
  });
}

before(async () => {
  serverProcess = spawn(
    "zsh",
    [
      "-lc",
      `source ~/.nvm/nvm.sh && NEXT_TELEMETRY_DISABLED=1 npm run dev -- --hostname 127.0.0.1 --port ${TEST_PORT}`
    ],
    {
      cwd: process.cwd(),
      env: process.env,
      stdio: "pipe"
    }
  );

  serverProcess.stdout.on("data", () => {});
  serverProcess.stderr.on("data", () => {});

  await waitForServerReady();
});

after(async () => {
  if (serverProcess && !serverProcess.killed) {
    serverProcess.kill("SIGINT");
  }

  await prisma.$disconnect();
});

test("POST /api/auth/register cria conta, normaliza email e retorna cookie de sessao", async () => {
  const email = `api-register-${Date.now()}@Example.com`;

  try {
    const response = await fetch(`${BASE_URL}/api/auth/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        name: "API Register",
        email,
        password: "Demo@1234"
      })
    });

    assert.equal(response.status, 201);
    assert.ok(response.headers.get("set-cookie"));

    const payload = (await response.json()) as {
      user: {
        email: string;
        name: string;
      };
    };

    assert.equal(payload.user.email, email.toLowerCase());
    assert.equal(payload.user.name, "API Register");
  } finally {
    await cleanupUserByEmail(email.toLowerCase());
  }
});

test("POST /api/auth/login rejeita senha invalida", async () => {
  const email = `api-login-${Date.now()}@local.dev`;

  try {
    await prisma.user.create({
      data: {
        email,
        name: "API Login",
        passwordHash: hashPassword("Demo@1234")
      }
    });

    const response = await fetch(`${BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        email,
        password: "senha-errada"
      })
    });

    assert.equal(response.status, 401);

    const payload = (await response.json()) as { message: string };
    assert.equal(payload.message, "E-mail ou senha invalidos.");
  } finally {
    await cleanupUserByEmail(email);
  }
});

test("POST /api/transactions exige autenticacao", async () => {
  const response = await fetch(`${BASE_URL}/api/transactions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      ticker: "PETR4",
      assetType: "STOCK",
      type: "BUY",
      quantity: 10,
      value: 1000
    })
  });

  assert.equal(response.status, 401);
});

test("fluxo autenticado de create, update, logout e bloqueio apos logout funciona via HTTP", async () => {
  const email = `api-flow-${Date.now()}@local.dev`;

  try {
    const registerResponse = await fetch(`${BASE_URL}/api/auth/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        name: "API Flow",
        email,
        password: "Demo@1234"
      })
    });

    assert.equal(registerResponse.status, 201);
    const sessionCookie = extractCookie(registerResponse);

    const createResponse = await fetch(`${BASE_URL}/api/transactions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: sessionCookie
      },
      body: JSON.stringify({
        ticker: "TESTE11",
        assetType: "FII",
        type: "BUY",
        quantity: 10,
        value: 1000,
        occurredAt: "2026-03-10"
      })
    });

    assert.equal(createResponse.status, 201);

    const createdPayload = (await createResponse.json()) as {
      transaction: {
        id: string;
      };
    };

    const patchResponse = await fetch(
      `${BASE_URL}/api/transactions/${createdPayload.transaction.id}`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Cookie: sessionCookie
        },
        body: JSON.stringify({
          ticker: "TESTE11",
          assetType: "FII",
          type: "BUY",
          quantity: 5,
          value: 650,
          occurredAt: "2026-03-12"
        })
      }
    );

    assert.equal(patchResponse.status, 200);

    const user = await prisma.user.findUniqueOrThrow({
      where: {
        email
      },
      select: {
        id: true
      }
    });

    const assetAfterPatch = await prisma.asset.findFirstOrThrow({
      where: {
        userId: user.id,
        ticker: "TESTE11"
      },
      select: {
        quantity: true,
        averagePrice: true
      }
    });

    assert.equal(assetAfterPatch.quantity.toFixed(4), "5.0000");
    assert.equal(assetAfterPatch.averagePrice.toFixed(4), "130.0000");

    const logoutResponse = await fetch(`${BASE_URL}/api/auth/logout`, {
      method: "POST",
      headers: {
        Cookie: sessionCookie
      }
    });

    assert.equal(logoutResponse.status, 200);

    const unauthorizedAfterLogout = await fetch(`${BASE_URL}/api/transactions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: sessionCookie
      },
      body: JSON.stringify({
        ticker: "TESTE11",
        assetType: "FII",
        type: "BUY",
        quantity: 1,
        value: 100
      })
    });

    assert.equal(unauthorizedAfterLogout.status, 401);
  } finally {
    await cleanupUserByEmail(email);
  }
});
