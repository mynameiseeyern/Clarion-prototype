import { fleet } from "@/data/dashboard"
import { adminNavItems, adminDocNavItems, type NavItem, type PageId } from "@/nav"

// Acme Contact Centre brand monogram (placeholder customer logo).
function CompanyLogo() {
  return (
    <svg viewBox="0 0 32 32" className="size-8 shrink-0" aria-hidden="true">
      <rect width="32" height="32" rx="8" fill="#3730A3" />
      <g stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none">
        <path d="M16 8 L10 24" />
        <path d="M16 8 L22 24" />
        <path d="M12.4 18.6 H19.6" />
      </g>
    </svg>
  )
}

/**
 * Sidebar for the Administration experience. Same chrome as the Fleet sidebar
 * (top-left header switches org), listing the admin nav plus the shared
 * Product development docs. The Fleet ↔ Admin switch lives in the top-right
 * account menu.
 */
export function AdminSidebar({
  active,
  onNavigate,
}: {
  active: PageId
  onNavigate: (id: PageId) => void
}) {
  return (
    <aside className="flex h-full w-64 shrink-0 flex-col" style={{ background: "var(--bg-sidebar)" }}>
      {/* Header — org brand */}
      <div className="flex h-16 items-center px-2">
        <div className="flex w-full items-center gap-2.5 p-2">
          <CompanyLogo />
          <span className="flex min-w-px flex-1 flex-col items-start gap-0.5 text-left">
            <span className="w-full truncate text-sm font-semibold leading-none" style={{ color: "var(--fg-neutral-emphasis)" }}>
              {fleet.workspace}
            </span>
            <span className="w-full truncate text-xs leading-none" style={{ color: "var(--fg-neutral-muted)" }}>
              Administration
            </span>
          </span>
        </div>
      </div>

      {/* Content — admin nav + shared docs */}
      <div className="flex-1 overflow-y-auto p-2">
        <NavGroup label="Administration" items={adminNavItems} active={active} onNavigate={onNavigate} />
        <div className="mt-3">
          <NavGroup label="Product development" items={adminDocNavItems} active={active} onNavigate={onNavigate} />
        </div>
      </div>

      {/* Footer */}
      <div className="flex flex-col gap-2 px-4 py-2">
        <div className="flex items-center p-2">
          <img src="/ir-logo.png" alt="IR" className="h-6 w-auto dark:hidden" />
          <img src="/ir-logo-white.png" alt="IR" className="hidden h-6 w-auto dark:block" />
        </div>
      </div>
    </aside>
  )
}

function NavGroup({
  label, items, active, onNavigate,
}: {
  label: string
  items: NavItem[]
  active: PageId
  onNavigate: (id: PageId) => void
}) {
  return (
    <>
      <div className="flex h-8 items-center px-2 text-xs font-medium" style={{ color: "var(--fg-neutral-emphasis)" }}>
        {label}
      </div>
      <nav className="flex flex-col gap-1">
        {items.map(({ id, label: itemLabel, icon: Icon }) => {
          const isActive = id === active
          return (
            <button
              key={id}
              type="button"
              onClick={() => onNavigate(id)}
              className="relative flex h-8 w-full items-center gap-2 rounded-md p-2 text-left text-sm transition-colors"
              style={isActive
                ? { background: "var(--bg-selected-subtle)", color: "var(--fg-neutral-emphasis)" }
                : { color: "var(--fg-neutral-emphasis)" }}
              onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.background = "var(--bg-neutral-subtle-hovered)" }}
              onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.background = "transparent" }}
            >
              {isActive && (
                <span className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-full" style={{ background: "var(--border-focused)" }} />
              )}
              <Icon className="size-4 shrink-0" style={{ color: isActive ? "var(--fg-primary-emphasis)" : "var(--fg-neutral-muted)" }} />
              <span className="truncate">{itemLabel}</span>
            </button>
          )
        })}
      </nav>
    </>
  )
}
