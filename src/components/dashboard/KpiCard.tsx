import type { ReactNode } from "react"
import { Info, type LucideIcon } from "lucide-react"
import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"

/** Small info affordance: an (i) icon that reveals an explanatory tooltip on hover. */
function InfoTip({ text }: { text: string }) {
  return (
    <span className="group/info relative flex shrink-0 items-center">
      <Info className="size-4 cursor-help" style={{ color: "var(--fg-neutral-subtle)" }} />
      <span
        role="tooltip"
        className="pointer-events-none absolute top-full right-0 z-40 mt-2 hidden w-64 rounded-xl px-3 py-2.5 text-xs font-normal leading-relaxed group-hover/info:block"
        style={{ background: "var(--bg-neutral-emphasis)", color: "var(--fg-on-neutral-emphasis)", boxShadow: "var(--shadow-md)" }}
      >
        {text}
        <span className="absolute bottom-full right-2.5 size-2.5 translate-y-1/2 rotate-45" style={{ background: "var(--bg-neutral-emphasis)" }} />
      </span>
    </span>
  )
}

export function KpiCard({
  title,
  icon: Icon,
  value,
  delta,
  info,
  children,
  className,
  fixedWidth = false,
}: {
  title: ReactNode
  icon: LucideIcon
  value: ReactNode
  delta?: ReactNode
  /** optional explanatory tooltip shown via an (i) icon next to the title */
  info?: string
  children?: ReactNode
  className?: string
  fixedWidth?: boolean
}) {
  return (
    <Card
      className={cn(
        "gap-0 rounded-xl",
        fixedWidth ? "w-60 shrink-0" : "min-w-px flex-1",
        className
      )}
    >
      <div className="flex items-start gap-2 p-4">
        <div className="flex min-w-0 flex-1 items-center gap-1.5">
          <h3
            className="text-heading-sm truncate"
            style={{ color: "var(--fg-neutral-emphasis)" }}
          >
            {title}
          </h3>
          {info && <InfoTip text={info} />}
        </div>
        <Icon className="size-4 shrink-0" style={{ color: "var(--fg-neutral-subtle)" }} />
      </div>
      <div className="flex flex-col gap-2 px-4 pb-4">
        <div className="flex items-baseline gap-2">
          <div
            className="text-metric-xl"
            style={{ color: "var(--fg-neutral-emphasis)" }}
          >
            {value}
          </div>
          {delta}
        </div>
        {children}
      </div>
    </Card>
  )
}
