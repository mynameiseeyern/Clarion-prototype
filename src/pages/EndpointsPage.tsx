import { EndpointsTable } from "@/components/endpoints/EndpointsTable"
import type { Endpoint } from "@/data/endpoints"

export function EndpointsPage({
  locationIds,
  onLocationsChange,
  onOpenEndpoint,
  openEndpointId,
  showAll,
}: {
  locationIds: string[]
  onLocationsChange: (ids: string[]) => void
  onOpenEndpoint: (rows: Endpoint[], index: number) => void
  openEndpointId?: string | null
  showAll?: boolean
}) {
  return (
    <EndpointsTable
      locationIds={locationIds}
      onLocationsChange={onLocationsChange}
      onOpenEndpoint={onOpenEndpoint}
      openEndpointId={openEndpointId}
      showAll={showAll}
    />
  )
}
