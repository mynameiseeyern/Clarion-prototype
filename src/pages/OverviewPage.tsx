import { StatsStrip } from "@/components/dashboard/StatsStrip"
import { MapAndLocations } from "@/components/dashboard/MapAndLocations"
import { ActiveAlertsCard } from "@/components/dashboard/ActiveAlertsCard"
import type { LiveFleet } from "@/hooks/useStreaming"
import type { PageId } from "@/nav"

export function OverviewPage({
  live,
  selectedId,
  onSelect,
  onNavigate,
}: {
  live: LiveFleet
  selectedId: string
  onSelect: (id: string) => void
  onNavigate: (id: PageId) => void
}) {
  return (
    <div className="flex flex-col gap-4">
      <StatsStrip live={live} />
      <MapAndLocations
        selectedId={selectedId}
        onSelect={onSelect}
        onViewEndpoints={() => onNavigate("endpoints")}
      />
      <ActiveAlertsCard selectedId={selectedId} onViewAll={() => onNavigate("alerts")} />
    </div>
  )
}
