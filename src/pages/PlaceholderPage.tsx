import type { LucideIcon } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export function PlaceholderPage({
  title,
  icon: Icon,
  description,
}: {
  title: string
  icon: LucideIcon
  description: string
}) {
  return (
    <Card className="w-full items-center justify-center rounded-xl py-20">
      <div className="flex max-w-sm flex-col items-center gap-3 text-center">
        <span
          className="flex size-12 items-center justify-center rounded-xl"
          style={{ background: "var(--bg-primary-subtle)", color: "var(--fg-primary-emphasis)" }}
        >
          <Icon className="size-6" />
        </span>
        <h2 className="text-heading-sm" style={{ color: "var(--fg-neutral-emphasis)" }}>
          {title}
        </h2>
        <p className="text-body-sm" style={{ color: "var(--fg-neutral-muted)" }}>
          {description}
        </p>
        <Badge variant="secondary" className="mt-1">Coming soon</Badge>
      </div>
    </Card>
  )
}
