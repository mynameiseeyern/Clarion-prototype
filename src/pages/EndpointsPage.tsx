import { EndpointsTable } from "@/components/endpoints/EndpointsTable"
import type { Endpoint } from "@/data/endpoints"

export function EndpointsPage({
  locationId,
  onLocationChange,
  onOpenEndpoint,
  openEndpointId,
}: {
  locationId: string
  onLocationChange: (id: string) => void
  onOpenEndpoint: (rows: Endpoint[], index: number) => void
  openEndpointId?: string | null
}) {
  return (
    <EndpointsTable
      locationId={locationId}
      onLocationChange={onLocationChange}
      onOpenEndpoint={onOpenEndpoint}
      openEndpointId={openEndpointId}
    />
  )
}
