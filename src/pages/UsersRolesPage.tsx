import { useMemo, useState } from "react"
import {
  Search, X, Plus, MoreHorizontal, ShieldCheck, UserCog, Mail, KeyRound,
  UserMinus, UserCheck, Users as UsersIcon, BadgeCheck,
} from "lucide-react"
import {
  Avatar, AvatarFallback, Badge, Button,
  Card, CardAction, CardFooter, CardHeader, CardHeaderText, CardTitle,
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
  EmptyState, InputGroup, InputGroupAddon, InputGroupInput, KpiTile, Select,
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@ir/ui"
import { toast } from "@/components/ui/toast"
import { InviteMemberDialog, type InviteDraft } from "@/components/admin/InviteMemberDialog"
import {
  users as seedUsers, groupName, roleLabel, roleBlurb, statusLabel,
  type AccountUser, type UserRole, type UserStatus,
} from "@/data/users"

const initials = (name: string) => name.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase()

const statusColor: Record<UserStatus, "success" | "info" | "neutral"> = {
  active: "success", invited: "info", deactivated: "neutral",
}

const roleOptions = (Object.keys(roleLabel) as UserRole[]).map((r) => ({ value: r, label: roleLabel[r] }))
const statusOptions = (Object.keys(statusLabel) as UserStatus[]).map((s) => ({ value: s, label: statusLabel[s] }))

export function UsersRolesPage() {
  const [rows, setRows] = useState<AccountUser[]>(seedUsers)
  const [search, setSearch] = useState("")
  const [roles, setRoles] = useState<string[]>([])
  const [statuses, setStatuses] = useState<string[]>(["active"])
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
      if (roles.length && !roles.includes(u.role)) return false
      if (statuses.length && !statuses.includes(u.status)) return false
      if (q && !(u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q))) return false
      return true
    })
  }, [rows, search, roles, statuses])

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
    setStatuses(["invited"])
    toast({ title: `Invite sent to ${email}`, description: "Email stubbed in prototype.", variant: "success" })
  }

  const clearFilters = () => { setSearch(""); setRoles([]); setStatuses([]) }

  return (
    <div className="flex flex-col gap-4">
      {/* KPI strip */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KpiTile label="Active" value={stats.active} />
        <KpiTile label="Invited" value={stats.invited} />
        <KpiTile label="Admins" value={stats.admins} />
        <KpiTile label="Deactivated" value={stats.deactivated} />
      </div>

      <Card className="w-full overflow-hidden">
        <CardHeader className="pb-4">
          <CardHeaderText>
            <div className="flex items-center gap-2">
              <CardTitle>Members</CardTitle>
              <Badge>{filtered.length} {filtered.length === 1 ? "user" : "users"}</Badge>
            </div>
          </CardHeaderText>
          <CardAction>
            <Button size="sm" onClick={() => setInviteOpen(true)}><Plus aria-hidden /> Invite member</Button>
          </CardAction>
        </CardHeader>

        {/* toolbar */}
        <div className="flex flex-col gap-2 px-6 pb-4 sm:flex-row sm:items-center">
          <InputGroup className="sm:max-w-xs">
            <InputGroupAddon><Search aria-hidden /></InputGroupAddon>
            <InputGroupInput
              aria-label="Search members"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name or email…"
            />
            {search && (
              <InputGroupAddon align="end">
                <Button variant="ghost" size="icon-xs" aria-label="Clear search" onClick={() => setSearch("")}><X aria-hidden /></Button>
              </InputGroupAddon>
            )}
          </InputGroup>
          <div className="flex items-center gap-2 sm:ms-auto">
            <Select label="Role" options={roleOptions} value={roles} onValueChange={setRoles} showDetail={false} icon={<UserCog />} className="min-w-32" />
            <Select label="Status" options={statusOptions} value={statuses} onValueChange={setStatuses} showDetail={false} icon={<BadgeCheck />} className="min-w-32" />
          </div>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead align="start">User</TableHead>
              <TableHead align="start">Role</TableHead>
              <TableHead align="start">Groups</TableHead>
              <TableHead align="start">Last active</TableHead>
              <TableHead align="start">Status</TableHead>
              <TableHead align="start" className="w-12"><span className="sr-only">Actions</span></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((u) => (
              <TableRow key={u.id} className={u.status === "deactivated" ? "text-content-neutral-muted" : undefined}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar size="sm"><AvatarFallback>{initials(u.name)}</AvatarFallback></Avatar>
                    <div className="flex min-w-0 flex-col">
                      <span className="truncate text-label-md text-content-neutral-emphasis">{u.name}</span>
                      <span className="truncate text-body-xs text-content-neutral-muted">{u.email}</span>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <span className="inline-flex items-center gap-1.5">
                    {u.role === "admin"
                      ? <ShieldCheck aria-hidden className="size-4 text-content-primary-emphasis" />
                      : <UserCog aria-hidden className="size-4 text-content-neutral-subtle" />}
                    {roleLabel[u.role]}
                  </span>
                </TableCell>
                <TableCell>
                  {u.role === "admin" ? (
                    <span className="text-content-neutral-subtle">All groups</span>
                  ) : u.groups.length === 0 ? (
                    <Badge color="warning">Unassigned</Badge>
                  ) : (
                    <div className="flex flex-wrap items-center gap-1">
                      {u.groups.slice(0, 2).map((g) => <Badge key={g} variant="outline">{groupName(g)}</Badge>)}
                      {u.groups.length > 2 && <span className="text-body-xs text-content-neutral-muted">+{u.groups.length - 2}</span>}
                    </div>
                  )}
                </TableCell>
                <TableCell className="text-content-neutral-muted">
                  {u.status === "invited" ? `Invited ${u.invitedAgo}` : (u.lastActive ?? "—")}
                </TableCell>
                <TableCell>
                  <Badge color={statusColor[u.status]} dot>{statusLabel[u.status]}</Badge>
                </TableCell>
                <TableCell className="pe-3">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon-sm" aria-label={`Actions for ${u.name}`}><MoreHorizontal aria-hidden /></Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onSelect={() => onEditRole(u)}><UserCog aria-hidden /> Edit role &amp; groups</DropdownMenuItem>
                      {u.status === "invited" && <DropdownMenuItem onSelect={() => onResend(u)}><Mail aria-hidden /> Resend invite</DropdownMenuItem>}
                      {u.status === "active" && <DropdownMenuItem onSelect={() => onReset(u)}><KeyRound aria-hidden /> Send password reset</DropdownMenuItem>}
                      <DropdownMenuSeparator />
                      {u.status === "deactivated"
                        ? <DropdownMenuItem onSelect={() => onReactivate(u)}><UserCheck aria-hidden /> Reactivate</DropdownMenuItem>
                        : <DropdownMenuItem variant="destructive" onSelect={() => onDeactivate(u)}><UserMinus aria-hidden /> Deactivate</DropdownMenuItem>}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
            {filtered.length === 0 && (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={6}>
                  <EmptyState
                    size="sm"
                    icon={<UsersIcon />}
                    title="No members match"
                    description="Try a different name, or clear the role and status filters."
                    action={<Button variant="outline" size="sm" onClick={clearFilters}>Clear filters</Button>}
                  />
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>

        {/* role legend */}
        <CardFooter className="flex-col items-start gap-1 pt-4 sm:flex-row sm:items-center sm:gap-6">
          <span className="inline-flex items-center gap-1.5 text-body-xs text-content-neutral-muted">
            <ShieldCheck aria-hidden className="size-3.5 text-content-primary-emphasis" />
            <strong className="font-medium text-content-neutral-emphasis">{roleLabel.admin}</strong> — {roleBlurb.admin}
          </span>
          <span className="inline-flex items-center gap-1.5 text-body-xs text-content-neutral-muted">
            <UserCog aria-hidden className="size-3.5 text-content-neutral-subtle" />
            <strong className="font-medium text-content-neutral-emphasis">{roleLabel.manager}</strong> — {roleBlurb.manager}
          </span>
        </CardFooter>
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
