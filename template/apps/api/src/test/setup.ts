import { testDatabaseUrl } from "./database-url";

process.env.DATABASE_URL = testDatabaseUrl();
process.env.NODE_ENV = "test";

process.env.BETTER_AUTH_URL ??= "http://localhost:3002";
process.env.BETTER_AUTH_SECRET ??= "test-secret-at-least-32-characters-long!!";
process.env.CORS_ORIGIN ??= "http://localhost:3000";
