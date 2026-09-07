# Web API documentation proxy

`web.inttegro.dev` is a Cloudflare Worker custom domain in front of the
versioned API documentation published from the `gh-pages` branch. The Worker
keeps DNS and TLS at Cloudflare while GitHub Actions remains responsible for
building and publishing each documentation version.

Deploy from the repository root after authenticating Wrangler:

```sh
npx wrangler@4.129.0 deploy \
  --config infrastructure/web-docs-proxy/wrangler.jsonc
```
