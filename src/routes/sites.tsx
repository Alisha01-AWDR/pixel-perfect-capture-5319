import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell, MapSurface } from "@/components/darukaa-shell";
import { useAuth } from "@/lib/auth";
import { listSites, type Site } from "@/lib/darukaa";

export const Route = createFileRoute("/sites")({
  head: () => ({ meta: [{ title: "Sites — Darukaa.Earth" }, { name: "description", content: "Browse monitored ecological sites and boundaries." }, { property: "og:title", content: "Sites — Darukaa.Earth" }, { property: "og:description", content: "Browse monitored ecological sites and boundaries." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" }] }),
  component: SitesPage,
});

function SitesPage() {
  const { token } = useAuth();
  const [sites, setSites] = useState<Site[]>([]);
  useEffect(() => { if (token) void listSites().then(setSites); }, [token]);
  return <AppShell title="Sites" subtitle="Boundary register · 23 monitored areas"><div className="flex flex-1 flex-col gap-4 overflow-auto p-4 lg:flex-row"><MapSurface sites={sites} onSiteClick={(site) => { window.location.href = `/sites/${site.id}`; }} /><div className="panel w-full rounded-[12px] p-4 lg:w-[340px]"><p className="type-mono text-[10px] uppercase tracking-[0.18em] text-ink-soft">Site register</p><h2 className="type-display mt-1 text-lg font-semibold">All monitored boundaries</h2><div className="mt-4 space-y-2">{sites.map((site) => <Link key={site.id} to="/sites/$siteId" params={{ siteId: site.id }} className="block rounded-[9px] bg-card/60 p-3 transition-colors hover:bg-card"><div className="flex items-center gap-2"><span className={`size-2 rounded-full ${site.status === "degraded" ? "bg-amber" : site.status === "water" ? "bg-sage" : "bg-moss"}`} /><p className="text-sm font-medium">{site.name}</p></div><p className="mt-1 type-mono text-[10px] text-ink-soft">{site.area}</p></Link>)}</div></div></div></AppShell>;
}