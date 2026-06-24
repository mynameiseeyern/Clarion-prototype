import { fleet } from "@/data/dashboard"
import { navItems, devNavItems, type NavItem, type PageId } from "@/nav"

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
      {/* Header — workspace brand */}
      <div className="flex h-16 items-center px-2">
        <div className="flex w-full items-center gap-2.5 p-2">
          <CompanyLogo />
          <span className="min-w-px flex-1 truncate text-sm font-semibold" style={{ color: "var(--fg-neutral-emphasis)" }}>
            {fleet.workspace}
          </span>
        </div>
      </div>

      {/* Content — nav */}
      <div className="flex-1 overflow-y-auto p-2">
        <NavGroup label="Workspace" items={navItems} active={active} onNavigate={onNavigate} />
        <div className="mt-3">
          <NavGroup label="Product development" items={devNavItems} active={active} onNavigate={onNavigate} />
        </div>
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
        {/* IR brand lockup — clear space + min 'i' height (≈20px) per brand book;
            "Clarity" set in Poppins to match the Integrated Research wordmark. */}
        <div className="flex items-center gap-3 p-2">
          <img src="/ir-logo.png" alt="Integrated Research" className="h-9 w-auto dark:hidden" />
          <img src="/ir-logo-white.png" alt="Integrated Research" className="hidden h-9 w-auto dark:block" />
          <span className="h-5 w-px shrink-0" style={{ background: "var(--border-neutral-emphasis)" }} aria-hidden />
          <span className="text-base" style={{ fontFamily: "'Poppins', ui-sans-serif, sans-serif", fontWeight: 500, color: "var(--fg-neutral-emphasis)" }}>Clarity</span>
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
              style={
                isActive
                  ? { background: "var(--bg-selected-subtle)", color: "var(--fg-neutral-emphasis)" }
                  : { color: "var(--fg-neutral-emphasis)" }
              }
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
