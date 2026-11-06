import { defineConfig } from "astro/config";
import node from "@astrojs/node";

export default defineConfig({
  site: "https://xigo.ch",
  output: "static",
  adapter: node({ mode: "standalone" }),
  trailingSlash: "never",
  build: { format: "directory" },
});
