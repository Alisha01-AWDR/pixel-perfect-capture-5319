import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Check, Database, Globe, Layers, Save, Server, Settings2, ShieldCheck, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AppShell } from "@/components/darukaa-shell";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Settings — Darukaa.Earth" },
      { name: "description", content: "Configure field station preferences, telemetry, and GIS settings." },
      { property: "og:title", content: "Settings — Darukaa.Earth" },
      { property: "og:description", content: "Configure field station preferences, telemetry, and GIS settings." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  const [leadName, setLeadName] = useState(() => {
    if (typeof window !== "undefined") {
      return window.localStorage.getItem("darukaa_lead_name") || "Amara Okonkwo";
    }
    return "Amara Okonkwo";
  });
  const [callsign, setCallsign] = useState(() => {
    if (typeof window !== "undefined") {
      return window.localStorage.getItem("darukaa_callsign") || "Field Lead · Bio-corridor Monitoring";
    }
    return "Field Lead · Bio-corridor Monitoring";
  });
  const [carbonTarget, setCarbonTarget] = useState(() => {
    if (typeof window !== "undefined") {
      return window.localStorage.getItem("darukaa_carbon_target") || "4.4M";
    }
    return "4.4M";
  });
  const [areaUnit, setAreaUnit] = useState("ha");
  const [boundaryColor, setBoundaryColor] = useState("sky");
  const [saved, setSaved] = useState(false);

  function handleSave() {
    if (typeof window !== "undefined") {
      window.localStorage.setItem("darukaa_lead_name", leadName);
      window.localStorage.setItem("darukaa_callsign", callsign);
      window.localStorage.setItem("darukaa_carbon_target", carbonTarget);
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  return (
    <AppShell title="Settings" subtitle="Field console configuration · workspace preferences">
      <div className="flex-1 overflow-auto p-6">
        <div className="mx-auto max-w-4xl space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="type-mono text-[10px] uppercase tracking-[0.18em] text-ink-soft">Workspace</p>
              <h2 className="type-display mt-1 text-2xl font-semibold">Console & Telemetry Settings</h2>
              <p className="mt-1 text-sm text-ink-soft">Manage field station profile, spatial parameters, and backend connectivity.</p>
            </div>
            <Button
              onClick={handleSave}
              className="bg-moss text-mist hover:bg-moss-deep cursor-pointer flex items-center gap-2"
            >
              {saved ? <Check size={15} /> : <Save size={15} />}
              {saved ? "Preferences Saved" : "Save Preferences"}
            </Button>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {/* Field Station Profile */}
            <div className="panel rounded-[14px] p-5 space-y-4">
              <div className="flex items-center gap-2.5">
                <div className="grid size-8 place-items-center rounded-lg bg-moss/15 text-moss">
                  <User size={16} />
                </div>
                <div>
                  <h3 className="type-display text-base font-semibold">Field Station Profile</h3>
                  <p className="type-mono text-[10px] text-ink-soft">Operator credentials & identification</p>
                </div>
              </div>
              <div className="space-y-3 pt-2">
                <div>
                  <label htmlFor="lead-name" className="text-xs font-medium text-ink-soft">Operator / Lead Name</label>
                  <Input
                    id="lead-name"
                    value={leadName}
                    onChange={(e) => setLeadName(e.target.value)}
                    className="mt-1.5 bg-card/60"
                  />
                </div>
                <div>
                  <label htmlFor="callsign" className="text-xs font-medium text-ink-soft">Role / Desk Designation</label>
                  <Input
                    id="callsign"
                    value={callsign}
                    onChange={(e) => setCallsign(e.target.value)}
                    className="mt-1.5 bg-card/60"
                  />
                </div>
                <div>
                  <label htmlFor="carbon-target" className="text-xs font-medium text-ink-soft">Annual Carbon Target (tCO₂e)</label>
                  <Input
                    id="carbon-target"
                    value={carbonTarget}
                    onChange={(e) => setCarbonTarget(e.target.value)}
                    className="mt-1.5 bg-card/60"
                  />
                </div>
              </div>
            </div>

            {/* GIS & Map Layer Configuration */}
            <div className="panel rounded-[14px] p-5 space-y-4">
              <div className="flex items-center gap-2.5">
                <div className="grid size-8 place-items-center rounded-lg bg-moss/15 text-moss">
                  <Layers size={16} />
                </div>
                <div>
                  <h3 className="type-display text-base font-semibold">GIS & Map Visuals</h3>
                  <p className="type-mono text-[10px] text-ink-soft">Map overlays & vector appearance</p>
                </div>
              </div>
              <div className="space-y-3 pt-2">
                <div>
                  <p className="text-xs font-medium text-ink-soft">Site Boundary Color</p>
                  <div className="mt-2 flex gap-2">
                    <button
                      type="button"
                      onClick={() => setBoundaryColor("sky")}
                      className={`flex flex-1 items-center justify-center gap-2 rounded-[8px] border px-3 py-2 text-xs font-medium transition-all ${
                        boundaryColor === "sky"
                          ? "border-sky-400 bg-sky-400/15 text-ink ring-1 ring-sky-400"
                          : "border-ink/10 bg-card/40 text-ink-soft hover:bg-card/70"
                      }`}
                    >
                      <span className="size-2.5 rounded-full bg-sky-400 shadow-[0_0_6px_rgba(56,189,248,0.8)]" />
                      Luminous Blue
                    </button>
                    <button
                      type="button"
                      onClick={() => setBoundaryColor("moss")}
                      className={`flex flex-1 items-center justify-center gap-2 rounded-[8px] border px-3 py-2 text-xs font-medium transition-all ${
                        boundaryColor === "moss"
                          ? "border-moss bg-moss/15 text-ink ring-1 ring-moss"
                          : "border-ink/10 bg-card/40 text-ink-soft hover:bg-card/70"
                      }`}
                    >
                      <span className="size-2.5 rounded-full bg-moss" />
                      Ecology Green
                    </button>
                  </div>
                </div>
                <div>
                  <p className="text-xs font-medium text-ink-soft">Area Measurement Unit</p>
                  <div className="mt-2 flex gap-2">
                    <button
                      type="button"
                      onClick={() => setAreaUnit("ha")}
                      className={`flex-1 rounded-[8px] border px-3 py-2 text-xs font-medium transition-all ${
                        areaUnit === "ha"
                          ? "border-moss bg-moss/15 text-ink ring-1 ring-moss"
                          : "border-ink/10 bg-card/40 text-ink-soft hover:bg-card/70"
                      }`}
                    >
                      Hectares (ha)
                    </button>
                    <button
                      type="button"
                      onClick={() => setAreaUnit("km2")}
                      className={`flex-1 rounded-[8px] border px-3 py-2 text-xs font-medium transition-all ${
                        areaUnit === "km2"
                          ? "border-moss bg-moss/15 text-ink ring-1 ring-moss"
                          : "border-ink/10 bg-card/40 text-ink-soft hover:bg-card/70"
                      }`}
                    >
                      Square Kilometers (km²)
                    </button>
                  </div>
                </div>
                <div className="rounded-[9px] bg-mist-deep/40 p-3 text-xs text-ink-soft space-y-1">
                  <div className="flex justify-between type-mono text-[10px]">
                    <span>SPATIAL ENGINE</span>
                    <span className="text-moss font-semibold">PostGIS 3.6</span>
                  </div>
                  <div className="flex justify-between type-mono text-[10px]">
                    <span>CRS PROJECTION</span>
                    <span>WGS 84 (EPSG:4326)</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Backend & Database Telemetry Status */}
            <div className="panel rounded-[14px] p-5 space-y-4 md:col-span-2">
              <div className="flex items-center gap-2.5">
                <div className="grid size-8 place-items-center rounded-lg bg-moss/15 text-moss">
                  <Server size={16} />
                </div>
                <div>
                  <h3 className="type-display text-base font-semibold">Backend & Database Telemetry</h3>
                  <p className="type-mono text-[10px] text-ink-soft">Local API services and PostGIS connection health</p>
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-3 pt-2">
                <div className="rounded-[10px] border border-ink/10 bg-card/50 p-3.5 space-y-1">
                  <div className="flex items-center gap-1.5 type-mono text-[10px] uppercase text-ink-soft">
                    <Database size={12} className="text-moss" />
                    <span>Database Engine</span>
                  </div>
                  <p className="type-display text-sm font-semibold">PostgreSQL 18</p>
                  <p className="type-mono text-[10px] text-moss">Port 5432 · Active</p>
                </div>
                <div className="rounded-[10px] border border-ink/10 bg-card/50 p-3.5 space-y-1">
                  <div className="flex items-center gap-1.5 type-mono text-[10px] uppercase text-ink-soft">
                    <Globe size={12} className="text-moss" />
                    <span>Spatial Extensions</span>
                  </div>
                  <p className="type-display text-sm font-semibold">PostGIS 3.6.2</p>
                  <p className="type-mono text-[10px] text-moss">GEOS + PROJ active</p>
                </div>
                <div className="rounded-[10px] border border-ink/10 bg-card/50 p-3.5 space-y-1">
                  <div className="flex items-center gap-1.5 type-mono text-[10px] uppercase text-ink-soft">
                    <ShieldCheck size={12} className="text-moss" />
                    <span>FastAPI Core</span>
                  </div>
                  <p className="type-display text-sm font-semibold">v0.115 / Uvicorn</p>
                  <p className="type-mono text-[10px] text-moss">http://127.0.0.1:8000</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
