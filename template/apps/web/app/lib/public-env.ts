// Runtime config for the browser. The root loader serializes it into
// `window.__ENV__`, so one built image works on any origin.

export type PublicEnv = {
  API_URL: string;
};

declare global {
  interface Window {
    __ENV__?: Partial<PublicEnv>;
  }
}

/** The origin the browser reaches the api on. Browser-only. */
export function publicApiUrl(): string {
  return window.__ENV__?.API_URL ?? window.location.origin;
}
