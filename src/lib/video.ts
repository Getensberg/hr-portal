export function getVideoEmbedUrl(raw: string): string | null {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return null;
  }
  if (url.protocol !== "https:" && url.protocol !== "http:") return null;
  const host = url.hostname.replace(/^www\./, "");
  const idPattern = /^[\w-]{6,20}$/;

  if (host === "youtu.be") {
    const id = url.pathname.slice(1);
    return idPattern.test(id) ? `https://www.youtube.com/embed/${id}` : null;
  }
  if (host === "youtube.com" || host === "m.youtube.com") {
    if (url.pathname === "/watch") {
      const id = url.searchParams.get("v");
      return id && idPattern.test(id) ? `https://www.youtube.com/embed/${id}` : null;
    }
    const m = url.pathname.match(/^\/(?:embed|shorts)\/([\w-]{6,20})/);
    if (m) return `https://www.youtube.com/embed/${m[1]}`;
  }
  if (host === "rutube.ru") {
    const m = url.pathname.match(/^\/(?:video|play\/embed)\/([a-f0-9]{16,40})/i);
    if (m) return `https://rutube.ru/play/embed/${m[1]}`;
  }
  return null;
}