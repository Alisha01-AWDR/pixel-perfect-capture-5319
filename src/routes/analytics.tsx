import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { AppShell, MetricCard } from "@/components/darukaa-shell";
import { useAuth } from "@/lib/auth";
import { listSites, listMetrics, formatSiteMetrics, type Site, type Metric } from "@/lib/darukaa";

export const Route = createFileRoute("/analytics")({
  head: () => ({
    meta: [
      { title: "Analytics — Darukaa.Earth" },
      { name: "description", content: "Review carbon, biodiversity, and canopy monitoring trends." },
      { property: "og:title", content: "Analytics — Darukaa.Earth" },
      { property: "og:description", content: "Review carbon, biodiversity, and canopy monitoring trends." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AnalyticsPage,
});

function AnalyticsPage() {
  const { token } = useAuth();
  const [sites, setSites] = useState<Site[]>([]);
  const [selectedSite, setSelectedSite] = useState<Site | null>(null);
  const [siteMetrics, setSiteMetrics] = useState<Metric[]>([]);

  useEffect(() => {
    if (!token) return;
    listSites()
      .then((loadedSites) => {
        setSites(loadedSites);
        if (loadedSites.length > 0) {
          setSelectedSite((prev) => {
            if (prev) {
              const match = loadedSites.find((s) => s.id === prev.id);
              if (match) return match;
            }
            return loadedSites[0];
          });
        }
      })
      .catch((err) => {
        console.warn("Failed to load sites for analytics", err);
      });
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
        console.warn("Failed to fetch metrics for analytics", err);
      });
    return () => {
      isCancelled = true;
    };
  }, [selectedSite?.id]);

  const metricsData = useMemo(() => {
    return formatSiteMetrics(selectedSite, siteMetrics);
  }, [selectedSite, siteMetrics]);

  return (
    <AppShell
      title={selectedSite ? `${selectedSite.name} Analytics` : "Analytics"}
      subtitle={selectedSite ? `${selectedSite.area} · latest telemetry & historical signal` : "Network signal · rolling 12 months"}
    >
      <div className="flex-1 overflow-auto p-4">
        {sites.length > 0 && (
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2.5 rounded-[12px] border border-ink/10 bg-mist-deep/40 px-3.5 py-2 backdrop-blur-xl">
            <span className="type-mono text-[10px] uppercase tracking-[0.16em] text-ink-soft">
              Monitored Polygon:
            </span>
            <div className="flex flex-wrap items-center gap-1.5">
              {sites.map((site) => {
                const isSelected = selectedSite?.id === site.id;
                return (
                  <button
                    key={site.id}
                    type="button"
                    onClick={() => setSelectedSite(site)}
                    className={`flex items-center gap-1.5 rounded-[8px] px-2.5 py-1 text-xs transition-all cursor-pointer ${
                      isSelected
                        ? "bg-moss text-mist font-medium shadow-xs ring-1 ring-moss-deep/30"
                        : "bg-card/70 text-ink-soft hover:bg-card hover:text-ink ring-1 ring-ink/5"
                    }`}
                  >
                    <span
                      className={`size-1.5 rounded-full ${
                        site.status === "degraded"
                          ? "bg-amber"
                          : site.status === "water"
                          ? "bg-sage"
                          : isSelected
                          ? "bg-mist"
                          : "bg-moss"
                      }`}
                    />
                    <span>{site.name}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <div className="grid gap-3 md:grid-cols-4">
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

        <div className="panel mt-4 rounded-[12px] p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="type-mono text-[10px] uppercase tracking-[0.18em] text-ink-soft">
                {selectedSite ? `${selectedSite.name} trend` : "Network trend"}
              </p>
              <h2 className="type-display mt-1 text-xl font-semibold">
                {selectedSite
                  ? `Carbon stock & canopy trajectory (${selectedSite.name})`
                  : "Carbon stock across monitored sites"}
              </h2>
            </div>
            <span className="type-mono text-[10px] text-ink-soft">
              {siteMetrics.length ? `${siteMetrics.length} data points` : "2025—2026"}
            </span>
          </div>
          <div className="mt-6 h-64 rounded-[10px] bg-mist-deep/60 p-4">
            <svg
              className="h-full w-full"
              viewBox="0 0 800 240"
              preserveAspectRatio="none"
              role="img"
              aria-label="Carbon stock trend line"
            >
              <path
                d="M0 190 C90 172 120 166 190 176 S300 128 380 142 S500 96 570 112 S690 58 800 42"
                fill="none"
                stroke="var(--color-moss)"
                strokeWidth="4"
                vectorEffect="non-scaling-stroke"
              />
              <path
                d="M0 190 C90 172 120 166 190 176 S300 128 380 142 S500 96 570 112 S690 58 800 42 L800 240 L0 240 Z"
                fill="color-mix(in oklab, var(--color-moss) 12%, transparent)"
              />
            </svg>
          </div>
        </div>
      </div>
    </AppShell>
  );
}