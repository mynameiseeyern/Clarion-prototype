import { useState, type ReactNode } from "react"
import { ChevronRight, ChevronDown, Search, X } from "lucide-react"
import { Button, Checkbox, Chip, InputGroup, InputGroupAddon, InputGroupInput } from "@ir/ui"
import { cnPicasso as cn } from "@/lib/utils"
import { groupTree, groupName, type GroupNode } from "@/data/users"

/**
 * Hierarchical group picker (Country → Area → Office → Shift). Search + expand /
 * collapse + checkboxes. Selected nodes show as removable chips, so the full
 * catalogue never renders as a wall of chips. A Manager assigned to a node sees
 * everything beneath it (cascade).
 */
const indent = ["ps-0", "ps-4", "ps-8", "ps-12", "ps-16"]

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
    setExpanded((s) => { const n = new Set(s); if (n.has(id)) n.delete(id); else n.add(id); return n })

  // A node matches if its name does, or any descendant's does (so ancestors stay visible).
  const matches = (n: GroupNode): boolean =>
    !q || n.name.toLowerCase().includes(q) || !!n.children?.some(matches)

  const renderNode = (n: GroupNode, depth: number): ReactNode => {
    if (!matches(n)) return null
    const hasKids = !!n.children?.length
    const isExp = q ? true : expanded.has(n.id) // auto-expand while searching
    const id = `group-${n.id}`
    return (
      <div key={n.id}>
        <div className={cn("flex items-center gap-1", indent[Math.min(depth, indent.length - 1)])}>
          {hasKids ? (
            <Button variant="ghost" size="icon-xs" aria-label={`${isExp ? "Collapse" : "Expand"} ${n.name}`} aria-expanded={isExp} onClick={() => toggleExp(n.id)}>
              {isExp ? <ChevronDown aria-hidden /> : <ChevronRight aria-hidden className="rtl-mirror" />}
            </Button>
          ) : (
            <span aria-hidden className="size-6 shrink-0" />
          )}
          <label htmlFor={id} className="flex min-w-0 flex-1 cursor-pointer items-center gap-2 rounded-md px-1.5 py-1 text-body-sm text-content-neutral-emphasis hover:bg-surface-neutral-subtle-hovered">
            <Checkbox id={id} size="sm" checked={value.includes(n.id)} onCheckedChange={() => toggleSel(n.id)} />
            <span className="truncate">{n.name}</span>
          </label>
        </div>
        {hasKids && isExp && n.children!.map((c) => renderNode(c, depth + 1))}
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-2">
      <InputGroup>
        <InputGroupAddon><Search aria-hidden /></InputGroupAddon>
        <InputGroupInput aria-label="Search groups" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search groups…" />
        {search && (
          <InputGroupAddon align="end">
            <Button variant="ghost" size="icon-xs" aria-label="Clear search" onClick={() => setSearch("")}><X aria-hidden /></Button>
          </InputGroupAddon>
        )}
      </InputGroup>

      <div className="max-h-52 overflow-y-auto rounded-lg border border-line-neutral-muted p-1">
        {groupTree.some(matches) ? (
          groupTree.map((n) => renderNode(n, 0))
        ) : (
          <div className="px-2 py-6 text-center text-body-sm text-content-neutral-muted">No groups match “{search}”.</div>
        )}
      </div>

      {value.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {value.map((id) => (
            <Chip key={id} selected onRemove={() => toggleSel(id)} removeLabel={`Remove ${groupName(id)}`}>
              {groupName(id)}
            </Chip>
          ))}
        </div>
      )}
    </div>
  )
}
