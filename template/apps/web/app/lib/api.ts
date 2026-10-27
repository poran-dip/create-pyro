import type { ApiError } from "@repo/shared";

export class ApiRequestError extends Error {
  code: string;
  status: number;
  details?: unknown;

  constructor(
    message: string,
    code: string,
    status: number,
    details?: unknown,
  ) {
    super(message);
    this.name = "ApiRequestError";
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

type JsonResponse = { status: number; json: () => Promise<unknown> };

type DataOf<R> = R extends { json: () => Promise<infer J> }
  ? J extends { success: true; data: infer D }
    ? D
    : never
  : never;

/**
 * Reads an api response and returns its `data`, typed from the hono client.
 * Throws `ApiRequestError` for an `{ success: false }` body.
 */
export async function unwrap<R extends JsonResponse>(
  response: R,
): Promise<DataOf<R>> {
  const json = (await response.json()) as
    | { success: true; data: unknown }
    | ApiError;

  if (!json.success) {
    const { message, code, details } = json.error;
    throw new ApiRequestError(message, code, response.status, details);
  }

  return json.data as DataOf<R>;
}
