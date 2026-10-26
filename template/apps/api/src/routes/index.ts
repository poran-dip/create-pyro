import { Hono } from "hono";
import type { AppEnv } from "../types/context";
import authRouter from "./auth";
import me from "./me";

const api = new Hono<AppEnv>().route("/auth", authRouter).route("/me", me);

export default api;
