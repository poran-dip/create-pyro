import { describe, expect, it } from "vitest";
import { signInSchema, signUpSchema } from "./auth";

describe("signUpSchema", () => {
  it("accepts a valid sign-up and trims the name", () => {
    const result = signUpSchema.parse({
      name: "  Ada  ",
      email: "ada@example.com",
      password: "correct horse",
    });
    expect(result.name).toBe("Ada");
  });

  it("rejects a short password", () => {
    const result = signUpSchema.safeParse({
      name: "Ada",
      email: "ada@example.com",
      password: "short",
    });
    expect(result.success).toBe(false);
  });
});

describe("signInSchema", () => {
  it("rejects a malformed email", () => {
    const result = signInSchema.safeParse({
      email: "not-an-email",
      password: "anything",
    });
    expect(result.success).toBe(false);
  });
});
