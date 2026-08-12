import { defineConfig } from "vite";

// base para GitHub Pages (repo /poseidos/). En local, VITE_BASE=/ bun run dev
const base = process.env.VITE_BASE ?? "/poseidos/";

export default defineConfig({
  base,
  server: { host: true, port: 5173 },
  build: { target: "es2022" },
});
