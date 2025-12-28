import { defineConfig } from "astro/config";
import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";

import rehypeCitation from "rehype-citation";

// NOTE:
// - For `labofdoubt.github.io` (user/organization pages), `base` should be "/".
// - If you deploy this Astro site under a subpath (e.g. /astro/), set base: "/astro".
export default defineConfig({
  site: "https://labofdoubt.github.io",
  base: process.env.ASTRO_BASE ?? "/",
  integrations: [mdx(), sitemap()],
  markdown: {
    // Math is rendered client-side by MathJax (loaded in BaseLayout.astro).
    rehypePlugins: [
      [
        rehypeCitation,
        {
          bibliography: ["./src/content/references.bib"],
          // Rendered bibliography will appear where you place: <div id="refs"></div>
          linkCitations: true,
        },
      ],
    ],
  },
});


