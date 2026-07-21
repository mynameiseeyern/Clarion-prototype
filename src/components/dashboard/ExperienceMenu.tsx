import { CircleUserRound, LayoutDashboard, ShieldCheck, Check, LogOut } from "lucide-react"
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { experienceLabel, type Experience } from "@/nav"

/**
 * Top-right account menu — signed-in identity + sign out.
 * The experience switcher (Fleet ↔ Admin) only appears when `onSwitch` is passed
 * (used by the Admin shell); the fleet top bar renders it as sign-out only.
 */
export function ExperienceMenu({
  experience,
  onSwitch,
}: {
  experience?: Experience
  onSwitch?: (e: Experience) => void
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label="Account"
          className="flex size-8 shrink-0 items-center justify-center rounded-full transition-colors"
          style={{ background: "var(--bg-neutral-subtle)", color: "var(--fg-neutral-muted)" }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-neutral-subtle-hovered)")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "var(--bg-neutral-subtle)")}
        >
          <CircleUserRound className="size-4" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>
          <div className="flex flex-col">
            <span className="text-sm font-medium" style={{ color: "var(--fg-neutral-emphasis)" }}>Ava Thornton</span>
            <span className="text-xs font-normal" style={{ color: "var(--fg-neutral-muted)" }}>ava.thornton@ir.com · Admin</span>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {onSwitch && (
          <>
            <DropdownMenuLabel className="text-xs">Switch experience</DropdownMenuLabel>
            <DropdownMenuItem onSelect={() => onSwitch("fleet")}>
              <LayoutDashboard /> {experienceLabel.fleet}
              {experience === "fleet" && <Check className="ml-auto" />}
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => onSwitch("admin")}>
              <ShieldCheck /> {experienceLabel.admin}
              {experience === "admin" && <Check className="ml-auto" />}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
          </>
        )}
        <DropdownMenuItem><LogOut /> Sign out</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
