# Astro version (for comparison with Quarto)

This folder contains a minimal Astro implementation of the same site structure (Home/Blog/About + a blog post), so you can compare **Astro vs Quarto** side-by-side.

## Run locally

```bash
cd astro
npm install
npm run dev
```

## Build

```bash
cd astro
npm run build
npm run preview
```

## Notes on deployment

- This repo deploys the **Quarto** site to GitHub Pages at the root: `/`.
- The GitHub Pages workflow also builds this Astro site and publishes it under: `/astro/`
  - URL: `https://labofdoubt.github.io/astro/`

### Deploy Astro at the root instead (optional)

If you decide you want Astro to replace Quarto at `/`, we can switch the workflow to upload `astro/dist` directly (and set `ASTRO_BASE=/`).


