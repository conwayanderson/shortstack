# shortstack

A small link shortener with a click-stats dashboard. One service: an Express API that also serves the built React UI.

- `POST /api/links` `{ "url": "https://…", "slug": "optional" }` → creates a short link
- `GET /api/links` → every link with its click count
- `GET /api/links/:slug/stats` → clicks by day for the last 14 days
- `DELETE /api/links/:slug` → removes a link
- `GET /:slug` → redirects to the target and counts the click

## Run it

```bash
npm install
npm run dev      # API on :3000, UI on :5173 (proxied to the API)
```

```bash
npm run build && npm start   # one process on $PORT (default 3000) serving the UI and the API
```

Links are kept in `data/links.json`. Set `DATA_FILE` to put it elsewhere (a volume, on Railway).

## Tests

```bash
npm test
```
