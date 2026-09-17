import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/darukaa-shell";
import { useAuth } from "@/lib/auth";
import { listProjects, type Project } from "@/lib/darukaa";

export const Route = createFileRoute("/projects")({
  head: () => ({ meta: [{ title: "Projects — Darukaa.Earth" }, { name: "description", content: "Manage ecological monitoring projects in Darukaa.Earth." }, { property: "og:title", content: "Projects — Darukaa.Earth" }, { property: "og:description", content: "Manage ecological monitoring projects in Darukaa.Earth." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" }] }),
  component: ProjectsPage,
});

export function ProjectsPage() {
  const { token } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  useEffect(() => { if (token) void listProjects().then(setProjects); }, [token]);
  return <AppShell title="Projects" subtitle="Workspace index · active monitoring portfolios"><div className="flex-1 overflow-auto p-6"><div className="mx-auto max-w-5xl"><div className="mb-5"><p className="type-mono text-[10px] uppercase tracking-[0.18em] text-ink-soft">Operations</p><h2 className="type-display mt-1 text-3xl font-semibold">Your project register</h2><p className="mt-2 text-sm text-ink-soft">Every landscape, boundary, and monitoring target in one place.</p></div><div className="grid gap-3 md:grid-cols-2">{projects.map((project) => <Link key={project.id} to="/projects/$projectId" params={{ projectId: project.id }} className="panel rounded-[12px] p-5 transition-transform hover:-translate-y-0.5"><div className="flex items-start justify-between"><div><p className="type-mono text-[10px] uppercase tracking-[0.15em] text-moss">{project.status}</p><h3 className="type-display mt-2 text-lg font-semibold">{project.name}</h3></div><span className="type-mono text-xs text-ink-soft">{project.progress}%</span></div><p className="mt-3 text-sm text-ink-soft">{project.area} · {project.sites} monitored sites</p><div className="mt-4 h-1.5 overflow-hidden rounded-full bg-ink/10"><div className="h-full rounded-full bg-moss" style={{ width: `${project.progress}%` }} /></div></Link>)}</div></div></div></AppShell>;
}