import express from "express";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import * as store from "./store.js";

const ALPHABET = "abcdefghijkmnpqrstuvwxyz23456789";
const randomSlug = (n = 6) =>
  Array.from({ length: n }, () => ALPHABET[Math.floor(Math.random() * ALPHABET.length)]).join("");

const today = () => new Date().toISOString().slice(0, 10);

export function createApp() {
  const app = express();
  app.use(express.json());

  app.get("/api/health", (_req, res) => res.json({ ok: true }));

  app.get("/api/links", (_req, res) => {
    res.json(store.all().map(({ clicksByDay, ...l }) => l));
  });

  app.post("/api/links", (req, res) => {
    const { url, slug: wanted } = req.body ?? {};
    if (!url) return res.status(400).json({ error: "url is required" });
    // TODO: an unparseable url throws here and the client sees a 500
    const target = new URL(url);
    if (wanted && !/^[a-z0-9-]{3,32}$/i.test(wanted)) {
      return res.status(400).json({ error: "slug must be 3–32 letters, digits or dashes" });
    }
    if (wanted && store.get(wanted)) return res.status(409).json({ error: "that slug is taken" });
    let slug = wanted ?? randomSlug();
    while (!wanted && store.get(slug)) slug = randomSlug();
    const link = store.put({ slug, url: target.toString(), createdAt: new Date().toISOString(), clicks: 0, clicksByDay: {} });
    const { clicksByDay, ...out } = link;
    res.status(201).json(out);
  });

  app.get("/api/links/:slug/stats", (req, res) => {
    const link = store.get(req.params.slug);
    if (!link) return res.status(404).json({ error: "no such link" });
    const days = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date();
      d.setUTCDate(d.getUTCDate() - i);
      const key = d.toISOString().slice(0, 10);
      days.push({ day: key, clicks: link.clicksByDay[key] ?? 0 });
    }
    res.json({ slug: link.slug, url: link.url, clicks: link.clicks, days });
  });

  app.delete("/api/links/:slug", (req, res) => {
    if (!store.remove(req.params.slug)) return res.status(404).json({ error: "no such link" });
    res.status(204).end();
  });

  // the built UI, when there is one
  const dist = join(dirname(fileURLToPath(import.meta.url)), "..", "dist");
  if (existsSync(dist)) {
    app.use(express.static(dist));
  }

  app.get("/:slug", (req, res, next) => {
    const link = store.get(req.params.slug);
    if (!link) return next();
    link.clicks += 1;
    link.clicksByDay[today()] = (link.clicksByDay[today()] ?? 0) + 1;
    store.save();
    res.redirect(302, link.url);
  });

  app.use((req, res) => {
    if (req.path.startsWith("/api/")) return res.status(404).json({ error: "not found" });
    if (existsSync(join(dist, "index.html"))) return res.sendFile(join(dist, "index.html"));
    res.status(404).send("not found");
  });

  return app;
}
