import { defineConfig } from "vite";

// Local default "/". CI / Pages: VITE_BASE=/poseidos/ bun run build
const base = process.env.VITE_BASE ?? "/";

export default defineConfig({
  base,
  server: { host: true, port: 5173 },
  build: { target: "es2022" },
});
