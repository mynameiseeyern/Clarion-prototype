import { useEffect, useRef, type ReactNode } from "react"
import { Flag } from "lucide-react"
import type { MetricStatus } from "@/data/endpointDetail"

const statusColor: Record<MetricStatus, string> = {
  good: "var(--bg-primary-emphasis)",
  warn: "var(--status-warning)",
  crit: "var(--status-critical)",
  none: "var(--bg-neutral-subtle-pressed)",
}

export function SegBar({ fill, status, segments = 10 }: { fill: number; status: MetricStatus; segments?: number }) {
  const filled = Math.max(status === "none" ? 0 : 1, Math.round(fill * segments))
  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: segments }).map((_, i) => (
        <span
          key={i}
          className="h-2 flex-1 rounded-sm"
          style={{ background: i < filled ? statusColor[status] : "var(--bg-neutral-subtle-pressed)" }}
        />
      ))}
    </div>
  )
}

export function Panel({ children, className, highlight = false }: { children: ReactNode; className?: string; highlight?: boolean }) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (highlight) ref.current?.scrollIntoView({ block: "nearest", behavior: "smooth" })
  }, [highlight])
  return (
    <div
      ref={ref}
      className={"relative rounded-xl p-4 " + (className ?? "")}
      style={{
        // informational callout (not a control): soft info tint + border, no focus ring
        background: highlight ? "var(--bg-info-subtle)" : "var(--bg-neutral-subtle)",
        border: `1px solid ${highlight ? "var(--border-info-muted)" : "var(--border-neutral-subtle)"}`,
      }}
    >
      {highlight && (
        <span
          className="pointer-events-none absolute right-3 top-3 inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide"
          style={{ background: "var(--bg-card)", color: "var(--fg-info-emphasis)", border: "1px solid var(--border-info-muted)" }}
          title="This is the condition that flagged the device"
        >
          <Flag className="size-2.5" /> Flagged
        </span>
      )}
      {children}
    </div>
  )
}

export function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <div className="mb-3 flex items-center gap-3">
      <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--fg-neutral-subtle)" }}>{children}</span>
      <span className="h-px flex-1" style={{ background: "var(--border-neutral-subtle)" }} />
    </div>
  )
}

export function MetricBlock({ label, value, unit, children, highlight = false }: { label: string; value: string; unit: string; children?: ReactNode; highlight?: boolean }) {
  return (
    <Panel highlight={highlight}>
      <div className="mb-2 text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--fg-neutral-subtle)" }}>{label}</div>
      <div className="mb-3 flex items-baseline gap-1">
        <span className="text-2xl font-semibold" style={{ color: "var(--fg-neutral-emphasis)" }}>{value}</span>
        <span className="text-sm" style={{ color: "var(--fg-neutral-muted)" }}>{unit}</span>
      </div>
      {children}
    </Panel>
  )
}
