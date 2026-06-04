import * as Dialog from "@radix-ui/react-dialog"
import { X, MapPin, Clock, Users, Siren, Wifi, Activity, Gauge, ChevronRight, type LucideIcon } from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import type { Status } from "@/data/dashboard"
import type { Rollup, RollupCause, Endpoint } from "@/data/endpoints"

const causeIcon: Record<RollupCause, LucideIcon> = {
  platform: Siren, loss: Activity, latency: Gauge, jitter: Wifi, other: Activity,
}
const sevTone: Record<Exclude<Status, "healthy">, { bg: string; fg: string }> = {
  critical: { bg: "var(--bg-danger-subtle)", fg: "var(--fg-on-danger-subtle)" },
  warning: { bg: "var(--bg-warning-subtle)", fg: "var(--fg-on-warning-subtle)" },
}
const statusVar: Record<Status, string> = {
  healthy: "var(--status-healthy)", warning: "var(--status-warning)", critical: "var(--status-critical)",
}
const initials = (name: string) => name.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase()
const cap = (s: string) => s[0].toUpperCase() + s.slice(1)

function Meta({ icon: Icon, children }: { icon: LucideIcon; children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap" style={{ color: "var(--fg-neutral-muted)" }}>
      <Icon className="size-3.5" style={{ color: "var(--fg-neutral-subtle)" }} />{children}
    </span>
  )
}

export function AlertDrawer({
  rollup, open, onOpenChange, onOpenEndpoint,
}: {
  rollup: Rollup | null
  open: boolean
  onOpenChange: (o: boolean) => void
  onOpenEndpoint: (rows: Endpoint[], index: number) => void
}) {
  if (!rollup) return null
  const Icon = causeIcon[rollup.cause]
  const tone = sevTone[rollup.severity]

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 data-[state=open]:animate-in data-[state=open]:fade-in-0" style={{ background: "var(--bg-scrim)" }} />
        <Dialog.Content
          className="fixed right-0 top-0 z-50 flex h-full w-[600px] max-w-[95vw] flex-col overflow-hidden shadow-xl outline-none data-[state=open]:animate-in data-[state=open]:slide-in-from-right"
          style={{ background: "var(--bg-card)", borderLeft: "1px solid var(--border-neutral-muted)" }}
        >
          {/* header */}
          <div className="shrink-0 px-5 pt-4" style={{ borderBottom: "1px solid var(--border-neutral-muted)" }}>
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl" style={{ background: tone.bg, color: tone.fg }}><Icon className="size-5" /></span>
                <div className="flex flex-col">
                  <div className="flex items-center gap-2">
                    <Dialog.Title className="text-lg font-semibold" style={{ color: "var(--fg-neutral-emphasis)" }}>{rollup.title}</Dialog.Title>
                    <span className="rounded-md px-2 py-0.5 text-xs font-semibold uppercase" style={{ background: tone.bg, color: tone.fg }}>{cap(rollup.severity)}</span>
                  </div>
                  <Dialog.Description className="text-xs" style={{ color: "var(--fg-neutral-muted)" }}>Alert rollup · {rollup.affected} endpoints affected</Dialog.Description>
                </div>
              </div>
              <button type="button" aria-label="Close" onClick={() => onOpenChange(false)} className="flex size-8 items-center justify-center rounded-md transition-colors hover:bg-[var(--bg-neutral-subtle-hovered)]" style={{ color: "var(--fg-neutral-muted)" }}><X className="size-4" /></button>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 pb-4 text-sm">
              <Meta icon={MapPin}>{rollup.locationName}</Meta>
              <Meta icon={Users}>{rollup.affected} impacted</Meta>
              <Meta icon={Clock}>Started {rollup.startedMinAgo}m ago</Meta>
            </div>
          </div>

          {/* impacted endpoints */}
          <div className="min-h-px flex-1 overflow-y-auto" style={{ background: "var(--bg-app)" }}>
            <div className="px-5 py-3 text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--fg-neutral-subtle)" }}>Impacted endpoints</div>
            <div className="flex flex-col px-2 pb-4">
              {rollup.endpoints.map((e, i) => (
                <button key={e.id} type="button" onClick={() => onOpenEndpoint(rollup.endpoints, i)}
                  className="group flex items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors"
                  onMouseEnter={(ev) => (ev.currentTarget.style.background = "var(--bg-neutral-subtle-hovered)")}
                  onMouseLeave={(ev) => (ev.currentTarget.style.background = "transparent")}>
                  <Avatar className="size-8"><AvatarFallback>{initials(e.user)}</AvatarFallback></Avatar>
                  <div className="flex min-w-px flex-1 flex-col">
                    <span className="truncate text-sm font-medium" style={{ color: "var(--fg-neutral-emphasis)" }}>{e.user}</span>
                    <span className="truncate font-mono text-xs" style={{ color: "var(--fg-neutral-muted)" }}>{e.machine}</span>
                  </div>
                  <span className="inline-flex items-center gap-1.5 text-xs" style={{ color: "var(--fg-neutral-muted)" }}>
                    <span className="size-1.5 rounded-full" style={{ background: statusVar[e.status] }} />
                    {e.primaryIssue ?? "—"}
                  </span>
                  <ChevronRight className="size-4 shrink-0 opacity-0 transition-opacity group-hover:opacity-100" style={{ color: "var(--fg-neutral-subtle)" }} />
                </button>
              ))}
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
