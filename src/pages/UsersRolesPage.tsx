import { useMemo, useState } from "react"
import {
  Search, X, Plus, MoreHorizontal, ShieldCheck, UserCog, Mail, KeyRound,
  UserMinus, UserCheck, Users as UsersIcon,
} from "lucide-react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { toast } from "@/components/ui/toast"
import { InviteMemberDialog, type InviteDraft } from "@/components/admin/InviteMemberDialog"
import {
  users as seedUsers, groupName, roleLabel, roleBlurb, statusLabel,
  type AccountUser, type UserRole, type UserStatus,
} from "@/data/users"

const initials = (name: string) => name.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase()

const statusBadge: Record<UserStatus, "success" | "info" | "secondary"> = {
  active: "success", invited: "info", deactivated: "secondary",
}
const statusDot: Record<UserStatus, string> = {
  active: "var(--status-healthy)", invited: "var(--status-info)", deactivated: "var(--status-unknown)",
}

function Stat({ label, value, icon: Icon }: { label: string; value: number; icon: typeof UsersIcon }) {
  return (
    <Card className="flex-1 gap-0 rounded-xl p-4">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium" style={{ color: "var(--fg-neutral-emphasis)" }}>{label}</span>
        <Icon className="size-4" style={{ color: "var(--fg-neutral-subtle)" }} />
      </div>
      <span className="mt-2 font-mono text-2xl font-semibold" style={{ color: "var(--fg-neutral-emphasis)" }}>{value}</span>
    </Card>
  )
}

export function UsersRolesPage() {
  const [rows, setRows] = useState<AccountUser[]>(seedUsers)
  const [search, setSearch] = useState("")
  const [role, setRole] = useState<UserRole | "all">("all")
  const [status, setStatus] = useState<UserStatus | "all">("active")
  const [inviteOpen, setInviteOpen] = useState(false)

  const stats = useMemo(() => ({
    active: rows.filter((u) => u.status === "active").length,
    invited: rows.filter((u) => u.status === "invited").length,
    admins: rows.filter((u) => u.role === "admin" && u.status !== "deactivated").length,
    deactivated: rows.filter((u) => u.status === "deactivated").length,
  }), [rows])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return rows.filter((u) => {
      if (role !== "all" && u.role !== role) return false
      if (status !== "all" && u.status !== status) return false
      if (q && !(u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q))) return false
      return true
    })
  }, [rows, search, role, status])

  const activeAdmins = rows.filter((u) => u.role === "admin" && u.status === "active").length

  const setStatusFor = (id: string, next: UserStatus) =>
    setRows((xs) => xs.map((u) => (u.id === id ? { ...u, status: next } : u)))

  const onDeactivate = (u: AccountUser) => {
    if (u.role === "admin" && activeAdmins <= 1) {
      toast({ title: "Can't deactivate the last Admin", description: "Assign another Admin first.", variant: "danger" })
      return
    }
    setStatusFor(u.id, "deactivated")
    toast({ title: `${u.name} deactivated`, description: "Access revoked. (Stubbed)", variant: "danger" })
  }
  const onReactivate = (u: AccountUser) => {
    setStatusFor(u.id, "active")
    toast({ title: `${u.name} reactivated`, variant: "success" })
  }
  const onResend = (u: AccountUser) =>
    toast({ title: `Invite resent to ${u.email}`, description: "No duplicate account created. (Stubbed)", variant: "success" })
  const onReset = (u: AccountUser) =>
    toast({ title: `Password reset sent to ${u.email}`, description: "Email stubbed in prototype.", variant: "info" })
  const onEditRole = (u: AccountUser) =>
    toast({ title: `Edit role — ${u.name}`, description: "Role editor coming next.", variant: "info" })

  const onInvite = ({ email, role: r, groups: gs }: InviteDraft) => {
    const name = email.split("@")[0].split(/[._-]+/).filter(Boolean)
      .map((p) => p[0].toUpperCase() + p.slice(1)).join(" ") || email
    const newUser: AccountUser = {
      id: `u-${Date.now()}`, name, email, role: r, status: "invited",
      groups: gs, lastActive: null, invitedAgo: "just now",
    }
    setRows((xs) => [newUser, ...xs])
    setStatus("invited")
    toast({ title: `Invite sent to ${email}`, description: "Email stubbed in prototype.", variant: "success" })
  }

  return (
    <div className="flex flex-col gap-4">
      {/* KPI strip */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <Stat label="Active" value={stats.active} icon={UserCheck} />
        <Stat label="Invited" value={stats.invited} icon={Mail} />
        <Stat label="Admins" value={stats.admins} icon={ShieldCheck} />
        <Stat label="Deactivated" value={stats.deactivated} icon={UserMinus} />
      </div>

      <Card className="w-full gap-0 overflow-hidden rounded-xl p-0">
        {/* header */}
        <div className="flex items-center gap-2 px-4 py-4">
          <h2 className="text-base font-medium" style={{ color: "var(--fg-neutral-emphasis)" }}>Members</h2>
          <span className="flex h-5 items-center rounded-full px-2 text-xs font-medium" style={{ background: "var(--bg-neutral-subtle)", color: "var(--fg-neutral-muted)" }}>
            {filtered.length} {filtered.length === 1 ? "user" : "users"}
          </span>
          <Button size="sm" className="ml-auto" onClick={() => setInviteOpen(true)}>
            <Plus /> Invite member
          </Button>
        </div>

        {/* toolbar */}
        <div className="flex flex-col gap-2 px-4 pb-4 sm:flex-row sm:items-center">
          <div className="flex h-9 w-full items-center gap-1.5 rounded-lg px-2.5 sm:max-w-xs" style={{ background: "var(--bg-input-default)", border: "1px solid var(--border-input-default)" }}>
            <Search className="size-4 shrink-0" style={{ color: "var(--fg-neutral-muted)" }} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name or email…"
              className="min-w-px flex-1 bg-transparent text-sm outline-none placeholder:text-[var(--fg-neutral-muted)]"
              style={{ color: "var(--fg-neutral-emphasis)" }}
            />
            {search && (
              <button type="button" aria-label="Clear search" onClick={() => setSearch("")} className="flex size-5 shrink-0 items-center justify-center rounded-sm transition-colors hover:bg-[var(--bg-neutral-subtle-hovered)]" style={{ color: "var(--fg-neutral-muted)" }}>
                <X className="size-3.5" />
              </button>
            )}
          </div>
          <div className="flex items-center gap-2 sm:ml-auto">
            <Select value={role} onValueChange={(v) => setRole(v as UserRole | "all")}>
              <SelectTrigger className="h-9"><SelectValue placeholder="Role" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All roles</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="manager">CC Manager</SelectItem>
              </SelectContent>
            </Select>
            <Select value={status} onValueChange={(v) => setStatus(v as UserStatus | "all")}>
              <SelectTrigger className="h-9"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="invited">Invited</SelectItem>
                <SelectItem value="deactivated">Deactivated</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* table */}
        <div className="w-full overflow-x-auto" style={{ borderTop: "1px solid var(--border-neutral-subtle)" }}>
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border-neutral-muted)", background: "var(--bg-neutral-subtle)" }}>
                <Th>User</Th>
                <Th>Role</Th>
                <Th>Groups</Th>
                <Th>Last active</Th>
                <Th>Status</Th>
                <th className="w-10" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((u) => (
                <tr key={u.id} className="group transition-colors" style={{ borderBottom: "1px solid var(--border-neutral-subtle)", opacity: u.status === "deactivated" ? 0.6 : 1 }}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <Avatar className="size-8"><AvatarFallback>{initials(u.name)}</AvatarFallback></Avatar>
                      <div className="flex min-w-px flex-col">
                        <span className="truncate text-sm font-medium" style={{ color: "var(--fg-neutral-emphasis)" }}>{u.name}</span>
                        <span className="truncate text-xs" style={{ color: "var(--fg-neutral-muted)" }}>{u.email}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-1.5 text-sm" style={{ color: "var(--fg-neutral-emphasis)" }}>
                      {u.role === "admin" ? <ShieldCheck className="size-3.5" style={{ color: "var(--fg-primary-emphasis)" }} /> : <UserCog className="size-3.5" style={{ color: "var(--fg-neutral-subtle)" }} />}
                      {roleLabel[u.role]}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {u.role === "admin" ? (
                      <span className="text-sm" style={{ color: "var(--fg-neutral-subtle)" }}>All groups</span>
                    ) : u.groups.length === 0 ? (
                      <span className="text-sm" style={{ color: "var(--fg-warning-emphasis)" }}>Unassigned</span>
                    ) : (
                      <div className="flex flex-wrap items-center gap-1">
                        {u.groups.slice(0, 2).map((g) => (
                          <Badge key={g} variant="secondary">{groupName(g)}</Badge>
                        ))}
                        {u.groups.length > 2 && (
                          <span className="text-xs" style={{ color: "var(--fg-neutral-muted)" }}>+{u.groups.length - 2}</span>
                        )}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {u.status === "invited" ? (
                      <span className="text-sm" style={{ color: "var(--fg-neutral-subtle)" }}>Invited {u.invitedAgo}</span>
                    ) : (
                      <span className="text-sm" style={{ color: "var(--fg-neutral-muted)" }}>{u.lastActive ?? "—"}</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={statusBadge[u.status]} className="gap-1.5">
                      <span className="size-1.5 rounded-full" style={{ background: statusDot[u.status] }} />
                      {statusLabel[u.status]}
                    </Badge>
                  </td>
                  <td className="pr-3">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button type="button" aria-label="Row actions" className="flex size-8 items-center justify-center rounded-md transition-colors hover:bg-[var(--bg-neutral-subtle-hovered)]" style={{ color: "var(--fg-neutral-muted)" }}>
                          <MoreHorizontal className="size-4" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onSelect={() => onEditRole(u)}><UserCog /> Edit role &amp; groups</DropdownMenuItem>
                        {u.status === "invited" && (
                          <DropdownMenuItem onSelect={() => onResend(u)}><Mail /> Resend invite</DropdownMenuItem>
                        )}
                        {u.status === "active" && (
                          <DropdownMenuItem onSelect={() => onReset(u)}><KeyRound /> Send password reset</DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        {u.status === "deactivated" ? (
                          <DropdownMenuItem onSelect={() => onReactivate(u)}><UserCheck /> Reactivate</DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem onSelect={() => onDeactivate(u)} className="text-[var(--fg-danger-emphasis)]"><UserMinus /> Deactivate</DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-16">
                    <div className="flex flex-col items-center gap-2 text-center">
                      <UsersIcon className="size-6" style={{ color: "var(--fg-neutral-subtle)" }} />
                      <span className="text-sm" style={{ color: "var(--fg-neutral-muted)" }}>No users match your filters.</span>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* footer — role legend */}
        <div className="flex flex-col gap-1 px-4 py-3 sm:flex-row sm:items-center sm:gap-6" style={{ borderTop: "1px solid var(--border-neutral-muted)" }}>
          <span className="inline-flex items-center gap-1.5 text-xs" style={{ color: "var(--fg-neutral-muted)" }}>
            <ShieldCheck className="size-3.5" style={{ color: "var(--fg-primary-emphasis)" }} /> <b style={{ color: "var(--fg-neutral-emphasis)" }}>Admin</b> — {roleBlurb.admin}
          </span>
          <span className="inline-flex items-center gap-1.5 text-xs" style={{ color: "var(--fg-neutral-muted)" }}>
            <UserCog className="size-3.5" style={{ color: "var(--fg-neutral-subtle)" }} /> <b style={{ color: "var(--fg-neutral-emphasis)" }}>CC Manager</b> — {roleBlurb.manager}
          </span>
        </div>
      </Card>

      <InviteMemberDialog
        open={inviteOpen}
        onOpenChange={setInviteOpen}
        existingEmails={rows.map((u) => u.email)}
        onInvite={onInvite}
      />
    </div>
  )
}

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th className="h-10 px-4 text-left align-middle text-xs font-medium" style={{ color: "var(--fg-neutral-muted)" }}>
      {children}
    </th>
  )
}
