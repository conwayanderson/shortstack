export type Link = { slug: string; url: string; createdAt: string; clicks: number };
export type Stats = { slug: string; url: string; clicks: number; days: { day: string; clicks: number }[] };

async function json<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let message = res.statusText;
    try {
      message = ((await res.json()) as { error?: string }).error ?? message;
    } catch {}
    throw new Error(message);
  }
  return res.status === 204 ? (undefined as T) : ((await res.json()) as T);
}

export const api = {
  list: () => fetch("/api/links").then((r) => json<Link[]>(r)),
  create: (url: string, slug?: string) =>
    fetch("/api/links", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(slug ? { url, slug } : { url }),
    }).then((r) => json<Link>(r)),
  stats: (slug: string) => fetch(`/api/links/${slug}/stats`).then((r) => json<Stats>(r)),
  remove: (slug: string) => fetch(`/api/links/${slug}`, { method: "DELETE" }).then((r) => json<void>(r)),
};
