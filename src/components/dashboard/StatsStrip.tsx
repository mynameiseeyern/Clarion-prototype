import { Monitor, Siren, Tally5 } from "lucide-react"
import { KpiCard } from "./KpiCard"
import { SegmentedBar, LegendItem } from "./primitives"
import { rollupsAll } from "@/data/endpoints"
import type { LiveFleet } from "@/hooks/useStreaming"

export function StatsStrip({ live }: { live: LiveFleet }) {
  const issues = rollupsAll()
  const warnIssues = issues.filter((r) => r.severity === "warning").length
  const critIssues = issues.filter((r) => r.severity === "critical").length
  const issueSegments = [
    { status: "warning" as const, flex: warnIssues, count: warnIssues, label: "Warning" },
    { status: "critical" as const, flex: critIssues, count: critIssues, label: "Critical" },
  ].filter((s) => s.count > 0)

  return (
    <section className="flex w-full flex-col gap-2">
      <div className="flex items-center gap-2.5">
        <span className="text-sm font-medium" style={{ color: "var(--fg-neutral-emphasis)" }}>
          Entire fleet
        </span>
        <span
          className="flex h-5 items-center rounded-full px-1.5 text-xs font-medium"
          style={{ background: "var(--bg-neutral-subtle)", color: "var(--fg-neutral-emphasis)" }}
        >
          {live.endpoints.toLocaleString()} total endpoints
        </span>
      </div>

      <div className="flex flex-col items-stretch gap-2 sm:flex-row sm:items-stretch">
        <KpiCard title="Online endpoints" icon={Monitor} value={live.online.toLocaleString()}>
          <SegmentedBar
            segments={[
              { status: "healthy", flex: live.healthy, count: live.healthy },
              { status: "warning", flex: live.warning, count: live.warning },
              { status: "critical", flex: live.critical, count: live.critical },
            ]}
          />
          <div className="flex items-center gap-2">
            <LegendItem status="healthy" label="Healthy" />
            <LegendItem status="warning" label="Warning" />
            <LegendItem status="critical" label="Critical" />
          </div>
        </KpiCard>

        <KpiCard title="Open issues" icon={Siren} value={String(issues.length)}>
          <SegmentedBar segments={issueSegments} />
          <div className="flex items-center gap-2">
            <LegendItem status="warning" label="Warning" />
            <LegendItem status="critical" label="Critical" />
          </div>
        </KpiCard>

        <KpiCard
          title={
            <>
              Clarity<sup className="top-[-0.4em] text-[0.6em]">™</sup> Network Score
            </>
          }
          icon={Tally5}
          value={live.score.toFixed(2)}
        >
          <div className="flex items-center gap-2">
            <span className="text-xs" style={{ color: "var(--fg-neutral-emphasis)" }}>Acceptable: &gt;3.6</span>
            <span className="text-xs" style={{ color: "var(--fg-neutral-emphasis)" }}>Good: &gt;4</span>
          </div>
        </KpiCard>
      </div>
    </section>
  )
}
