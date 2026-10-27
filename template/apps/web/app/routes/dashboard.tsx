import { useNavigate } from "react-router";
import { unwrap } from "~/lib/api";
import { api } from "~/lib/api.server";
import { authClient } from "~/lib/auth-client";
import { requireSession } from "~/lib/session.server";
import type { Route } from "./+types/dashboard";

export function meta() {
  return [{ title: "Dashboard · my-pyro-app" }];
}

const formatDate = (iso: string) =>
  new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "UTC",
  }).format(new Date(iso));

export async function loader({ request }: Route.LoaderArgs) {
  await requireSession(request);

  // Typed end to end: the response shape comes from the api's route.
  const user = await unwrap(await api(request).api.me.$get());

  return {
    user,
    joined: `${formatDate(user.createdAt)} UTC`,
  };
}

export default function Dashboard({ loaderData }: Route.ComponentProps) {
  const { user, joined } = loaderData;
  const navigate = useNavigate();

  async function signOut() {
    await authClient().signOut();
    navigate("/", { replace: true });
  }

  const details = [
    ["Name", user.name],
    ["Email", user.email],
    ["Email verified", user.emailVerified ? "Yes" : "No"],
    ["User ID", user.id],
    ["Joined", joined],
  ] as const;

  return (
    <main className="mx-auto flex min-h-svh max-w-xl flex-col justify-center gap-8 px-6 py-12">
      <header className="flex items-end justify-between gap-4">
        <div className="flex flex-col gap-2">
          <span className="font-mono text-xs uppercase tracking-widest text-accent">
            Dashboard
          </span>
          <h1 className="text-3xl font-semibold tracking-tight">
            Hi, {user.name}
          </h1>
        </div>
        <button
          type="button"
          onClick={signOut}
          className="rounded-lg border border-line px-3 py-1.5 text-sm font-medium transition hover:bg-surface-raised"
        >
          Sign out
        </button>
      </header>

      <dl className="divide-y divide-line rounded-xl border border-line bg-surface-raised shadow-sm">
        {details.map(([label, value]) => (
          <div
            key={label}
            className="grid grid-cols-[8rem_1fr] gap-4 px-5 py-3 text-sm"
          >
            <dt className="text-ink-muted">{label}</dt>
            <dd className="break-all font-medium">{value}</dd>
          </div>
        ))}
      </dl>
    </main>
  );
}
