import { ArrowRight, CircleCheck, Timer, Bot, type LucideIcon } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { KpiCard } from "./KpiCard"
import { LegendItem } from "./primitives"
import { recentActivity, fleet } from "@/data/dashboard"

const iconMap: Record<string, LucideIcon> = {
  resolved: CircleCheck,
  time: Timer,
  auto: Bot,
}

export function ActiveAlertsCard() {
  return (
    <Card className="w-full gap-0 overflow-hidden rounded-xl p-0">
      {/* header */}
      <div
        className="flex items-center justify-between p-4"
        style={{ borderBottom: "1px solid var(--border-neutral-muted)" }}
      >
        <h2 className="text-base font-medium" style={{ color: "var(--fg-neutral-emphasis)" }}>
          Active alerts
        </h2>
        <Button variant="outline" size="sm" className="gap-1.5">
          View all alerts
          <ArrowRight className="size-4" />
        </Button>
      </div>

      {/* content */}
      <div className="flex flex-col gap-0.5 px-4 py-4">
        <p className="text-sm font-medium" style={{ color: "var(--fg-neutral-emphasis)" }}>
          No active alerts in {fleet.selectedLocation}
        </p>
        <p className="text-sm" style={{ color: "var(--fg-neutral-muted)" }}>
          Recent activity for this location · last 24 h
        </p>

        <div className="flex flex-wrap items-center gap-2 py-2">
          {recentActivity.map((a) => (
            <KpiCard key={a.id} title={a.label} icon={iconMap[a.icon]} value={a.value} fixedWidth>
              <div className="flex items-center gap-2">
                <LegendItem label="Healthy" muted showDot={false} />
                <LegendItem label="Warning" muted showDot={false} />
                <LegendItem label="Critical" muted showDot={false} />
              </div>
            </KpiCard>
          ))}
        </div>
      </div>
    </Card>
  )
}
