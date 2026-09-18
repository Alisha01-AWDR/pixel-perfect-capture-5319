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

const API_BASE_URL = (import.meta.env["VITE_API_BASE_URL"] as string | undefined)?.replace(/\/$/, "") ?? "";
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
  if (response.status === 401 && typeof window !== "undefined") {
    window.localStorage.removeItem("darukaa_token");
  }
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

export async function listProjects(): Promise<Project[]> {
  if (isDemoMode) return readLocal("darukaa_projects", demoProjects);
  try {
    return await request<Project[]>("/projects");
  } catch {
    return readLocal("darukaa_projects", demoProjects);
  }
}

export async function getProject(projectId: string): Promise<Project | null> {
  if (isDemoMode) {
    const projects = await listProjects();
    return projects.find((p) => p.id === projectId) ?? null;
  }
  try {
    return await request<Project>(`/projects/${projectId}`);
  } catch {
    const projects = await listProjects();
    return projects.find((p) => p.id === projectId) ?? null;
  }
}

export async function listSites(): Promise<Site[]> {
  if (isDemoMode) return readLocal("darukaa_sites", demoSites);
  try {
    return await request<Site[]>("/sites");
  } catch {
    return readLocal("darukaa_sites", demoSites);
  }
}

export async function listProjectSites(projectId: string): Promise<Site[]> {
  if (isDemoMode) return (await listSites()).filter((site) => site.project_id === projectId);
  try {
    return await request<Site[]>(`/projects/${projectId}/sites`);
  } catch {
    return (await listSites()).filter((site) => site.project_id === projectId);
  }
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

export type SiteMetricsSummary = {
  carbon: { value: string; detail: string; tone: "moss" | "amber" | "ink" };
  biodiversity: { value: string; detail: string; tone: "moss" | "amber" | "ink" };
  canopy: { value: string; detail: string; tone: "moss" | "amber" | "ink" };
  alerts: { value: string; detail: string; tone: "moss" | "amber" | "ink" };
};

export function formatSiteMetrics(site: Site | null, metrics: Metric[]): SiteMetricsSummary {
  if (!site) {
    return {
      carbon: { value: "—", detail: "Select a site", tone: "ink" },
      biodiversity: { value: "—", detail: "Select a site", tone: "ink" },
      canopy: { value: "—", detail: "Select a site", tone: "ink" },
      alerts: { value: "0", detail: "0 open", tone: "moss" },
    };
  }

  const carbons = metrics.filter((m) => m.metric_type === "carbon");
  const bios = metrics.filter((m) => m.metric_type === "biodiversity");
  const canopies = metrics.filter((m) => m.metric_type === "canopy");

  // Carbon computation
  const latestCarbon = carbons[0]?.value;
  const prevCarbon = carbons[1]?.value;
  let carbonValue = "—";
  let carbonDetail = "tCO₂e · latest";
  let carbonTone: "moss" | "amber" | "ink" = "moss";

  if (latestCarbon !== undefined) {
    if (latestCarbon >= 1_000_000) {
      carbonValue = `${(latestCarbon / 1_000_000).toFixed(1)}M`;
    } else if (latestCarbon >= 1000) {
      carbonValue = `${(latestCarbon / 1000).toFixed(1)}k`;
    } else {
      carbonValue = `${latestCarbon.toFixed(1)}M`;
    }

    if (prevCarbon !== undefined && prevCarbon > 0) {
      const diffPercent = ((latestCarbon - prevCarbon) / prevCarbon) * 100;
      const sign = diffPercent >= 0 ? "+" : "";
      carbonDetail = `tCO₂e · ${sign}${diffPercent.toFixed(1)}%`;
      carbonTone = diffPercent < 0 ? "amber" : "moss";
    }
  }

  // Biodiversity computation
  const latestBio = bios[0]?.value;
  const prevBio = bios[1]?.value;
  let bioValue = "—";
  let bioDetail = "Shannon · stable";
  let bioTone: "moss" | "amber" | "ink" = "ink";

  if (latestBio !== undefined) {
    bioValue = latestBio.toFixed(2);
    if (prevBio !== undefined) {
      const diff = latestBio - prevBio;
      if (diff > 0.01) {
        bioDetail = "Shannon · improving";
        bioTone = "moss";
      } else if (diff < -0.01) {
        bioDetail = "Shannon · declining";
        bioTone = "amber";
      } else {
        bioDetail = "Shannon · stable";
      }
    }
  }

  // Canopy computation
  const latestCanopy = canopies[0]?.value;
  const prevCanopy = canopies[1]?.value;
  let canopyValue = "—";
  let canopyDetail = "+0.0 pts";
  let canopyTone: "moss" | "amber" | "ink" = "moss";

  if (latestCanopy !== undefined) {
    canopyValue = `${Math.round(latestCanopy)}%`;
    if (prevCanopy !== undefined) {
      const diffPts = latestCanopy - prevCanopy;
      const sign = diffPts >= 0 ? "+" : "";
      canopyDetail = `${sign}${diffPts.toFixed(1)} pts`;
      canopyTone = diffPts < 0 || latestCanopy < 60 ? "amber" : "moss";
    } else {
      canopyDetail = "Latest reading";
      canopyTone = latestCanopy < 60 ? "amber" : "moss";
    }
  }

  // Alerts computation based on site status & telemetry
  let alertsValue = "0";
  let alertsDetail = "0 open";
  let alertsTone: "moss" | "amber" | "ink" = "moss";

  if (site.status === "degraded") {
    alertsValue = "3";
    alertsDetail = "2 open";
    alertsTone = "amber";
  } else if (site.status === "water") {
    alertsValue = "1";
    alertsDetail = "1 open";
    alertsTone = "amber";
  } else {
    if (latestCanopy !== undefined && latestCanopy < 68) {
      alertsValue = "2";
      alertsDetail = "1 open";
      alertsTone = "amber";
    } else if (prevCarbon !== undefined && latestCarbon !== undefined && latestCarbon < prevCarbon) {
      alertsValue = "1";
      alertsDetail = "1 open";
      alertsTone = "amber";
    } else {
      alertsValue = "0";
      alertsDetail = "0 open";
      alertsTone = "moss";
    }
  }

  return {
    carbon: { value: carbonValue, detail: carbonDetail, tone: carbonTone },
    biodiversity: { value: bioValue, detail: bioDetail, tone: bioTone },
    canopy: { value: canopyValue, detail: canopyDetail, tone: canopyTone },
    alerts: { value: alertsValue, detail: alertsDetail, tone: alertsTone },
  };
}

function getFallbackMetrics(siteId: string): Metric[] {
  const h = (siteId || "default").split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
  const offsetC = ((h % 15) - 7) * 0.15;
  const offsetB = ((h % 11) - 5) * 0.02;
  const offsetK = ((h % 17) - 8) * 1.5;

  const carbon = Math.max(1.5, Number((4.1 + offsetC).toFixed(1)));
  const prevCarbon = Number(Math.max(1.2, carbon - 0.15).toFixed(1));
  const bio = Math.max(0.5, Math.min(0.99, Number((0.87 + offsetB).toFixed(2))));
  const prevBio = Number(Math.max(0.4, bio - 0.02).toFixed(2));
  const canopy = Math.max(40, Math.min(95, Number((71 + offsetK).toFixed(1))));
  const prevCanopy = Number(Math.max(35, canopy - 1.2).toFixed(1));

  return [
    { metric_type: "carbon", value: carbon, recorded_at: "2026-06-01" },
    { metric_type: "biodiversity", value: bio, recorded_at: "2026-06-01" },
    { metric_type: "canopy", value: canopy, recorded_at: "2026-06-01" },
    { metric_type: "carbon", value: prevCarbon, recorded_at: "2025-12-01" },
    { metric_type: "biodiversity", value: prevBio, recorded_at: "2025-12-01" },
    { metric_type: "canopy", value: prevCanopy, recorded_at: "2025-12-01" },
  ];
}

export async function listMetrics(siteId: string): Promise<Metric[]> {
  if (isDemoMode) {
    return getFallbackMetrics(siteId);
  }
  try {
    return await request<Metric[]>(`/sites/${siteId}/metrics`);
  } catch (err) {
    console.warn(`Failed to fetch backend metrics for ${siteId}, using fallback`, err);
    return getFallbackMetrics(siteId);
  }
}

export async function seedMetrics(siteId: string) {
  if (isDemoMode) return listMetrics(siteId);
  try {
    await request(`/sites/${siteId}/metrics/seed-mock-data`, { method: "POST" });
  } catch (err) {
    console.warn(`Failed to seed metrics on backend for ${siteId}`, err);
  }
  return listMetrics(siteId);
}

export function demoSessionToken() {
  return DEMO_TOKEN;
}