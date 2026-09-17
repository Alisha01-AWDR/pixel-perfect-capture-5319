import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, Check, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AppShell, MapSurface } from "@/components/darukaa-shell";
import { createSite, listProjectSites, listProjects, type Project, type Site } from "@/lib/darukaa";

export const Route = createFileRoute("/_authenticated/projects/$projectId")({
  head: () => ({ meta: [{ title: "Project detail — Darukaa.Earth" }, { name: "description", content: "Manage sites and boundaries within a Darukaa.Earth project." }, { property: "og:title", content: "Project detail — Darukaa.Earth" }, { property: "og:description", content: "Manage sites and boundaries within a Darukaa.Earth project." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" }] }),
  component: ProjectDetailPage,
});

function ProjectDetailPage() {
  const { projectId } = Route.useParams();
  const [project, setProject] = useState<Project | null>(null);
  const [sites, setSites] = useState<Site[]>([]);
  const [points, setPoints] = useState<Array<{ x: number; y: number }>>([]);
  const [siteName, setSiteName] = useState("");
  useEffect(() => { void Promise.all([listProjects(), listProjectSites(projectId)]).then(([projects, nextSites]) => { setProject(projects.find((item) => item.id === projectId) ?? null); setSites(nextSites); }); }, [projectId]);
  async function saveSite() { if (points.length < 3 || !siteName.trim()) return; const coordinates = [points.map((point) => [point.x, point.y])]; await createSite(projectId, siteName.trim(), coordinates); setSites(await listProjectSites(projectId)); setPoints([]); setSiteName(""); }
  return <AppShell title={project?.name ?? "Project"} subtitle={`${project?.area ?? "Workspace"} · boundary editor`}><div className="flex flex-1 flex-col gap-4 overflow-auto p-4 lg:flex-row"><MapSurface sites={sites} drawing draftPoints={points} onMapClick={(point) => setPoints((current) => [...current, point])} onSiteClick={(site) => { window.location.href = `/sites/${site.id}`; }} /><aside className="flex w-full flex-col gap-4 lg:w-[340px]"><Link to="/projects" className="flex items-center gap-2 text-sm text-ink-soft hover:text-ink"><ArrowLeft size={15} />Back to projects</Link><div className="panel rounded-[12px] p-4"><p className="type-mono text-[10px] uppercase tracking-[0.16em] text-ink-soft">Draw a new boundary</p><h2 className="type-display mt-1 text-lg font-semibold">Add monitoring site</h2><p className="mt-2 text-sm leading-5 text-ink-soft">Click at least three points on the map, then name the site before saving.</p><label htmlFor="site-name" className="mt-4 block text-sm font-medium">Site name</label><Input id="site-name" value={siteName} onChange={(event) => setSiteName(event.target.value)} placeholder="e.g. River Edge North" className="mt-2 bg-card/60" /><div className="mt-3 flex items-center justify-between type-mono text-[10px] text-ink-soft"><span>{points.length} boundary points</span>{points.length > 0 && <button className="flex items-center gap-1 text-amber hover:underline" onClick={() => setPoints([])}><Trash2 size={12} />Clear</button>}</div><Button disabled={points.length < 3 || !siteName.trim()} onClick={saveSite} className="mt-4 w-full bg-moss text-mist hover:bg-moss-deep"><Check size={15} />Save site</Button></div><div className="panel rounded-[12px] p-4"><div className="flex items-center justify-between"><p className="type-display text-sm font-semibold">Sites in this project</p><span className="type-mono text-[10px] text-ink-soft">{sites.length} total</span></div><div className="mt-3 space-y-1">{sites.map((site) => <Link key={site.id} to="/sites/$siteId" params={{ siteId: site.id }} className="flex items-center gap-3 rounded-[9px] px-2 py-2 hover:bg-card/70"><span className="size-2 rounded-full bg-moss" /><span className="min-w-0 flex-1 truncate text-[13px]">{site.name}</span><span className="type-mono text-[10px] text-ink-soft">{site.area}</span></Link>)}</div></div></aside></div></AppShell>;
}