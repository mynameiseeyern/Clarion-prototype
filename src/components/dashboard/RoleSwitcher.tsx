import { ShieldCheck, UserCog, Check, ChevronDown, Settings, LogOut } from "lucide-react"
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { roleName, type Role } from "@/nav"

/**
 * Top-right "View as" control. Prototype affordance to preview the same Fleet
 * view as each role — Admins see the Administration nav + whole org; CC Managers
 * get a stripped-down, Group-scoped view. (Top-left sidebar switches org.)
 */
export function RoleSwitcher({
  role,
  onSwitch,
}: {
  role: Role
  onSwitch: (r: Role) => void
}) {
  const Icon = role === "admin" ? ShieldCheck : UserCog
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label="View as role"
          className="flex h-8 items-center gap-1.5 rounded-full px-3 text-sm font-medium transition-colors"
          style={{ background: "var(--bg-neutral-subtle)", color: "var(--fg-neutral-emphasis)" }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-neutral-subtle-hovered)")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "var(--bg-neutral-subtle)")}
        >
          <Icon className="size-4" style={{ color: "var(--fg-neutral-muted)" }} />
          <span className="hidden sm:inline" style={{ color: "var(--fg-neutral-muted)" }}>Viewing as</span>
          <span>{roleName[role]}</span>
          <ChevronDown className="size-4" style={{ color: "var(--fg-neutral-muted)" }} />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="text-xs">View as (preview)</DropdownMenuLabel>
        <DropdownMenuItem onSelect={() => onSwitch("admin")}>
          <ShieldCheck /> {roleName.admin}
          {role === "admin" && <Check className="ml-auto" />}
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => onSwitch("manager")}>
          <UserCog /> {roleName.manager}
          {role === "manager" && <Check className="ml-auto" />}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuLabel>
          <div className="flex flex-col">
            <span className="text-sm font-medium" style={{ color: "var(--fg-neutral-emphasis)" }}>Ava Thornton</span>
            <span className="text-xs font-normal" style={{ color: "var(--fg-neutral-muted)" }}>ava.thornton@ir.com</span>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuItem><Settings /> Account settings</DropdownMenuItem>
        <DropdownMenuItem><LogOut /> Sign out</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
