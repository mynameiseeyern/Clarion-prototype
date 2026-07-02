import { useState } from "react"
import { Check, ChevronDown } from "lucide-react"
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover"
import { Badge } from "@/components/ui/badge"
import type { EndpointStatus } from "@/data/endpoints"

export const statusVar: Record<EndpointStatus, string> = {
  healthy: "var(--status-healthy)",
  warning: "var(--status-warning)",
  critical: "var(--status-critical)",
  offline: "var(--status-unknown)",
}
export const statusBadge: Record<EndpointStatus, "success" | "warning" | "danger" | "secondary"> = {
  healthy: "success", warning: "warning", critical: "danger", offline: "secondary",
}
export const cap = (s: string) => s[0].toUpperCase() + s.slice(1)
export const initials = (name: string) => name.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase()

/**
 * Canonical status/severity pill — coloured dot + label — so status is shown the
 * same way everywhere (matches the status dots on the map, list tiles and legend).
 */
export function StatusBadge({ status, label, className }: { status: EndpointStatus; label?: string; className?: string }) {
  return (
    <Badge variant={statusBadge[status]} className={`gap-1.5 ${className ?? ""}`}>
      <span className="size-1.5 rounded-full" style={{ background: statusVar[status] }} />
      {label ?? cap(status)}
    </Badge>
  )
}

export type StatusOption = { id: EndpointStatus; label: string }
// worst-first, offline last
export const STATUS_OPTIONS: StatusOption[] = [
  { id: "critical", label: "Critical" },
  { id: "warning", label: "Warning" },
  { id: "healthy", label: "Healthy" },
  { id: "offline", label: "Offline" },
]

/**
 * Multi-select status filter (empty selection = all of `options`).
 * `options` lets a surface narrow the choices (e.g. the Overview attention card
 * only offers Critical + Warning).
 */
export function StatusFilter({
  value,
  onToggle,
  onClear,
  options = STATUS_OPTIONS,
  allLabel = "All statuses",
}: {
  value: EndpointStatus[]
  onToggle: (s: EndpointStatus) => void
  onClear: () => void
  options?: StatusOption[]
  allLabel?: string
}) {
  const [open, setOpen] = useState(false)
  const label = value.length === 0 ? allLabel : value.length === 1 ? cap(value[0]) : `${value.length} statuses`
  const rowCls = "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm transition-colors hover:bg-[var(--bg-neutral-subtle-hovered)]"
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button type="button" className="flex h-9 items-center gap-1.5 rounded-lg px-3 text-sm shadow-xs transition-colors hover:border-[var(--border-input-hovered)]"
          style={{ background: "var(--bg-input-default)", border: "1px solid var(--border-input-default)", color: "var(--fg-neutral-emphasis)" }}>
          <span>{label}</span>
          <ChevronDown className="size-4" style={{ color: "var(--fg-neutral-muted)" }} />
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-48 p-1">
        {options.map((o) => {
          const on = value.includes(o.id)
          return (
            <button key={o.id} type="button" role="option" aria-selected={on} onClick={() => onToggle(o.id)} className={rowCls} style={{ color: "var(--fg-neutral-emphasis)" }}>
              <span className="flex size-4 shrink-0 items-center justify-center rounded" style={{ background: on ? "var(--bg-primary-emphasis)" : "var(--bg-input-default)", border: `1px solid ${on ? "var(--bg-primary-emphasis)" : "var(--border-input-default)"}` }}>
                {on && <Check className="size-3" style={{ color: "var(--fg-on-primary-emphasis)" }} />}
              </span>
              <span className="size-2 shrink-0 rounded-full" style={{ background: statusVar[o.id] }} />
              <span className="flex-1">{o.label}</span>
            </button>
          )
        })}
        {value.length > 0 && (
          <div className="mt-1 pt-1" style={{ borderTop: "1px solid var(--border-neutral-subtle)" }}>
            <button type="button" onClick={onClear} className={rowCls} style={{ color: "var(--fg-link-default)" }}>Clear</button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  )
}
