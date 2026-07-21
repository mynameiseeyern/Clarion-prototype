import type { ReactNode } from "react"
import { PanelLeft, ChevronRight, Sun, Moon, HelpCircle } from "lucide-react"
import { fleet } from "@/data/dashboard"
import { pageLabel, type PageId, type Experience } from "@/nav"
import { Button } from "@/components/ui/button"
import { ExperienceMenu } from "./ExperienceMenu"

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
  onSwitchExperience,
}: {
  page: PageId
  dark: boolean
  onToggleTheme: () => void
  onToggleSidebar: () => void
  onSwitchExperience: (e: Experience) => void
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
        <div className="flex items-center gap-2">
          <Button asChild variant="outline" size="sm">
            <a href="/support.html" target="_blank" rel="noreferrer">
              <HelpCircle />
              Help
            </a>
          </Button>
          <IconButton label="Toggle theme" onClick={onToggleTheme}>
            {dark ? <Sun className="size-4" /> : <Moon className="size-4" />}
          </IconButton>
          <ExperienceMenu experience="fleet" onSwitch={onSwitchExperience} />
        </div>
      </div>
    </header>
  )
}
