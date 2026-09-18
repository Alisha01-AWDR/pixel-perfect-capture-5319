import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { AppShell, MapSurface, MetricCard, ProjectList } from "@/components/darukaa-shell";
import { useAuth } from "@/lib/auth";
import { listProjects, listSites, listMetrics, formatSiteMetrics, type Project, type Site, type Metric } from "@/lib/darukaa";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Monitoring Overview — Darukaa.Earth" },
      { name: "description", content: "See projects, sites, and ecological monitoring activity at a glance." },
      { property: "og:title", content: "Monitoring Overview — Darukaa.Earth" },
      { property: "og:description", content: "See projects, sites, and ecological monitoring activity at a glance." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: DashboardPage,
});

export function DashboardPage() {
  const { token, isReady } = useAuth();
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  const [selectedSite, setSelectedSite] = useState<Site | null>(null);
  const [siteMetrics, setSiteMetrics] = useState<Metric[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (isReady && !token) navigate({ to: "/login" });
  }, [isReady, navigate, token]);

  useEffect(() => {
    if (!token) return;
    Promise.all([listProjects(), listSites()])
      .then(([nextProjects, nextSites]) => {
        setProjects(nextProjects);
        setSites(nextSites);
        if (nextSites.length > 0) {
          setSelectedSite((prev) => {
            if (prev) {
              const matched = nextSites.find((s) => s.id === prev.id);
              if (matched) return matched;
            }
            return nextSites[0];
          });
        }
      })
      .catch((err) => {
        console.warn("Failed to load dashboard data", err);
      })
      .finally(() => setIsLoading(false));
  }, [token]);

  useEffect(() => {
    if (!selectedSite?.id) {
      setSiteMetrics([]);
      return;
    }
    let isCancelled = false;
    listMetrics(selectedSite.id)
      .then((metrics) => {
        if (!isCancelled) {
          setSiteMetrics(metrics);
        }
      })
      .catch((err) => {
        console.warn("Failed to fetch site metrics", err);
      });
    return () => {
      isCancelled = true;
    };
  }, [selectedSite?.id]);

  const metricsData = useMemo(() => {
    return formatSiteMetrics(selectedSite, siteMetrics);
  }, [selectedSite, siteMetrics]);

  return (
    <AppShell>
      <div className="flex flex-1 flex-col gap-4 overflow-auto p-4 lg:flex-row">
        <MapSurface
          sites={sites}
          selectedSiteId={selectedSite?.id}
          onSiteClick={(site) => setSelectedSite(site)}
        />
        <aside className="flex w-full flex-col gap-4 lg:w-[340px]">
          <div className="grid grid-cols-2 gap-3">
            <MetricCard
              label="Carbon stock"
              value={metricsData.carbon.value}
              detail={metricsData.carbon.detail}
              tone={metricsData.carbon.tone}
            />
            <MetricCard
              label="Biodiversity idx"
              value={metricsData.biodiversity.value}
              detail={metricsData.biodiversity.detail}
              tone={metricsData.biodiversity.tone}
            />
            <MetricCard
              label="Canopy cover"
              value={metricsData.canopy.value}
              detail={metricsData.canopy.detail}
              tone={metricsData.canopy.tone}
            />
            <MetricCard
              label="Alerts 30d"
              value={metricsData.alerts.value}
              detail={metricsData.alerts.detail}
              tone={metricsData.alerts.tone}
            />
          </div>
          <div className="panel rounded-[12px] p-3.5">
            <div className="flex items-center justify-between">
              <p className="type-display text-sm font-semibold">Active projects</p>
              <Link to="/projects" className="type-mono text-[11px] text-moss hover:underline">
                View all
              </Link>
            </div>
            {isLoading ? (
              <p className="mt-4 text-sm text-ink-soft">Loading projects…</p>
            ) : projects.length ? (
              <ProjectList projects={projects} />
            ) : (
              <EmptyProjects />
            )}
          </div>
          <div className="rounded-[12px] border border-dashed border-ink/15 bg-card/40 p-5 text-center backdrop-blur-xl">
            <div className="mx-auto grid size-9 place-items-center rounded-full bg-mist-deep text-moss">⌖</div>
            <p className="type-display mt-2.5 text-[13px] font-semibold">
              {selectedSite ? `Active site: ${selectedSite.name}` : sites.length ? "All boundaries accounted for" : "No polygon site yet"}
            </p>
            <p className="mx-auto mt-1 max-w-[24ch] text-[12px] text-ink-soft">
              {selectedSite
                ? `${selectedSite.area} · ${selectedSite.status} habitat`
                : sites.length
                ? "Select a boundary on the map to view its latest metrics."
                : "Create a project, then draw a boundary on the map to begin monitoring."}
            </p>
            {sites.length > 1 && (
              <div className="mt-3 flex flex-wrap justify-center gap-1.5 pt-1">
                {sites.map((site) => (
                  <button
                    key={site.id}
                    type="button"
                    onClick={() => setSelectedSite(site)}
                    className={`rounded-[6px] px-2 py-1 type-mono text-[10px] transition-all cursor-pointer ${
                      selectedSite?.id === site.id
                        ? "bg-moss text-mist font-medium shadow-xs"
                        : "bg-mist-deep/70 text-ink-soft hover:bg-mist-deep hover:text-ink"
                    }`}
                  >
                    {site.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        </aside>
      </div>
    </AppShell>
  );
}

function EmptyProjects() {
  return (
    <div className="mt-4 rounded-[9px] bg-mist-deep/50 p-4 text-sm text-ink-soft">
      No projects yet. Use <span className="font-medium text-moss">New project</span> to start your first monitoring workspace.
    </div>
  );
}