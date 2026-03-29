export function getApiBaseUrl() {
  const raw = process.env.NEXT_PUBLIC_API_URL;
  if (raw && raw.trim().length > 0) {
    const trimmed = raw.trim().replace(/\/+$/, "");

    // If the site is running on a public origin (e.g. Vercel), browsers block
    // requests to a user's localhost/private network. Guard against accidental
    // misconfiguration where NEXT_PUBLIC_API_URL is still set to localhost.
    if (typeof window !== "undefined") {
      const pageHost = window.location.hostname;
      const pageIsLoopback =
        pageHost === "localhost" ||
        pageHost === "127.0.0.1" ||
        pageHost === "0.0.0.0";

      const apiIsLoopback = /^https?:\/\/(localhost|127\.0\.0\.1|0\.0\.0\.0)(:\d+)?(\/|$)/i.test(trimmed);

      if (!pageIsLoopback && apiIsLoopback) {
        // Ignore and fall through to the production default.
      } else {
        return trimmed;
      }
    } else {
      return trimmed;
    }
  }

  // Local dev default.
  if (process.env.NODE_ENV !== "production") {
    return "http://localhost:5000";
  }

  // Production default (Render backend).
  return "https://reposmart.onrender.com";
}

export function buildApiUrl(path: string) {
  const base = getApiBaseUrl();
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return new URL(normalizedPath, base).toString();
}

type PostJsonOptions = {
  token?: string | null;
};

export async function postJson<T>(path: string, body: unknown, options: PostJsonOptions = {}): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (options.token) {
    headers.Authorization = `Bearer ${options.token}`;
  }

  const res = await fetch(buildApiUrl(path), {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    // const message =
    //   data &&
    //   typeof data === "object" &&
    //   "message" in data &&
    //   typeof (data as { message?: unknown }).message === "string"
    //     ? (data as { message: string }).message
    //     : `Request failed (${res.status})`;

    const message =
      data?.message ||
      data?.error ||
      `Request failed (${res.status})`;

    throw new Error(message);
  }

  return data as T;
}
