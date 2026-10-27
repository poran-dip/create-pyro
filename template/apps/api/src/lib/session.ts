import { auth } from "./auth";

export type Actor = {
  id: string;
  name: string;
  email: string;
};

export type ResolvedSession = {
  user: Actor;
  sessionId: string;
} | null;

export type SessionResolver = (headers: Headers) => Promise<ResolvedSession>;

export const resolveSession: SessionResolver = async (headers) => {
  const session = await auth.api.getSession({ headers });
  if (!session) return null;

  const { id, name, email } = session.user;
  return { user: { id, name, email }, sessionId: session.session.id };
};
