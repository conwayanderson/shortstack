import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";

const FILE = process.env.DATA_FILE ?? new URL("../data/links.json", import.meta.url).pathname;

/** @type {Map<string, Link>} */
let links = new Map();

/**
 * @typedef {{ slug: string, url: string, createdAt: string, clicks: number, clicksByDay: Record<string, number> }} Link
 */

export function load() {
  if (!existsSync(FILE)) return;
  try {
    const raw = JSON.parse(readFileSync(FILE, "utf8"));
    links = new Map(raw.map((l) => [l.slug, l]));
  } catch (err) {
    console.error("could not read", FILE, err);
  }
}

export function save() {
  mkdirSync(dirname(FILE), { recursive: true });
  writeFileSync(FILE, JSON.stringify([...links.values()], null, 2));
}

export function all() {
  return [...links.values()].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function get(slug) {
  return links.get(slug) ?? null;
}

export function put(link) {
  links.set(link.slug, link);
  save();
  return link;
}

export function remove(slug) {
  return links.delete(slug);
}

export function reset() {
  links = new Map();
}
