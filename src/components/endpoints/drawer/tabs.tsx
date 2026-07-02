import { Headphones, Mic, Video, Bluetooth, Usb, Info } from "lucide-react"
import type { Endpoint } from "@/data/endpoints"
import type { EndpointDetail, PlatformStatus } from "@/data/endpointDetail"
import { SegBar, Panel, SectionLabel, MetricBlock } from "./bits"
import { Badge } from "@/components/ui/badge"

/* ---------------- Network ---------------- */
export function NetworkTab({ d }: { d: EndpointDetail }) {
  const mos = d.network.mos
  return (
    <div className="flex flex-col gap-6">
      <div>
        <SectionLabel>Internet health</SectionLabel>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {/* Network MOS — combined 1–5 quality score; the one tile that keeps a level badge */}
          <MetricBlock label="Network MOS" value={mos.value} unit="/ 5" status={mos.status === "crit" ? "critical" : mos.status === "warn" ? "warning" : undefined}>
            <SegBar fill={mos.fill} status={mos.status} />
          </MetricBlock>
          {d.network.health.map((m) => (
            // raw network values are informational — no threshold text, no badge, neutral bar
            <MetricBlock key={m.label} label={m.label} value={m.value} unit={m.unit}>
              <SegBar fill={m.fill} status={m.status} />
            </MetricBlock>
          ))}
        </div>
      </div>
      <div>
        <SectionLabel>Speed &amp; connection</SectionLabel>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <MetricBlock label="Download" value={String(d.network.download)} unit="Mbps" />
          <MetricBlock label="Upload" value={String(d.network.upload)} unit="Mbps" />
          <Panel>
            <div className="mb-2 text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--fg-neutral-subtle)" }}>Interface</div>
            <div className="text-lg font-semibold" style={{ color: "var(--fg-neutral-emphasis)" }}>{d.network.interface.name}</div>
            <div className="text-xs" style={{ color: "var(--fg-neutral-muted)" }}>{d.network.interface.detail}</div>
          </Panel>
        </div>
      </div>
    </div>
  )
}

/* ---------------- UC/CC platforms ---------------- */
const platBadge: Record<PlatformStatus, { variant: "success" | "warning" | "danger"; label: string }> = {
  ok: { variant: "success", label: "OK" },
  degraded: { variant: "warning", label: "Degraded" },
  down: { variant: "danger", label: "Down" },
}
const fmt = (v: number | null, u: string) => (v === null ? "—" : `${v}${u}`)

export function PlatformsTab({ d }: { d: EndpointDetail }) {
  return (
    <div className="flex flex-col gap-4">
      <SectionLabel>UC/CC platforms in use</SectionLabel>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr style={{ color: "var(--fg-neutral-subtle)" }}>
              <th className="px-3 pb-2 text-left text-xs font-medium uppercase tracking-wide">Platform</th>
              <th className="px-3 pb-2 text-right text-xs font-medium uppercase tracking-wide">Latency</th>
              <th className="px-3 pb-2 text-right text-xs font-medium uppercase tracking-wide">Loss</th>
              <th className="px-3 pb-2 text-right text-xs font-medium uppercase tracking-wide">Jitter</th>
              <th className="px-3 pb-2 text-right text-xs font-medium uppercase tracking-wide">MOS</th>
              <th className="px-3 pb-2 text-right text-xs font-medium uppercase tracking-wide">Status</th>
            </tr>
          </thead>
          <tbody>
            {d.platforms.rows.map((p) => {
              const badge = platBadge[p.status]
              const dim = p.status === "down"
              const col = dim ? "var(--fg-neutral-subtle)" : p.status === "degraded" ? "var(--fg-warning-emphasis)" : "var(--fg-neutral-emphasis)"
              return (
                <tr key={p.name} style={{ borderTop: "1px solid var(--border-neutral-subtle)" }}>
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-2.5">
                      <span className="flex size-7 items-center justify-center rounded-md text-xs font-bold text-white" style={{ background: p.color }}>{p.key}</span>
                      <span className="font-medium" style={{ color: "var(--fg-neutral-emphasis)" }}>{p.name}</span>
                    </div>
                  </td>
                  <td className="px-3 py-3 text-right font-mono" style={{ color: col }}>{fmt(p.latency, "ms")}</td>
                  <td className="px-3 py-3 text-right font-mono" style={{ color: col }}>{fmt(p.loss, "%")}</td>
                  <td className="px-3 py-3 text-right font-mono" style={{ color: col }}>{fmt(p.jitter, "ms")}</td>
                  <td className="px-3 py-3 text-right font-mono" style={{ color: col }}>{p.mos === null ? "—" : p.mos.toFixed(1)}</td>
                  <td className="px-3 py-3 text-right">
                    <Badge variant={badge.variant}>{badge.label}</Badge>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      <div className="flex gap-3 rounded-xl p-3" style={{ background: "var(--bg-info-subtle)", border: "1px solid var(--border-info-muted)" }}>
        <Info className="mt-0.5 size-4 shrink-0" style={{ color: "var(--fg-info-emphasis)" }} />
        <p className="text-sm" style={{ color: "var(--fg-neutral-muted)" }}>
          <span className="font-semibold" style={{ color: "var(--fg-neutral-emphasis)" }}>Why this matters: </span>{d.platforms.why}
        </p>
      </div>
    </div>
  )
}

/* ---------------- Devices ---------------- */
const deviceIcon = { "audio-out": Headphones, "audio-in": Mic, video: Video, bt: Bluetooth, usb: Usb }

export function DevicesTab({ d }: { d: EndpointDetail }) {
  const Row = ({ r }: { r: EndpointDetail["devices"]["audio"][number] }) => {
    const Icon = deviceIcon[r.kind]
    return (
      <Panel className="flex items-center gap-3">
        <span className="flex size-9 items-center justify-center rounded-lg" style={{ background: "var(--bg-neutral-muted)", color: "var(--fg-neutral-muted)" }}><Icon className="size-4" /></span>
        <div className="flex min-w-px flex-1 flex-col">
          <span className="truncate text-sm font-semibold" style={{ color: "var(--fg-neutral-emphasis)" }}>{r.name}</span>
          <span className="truncate text-xs" style={{ color: "var(--fg-neutral-muted)" }}>{r.meta}</span>
        </div>
        <span className="text-xs font-medium" style={{ color: r.stateTone === "good" ? "var(--fg-success-emphasis)" : "var(--fg-neutral-muted)" }}>{r.state}</span>
      </Panel>
    )
  }
  return (
    <div className="flex flex-col gap-6">
      <div><SectionLabel>Audio devices</SectionLabel><div className="flex flex-col gap-2">{d.devices.audio.map((r) => <Row key={r.name} r={r} />)}</div></div>
      <div><SectionLabel>Video devices</SectionLabel><div className="flex flex-col gap-2">{d.devices.video.map((r) => <Row key={r.name} r={r} />)}</div></div>
      <div><SectionLabel>Bluetooth devices</SectionLabel><div className="flex flex-col gap-2">{d.devices.bluetooth.map((r) => <Row key={r.name} r={r} />)}</div></div>
      <div><SectionLabel>USB devices</SectionLabel><div className="flex flex-col gap-2">{d.devices.usb.map((r) => <Row key={r.name} r={r} />)}</div></div>
    </div>
  )
}

/* ---------------- System ---------------- */
export function SystemTab({ d }: { d: EndpointDetail }) {
  const { system: s } = d
  const Bar = ({ fill }: { fill: number }) => (
    <div className="flex items-center gap-1">
      {Array.from({ length: 10 }).map((_, i) => (
        <span key={i} className="h-2 flex-1 rounded-sm" style={{ background: i < Math.round(fill * 10) ? "var(--bg-primary-emphasis)" : "var(--bg-neutral-subtle-pressed)" }} />
      ))}
    </div>
  )
  return (
    <div className="flex flex-col gap-6">
      <div>
        <SectionLabel>Compute &amp; storage</SectionLabel>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <MetricBlock label={s.cpu.label} value={s.cpu.value} unit={s.cpu.unit}><Bar fill={Number(s.cpu.value) / 100} /><div className="mt-2 text-xs" style={{ color: "var(--fg-neutral-subtle)" }}>{s.cpu.meta}</div></MetricBlock>
          <MetricBlock label={s.memory.label} value={s.memory.value} unit={s.memory.unit}><Bar fill={s.memory.fill} /><div className="mt-2 text-xs" style={{ color: "var(--fg-neutral-subtle)" }}>{s.memory.meta}</div></MetricBlock>
          <MetricBlock label={s.disk.label} value={s.disk.value} unit={s.disk.unit}><Bar fill={s.disk.fill} /><div className="mt-2 text-xs" style={{ color: "var(--fg-neutral-subtle)" }}>{s.disk.meta}</div></MetricBlock>
          <Panel>
            <div className="mb-2 text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--fg-neutral-subtle)" }}>Battery</div>
            <div className="text-2xl font-semibold" style={{ color: "var(--fg-neutral-emphasis)" }}>{s.battery.value}</div>
            <div className="mt-2 text-xs" style={{ color: "var(--fg-neutral-subtle)" }}>{s.battery.detail}</div>
          </Panel>
        </div>
      </div>
      <div>
        <SectionLabel>OS &amp; Clarity Widget</SectionLabel>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Panel>
            <div className="mb-2 text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--fg-neutral-subtle)" }}>Operating system</div>
            <div className="text-lg font-semibold" style={{ color: "var(--fg-neutral-emphasis)" }}>{s.os.name}</div>
            <div className="text-xs" style={{ color: "var(--fg-neutral-muted)" }}>{s.os.detail}</div>
          </Panel>
          <Panel>
            <div className="mb-2 text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--fg-neutral-subtle)" }}>Clarity Widget</div>
            <div className="text-lg font-semibold" style={{ color: "var(--fg-neutral-emphasis)" }}>{s.agent.name}</div>
            <div className="text-xs" style={{ color: "var(--fg-neutral-muted)" }}>{s.agent.detail}</div>
          </Panel>
        </div>
      </div>
    </div>
  )
}

export type { Endpoint }
