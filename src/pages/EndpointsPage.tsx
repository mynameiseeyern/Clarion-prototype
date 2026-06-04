import { EndpointsTable } from "@/components/endpoints/EndpointsTable"
import type { Endpoint } from "@/data/endpoints"

export function EndpointsPage({
  locationId,
  onLocationChange,
  onOpenEndpoint,
}: {
  locationId: string
  onLocationChange: (id: string) => void
  onOpenEndpoint?: (e: Endpoint) => void
}) {
  return <EndpointsTable locationId={locationId} onLocationChange={onLocationChange} onOpenEndpoint={onOpenEndpoint} />
}
