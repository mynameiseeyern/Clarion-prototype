import * as React from "react"
import * as PopoverPrimitive from "@radix-ui/react-popover"
import { cn } from "@/lib/utils"

const Popover = PopoverPrimitive.Root
const PopoverTrigger = PopoverPrimitive.Trigger
const PopoverAnchor = PopoverPrimitive.Anchor

function PopoverContent({ className, align = "center", sideOffset = 6, container, ...props }: React.ComponentProps<typeof PopoverPrimitive.Content> & { container?: HTMLElement | null }) {
  return (
    <PopoverPrimitive.Portal container={container ?? undefined}>
      <PopoverPrimitive.Content
        align={align}
        sideOffset={sideOffset}
        className={cn(
          // z-[60] so combobox dropdowns sit above z-50 dialogs/side panels (e.g. the rule editor)
          "z-[60] rounded-xl border outline-none shadow-lg data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95",
          className
        )}
        style={{ background: "var(--bg-overlay)", borderColor: "var(--border-neutral-muted)" }}
        {...props}
      />
    </PopoverPrimitive.Portal>
  )
}

export { Popover, PopoverTrigger, PopoverContent, PopoverAnchor }
