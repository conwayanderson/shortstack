import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";
import { createApp } from "../server/app.js";
import { reset } from "../server/store.js";

process.env.DATA_FILE = "/tmp/shortstack-test-links.json";

describe("links", () => {
  beforeEach(() => reset());

  it("creates a link and redirects through it", async () => {
    const app = createApp();
    const created = await request(app).post("/api/links").send({ url: "https://railway.com/", slug: "rail" });
    expect(created.status).toBe(201);
    expect(created.body.slug).toBe("rail");
    const hop = await request(app).get("/rail");
    expect(hop.status).toBe(302);
    expect(hop.headers.location).toBe("https://railway.com/");
    const list = await request(app).get("/api/links");
    expect(list.body[0].clicks).toBe(1);
  });

  it("rejects a missing url", async () => {
    const app = createApp();
    const res = await request(app).post("/api/links").send({});
    expect(res.status).toBe(400);
  });

  it("rejects a custom slug that is already taken", async () => {
    const app = createApp();
    const first = await request(app).post("/api/links").send({ url: "https://railway.com/", slug: "taken" });
    expect(first.status).toBe(201);
    const second = await request(app).post("/api/links").send({ url: "https://example.com/", slug: "taken" });
    expect(second.status).toBe(409);
    expect(second.body.error).toMatch(/taken/i);
  });

  it("rejects an invalid slug", async () => {
    const app = createApp();
    const res = await request(app).post("/api/links").send({ url: "https://railway.com/", slug: "a!" });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/slug/i);
  });

  it("returns 14 days of stats with today's clicks counted", async () => {
    const app = createApp();
    const created = await request(app).post("/api/links").send({ url: "https://railway.com/", slug: "clicky" });
    expect(created.status).toBe(201);

    await request(app).get("/clicky");
    await request(app).get("/clicky");

    const res = await request(app).get("/api/links/clicky/stats");
    expect(res.status).toBe(200);
    expect(res.body.slug).toBe("clicky");
    expect(res.body.clicks).toBe(2);
    expect(res.body.days).toHaveLength(14);

    const todayKey = new Date().toISOString().slice(0, 10);
    const todayEntry = res.body.days.find((d) => d.day === todayKey);
    expect(todayEntry).toBeTruthy();
    expect(todayEntry.clicks).toBe(2);
    expect(res.body.days[res.body.days.length - 1].day).toBe(todayKey);
  });

  it("404s stats for an unknown slug", async () => {
    const app = createApp();
    const res = await request(app).get("/api/links/nope/stats");
    expect(res.status).toBe(404);
  });

  it("deletes a link, then 404s on redirect", async () => {
    const app = createApp();
    const created = await request(app).post("/api/links").send({ url: "https://railway.com/", slug: "gone" });
    expect(created.status).toBe(201);

    const del = await request(app).delete("/api/links/gone");
    expect(del.status).toBe(204);

    const hop = await request(app).get("/gone");
    expect(hop.status).toBe(404);
  });

  it("404s deleting an unknown slug", async () => {
    const app = createApp();
    const res = await request(app).delete("/api/links/nope");
    expect(res.status).toBe(404);
  });
});
