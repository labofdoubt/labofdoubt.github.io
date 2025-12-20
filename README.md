# labofdoubt.github.io (Astro)

This repo deploys an **Astro** static site to GitHub Pages at:

- `https://labofdoubt.github.io/`

## Local dev

```bash
cd astro
npm install
npm run dev
```

## Deploy

Pushing to `main` triggers the GitHub Actions workflow (`.github/workflows/quarto-publish.yml`) which builds Astro and deploys `astro/dist` to GitHub Pages.


