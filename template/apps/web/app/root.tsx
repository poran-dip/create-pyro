import {
  isRouteErrorResponse,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useRouteLoaderData,
} from "react-router";
import type { Route } from "./+types/root";
import "./app.css";
import { getPublicEnv } from "./lib/env.server";

export function loader() {
  return { env: getPublicEnv() };
}

export const links: Route.LinksFunction = () => [
  { rel: "icon", type: "image/svg+xml", href: "/favicon.svg" },
];

/** Hands the browser its runtime config (see lib/public-env.ts). */
function PublicEnvScript() {
  const data = useRouteLoaderData<typeof loader>("root");
  const json = JSON.stringify(data?.env ?? {}).replace(/</g, "\\u003c");

  return (
    <script dangerouslySetInnerHTML={{ __html: `window.__ENV__=${json}` }} />
  );
}

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body>
        {children}
        <ScrollRestoration />
        <PublicEnvScript />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  return <Outlet />;
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  let title = "Something went wrong";
  let details = "An unexpected error occurred. Please try again in a moment.";
  let stack: string | undefined;

  if (isRouteErrorResponse(error)) {
    if (error.status === 404) {
      title = "Page not found";
      details = "The page you are looking for does not exist.";
    } else if (error.statusText) {
      details = error.statusText;
    }
  } else if (import.meta.env.DEV && error instanceof Error) {
    details = error.message;
    stack = error.stack;
  }

  return (
    <main className="mx-auto flex min-h-svh max-w-2xl flex-col justify-center gap-4 px-6 py-12">
      <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
      <p className="text-ink-muted">{details}</p>
      <a href="/" className="font-medium text-accent hover:underline">
        Back to home
      </a>
      {stack && (
        <pre className="overflow-x-auto rounded-lg border border-line bg-surface-raised p-4 text-sm">
          <code>{stack}</code>
        </pre>
      )}
    </main>
  );
}
