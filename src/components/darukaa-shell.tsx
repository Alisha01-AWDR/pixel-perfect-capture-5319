import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from "react";
import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import { ArrowRight, BarChart3, Compass, LogOut, MapPinned, Plus, Search, Settings2, Users, X, ZoomIn, ZoomOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/lib/auth";
import { createProject, type Project, type Site } from "@/lib/darukaa";
import forestMap from "@/assets/forest-map.jpg";

type ShellProps = { children: ReactNode; title?: string; subtitle?: string };

export function AppShell({ children, title = "Monitoring Overview", subtitle = "Live satellite desk · 06:42 UTC" }: ShellProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [showNewProject, setShowNewProject] = useState(false);
  const [projectName, setProjectName] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  async function handleProjectSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!projectName.trim()) return;
    setIsSaving(true);
    const project = await createProject(projectName.trim());
    setProjectName("");
    setIsSaving(false);
    setShowNewProject(false);
    navigate({ to: "/projects/$projectId", params: { projectId: project.id } });
  }

  return (
    <div className="app-shell min-h-screen">
      <div className="mx-auto flex min-h-screen max-w-[1560px] overflow-hidden">
        <aside className="flex w-[264px] shrink-0 flex-col border-r border-ink/10 bg-mist-deep/60 backdrop-blur-xl">
          <div className="flex items-center gap-2.5 px-5 pb-4 pt-5">
            <div className="grid size-9 place-items-center rounded-[10px] bg-moss font-display text-sm font-semibold text-mist ring-1 ring-moss-deep/20">D</div>
            <div className="leading-tight">
              <p className="type-display text-[15px] font-semibold tracking-tight">Darukaa.Earth</p>
              <p className="type-mono text-[10px] uppercase tracking-[0.18em] text-ink-soft">Field Console</p>
            </div>
          </div>
          <div className="px-3 pt-2">
            <Button onClick={() => setShowNewProject(true)} className="h-auto w-full justify-start rounded-[10px] bg-moss px-3 py-2.5 text-sm font-medium text-mist shadow-sm ring-1 ring-moss-deep/25 hover:bg-moss-deep">
              <span className="grid size-5 place-items-center rounded-md bg-mist/15 text-base leading-none"><Plus size={15} /></span>
              <span className="pl-0.5">New project</span>
            </Button>
          </div>
          <nav className="mt-5 flex-1 space-y-0.5 px-3">
            <p className="px-2 pb-1.5 type-mono text-[10px] uppercase tracking-[0.2em] text-ink-soft/70">Operations</p>
            <NavItem to="/dashboard" label="Overview" icon={<Compass size={14} />} active={location.pathname === "/" || location.pathname === "/dashboard"} />
            <NavItem to="/projects" label="Projects" icon={<MapPinned size={14} />} active={location.pathname.startsWith("/projects")} count="07" />
            <NavItem to="/sites" label="Sites" icon={<MapPinned size={14} />} active={location.pathname.startsWith("/sites")} count="23" />
            <NavItem to="/analytics" label="Analytics" icon={<BarChart3 size={14} />} active={location.pathname === "/analytics"} />
            <p className="px-2 pb-1.5 pt-4 type-mono text-[10px] uppercase tracking-[0.2em] text-ink-soft/70">Workspace</p>
            <NavItem to="/projects" label="Teams" icon={<Users size={14} />} active={false} />
            <NavItem to="/projects" label="Settings" icon={<Settings2 size={14} />} active={false} />
          </nav>
          <div className="panel m-3 rounded-[12px] p-3">
            <div className="flex items-center justify-between">
              <p className="type-mono text-[10px] uppercase tracking-[0.15em] text-ink-soft">Carbon budget</p>
              <span className="type-mono text-[10px] text-moss">92%</span>
            </div>
            <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-ink/10"><div className="h-full w-[92%] rounded-full bg-moss" /></div>
            <p className="mt-2 text-[11px] text-ink-soft">4.1M tCO₂e of 4.4M target</p>
          </div>
          <button className="flex items-center gap-2.5 border-t border-ink/10 px-4 py-3.5 text-left transition-colors hover:bg-mist/50" onClick={logout} title="Sign out">
            <div className="grid size-8 shrink-0 place-items-center rounded-full bg-moss-deep type-display text-xs font-semibold text-mist">AO</div>
            <div className="min-w-0 flex-1 leading-tight"><p className="truncate text-[13px] font-medium">Amara Okonkwo</p><p className="type-mono text-[10px] text-ink-soft">Field Lead</p></div>
            <LogOut size={14} className="text-ink-soft" />
          </button>
        </aside>

        <main className="flex min-w-0 flex-1 flex-col">
          <header className="flex items-center gap-4 border-b border-ink/10 bg-mist/70 px-6 py-3.5 backdrop-blur-xl">
            <div className="min-w-0"><h1 className="type-display text-lg font-semibold tracking-tight">{title}</h1><p className="type-mono text-[11px] text-ink-soft">{subtitle}</p></div>
            <div className="ml-auto flex items-center gap-2.5">
              <div className="hidden items-center gap-2 rounded-[9px] border border-ink/10 bg-card/60 px-3 py-2 backdrop-blur-xl md:flex"><Search size={13} className="text-ink-soft" /><span className="type-mono text-[11px] text-ink-soft">Search sites, metrics…</span><span className="ml-4 type-mono text-[10px] text-ink-soft/60">⌘K</span></div>
              <div className="flex items-center gap-2 rounded-[9px] border border-ink/10 bg-card/60 px-3 py-2 backdrop-blur-xl"><span className="relative flex size-2"><span className="console-pulse absolute inline-flex size-2 rounded-full bg-moss" /><span className="relative inline-flex size-2 rounded-full bg-moss" /></span><span className="type-mono text-[11px] text-ink-soft">4 sensors live</span></div>
              <Button variant="outline" size="icon" className="rounded-[9px] border-ink/10 bg-card/60 text-ink-soft hover:bg-card"><Settings2 size={15} /></Button>
            </div>
          </header>
          {children}
        </main>
      </div>
      {showNewProject && <div className="fixed inset-0 z-50 grid place-items-center bg-ink/20 p-4 backdrop-blur-sm"><form onSubmit={handleProjectSubmit} className="panel w-full max-w-md rounded-[14px] p-5 shadow-xl"><div className="flex items-start justify-between"><div><p className="type-mono text-[10px] uppercase tracking-[0.18em] text-ink-soft">Workspace</p><h2 className="type-display mt-1 text-xl font-semibold">Start a new project</h2></div><Button type="button" variant="ghost" size="icon" onClick={() => setShowNewProject(false)}><X size={16} /></Button></div><label className="mt-5 block text-sm font-medium" htmlFor="new-project-name">Project name</label><Input id="new-project-name" value={projectName} onChange={(event) => setProjectName(event.target.value)} placeholder="e.g. Lower Congo Basin" className="mt-2 bg-card/60" autoFocus /><Button type="submit" disabled={isSaving || !projectName.trim()} className="mt-5 w-full bg-moss text-mist hover:bg-moss-deep">{isSaving ? "Creating…" : "Create project"}<ArrowRight size={15} /></Button></form></div>}
    </div>
  );
}

function NavItem({ to, label, icon, active, count }: { to: "/dashboard" | "/projects" | "/sites" | "/analytics"; label: string; icon: ReactNode; active: boolean; count?: string }) {
  return <Link to={to} className={`flex items-center gap-3 rounded-[9px] px-3 py-2 text-sm font-medium transition-colors ${active ? "bg-card/70 text-ink ring-1 ring-ink/5" : "text-ink-soft hover:bg-card/40 hover:text-ink"}`}><span className={active ? "text-moss" : "text-sage"}>{icon}</span>{label}{count && <span className="ml-auto type-mono text-[11px] text-ink-soft/70">{count}</span>}</Link>;
}

export function MetricCard({ label, value, detail, tone = "moss" }: { label: string; value: string; detail: string; tone?: "moss" | "amber" | "ink" }) {
  return <div className="panel rounded-[12px] p-3.5"><p className="type-mono text-[10px] uppercase tracking-[0.15em] text-ink-soft">{label}</p><p className="type-display mt-1.5 text-2xl font-semibold tracking-tight">{value}</p><p className={`type-mono text-[11px] ${tone === "amber" ? "text-amber" : tone === "ink" ? "text-ink-soft" : "text-moss"}`}>{detail}</p></div>;
}

export function MapSurface({ sites = [], drawing = false, draftPoints = [], onMapClick, onSiteClick }: { sites?: Site[]; drawing?: boolean; draftPoints?: Array<{ x: number; y: number }>; onMapClick?: (point: { x: number; y: number }) => void; onSiteClick?: (site: Site) => void }) {
  const polygons = useMemo(() => sites.map((site, index) => ({ site, points: index === 0 ? "18,24 34,18 45,30 42,48 29,56 17,46" : index === 1 ? "57,38 72,30 82,42 78,58 63,62 54,51" : "39,62 52,56 61,67 55,80 42,78" })), [sites]);
  function handleMapClick(event: React.MouseEvent<HTMLDivElement>) { if (!onMapClick) return; const bounds = event.currentTarget.getBoundingClientRect(); onMapClick({ x: ((event.clientX - bounds.left) / bounds.width) * 100, y: ((event.clientY - bounds.top) / bounds.height) * 100 }); }
  return <section className={`console-map relative min-h-[420px] flex-1 overflow-hidden rounded-[14px] border border-ink/10 ${drawing ? "cursor-crosshair" : ""}`} onClick={handleMapClick}><img className="map-image" src={forestMap} alt="Satellite view of a forest corridor and river" width={1280} height={820} /><div className="map-interaction-layer"><svg className="map-svg" viewBox="0 0 100 100" preserveAspectRatio="none">{polygons.map(({ site, points }) => <polygon key={site.id} className="map-site-shape" points={points} onClick={(event) => { event.stopPropagation(); onSiteClick?.(site); }} />)}{draftPoints.length > 0 && <polyline points={draftPoints.map((point) => `${point.x},${point.y}`).join(" ")} fill="none" stroke="var(--color-amber)" strokeWidth="0.8" strokeDasharray="2 1" vectorEffect="non-scaling-stroke" />}{draftPoints.map((point, index) => <circle key={`${point.x}-${point.y}`} cx={point.x} cy={point.y} r="1.4" fill="var(--color-amber)" stroke="var(--color-mist)" strokeWidth="0.45" vectorEffect="non-scaling-stroke" />)}</svg></div><div className="pointer-events-none absolute inset-0 z-10 bg-gradient-to-br from-card/30 via-transparent to-moss/10" /><div className="absolute left-4 top-4 z-20 rounded-[10px] border border-ink/10 bg-card/75 px-3 py-2 backdrop-blur-xl"><p className="type-mono text-[10px] uppercase tracking-[0.15em] text-ink-soft">Region</p><p className="type-display text-sm font-semibold">Atlantic Forest Corridor</p></div><div className="absolute right-4 top-4 z-20 flex flex-col gap-1.5"><Button variant="outline" size="icon" className="rounded-[8px] border-ink/10 bg-card/75 text-ink hover:bg-card"><ZoomIn size={15} /></Button><Button variant="outline" size="icon" className="rounded-[8px] border-ink/10 bg-card/75 text-ink hover:bg-card"><ZoomOut size={15} /></Button></div><div className="absolute bottom-4 left-4 z-20 flex flex-wrap gap-3 rounded-[10px] border border-ink/10 bg-card/75 px-3 py-2 backdrop-blur-xl"><span className="flex items-center gap-1.5 type-mono text-[10px] text-ink-soft"><span className="size-2 rounded-full bg-moss" />Forest</span><span className="flex items-center gap-1.5 type-mono text-[10px] text-ink-soft"><span className="size-2 rounded-full bg-amber" />Degraded</span><span className="flex items-center gap-1.5 type-mono text-[10px] text-ink-soft"><span className="size-2 rounded-full bg-sage" />Water</span></div><div className="absolute bottom-4 right-4 z-20 rounded-[10px] border border-ink/10 bg-ink/85 px-3 py-1.5 type-mono text-[10px] text-mist backdrop-blur-xl">23.4321° S · 46.6189° W</div>{drawing && <div className="absolute left-1/2 top-4 z-20 -translate-x-1/2 rounded-[9px] bg-ink/90 px-3 py-2 type-mono text-[10px] text-mist shadow-sm">Click map to place boundary points</div>}</section>;
}

export function ProjectList({ projects, onSelect }: { projects: Project[]; onSelect?: (project: Project) => void }) {
  return <ul className="mt-2.5 space-y-1">{projects.map((project) => <li key={project.id}><Link to="/projects/$projectId" params={{ projectId: project.id }} onClick={() => onSelect?.(project)} className="flex items-center gap-3 rounded-[9px] px-3 py-2.5 transition-colors hover:bg-card/70"><span className={`size-2 shrink-0 rounded-full ${project.status === "review" ? "bg-amber" : project.status === "planned" ? "bg-sage" : "bg-moss"}`} /><div className="min-w-0 flex-1 leading-tight"><p className="truncate text-[13px] font-medium">{project.name}</p><p className="type-mono text-[10px] text-ink-soft">{project.area} · {project.sites} sites</p></div><span className="type-mono text-[10px] text-ink-soft">{project.progress}%</span></Link></li>)}</ul>;
}

export function AuthPage({ mode }: { mode: "login" | "register" }) {
  const { token, isReady, login, register } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isBusy, setIsBusy] = useState(false);
  useEffect(() => { if (isReady && token) navigate({ to: "/dashboard" }); }, [isReady, navigate, token]);
  async function submit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); setError(""); setIsBusy(true); try { if (mode === "login") await login(email, password); else await register(email, password); navigate({ to: "/dashboard" }); } catch { setError("We couldn't complete that request. Check your details and try again."); } finally { setIsBusy(false); } }
  return <div className="app-shell grid min-h-screen place-items-center p-5"><div className="grid w-full max-w-5xl overflow-hidden rounded-[18px] border border-ink/10 bg-mist-deep/50 shadow-2xl lg:grid-cols-[1.1fr_0.9fr]"><div className="console-map relative min-h-[360px] overflow-hidden p-8 lg:min-h-[640px]"><img className="map-image" src={forestMap} alt="Forest corridor from above" width={1280} height={820} /><div className="relative z-10 flex h-full flex-col justify-between"><div className="flex items-center gap-2.5"><div className="grid size-9 place-items-center rounded-[10px] bg-moss type-display text-sm font-semibold text-mist">D</div><div><p className="type-display text-[15px] font-semibold tracking-tight">Darukaa.Earth</p><p className="type-mono text-[10px] uppercase tracking-[0.18em] text-ink-soft">Field Console</p></div></div><div className="max-w-sm"><p className="type-mono text-[10px] uppercase tracking-[0.2em] text-mist">Ecology, in evidence</p><h1 className="type-display mt-3 text-4xl font-semibold tracking-tight text-ink lg:text-5xl">Keep every living boundary in view.</h1><p className="mt-4 max-w-md text-sm leading-6 text-ink-soft">A focused workspace for carbon, biodiversity, and site monitoring across the landscapes that matter.</p></div><p className="type-mono text-[10px] uppercase tracking-[0.16em] text-ink-soft">Live satellite desk · 06:42 UTC</p></div></div><div className="bg-mist/90 p-8 lg:p-12"><p className="type-mono text-[10px] uppercase tracking-[0.18em] text-ink-soft">{mode === "login" ? "Welcome back" : "New field account"}</p><h2 className="type-display mt-2 text-3xl font-semibold">{mode === "login" ? "Sign in to your console" : "Create your console"}</h2><p className="mt-2 text-sm text-ink-soft">{mode === "login" ? "Continue where your monitoring left off." : "Start organizing your projects and sites."}</p><form className="mt-8 space-y-5" onSubmit={submit}><div><label htmlFor="email" className="text-sm font-medium">Email</label><Input id="email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required placeholder="you@organization.org" className="mt-2 bg-card/60" /></div><div><label htmlFor="password" className="text-sm font-medium">Password</label><Input id="password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} required minLength={6} placeholder="At least 6 characters" className="mt-2 bg-card/60" /></div>{error && <p className="rounded-[8px] border border-amber/30 bg-amber/10 px-3 py-2 text-sm text-amber">{error}</p>}<Button type="submit" disabled={isBusy} className="h-11 w-full bg-moss text-mist hover:bg-moss-deep">{isBusy ? "Connecting…" : mode === "login" ? "Enter field console" : "Create account"}<ArrowRight size={15} /></Button></form><p className="mt-8 text-center text-sm text-ink-soft">{mode === "login" ? "New to Darukaa.Earth? " : "Already have an account? "}<Link className="font-medium text-moss hover:underline" to={mode === "login" ? "/register" : "/login"}>{mode === "login" ? "Create an account" : "Sign in"}</Link></p></div></div></div>;
}