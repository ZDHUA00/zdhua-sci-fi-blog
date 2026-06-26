# ZDHUA.LOG

Astro-powered sci-fi personal blog for GitHub Pages. The UI uses native CSS and vanilla JavaScript only.

## Local Preview

```bash
npm install
npm run dev
```

Open `http://127.0.0.1:4321`.

## Content

Add Markdown posts in `src/content/blog`. Frontmatter is validated by `src/content/config.ts`.

The generated hero asset lives at `public/assets/nebula-field.png`; regenerate it with:

```bash
npm run asset:hero
```

## GitHub Pages

This repo includes `.github/workflows/pages.yml`. Push to `main`, enable GitHub Pages with GitHub Actions as the source, and the site will publish automatically.
