import { EndpointsTable } from "@/components/endpoints/EndpointsTable"
import type { Endpoint } from "@/data/endpoints"

export function EndpointsPage({
  initialLocationId = "all",
  onOpenEndpoint,
}: {
  initialLocationId?: string
  onOpenEndpoint?: (e: Endpoint) => void
}) {
  return <EndpointsTable initialLocationId={initialLocationId} onOpenEndpoint={onOpenEndpoint} />
}
