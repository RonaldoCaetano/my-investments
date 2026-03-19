import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { generateSessionToken, hashSessionToken } from "@/lib/security";

const SESSION_COOKIE_NAME = "my-investments-session";
const SESSION_DURATION_MS = 1000 * 60 * 60 * 24 * 30;

export interface AuthenticatedUser {
  id: string;
  email: string;
  name: string | null;
}

function getSessionCookieOptions(expiresAt: Date) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    expires: expiresAt,
    path: "/"
  };
}

export async function createSession(userId: string) {
  const sessionToken = generateSessionToken();
  const sessionTokenHash = hashSessionToken(sessionToken);
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);

  await prisma.session.create({
    data: {
      sessionTokenHash,
      expiresAt,
      userId
    }
  });

  const cookieStore = cookies();
  cookieStore.set(SESSION_COOKIE_NAME, sessionToken, getSessionCookieOptions(expiresAt));
}

export async function clearSession() {
  const cookieStore = cookies();
  const sessionToken = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (sessionToken) {
    await prisma.session.deleteMany({
      where: {
        sessionTokenHash: hashSessionToken(sessionToken)
      }
    });
  }

  cookieStore.set(SESSION_COOKIE_NAME, "", {
    ...getSessionCookieOptions(new Date(0)),
    maxAge: 0
  });
}

export async function getCurrentUser(): Promise<AuthenticatedUser | null> {
  const cookieStore = cookies();
  const sessionToken = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!sessionToken) {
    return null;
  }

  const session = await prisma.session.findUnique({
    where: {
      sessionTokenHash: hashSessionToken(sessionToken)
    },
    select: {
      expiresAt: true,
      user: {
        select: {
          id: true,
          email: true,
          name: true
        }
      }
    }
  });

  if (!session || session.expiresAt <= new Date()) {
    return null;
  }

  return session.user;
}

export async function requireCurrentUser() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  return user;
}
