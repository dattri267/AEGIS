import type { ZoneSummary, ZoneDetail, InterventionOption, Dispatch, Scorecard } from "@/types";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = "ApiError";
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${BASE_URL}${path}`, {
      ...init,
      headers: { "Content-Type": "application/json", ...(init?.headers || {}) },
      cache: "no-store",
    });
  } catch {
    throw new ApiError(0, "Could not reach the Aegis API. Is the backend running on " + BASE_URL + "?");
  }
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new ApiError(res.status, body.detail || `Request failed (${res.status})`);
  }
  return res.json();
}

export const api = {
  listZones: () => request<{ zones: ZoneSummary[] }>("/api/zones"),

  getZone: (id: number) => request<ZoneDetail>(`/api/zones/${id}`),

  getInterventions: (id: number) =>
    request<{ interventions: InterventionOption[] }>(`/api/zones/${id}/interventions`),

  createDispatch: (zoneId: number, interventions: string[]) =>
    request<Dispatch>("/api/dispatches", {
      method: "POST",
      body: JSON.stringify({ zone_id: zoneId, interventions }),
    }),

  listDispatches: () => request<{ dispatches: Dispatch[] }>("/api/dispatches"),

  resolveDispatch: (id: number) =>
    request<Dispatch>(`/api/dispatches/${id}/resolve`, { method: "POST" }),

  getScorecard: () => request<Scorecard>("/api/scorecard"),
};

export { ApiError };
