import { defineConfig } from "astro/config";
import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";

import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";

// NOTE:
// - For `labofdoubt.github.io` (user/organization pages), `base` should be "/".
// - If you deploy this Astro site under a subpath (e.g. /astro/), set base: "/astro".
export default defineConfig({
  site: "https://labofdoubt.github.io",
  base: process.env.ASTRO_BASE ?? "/",
  integrations: [mdx(), sitemap()],
  markdown: {
    remarkPlugins: [remarkMath],
    // Render KaTeX as HTML only (prevents “double rendering” in some browsers)
    rehypePlugins: [[rehypeKatex, { output: "html" }]],
  },
});


