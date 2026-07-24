# Chris Lawson — chrislawson.dev

Personal site (Astro + Cloudflare Workers): portfolio pages, writing, and résumé.

## Develop

```bash
npm install
npm run dev
```

Requires Node `>=22.12.0`. Prefer `astro dev --background` in agent workflows.

## Build & deploy

```bash
npm run build
npm run check    # astro check
npm run deploy   # astro build && wrangler deploy
```

GitHub Actions (`.github/workflows/deploy.yml`) runs check, build, smoke tests, then deploys on push to `main`/`master`.

Required repository secrets:

- `CLOUDFLARE_API_TOKEN` — Workers edit permission
- `CLOUDFLARE_ACCOUNT_ID` — Cloudflare account ID

Also create a GitHub Environment named `production` (workflow references it).

Production serves `chrislawson.dev` as static assets (no Worker script). `workers.dev` and preview URLs are disabled in `wrangler.jsonc`.

Handle `www` → apex with a [Cloudflare Redirect Rule](https://developers.cloudflare.com/rules/url-forwarding/examples/redirect-www-to-root/) (plus a proxied DNS record for `www`). Keep **Always Use HTTPS** on; HSTS is also set in `public/_headers`.

## Content

Blog posts live in `src/content/blog/*.md`. Set `draft: true` to keep a post out of lists, RSS, and routes.
