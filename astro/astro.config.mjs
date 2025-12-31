import { defineConfig } from "astro/config";
import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";

import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import rehypeCitation from "rehype-citation";
import rehypeLinkifyBibliographyUrls from "./src/rehype/linkify-bibliography-urls.mjs";
import rehypeNoWrapMathPunctuation from "./src/rehype/nowrap-math-punctuation.mjs";

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
    rehypePlugins: [
      [rehypeKatex, { output: "html" }],
      // Prevent orphan punctuation after inline math (e.g. "$x$," breaking across lines)
      rehypeNoWrapMathPunctuation,
      [
        rehypeCitation,
        {
          // Put BibTeX entries here:
          bibliography: ["./src/content/references.bib"],
          // Numeric in-text citations like [1] and grouped like [1, 2, 3]
          csl: "./src/content/csl/numeric-brackets.csl",
          // Rendered bibliography will appear where you place: <div id="refs"></div>
          linkCitations: true,
        },
      ],
      // Ensure URLs in the generated bibliography are clickable
      rehypeLinkifyBibliographyUrls,
    ],
  },
});


