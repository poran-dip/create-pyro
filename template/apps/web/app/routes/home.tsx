import { type FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router";
import { signInSchema, signUpSchema } from "@repo/shared";
import { authClient } from "~/lib/auth-client";
import { getSession } from "~/lib/session.server";
import { cn } from "~/lib/utils";
import type { Route } from "./+types/home";

export function meta() {
  return [{ title: "my-pyro-app" }];
}

export async function loader({ request }: Route.LoaderArgs) {
  const session = await getSession(request);
  return { user: session?.user ?? null };
}

type Mode = "sign-in" | "sign-up";

export default function Home({ loaderData }: Route.ComponentProps) {
  const { user } = loaderData;

  return (
    <main className="mx-auto flex min-h-svh max-w-sm flex-col justify-center gap-8 px-6 py-12">
      <header className="flex flex-col gap-2">
        <span className="font-mono text-xs uppercase tracking-widest text-accent">
          my-pyro-app
        </span>
        <h1 className="text-3xl font-semibold tracking-tight">
          {user ? `Welcome back, ${user.name}` : "Welcome"}
        </h1>
        <p className="text-ink-muted">
          {user
            ? "You're signed in."
            : "Sign in, or create an account to get started."}
        </p>
      </header>

      {user ? (
        <Link
          to="/dashboard"
          className="rounded-lg bg-accent px-4 py-2.5 text-center font-medium text-white transition hover:bg-accent-strong"
        >
          Go to dashboard
        </Link>
      ) : (
        <AuthForm />
      )}
    </main>
  );
}

function AuthForm() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>("sign-in");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const values = Object.fromEntries(new FormData(event.currentTarget));
    const schema = mode === "sign-in" ? signInSchema : signUpSchema;
    const parsed = schema.safeParse(values);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Check the form");
      return;
    }

    setPending(true);
    const client = authClient();
    const { error } =
      mode === "sign-in"
        ? await client.signIn.email(signInSchema.parse(values))
        : await client.signUp.email(signUpSchema.parse(values));
    setPending(false);

    if (error) {
      setError(error.message ?? "Something went wrong, please try again");
      return;
    }
    navigate("/dashboard");
  }

  function switchTo(next: Mode) {
    setMode(next);
    setError(null);
  }

  return (
    <div className="flex flex-col gap-6 rounded-xl border border-line bg-surface-raised p-6 shadow-sm">
      <div className="grid grid-cols-2 gap-1 rounded-lg bg-surface p-1 text-sm">
        {(["sign-in", "sign-up"] as const).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => switchTo(m)}
            className={cn(
              "rounded-md px-3 py-1.5 font-medium transition",
              mode === m
                ? "bg-surface-raised text-ink shadow-sm"
                : "text-ink-muted hover:text-ink",
            )}
          >
            {m === "sign-in" ? "Sign in" : "Create account"}
          </button>
        ))}
      </div>

      <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
        {mode === "sign-up" && (
          <Field label="Name" name="name" autoComplete="name" />
        )}
        <Field label="Email" name="email" type="email" autoComplete="email" />
        <Field
          label="Password"
          name="password"
          type="password"
          autoComplete={
            mode === "sign-in" ? "current-password" : "new-password"
          }
        />

        {error && (
          <p role="alert" className="text-sm text-danger">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-accent px-4 py-2.5 font-medium text-white transition hover:bg-accent-strong disabled:opacity-60"
        >
          {pending
            ? "Please wait…"
            : mode === "sign-in"
              ? "Sign in"
              : "Create account"}
        </button>
      </form>
    </div>
  );
}

function Field({
  label,
  ...props
}: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="flex flex-col gap-1.5 text-sm font-medium">
      {label}
      <input
        required
        {...props}
        className="rounded-lg border border-line bg-surface-raised px-3 py-2 font-normal outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20"
      />
    </label>
  );
}
