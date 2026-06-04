import type { LucideIcon } from "lucide-react"
import { Card } from "@/components/ui/card"

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
        <span
          className="mt-1 rounded-full px-2.5 py-1 text-xs font-medium"
          style={{ background: "var(--bg-neutral-subtle)", color: "var(--fg-neutral-muted)" }}
        >
          Coming soon
        </span>
      </div>
    </Card>
  )
}
