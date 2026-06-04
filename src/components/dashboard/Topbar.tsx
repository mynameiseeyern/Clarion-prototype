import type { ReactNode } from "react"
import { PanelLeft, ChevronRight, Search, CircleUserRound, Sun, Moon } from "lucide-react"
import { fleet } from "@/data/dashboard"
import { pageLabel, type PageId } from "@/nav"
import { NotificationsBell } from "./NotificationsBell"
import type { AlertNotification } from "@/data/alerts"

function IconButton({ children, label, onClick }: { children: ReactNode; label: string; onClick?: () => void }) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="flex size-8 shrink-0 items-center justify-center rounded-full transition-colors"
      style={{ background: "var(--bg-neutral-subtle)", color: "var(--fg-neutral-muted)" }}
      onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-neutral-subtle-hovered)")}
      onMouseLeave={(e) => (e.currentTarget.style.background = "var(--bg-neutral-subtle)")}
    >
      {children}
    </button>
  )
}

export function Topbar({
  page,
  dark,
  onToggleTheme,
  onToggleSidebar,
  onOpenSearch,
}: {
  page: PageId
  dark: boolean
  onToggleTheme: () => void
  onToggleSidebar: () => void
  onOpenSearch: () => void
}) {
  return (
    <header
      className="flex h-16 items-center justify-between px-4"
      style={{ borderBottom: "1px solid var(--border-neutral-muted)" }}
    >
      <div className="flex items-center gap-2">
        <button
          type="button"
          aria-label="Toggle sidebar"
          onClick={onToggleSidebar}
          className="flex size-7 items-center justify-center rounded-md transition-colors hover:bg-[var(--bg-neutral-subtle-hovered)]"
          style={{ color: "var(--fg-neutral-muted)" }}
        >
          <PanelLeft className="size-4" />
        </button>
        <span className="mx-1 h-4 w-px" style={{ background: "var(--border-neutral-muted)" }} />
        <nav className="flex items-center gap-2.5 text-sm">
          <span style={{ color: "var(--fg-neutral-muted)" }}>{fleet.workspace}</span>
          <ChevronRight className="size-4" style={{ color: "var(--fg-neutral-subtle)" }} />
          <span style={{ color: "var(--fg-neutral-emphasis)" }}>{pageLabel(page)}</span>
        </nav>
      </div>

      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={onOpenSearch}
          className="flex h-8 w-[373px] max-w-[40vw] items-center gap-1.5 rounded-lg px-2.5 py-1 text-left transition-colors"
          style={{ background: "var(--bg-input-default)", border: "1px solid var(--border-input-default)" }}
          onMouseEnter={(e) => (e.currentTarget.style.borderColor = "var(--border-input-hovered)")}
          onMouseLeave={(e) => (e.currentTarget.style.borderColor = "var(--border-input-default)")}
        >
          <Search className="size-4 shrink-0" style={{ color: "var(--fg-neutral-muted)" }} />
          <span className="min-w-px flex-1 truncate text-sm" style={{ color: "var(--fg-neutral-muted)" }}>
            Search endpoints, users, locations...
          </span>
          <kbd
            className="flex h-5 min-w-5 items-center justify-center gap-1 rounded-sm px-1 text-xs font-medium"
            style={{ background: "var(--bg-neutral-subtle)", color: "var(--fg-neutral-muted)" }}
          >
            ⌘K
          </kbd>
        </button>
        <div className="flex items-center gap-2">
          <IconButton label="Toggle theme" onClick={onToggleTheme}>
            {dark ? <Sun className="size-4" /> : <Moon className="size-4" />}
          </IconButton>
          <IconButton label="Notifications"><Bell className="size-4" /></IconButton>
          <IconButton label="Account"><CircleUserRound className="size-4" /></IconButton>
        </div>
      </div>
    </header>
  )
}
