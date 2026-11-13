import type { ApiError } from "./types";

/** A failed API call with the server's user-facing message. */
export class ApiFailure extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
  ) {
    super(message);
  }
}

export async function api<T>(path: string, init?: { method?: string; body?: unknown; signal?: AbortSignal }): Promise<T> {
  let res: Response;
  try {
    res = await fetch(path, {
      method: init?.method ?? "GET",
      headers: init?.body !== undefined ? { "Content-Type": "application/json" } : undefined,
      body: init?.body !== undefined ? JSON.stringify(init.body) : undefined,
      signal: init?.signal,
      cache: "no-store",
    });
  } catch (err) {
    if ((err as Error).name === "AbortError") throw err;
    throw new ApiFailure(0, "NETWORK", "Can't reach the server. Check your connection and try again.");
  }
  if (res.status === 401 && typeof window !== "undefined") {
    // Session expired mid-use: a full load to the login page resets all client state.
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination
    window.location.href = "/login?expired=1";
  }
  const data = (await res.json().catch(() => null)) as (T & Partial<ApiError>) | null;
  if (!res.ok) {
    throw new ApiFailure(
      res.status,
      data?.error?.code ?? "HTTP_" + res.status,
      data?.error?.message ?? "Something went wrong. Please try again.",
    );
  }
  return data as T;
}
