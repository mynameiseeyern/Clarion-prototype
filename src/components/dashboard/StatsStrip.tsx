import { Monitor, Siren, Tally5 } from "lucide-react"
import { KpiCard } from "./KpiCard"
import { SegmentedBar, LegendItem } from "./primitives"
import { rollupsAll } from "@/data/endpoints"
import type { LiveFleet } from "@/hooks/useStreaming"

// Net change in open issues vs. ~24h ago (deterministic dummy).
const ISSUES_24H_AGO = 6

// Clarity Network Score (0–100) quality band.
function cnsBand(v: number) {
  if (v >= 80) return { label: "Excellent", range: "80–100", color: "var(--fg-success-emphasis)" }
  if (v >= 60) return { label: "Good", range: "60–79", color: "var(--fg-success-emphasis)" }
  if (v >= 40) return { label: "Fair", range: "40–59", color: "var(--fg-warning-emphasis)" }
  return { label: "Poor", range: "0–39", color: "var(--fg-danger-emphasis)" }
}

function IssueDelta({ delta }: { delta: number }) {
  if (delta === 0) return <span className="text-sm" style={{ color: "var(--fg-neutral-muted)" }}>no change today</span>
  // more open issues than yesterday is a regression → danger; fewer → success
  const up = delta > 0
  const color = up ? "var(--fg-danger-emphasis)" : "var(--fg-success-emphasis)"
  return (
    <span className="text-sm font-medium" style={{ color }}>
      {up ? "+" : "−"}{Math.abs(delta)}
      <span className="font-normal" style={{ color: "var(--fg-neutral-muted)" }}> today</span>
    </span>
  )
}

export function StatsStrip({ live }: { live: LiveFleet }) {
  const issues = rollupsAll()
  const warnIssues = issues.filter((r) => r.severity === "warning").length
  const critIssues = issues.filter((r) => r.severity === "critical").length
  const issueSegments = [
    { status: "warning" as const, flex: warnIssues, count: warnIssues, label: "Warning" },
    { status: "critical" as const, flex: critIssues, count: critIssues, label: "Critical" },
  ].filter((s) => s.count > 0)
  const issuesDelta = issues.length - ISSUES_24H_AGO

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
          {live.endpoints.toLocaleString()} total devices
        </span>
      </div>

      <div className="flex flex-col items-stretch gap-2 sm:flex-row sm:items-stretch">
        <KpiCard title="Active devices" icon={Monitor} value={live.online.toLocaleString()}>
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

        <KpiCard title="Open issues" icon={Siren} value={String(issues.length)} delta={<IssueDelta delta={issuesDelta} />}>
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
          value={String(live.score)}
        >
          {(() => {
            const b = cnsBand(live.score)
            return (
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-medium" style={{ color: b.color }}>{b.label}</span>
                <span className="text-xs" style={{ color: "var(--fg-neutral-subtle)" }}>· {b.range}</span>
              </div>
            )
          })()}
        </KpiCard>
      </div>
    </section>
  )
}
