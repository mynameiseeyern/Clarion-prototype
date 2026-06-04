import { Monitor, Siren, Tally5 } from "lucide-react"
import { KpiCard } from "./KpiCard"
import { SegmentedBar, LegendItem } from "./primitives"
import { fleet } from "@/data/dashboard"

export function StatsStrip() {
  return (
    <section className="flex w-full flex-col gap-2">
      {/* label + badge */}
      <div className="flex items-center gap-2.5">
        <span className="text-sm font-medium" style={{ color: "var(--fg-neutral-emphasis)" }}>
          Entire fleet
        </span>
        <span
          className="flex h-5 items-center rounded-full px-1.5 text-xs font-medium"
          style={{
            background: "var(--bg-neutral-subtle)",
            color: "var(--fg-neutral-emphasis)",
          }}
        >
          {fleet.totalEndpoints.toLocaleString()} total endpoints
        </span>
      </div>

      {/* KPI cards */}
      <div className="flex flex-col items-stretch gap-2 sm:flex-row sm:items-center">
        <KpiCard title="Online endpoints" icon={Monitor} value={fleet.onlineEndpoints.toLocaleString()}>
          <SegmentedBar
            segments={[
              { status: "healthy", flex: 8 },
              { status: "warning", flex: 1.5 },
              { status: "critical", flex: 0.6 },
            ]}
          />
          <div className="flex items-center gap-2">
            <LegendItem status="healthy" label="Healthy" />
            <LegendItem status="warning" label="Warning" />
            <LegendItem status="critical" label="Critical" />
          </div>
        </KpiCard>

        <KpiCard title="Active alerts" icon={Siren} value={String(fleet.activeAlerts)}>
          <SegmentedBar
            segments={[
              { status: "warning", flex: 5 },
              { status: "critical", flex: 2 },
            ]}
          />
          <div className="flex items-center gap-2">
            <LegendItem status="warning" label="Warning" />
            <LegendItem status="critical" label="Critical" />
          </div>
        </KpiCard>

        <KpiCard title="Average MOS score" icon={Tally5} value={fleet.mosScore.toFixed(2)}>
          <div className="flex items-center gap-2">
            <span className="text-xs" style={{ color: "var(--fg-neutral-emphasis)" }}>
              Acceptable: &gt;3.6
            </span>
            <span className="text-xs" style={{ color: "var(--fg-neutral-emphasis)" }}>
              Good: &gt;4
            </span>
          </div>
        </KpiCard>
      </div>
    </section>
  )
}
