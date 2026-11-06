import { defineConfig } from "astro/config";
import node from "@astrojs/node";

export default defineConfig({
  output: "static",
  adapter: node({ mode: "standalone" }),
  trailingSlash: "never",
  build: { format: "file" },
});
