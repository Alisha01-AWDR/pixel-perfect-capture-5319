import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { AppShell, MapSurface, MetricCard, ProjectList } from "@/components/darukaa-shell";
import { useAuth } from "@/lib/auth";
import { listProjects, listSites, type Project, type Site } from "@/lib/darukaa";

export const Route = createFileRoute("/dashboard")({
  head: () => ({ meta: [{ title: "Monitoring Overview — Darukaa.Earth" }, { name: "description", content: "See projects, sites, and ecological monitoring activity at a glance." }, { property: "og:title", content: "Monitoring Overview — Darukaa.Earth" }, { property: "og:description", content: "See projects, sites, and ecological monitoring activity at a glance." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" }] }),
  component: DashboardPage,
});

export function DashboardPage() {
  const { token, isReady } = useAuth();
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  useEffect(() => { if (isReady && !token) navigate({ to: "/login" }); }, [isReady, navigate, token]);
  useEffect(() => { if (!token) return; Promise.all([listProjects(), listSites()]).then(([nextProjects, nextSites]) => { setProjects(nextProjects); setSites(nextSites); }).finally(() => setIsLoading(false)); }, [token]);
  return <AppShell><div className="flex flex-1 flex-col gap-4 overflow-auto p-4 lg:flex-row"><MapSurface sites={sites} onSiteClick={(site) => navigate({ to: "/sites/$siteId", params: { siteId: site.id } })} /><aside className="flex w-full flex-col gap-4 lg:w-[340px]"><div className="grid grid-cols-2 gap-3"><MetricCard label="Carbon stock" value="4.1M" detail="tCO₂e · +2.4%" /><MetricCard label="Biodiversity idx" value="0.87" detail="Shannon · stable" tone="ink" /><MetricCard label="Canopy cover" value="71%" detail="+1.1 pts" /><MetricCard label="Alerts 30d" value="3" detail="2 open" tone="amber" /></div><div className="panel rounded-[12px] p-3.5"><div className="flex items-center justify-between"><p className="type-display text-sm font-semibold">Active projects</p><Button variant="link" className="h-auto p-0 type-mono text-[11px] text-moss">View all</Button></div>{isLoading ? <p className="mt-4 text-sm text-ink-soft">Loading projects…</p> : projects.length ? <ProjectList projects={projects} /> : <EmptyProjects />}</div><div className="rounded-[12px] border border-dashed border-ink/15 bg-card/40 p-5 text-center backdrop-blur-xl"><div className="mx-auto grid size-9 place-items-center rounded-full bg-mist-deep text-moss">⌖</div><p className="type-display mt-2.5 text-[13px] font-semibold">{sites.length ? "All boundaries accounted for" : "No polygon site yet"}</p><p className="mx-auto mt-1 max-w-[24ch] text-[12px] text-ink-soft">{sites.length ? "Select a boundary on the map to open its latest metrics." : "Create a project, then draw a boundary on the map to begin monitoring."}</p></div></aside></div></AppShell>;
}

function EmptyProjects() { return <div className="mt-4 rounded-[9px] bg-mist-deep/50 p-4 text-sm text-ink-soft">No projects yet. Use <span className="font-medium text-moss">New project</span> to start your first monitoring workspace.</div>; }