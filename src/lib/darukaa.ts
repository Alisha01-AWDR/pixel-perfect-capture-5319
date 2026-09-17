export type Project = {
  id: string;
  name: string;
  description?: string;
  area: string;
  sites: number;
  progress: number;
  status: "active" | "review" | "planned";
};

export type Site = {
  id: string;
  project_id: string;
  name: string;
  area: string;
  status: "forest" | "degraded" | "water";
  coordinates: number[][][];
};

export type Metric = {
  metric_type: "carbon" | "biodiversity" | "canopy";
  value: number;
  recorded_at: string;
};

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/$/, "") ?? "";
const DEMO_TOKEN = "darukaa-demo-session";

const demoProjects: Project[] = [
  { id: "p-atlantic", name: "Atlantic Forest Corridor", area: "12,480 ha", sites: 4, progress: 98, status: "active" },
  { id: "p-savanna", name: "Savanna Restoration", area: "8,200 ha", sites: 3, progress: 74, status: "review" },
  { id: "p-mangrove", name: "Mangrove Basin", area: "3,950 ha", sites: 2, progress: 61, status: "planned" },
];

const demoSites: Site[] = [
  { id: "s-04", project_id: "p-atlantic", name: "Site 04", area: "12,480 ha", status: "forest", coordinates: [] },
  { id: "s-05", project_id: "p-atlantic", name: "River Edge", area: "2,140 ha", status: "water", coordinates: [] },
  { id: "s-12", project_id: "p-savanna", name: "North Rangeland", area: "4,100 ha", status: "degraded", coordinates: [] },
];

function readLocal<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const value = window.localStorage.getItem(key);
    return value ? (JSON.parse(value) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeLocal<T>(key: string, value: T) {
  if (typeof window !== "undefined") window.localStorage.setItem(key, JSON.stringify(value));
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const token = typeof window !== "undefined" ? window.localStorage.getItem("darukaa_token") : null;
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init?.headers ?? {}),
    },
  });
  if (!response.ok) throw new Error(`Request failed: ${response.status}`);
  return (await response.json()) as T;
}

export const isDemoMode = !API_BASE_URL;

export async function loginRequest(email: string, password: string) {
  if (isDemoMode) return DEMO_TOKEN;
  const body = new URLSearchParams({ username: email, password });
  const result = await request<{ access_token: string }>("/auth/login", { method: "POST", body, headers: { "Content-Type": "application/x-www-form-urlencoded" } });
  return result.access_token;
}

export async function registerRequest(email: string, password: string) {
  if (isDemoMode) return DEMO_TOKEN;
  await request("/auth/register", { method: "POST", body: JSON.stringify({ email, password }) });
  return loginRequest(email, password);
}

export async function listProjects() {
  if (isDemoMode) return readLocal("darukaa_projects", demoProjects);
  return request<Project[]>("/projects");
}

export async function listSites() {
  if (isDemoMode) return readLocal("darukaa_sites", demoSites);
  return request<Site[]>("/sites");
}

export async function listProjectSites(projectId: string) {
  if (isDemoMode) return (await listSites()).filter((site) => site.project_id === projectId);
  return request<Site[]>(`/projects/${projectId}/sites`);
}

export async function createProject(name: string) {
  if (isDemoMode) {
    const projects = await listProjects();
    const project: Project = { id: `p-${Date.now()}`, name, area: "—", sites: 0, progress: 0, status: "planned" };
    writeLocal("darukaa_projects", [project, ...projects]);
    return project;
  }
  return request<Project>("/projects", { method: "POST", body: JSON.stringify({ name, description: "Created from Darukaa.Earth" }) });
}

export async function createSite(projectId: string, name: string, coordinates: number[][][]) {
  if (isDemoMode) {
    const sites = await listSites();
    const site: Site = { id: `s-${Date.now()}`, project_id: projectId, name, area: "New boundary", status: "forest", coordinates };
    writeLocal("darukaa_sites", [site, ...sites]);
    return site;
  }
  return request<Site>(`/projects/${projectId}/sites`, { method: "POST", body: JSON.stringify({ name, coordinates }) });
}

export async function listMetrics(siteId: string) {
  if (isDemoMode) {
    return [
      { metric_type: "carbon", value: 4.1, recorded_at: "2026-06-01" },
      { metric_type: "biodiversity", value: 0.87, recorded_at: "2026-06-01" },
      { metric_type: "canopy", value: 71, recorded_at: "2026-06-01" },
      { metric_type: "carbon", value: 3.8, recorded_at: "2025-12-01" },
      { metric_type: "biodiversity", value: 0.84, recorded_at: "2025-12-01" },
      { metric_type: "canopy", value: 69.8, recorded_at: "2025-12-01" },
    ] satisfies Metric[];
  }
  return request<Metric[]>(`/sites/${siteId}/metrics`);
}

export async function seedMetrics(siteId: string) {
  if (isDemoMode) return listMetrics(siteId);
  await request(`/sites/${siteId}/metrics/seed-mock-data`, { method: "POST" });
  return listMetrics(siteId);
}

export function demoSessionToken() {
  return DEMO_TOKEN;
}