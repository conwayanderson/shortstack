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
});
