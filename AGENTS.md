# Agent Guidance (chrislawson.dev)

Personal site — Astro + Cloudflare Workers.

## Stack

- **Astro** with `@astrojs/cloudflare` adapter
- **Lint/format:** `oxlint` / `oxfmt` (`.astro` via `astro: true`, oxc#27386). VS Code: `oxc.oxc-vscode`
- Deploy: Wrangler static assets / Workers (see `wrangler.jsonc`, `.github/workflows/deploy.yml`)

## Development

```bash
npm install
npm run dev
# or: astro dev --background
```

Manage background server with `astro dev stop`, `astro dev status`, and `astro dev logs`.

| Script                 | Purpose                     |
| ---------------------- | --------------------------- |
| `npm run lint`         | oxlint                      |
| `npm run format`       | oxfmt --write               |
| `npm run format:check` | oxfmt --check               |
| `npm run check`        | astro check                 |
| `npm run validate`     | check + lint + format:check |
| `npm run build`        | astro build                 |

## Documentation

Full documentation: https://docs.astro.build

Consult these guides before working on related tasks:

- [Adding pages, dynamic routes, or middleware](https://docs.astro.build/en/guides/routing/)
- [Working with Astro components](https://docs.astro.build/en/basics/astro-components/)
- [Using React, Vue, Svelte, or other framework components](https://docs.astro.build/en/guides/framework-components/)
- [Adding or managing content](https://docs.astro.build/en/guides/content-collections/)
- [Adding styles or using Tailwind](https://docs.astro.build/en/guides/styling/)
- [Supporting multiple languages](https://docs.astro.build/en/guides/internationalization/)
