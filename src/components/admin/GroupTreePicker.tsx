import { useState } from "react"
import { ChevronRight, ChevronDown, Check, Search, X } from "lucide-react"
import { Chip } from "@/components/ui/chip"
import { groupTree, groupName, type GroupNode } from "@/data/users"

/**
 * Hierarchical group picker (Country → Area → Office → Shift). Search + expand /
 * collapse + checkboxes. Selected nodes show as removable token chips, so the
 * full catalogue never renders as a wall of chips. A Manager assigned to a node
 * sees everything beneath it (cascade).
 */
export function GroupTreePicker({
  value,
  onChange,
}: {
  value: string[]
  onChange: (ids: string[]) => void
}) {
  const [search, setSearch] = useState("")
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const q = search.trim().toLowerCase()

  const toggleSel = (id: string) =>
    onChange(value.includes(id) ? value.filter((x) => x !== id) : [...value, id])
  const toggleExp = (id: string) =>
    setExpanded((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n })

  // node matches if its name matches, or any descendant matches (so ancestors stay visible)
  const matches = (n: GroupNode): boolean =>
    !q || n.name.toLowerCase().includes(q) || !!n.children?.some(matches)

  const Box = ({ on }: { on: boolean }) => (
    <span
      className="flex size-4 shrink-0 items-center justify-center rounded"
      style={{
        background: on ? "var(--bg-primary-emphasis)" : "var(--bg-input-default)",
        border: `1px solid ${on ? "var(--bg-primary-emphasis)" : "var(--border-input-default)"}`,
      }}
    >
      {on && <Check className="size-3" style={{ color: "var(--fg-on-primary-emphasis)" }} />}
    </span>
  )

  const renderNode = (n: GroupNode, depth: number): React.ReactNode => {
    if (!matches(n)) return null
    const hasKids = !!n.children?.length
    const isExp = q ? true : expanded.has(n.id) // auto-expand while searching
    const sel = value.includes(n.id)
    return (
      <div key={n.id}>
        <div className="flex items-center gap-1" style={{ paddingLeft: depth * 16 }}>
          {hasKids ? (
            <button
              type="button"
              aria-label={isExp ? "Collapse" : "Expand"}
              onClick={() => toggleExp(n.id)}
              className="flex size-5 shrink-0 items-center justify-center rounded transition-colors hover:bg-[var(--bg-neutral-subtle-hovered)]"
              style={{ color: "var(--fg-neutral-muted)" }}
            >
              {isExp ? <ChevronDown className="size-3.5" /> : <ChevronRight className="size-3.5" />}
            </button>
          ) : (
            <span className="size-5 shrink-0" />
          )}
          <button
            type="button"
            onClick={() => toggleSel(n.id)}
            className="flex min-w-px flex-1 items-center gap-2 rounded-md px-1.5 py-1 text-left text-sm transition-colors hover:bg-[var(--bg-neutral-subtle-hovered)]"
            style={{ color: "var(--fg-neutral-emphasis)" }}
          >
            <Box on={sel} />
            <span className="truncate">{n.name}</span>
          </button>
        </div>
        {hasKids && isExp && n.children!.map((c) => renderNode(c, depth + 1))}
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-2">
      {/* search */}
      <div className="flex h-9 items-center gap-1.5 rounded-lg px-2.5" style={{ background: "var(--bg-input-default)", border: "1px solid var(--border-input-default)" }}>
        <Search className="size-4 shrink-0" style={{ color: "var(--fg-neutral-muted)" }} />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search groups…"
          className="min-w-px flex-1 bg-transparent text-sm outline-none placeholder:text-[var(--fg-neutral-muted)]"
          style={{ color: "var(--fg-neutral-emphasis)" }}
        />
        {search && (
          <button type="button" aria-label="Clear" onClick={() => setSearch("")} className="flex size-5 shrink-0 items-center justify-center rounded-sm transition-colors hover:bg-[var(--bg-neutral-subtle-hovered)]" style={{ color: "var(--fg-neutral-muted)" }}>
            <X className="size-3.5" />
          </button>
        )}
      </div>

      {/* tree */}
      <div className="max-h-52 overflow-y-auto rounded-lg p-1" style={{ border: "1px solid var(--border-neutral-muted)" }}>
        {groupTree.some(matches) ? (
          groupTree.map((n) => renderNode(n, 0))
        ) : (
          <div className="px-2 py-6 text-center text-sm" style={{ color: "var(--fg-neutral-muted)" }}>No groups match “{search}”.</div>
        )}
      </div>

      {/* selected as removable token chips */}
      {value.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {value.map((id) => (
            <Chip key={id} size="sm" onRemove={() => toggleSel(id)} removeLabel={`Remove ${groupName(id)}`}>
              {groupName(id)}
            </Chip>
          ))}
        </div>
      )}
    </div>
  )
}
