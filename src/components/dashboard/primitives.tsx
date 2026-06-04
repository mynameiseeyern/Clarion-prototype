import type { Status } from "@/data/dashboard"
import { cn } from "@/lib/utils"

const statusVar: Record<Status, string> = {
  healthy: "var(--status-healthy)",
  warning: "var(--status-warning)",
  critical: "var(--status-critical)",
}

/** A small status dot with a card-coloured ring + xs shadow (per spec). */
export function StatusDot({
  status,
  className,
}: {
  status: Status
  className?: string
}) {
  return (
    <span
      className={cn("inline-block size-3 shrink-0 rounded-full", className)}
      style={{
        backgroundColor: statusVar[status],
        border: "1px solid var(--bg-card)",
        boxShadow: "var(--shadow-xs)",
      }}
    />
  )
}

/** Dot + label legend item. */
export function LegendItem({
  status,
  label,
  muted = false,
  showDot = true,
}: {
  status?: Status
  label: string
  muted?: boolean
  showDot?: boolean
}) {
  return (
    <span className="inline-flex items-center gap-1">
      {showDot && status && <StatusDot status={status} />}
      <span
        className="text-body-xs"
        style={{
          color: muted
            ? "var(--fg-neutral-subtle)"
            : "var(--fg-neutral-emphasis)",
        }}
      >
        {label}
      </span>
    </span>
  )
}

/** Horizontal segmented bar (healthy / warning / critical proportions). */
export function SegmentedBar({
  segments,
  className,
}: {
  segments: { status: Status; flex: number }[]
  className?: string
}) {
  return (
    <div
      className={cn("flex h-1 w-full items-center overflow-hidden rounded-full", className)}
    >
      {segments.map((s, i) => (
        <span
          key={i}
          className="h-full min-w-px"
          style={{ flex: `${s.flex} 0 0`, backgroundColor: statusVar[s.status] }}
        />
      ))}
    </div>
  )
}
