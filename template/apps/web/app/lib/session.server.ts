import { redirect } from "react-router";
import { serverEnv } from "./env.server";

export type Session = {
  user: { id: string; name: string; email: string };
  session: { id: string; expiresAt: string };
};

/** The request's session, or null when signed out or the api is unreachable. */
export async function getSession(request: Request): Promise<Session | null> {
  try {
    const res = await fetch(
      `${serverEnv.INTERNAL_API_URL}/api/auth/get-session`,
      {
        headers: { cookie: request.headers.get("cookie") ?? "" },
      },
    );
    if (!res.ok) return null;
    const data = (await res.json()) as Session | null;
    return data?.user ? data : null;
  } catch {
    return null;
  }
}

/** The request's session; redirects to the homepage when signed out. */
export async function requireSession(request: Request): Promise<Session> {
  const session = await getSession(request);
  if (!session) throw redirect("/");
  return session;
}
