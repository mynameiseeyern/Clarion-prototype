import { Info } from "lucide-react"
import { cn } from "@/lib/utils"

/** An (i) icon that reveals an explanatory tooltip on hover. Case/tracking are
 *  reset so it reads normally even inside uppercase labels. */
export function InfoTip({
  text,
  side = "top",
  className,
}: {
  text: string
  side?: "top" | "bottom"
  className?: string
}) {
  const top = side === "top"
  return (
    <span className={cn("group/info relative inline-flex shrink-0 items-center align-middle", className)}>
      <Info className="size-3.5 cursor-help" style={{ color: "var(--fg-neutral-subtle)" }} />
      <span
        role="tooltip"
        className={cn(
          "pointer-events-none absolute left-1/2 z-40 hidden w-60 -translate-x-1/2 rounded-lg px-3 py-2.5 text-xs font-normal normal-case leading-relaxed tracking-normal group-hover/info:block",
          top ? "bottom-full mb-2" : "top-full mt-2",
        )}
        style={{ background: "var(--bg-neutral-emphasis)", color: "var(--fg-on-neutral-emphasis)", boxShadow: "var(--shadow-md)" }}
      >
        {text}
        <span
          className={cn("absolute left-1/2 size-2.5 -translate-x-1/2 rotate-45", top ? "top-full -translate-y-1/2" : "bottom-full translate-y-1/2")}
          style={{ background: "var(--bg-neutral-emphasis)" }}
        />
      </span>
    </span>
  )
}
