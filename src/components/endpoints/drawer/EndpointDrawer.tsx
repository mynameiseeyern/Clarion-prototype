import { useEffect, useMemo, useState } from "react"
import * as Dialog from "@radix-ui/react-dialog"
import { Monitor, MapPin, Globe, User, ChevronUp, ChevronDown, Maximize2, Minimize2, X } from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { getEndpointDetail } from "@/data/endpointDetail"
import type { Endpoint } from "@/data/endpoints"
import type { Status } from "@/data/dashboard"
import { NetworkTab, PlatformsTab, DevicesTab, SystemTab } from "./tabs"

const statusTone: Record<Status, { bg: string; fg: string }> = {
  healthy: { bg: "var(--bg-success-subtle)", fg: "var(--fg-on-success-subtle)" },
  warning: { bg: "var(--bg-warning-subtle)", fg: "var(--fg-on-warning-subtle)" },
  critical: { bg: "var(--bg-danger-subtle)", fg: "var(--fg-on-danger-subtle)" },
}
const cap = (s: string) => s[0].toUpperCase() + s.slice(1)
const initials = (name: string) => name.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase()

function MetaItem({ icon: Icon, children }: { icon: typeof Monitor; children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap" style={{ color: "var(--fg-neutral-muted)" }}>
      <Icon className="size-3.5" style={{ color: "var(--fg-neutral-subtle)" }} />
      {children}
    </span>
  )
}

function IconBtn({ children, label, onClick, disabled }: { children: React.ReactNode; label: string; onClick: () => void; disabled?: boolean }) {
  return (
    <button
      type="button" aria-label={label} onClick={onClick} disabled={disabled}
      className="flex size-8 items-center justify-center rounded-md transition-colors disabled:opacity-40"
      style={{ color: "var(--fg-neutral-muted)" }}
      onMouseEnter={(e) => { if (!disabled) e.currentTarget.style.background = "var(--bg-neutral-subtle-hovered)" }}
      onMouseLeave={(e) => { e.currentTarget.style.background = "transparent" }}
    >
      {children}
    </button>
  )
}

const TABS = [
  { id: "network", label: "Network" },
  { id: "platforms", label: "UC/CC platforms" },
  { id: "devices", label: "Devices" },
  { id: "system", label: "System" },
]

export function EndpointDrawer({
  rows, index, onIndexChange, open, onOpenChange,
}: {
  rows: Endpoint[]
  index: number
  onIndexChange: (i: number) => void
  open: boolean
  onOpenChange: (o: boolean) => void
}) {
  const [expanded, setExpanded] = useState(false)
  const [tab, setTab] = useState("network")
  const e = rows[index]
  const detail = useMemo(() => (e ? getEndpointDetail(e) : null), [e])

  const go = (delta: number) => {
    const next = index + delta
    if (next >= 0 && next < rows.length) onIndexChange(next)
  }

  useEffect(() => {
    if (!open) return
    const onKey = (ev: KeyboardEvent) => {
      if (ev.key === "ArrowDown") { ev.preventDefault(); go(1) }
      if (ev.key === "ArrowUp") { ev.preventDefault(); go(-1) }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [open, index, rows.length])

  if (!e || !detail) return null
  const tone = statusTone[e.status]

  const contentClass = expanded
    ? "fixed left-1/2 top-1/2 z-50 flex h-[94vh] w-[1120px] max-w-[96vw] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-2xl shadow-xl outline-none data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95"
    : "fixed right-0 top-0 z-50 flex h-full w-[640px] max-w-[95vw] flex-col overflow-hidden shadow-xl outline-none data-[state=open]:animate-in data-[state=open]:slide-in-from-right data-[state=closed]:animate-out data-[state=closed]:slide-out-to-right"

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay
          className="fixed inset-0 z-50 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=closed]:animate-out data-[state=closed]:fade-out-0"
          style={{ background: "var(--bg-scrim)" }}
        />
        <Dialog.Content
          className={contentClass}
          style={{ background: "var(--bg-card)", border: "1px solid var(--border-neutral-muted)" }}
        >
          {/* utility bar */}
          <div className="flex shrink-0 items-center justify-between px-3 py-2" style={{ borderBottom: "1px solid var(--border-neutral-subtle)" }}>
            <div className="flex items-center gap-1">
              <IconBtn label="Previous endpoint" onClick={() => go(-1)} disabled={index === 0}><ChevronUp className="size-4" /></IconBtn>
              <IconBtn label="Next endpoint" onClick={() => go(1)} disabled={index === rows.length - 1}><ChevronDown className="size-4" /></IconBtn>
              <span className="ml-1 text-xs font-medium tabular-nums" style={{ color: "var(--fg-neutral-muted)" }}>
                {index + 1} <span style={{ color: "var(--fg-neutral-subtle)" }}>of {rows.length.toLocaleString()}</span>
              </span>
            </div>
            <div className="flex items-center gap-1">
              <IconBtn label={expanded ? "Collapse" : "Expand"} onClick={() => setExpanded((v) => !v)}>
                {expanded ? <Minimize2 className="size-4" /> : <Maximize2 className="size-4" />}
              </IconBtn>
              <IconBtn label="Close" onClick={() => onOpenChange(false)}><X className="size-4" /></IconBtn>
            </div>
          </div>

          {/* identity header */}
          <div className="shrink-0 px-5 pt-4" style={{ borderBottom: "1px solid var(--border-neutral-muted)" }}>
            <div className="flex items-center gap-3">
              <Avatar className="size-10"><AvatarFallback>{initials(e.user)}</AvatarFallback></Avatar>
              <div className="flex min-w-px flex-1 flex-col">
                <div className="flex items-center gap-2.5">
                  <Dialog.Title className="truncate text-lg font-semibold" style={{ color: "var(--fg-neutral-emphasis)" }}>{e.user}</Dialog.Title>
                  <span className="shrink-0 rounded-md px-2 py-0.5 text-xs font-semibold uppercase" style={{ background: tone.bg, color: tone.fg }}>{cap(e.status)}</span>
                </div>
                <span className="truncate font-mono text-xs" style={{ color: "var(--fg-neutral-muted)" }}>{e.machine}</span>
              </div>
            </div>
            <Dialog.Description className="sr-only">Endpoint details for {e.user}, {e.machine}</Dialog.Description>

            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
              <MetaItem icon={MapPin}>{detail.locationDetail}</MetaItem>
              <MetaItem icon={Globe}>{e.isp} · <span className="font-mono text-xs">{e.ip}</span></MetaItem>
              <MetaItem icon={User}>{e.team}</MetaItem>
              <MetaItem icon={Monitor}>{e.connection}</MetaItem>
            </div>

            <Tabs value={tab} onValueChange={setTab} className="mt-3">
              <TabsList className="h-auto gap-4 bg-transparent p-0">
                {TABS.map((t) => (
                  <TabsTrigger
                    key={t.id} value={t.id}
                    className="relative rounded-none border-b-2 border-transparent bg-transparent px-0.5 pb-2.5 text-sm font-medium data-[state=active]:border-[var(--border-focused)] data-[state=active]:bg-transparent data-[state=active]:text-[var(--fg-neutral-emphasis)] data-[state=active]:shadow-none"
                  >
                    {t.label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </div>

          {/* body */}
          <div className="min-h-px flex-1 overflow-y-auto px-5 py-5" style={{ background: "var(--bg-app)" }}>
            <Tabs value={tab} onValueChange={setTab}>
              <TabsContent value="network"><NetworkTab d={detail} /></TabsContent>
              <TabsContent value="platforms"><PlatformsTab d={detail} /></TabsContent>
              <TabsContent value="devices"><DevicesTab d={detail} /></TabsContent>
              <TabsContent value="system"><SystemTab d={detail} /></TabsContent>
            </Tabs>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
