import { GalleryVerticalEnd, ChevronsUpDown } from "lucide-react"
import { fleet } from "@/data/dashboard"
import { navItems, type PageId } from "@/nav"

export function Sidebar({
  active,
  onNavigate,
  secondsAgo,
}: {
  active: PageId
  onNavigate: (id: PageId) => void
  secondsAgo: number
}) {
  return (
    <aside
      className="flex h-full w-64 shrink-0 flex-col"
      style={{ background: "var(--bg-sidebar)" }}
    >
      {/* Header — workspace switcher */}
      <div className="flex h-16 items-center px-2">
        <button
          type="button"
          className="flex w-full items-center gap-2 rounded-md p-2 transition-colors hover:bg-[var(--bg-neutral-subtle-hovered)]"
        >
          <span
            className="flex size-8 shrink-0 items-center justify-center rounded-lg"
            style={{ background: "var(--bg-neutral-emphasis)", color: "var(--fg-on-neutral-emphasis)" }}
          >
            <GalleryVerticalEnd className="size-4" />
          </span>
          <span className="flex min-w-px flex-1 flex-col items-start gap-0.5 text-left">
            <span className="w-full truncate text-sm font-semibold leading-none" style={{ color: "var(--fg-neutral-emphasis)" }}>
              {fleet.workspace}
            </span>
            <span className="w-full truncate text-xs leading-none" style={{ color: "var(--fg-neutral-muted)" }}>
              {fleet.product}
            </span>
          </span>
          <ChevronsUpDown className="size-4 shrink-0" style={{ color: "var(--fg-neutral-subtle)" }} />
        </button>
      </div>

      {/* Content — nav */}
      <div className="flex-1 overflow-y-auto p-2">
        <div className="flex h-8 items-center px-2 text-xs font-medium" style={{ color: "var(--fg-neutral-emphasis)" }}>
          Workspace
        </div>
        <nav className="flex flex-col gap-1">
          {navItems.map(({ id, label, icon: Icon }) => {
            const isActive = id === active
            return (
              <button
                key={id}
                type="button"
                onClick={() => onNavigate(id)}
                className="relative flex h-8 w-full items-center gap-2 rounded-md p-2 text-left text-sm transition-colors"
                style={
                  isActive
                    ? { background: "var(--bg-selected-subtle)", color: "var(--fg-neutral-emphasis)" }
                    : { color: "var(--fg-neutral-emphasis)" }
                }
                onMouseEnter={(e) => {
                  if (!isActive) e.currentTarget.style.background = "var(--bg-neutral-subtle-hovered)"
                }}
                onMouseLeave={(e) => {
                  if (!isActive) e.currentTarget.style.background = "transparent"
                }}
              >
                {isActive && (
                  <span
                    className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-full"
                    style={{ background: "var(--border-focused)" }}
                  />
                )}
                <Icon
                  className="size-4 shrink-0"
                  style={{ color: isActive ? "var(--fg-primary-emphasis)" : "var(--fg-neutral-muted)" }}
                />
                <span className="truncate">{label}</span>
              </button>
            )
          })}
        </nav>
      </div>

      {/* Footer */}
      <div className="flex flex-col gap-2 px-4 py-2">
        <div className="flex items-center gap-2 p-2">
          <span
            className="size-3 shrink-0 rounded-full"
            style={{ background: "var(--status-healthy)", border: "1px solid var(--bg-card)", boxShadow: "var(--shadow-xs)" }}
          />
          <span className="truncate text-xs font-medium" style={{ color: "var(--fg-neutral-muted)" }}>
            {secondsAgo === 0 ? "Streaming just now" : `Streaming ${secondsAgo}s ago`}
          </span>
        </div>
        <div className="flex items-center gap-2 p-2">
          <span className="text-body-lg" style={{ color: "var(--fg-neutral-emphasis)" }}>Powered by</span>
          <span
            className="flex size-6 items-center justify-center rounded-[2px] text-[10px] font-bold tracking-tight"
            style={{ background: "var(--bg-neutral-emphasis)", color: "var(--fg-on-neutral-emphasis)" }}
          >
            IR
          </span>
        </div>
      </div>
    </aside>
  )
}
