import { drizzleAdapter } from "@better-auth/drizzle-adapter";
import { createId } from "@paralleldrive/cuid2";
import { betterAuth } from "better-auth";
import { apiEnv, authEnv } from "@repo/config";
import {
  accountsTable,
  db,
  sessionsTable,
  usersTable,
  verificationsTable,
} from "@repo/db";
import { PASSWORD_MAX_LENGTH, PASSWORD_MIN_LENGTH } from "@repo/shared";

export const auth = betterAuth({
  baseURL: authEnv.BETTER_AUTH_URL,
  secret: authEnv.BETTER_AUTH_SECRET,
  basePath: "/api/auth",
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      user: usersTable,
      session: sessionsTable,
      account: accountsTable,
      verification: verificationsTable,
    },
  }),
  emailAndPassword: {
    enabled: true,
    minPasswordLength: PASSWORD_MIN_LENGTH,
    maxPasswordLength: PASSWORD_MAX_LENGTH,
  },
  // To add Google sign-in: add GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET to
  // authSchema in packages/config, then uncomment this block.
  // socialProviders: {
  //   google: {
  //     clientId: authEnv.GOOGLE_CLIENT_ID,
  //     clientSecret: authEnv.GOOGLE_CLIENT_SECRET,
  //   },
  // },
  advanced: {
    database: {
      generateId: () => createId(),
    },
  },
  trustedOrigins: [apiEnv.CORS_ORIGIN],
});
