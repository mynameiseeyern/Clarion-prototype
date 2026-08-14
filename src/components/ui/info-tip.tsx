import { Info } from "lucide-react"
import { cn } from "@/lib/utils"

/** An (i) icon that reveals an explanatory tooltip on hover. Case/tracking are
 *  reset so it reads normally even inside uppercase labels. `align` controls which
 *  way the bubble opens so it doesn't clip against a container edge. */
export function InfoTip({
  text,
  side = "top",
  align = "center",
  className,
}: {
  text: string
  side?: "top" | "bottom"
  align?: "center" | "start" | "end"
  className?: string
}) {
  const top = side === "top"
  const bubbleAlign = align === "center" ? "left-1/2 -translate-x-1/2" : align === "end" ? "right-0" : "left-0"
  const caretAlign = align === "center" ? "left-1/2 -translate-x-1/2" : align === "end" ? "right-1.5" : "left-1.5"
  return (
    <span className={cn("group/info relative inline-flex shrink-0 items-center align-middle", className)}>
      <Info className="size-3.5 cursor-help" style={{ color: "var(--fg-neutral-subtle)" }} />
      <span
        role="tooltip"
        className={cn(
          "pointer-events-none absolute z-40 hidden w-60 rounded-lg px-3 py-2.5 text-xs font-normal normal-case leading-relaxed tracking-normal group-hover/info:block",
          top ? "bottom-full mb-2" : "top-full mt-2",
          bubbleAlign,
        )}
        style={{ background: "var(--bg-neutral-emphasis)", color: "var(--fg-on-neutral-emphasis)", boxShadow: "var(--shadow-md)" }}
      >
        {text}
        <span
          className={cn("absolute size-2.5 rotate-45", top ? "top-full -translate-y-1/2" : "bottom-full translate-y-1/2", caretAlign)}
          style={{ background: "var(--bg-neutral-emphasis)" }}
        />
      </span>
    </span>
  )
}
