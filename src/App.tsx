import { useEffect, useState } from "react";
import { api, type Link, type Stats } from "./api";

export function App() {
  const [links, setLinks] = useState<Link[]>([]);
  const [url, setUrl] = useState("");
  const [slug, setSlug] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState<Stats | null>(null);

  useEffect(() => {
    api.list().then(setLinks).catch((e) => setError(e.message));
  }, []);

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await api.create(url, slug || undefined);
      setUrl("");
      setSlug("");
      // TODO: the list does not pick the new link up until the page is reloaded
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const remove = async (s: string) => {
    await api.remove(s);
    setLinks((ls) => ls.filter((l) => l.slug !== s));
    if (open?.slug === s) setOpen(null);
  };

  return (
    <main className="wrap">
      <header className="head">
        <h1>shortstack</h1>
        <p className="sub">Short links with click stats.</p>
      </header>

      <form className="create" onSubmit={create}>
        <input
          type="url"
          placeholder="https://example.com/some/long/path"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          required
        />
        <input
          className="slug"
          placeholder="custom slug (optional)"
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
        />
        <button type="submit">Shorten</button>
      </form>
      {error ? <p className="error">{error}</p> : null}

      <table className="links">
        <thead>
          <tr>
            <th>Short</th>
            <th>Target</th>
            <th className="num">Clicks</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {links.map((l) => (
            <tr key={l.slug}>
              <td>
                <a href={`/${l.slug}`} target="_blank" rel="noreferrer">
                  /{l.slug}
                </a>
              </td>
              <td className="target" title={l.url}>
                {l.url}
              </td>
              <td className="num">{l.clicks}</td>
              <td className="acts">
                <button type="button" onClick={() => api.stats(l.slug).then(setOpen)}>
                  Stats
                </button>
                <button type="button" className="danger" onClick={() => remove(l.slug)}>
                  Delete
                </button>
              </td>
            </tr>
          ))}
          {links.length === 0 ? (
            <tr>
              <td colSpan={4} className="empty">
                No links yet.
              </td>
            </tr>
          ) : null}
        </tbody>
      </table>

      {open ? (
        <section className="stats">
          <div className="stats-head">
            <h2>/{open.slug}</h2>
            <span className="muted">{open.clicks} clicks · last 14 days</span>
            <button type="button" onClick={() => setOpen(null)}>
              Close
            </button>
          </div>
          <div className="bars">
            {open.days.map((d) => {
              const max = Math.max(1, ...open.days.map((x) => x.clicks));
              return (
                <div className="bar" key={d.day} title={`${d.day}: ${d.clicks}`}>
                  <div className="fill" style={{ height: `${(d.clicks / max) * 100}%` }} />
                  <span className="day">{d.day.slice(8)}</span>
                </div>
              );
            })}
          </div>
        </section>
      ) : null}
    </main>
  );
}
