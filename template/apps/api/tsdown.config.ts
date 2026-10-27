import { defineConfig } from "tsdown";

export default defineConfig({
  tsconfig: "tsconfig.build.json",
  entry: ["src/index.ts"],
  format: ["esm"],
  // The declarations are what apps/web imports `AppType` from.
  dts: true,
  sourcemap: true,
  clean: true,
  treeshake: true,
  target: false,
});
