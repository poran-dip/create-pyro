import { describe, expect, it } from "vitest";
import { ApiRequestError, unwrap } from "./api";

const respond = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status });

describe("unwrap", () => {
  it("returns the data of a successful response", async () => {
    const data = await unwrap(
      respond(200, { success: true, data: { id: "abc" } }),
    );
    expect(data).toEqual({ id: "abc" });
  });

  it("throws the api's error for a failed response", async () => {
    const promise = unwrap(
      respond(401, {
        success: false,
        error: { code: "UNAUTHORIZED", message: "You need to sign in" },
      }),
    );
    await expect(promise).rejects.toBeInstanceOf(ApiRequestError);
    await expect(promise).rejects.toMatchObject({
      code: "UNAUTHORIZED",
      status: 401,
    });
  });
});
