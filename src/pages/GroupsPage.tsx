import { useState } from "react"
import { FolderTree, Link2, MoreHorizontal, Pencil, Plus, Search, Trash2, X } from "lucide-react"
import {
  Alert, AlertDescription, Avatar, AvatarFallback, Badge, Button, Card, CardAction, CardHeader, CardHeaderText, CardTitle,
  Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
  Drawer, DrawerBody, DrawerCloseButton, DrawerContent, DrawerDescription, DrawerFooter, DrawerHeader, DrawerHeading,
  DrawerTitle, DrawerTitleGroup,
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
  EmptyState, Field, FieldControl, FieldError, FieldLabel, Input, InputGroup, InputGroupAddon, InputGroupInput,
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow, Textarea,
} from "@ir/ui"
import { toast } from "@/components/ui/toast"
import { ME, access, assignmentLabel, initials, wouldOrphanTenant, type Group } from "@/data/access"
import { AddRoleDialog, PeoplePicker, PersonCell, RoleBadge, fmt, plural, useAccess } from "@/components/admin/access/AccessBits"

/**
 * Groups (Iris platform, Client Admin). Flat — groups can't contain groups — so they
 * map one-to-one onto IdP groups later. Roles are given to groups; members inherit them.
 */
export function GroupsPage() {
  useAccess()
  const [search, setSearch] = useState("")
  const [open, setOpen] = useState<string | null>(null)
  const [editing, setEditing] = useState<Group | "new" | null>(null)
  const [deleting, setDeleting] = useState<Group | null>(null)

  const all = access.groups()
  const q = search.trim().toLowerCase()
  const groups = all.filter((g) => !q || g.name.toLowerCase().includes(q) || g.description.toLowerCase().includes(q))

  return (
    <div className="flex flex-col gap-4">
      <Card className="w-full overflow-hidden">
        <CardHeader className="pb-4">
          <CardHeaderText>
            <div className="flex items-center gap-2"><CardTitle>Groups</CardTitle><Badge>{fmt(all.length)}</Badge></div>
          </CardHeaderText>
          <CardAction><Button size="sm" onClick={() => setEditing("new")}><Plus aria-hidden /> Create group</Button></CardAction>
        </CardHeader>
        <div className="px-6 pb-4">
          <InputGroup className="w-72">
            <InputGroupAddon><Search aria-hidden /></InputGroupAddon>
            <InputGroupInput aria-label="Search groups" placeholder="Search groups" value={search} onChange={(e) => setSearch(e.target.value)} />
            {search && <InputGroupAddon align="end"><Button variant="ghost" size="icon-xs" aria-label="Clear search" onClick={() => setSearch("")}><X aria-hidden /></Button></InputGroupAddon>}
          </InputGroup>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead align="start">Group</TableHead>
              <TableHead align="start">Roles</TableHead>
              <TableHead align="start">Members</TableHead>
              <TableHead align="start">Membership</TableHead>
              <TableHead className="w-12"><span className="sr-only">Actions</span></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {groups.map((g) => (
              <TableRow key={g.id} className="cursor-pointer" onClick={() => setOpen(g.id)}>
                <TableCell className="max-w-64">
                  <div className="flex min-w-0 flex-col">
                    <span className="truncate text-label-md text-content-neutral-emphasis">{g.name}</span>
                    {g.description && <span className="truncate text-body-xs text-content-neutral-muted">{g.description}</span>}
                  </div>
                </TableCell>
                <TableCell className="max-w-80">
                  {g.assignments.length
                    ? <div className="flex flex-wrap gap-1">{g.assignments.map((x) => <RoleBadge key={x.id} x={x} />)}</div>
                    : <Badge color="warning">No roles</Badge>}
                </TableCell>
                <TableCell><Members ids={g.members} /></TableCell>
                <TableCell className="text-content-neutral-muted">{g.source === "local" ? "Managed in Iris" : <span className="inline-flex items-center gap-1"><Link2 className="size-3.5" aria-hidden /> {g.idpGroup}</span>}</TableCell>
                <TableCell className="pe-3" onClick={(e) => e.stopPropagation()}>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild><Button variant="ghost" size="icon-sm" aria-label={`Actions for ${g.name}`}><MoreHorizontal aria-hidden /></Button></DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onSelect={() => setOpen(g.id)}>Open</DropdownMenuItem>
                      <DropdownMenuItem onSelect={() => setEditing(g)}><Pencil aria-hidden /> Rename</DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem variant="destructive" onSelect={() => setDeleting(g)}><Trash2 aria-hidden /> Delete…</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
            {!groups.length && (
              <TableRow className="hover:bg-transparent"><TableCell colSpan={5}>
                <EmptyState size="sm" icon={<FolderTree />} title={q ? "No groups match" : "No groups yet"} description={q ? "Try a different name." : "Create a group, give it a role, then add people."} />
              </TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </Card>

      <GroupDrawer id={open} onClose={() => setOpen(null)} onRename={(g) => setEditing(g)} onDelete={(g) => setDeleting(g)} />
      <GroupDialog value={editing} onClose={(id) => { setEditing(null); if (id) setOpen(id) }} />
      <DeleteGroupDialog group={deleting} onClose={() => setDeleting(null)} onDeleted={() => { setDeleting(null); setOpen(null) }} />
    </div>
  )
}

function Members({ ids }: { ids: string[] }) {
  const people = ids.map((id) => access.person(id)).filter(Boolean)
  if (!people.length) return <span className="text-content-neutral-subtle">Nobody</span>
  return (
    <div className="flex items-center gap-2">
      <div className="flex -space-x-2">
        {people.slice(0, 3).map((p) => <Avatar key={p!.id} size="xs" className="ring-2 ring-[var(--bg-card)]"><AvatarFallback>{initials(p!.name)}</AvatarFallback></Avatar>)}
      </div>
      <span className="text-body-sm text-content-neutral-muted">{fmt(people.length)}</span>
    </div>
  )
}

// ---------------------------------------------------------------- drawer ----

function GroupDrawer({ id, onClose, onRename, onDelete }: { id: string | null; onClose: () => void; onRename: (g: Group) => void; onDelete: (g: Group) => void }) {
  useAccess()
  const g = id ? access.group(id) : undefined
  const [roleOpen, setRoleOpen] = useState(false)
  const [peopleOpen, setPeopleOpen] = useState(false)
  if (!g) return <Drawer open={false} />
  const members = g.members.map((m) => access.person(m)).filter(Boolean)

  const removeRole = (aid: string) => {
    if (wouldOrphanTenant({ groupId: g.id, assignmentId: aid })) { toast({ title: "Can't remove the last Tenant Admin.", description: "Someone else needs Tenant Admin first.", variant: "danger" }); return }
    if (g.members.includes(ME) && g.assignments.find((x) => x.id === aid)?.role === "tenant_admin") { toast({ title: "You can't remove your own admin access.", variant: "danger" }); return }
    access.removeGroupRole(g.id, aid)
    toast({ title: "Role removed.", description: `${plural(g.members.length, "member")} lose it from their next request.` })
  }
  const removeMember = (pid: string) => {
    if (wouldOrphanTenant({ groupId: g.id, personId: pid })) { toast({ title: "Can't remove the last Tenant Admin.", variant: "danger" }); return }
    if (pid === ME && g.assignments.some((x) => x.role === "tenant_admin")) { toast({ title: "You can't remove your own admin access.", variant: "danger" }); return }
    access.removeMember(g.id, pid)
    toast({ title: `${access.person(pid)?.name} was removed from ${g.name}.` })
  }

  return (
    <Drawer open={!!id} onOpenChange={(o) => { if (!o) onClose() }}>
      <DrawerContent size="wide">
        <DrawerHeader type="title">
          <DrawerHeading>
            <DrawerTitleGroup>
              <DrawerTitle>{g.name}</DrawerTitle>
              <DrawerDescription>{g.description || "No description"}</DrawerDescription>
            </DrawerTitleGroup>
            <Button variant="ghost" size="icon-sm" aria-label="Rename group" onClick={() => onRename(g)}><Pencil aria-hidden /></Button>
            <DrawerCloseButton />
          </DrawerHeading>
        </DrawerHeader>
        <DrawerBody className="gap-6">
          <section className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <h3 className="text-label-lg text-content-neutral-emphasis">Roles</h3>
              <Button variant="outline" size="sm" onClick={() => setRoleOpen(true)}><Plus aria-hidden /> Add role</Button>
            </div>
            {g.assignments.length ? (
              <ul className="flex flex-col divide-y divide-line-neutral-muted rounded-lg border border-line-neutral-muted">
                {g.assignments.map((x) => (
                  <li key={x.id} className="flex items-center justify-between gap-3 px-4 py-2.5">
                    <RoleBadge x={x} />
                    <Button variant="ghost" size="icon-xs" aria-label={`Remove ${assignmentLabel(x)}`} onClick={() => removeRole(x.id)}><X aria-hidden /></Button>
                  </li>
                ))}
              </ul>
            ) : <Alert variant="warning"><AlertDescription>This group has no roles, so its members get nothing from it.</AlertDescription></Alert>}
          </section>

          <section className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <h3 className="text-label-lg text-content-neutral-emphasis">Members <span className="text-content-neutral-muted">{fmt(members.length)}</span></h3>
              <Button variant="outline" size="sm" disabled={g.source === "linked"} onClick={() => setPeopleOpen(true)}><Plus aria-hidden /> Add people</Button>
            </div>
            {members.length ? (
              <ul className="flex flex-col divide-y divide-line-neutral-muted rounded-lg border border-line-neutral-muted">
                {members.map((p) => (
                  <li key={p!.id} className="flex items-center justify-between gap-3 px-4 py-2">
                    <PersonCell p={p!} sub={p!.status !== "active" ? `${p!.email} · ${p!.status}` : undefined} />
                    {g.source === "local" && <Button variant="ghost" size="sm" onClick={() => removeMember(p!.id)}>Remove</Button>}
                  </li>
                ))}
              </ul>
            ) : <p className="text-body-sm text-content-neutral-muted">Nobody yet.</p>}
          </section>

          <section className="flex flex-col gap-2 rounded-lg bg-surface-neutral-subtle p-4">
            <span className="inline-flex items-center gap-2 text-label-md text-content-neutral-emphasis"><Link2 className="size-4" aria-hidden /> Membership: managed in Iris</span>
            <p className="text-body-sm text-content-neutral-muted">Once single sign-on or SCIM is on, you can link this group to a group in your identity provider. Its members then come from there and can&apos;t be changed here.</p>
          </section>
        </DrawerBody>
        <DrawerFooter className="justify-between">
          <Button variant="ghost" className="text-content-danger-emphasis" onClick={() => onDelete(g)}><Trash2 aria-hidden /> Delete group</Button>
          <Button variant="outline" onClick={onClose}>Done</Button>
        </DrawerFooter>
      </DrawerContent>

      <AddRoleDialog open={roleOpen} onOpenChange={setRoleOpen} title={`Add a role to ${g.name}`} existing={g.assignments}
        onAdd={(x) => { access.addGroupRole(g.id, x); toast({ title: `${g.name} now has ${assignmentLabel({ ...x, id: "" })}.`, description: `${plural(g.members.length, "member")} get it from their next request.` }) }} />
      <PeoplePicker open={peopleOpen} onOpenChange={setPeopleOpen} title={`Add people to ${g.name}`} exclude={g.members}
        onPick={(ids) => { access.addMembers(g.id, ids); toast({ title: `${plural(ids.length, "person", "people")} added to ${g.name}.` }) }} />
    </Drawer>
  )
}

// --------------------------------------------------------- create / rename ---

function GroupDialog({ value, onClose }: { value: Group | "new" | null; onClose: (createdId?: string) => void }) {
  const isNew = value === "new"
  const g = value && value !== "new" ? value : null
  const [name, setName] = useState("")
  const [desc, setDesc] = useState("")
  const [tried, setTried] = useState(false)
  const [lastKey, setLastKey] = useState<string | null>(null)
  const key = value === null ? null : isNew ? "new" : g!.id
  if (key !== lastKey) { setLastKey(key); setName(g?.name ?? ""); setDesc(g?.description ?? ""); setTried(false) }

  const clash = access.groups().some((x) => x.id !== g?.id && x.name.trim().toLowerCase() === name.trim().toLowerCase())
  const err = tried && !name.trim() ? "Give the group a name." : clash ? "Another group already has this name." : null
  const save = () => {
    setTried(true)
    if (!name.trim() || clash) return
    if (isNew) { const id = access.createGroup({ name, description: desc }); toast({ title: `${name.trim()} was created.`, description: "Now give it a role and add people." }); onClose(id) }
    else { access.updateGroup(g!.id, { name: name.trim(), description: desc.trim() }); toast({ title: "Group updated." }); onClose() }
  }
  return (
    <Dialog open={value !== null} onOpenChange={(o) => { if (!o) onClose() }}>
      <DialogContent size="sm">
        <DialogHeader><DialogTitle>{isNew ? "Create group" : `Rename ${g?.name}`}</DialogTitle></DialogHeader>
        <DialogBody className="gap-4">
          <Field invalid={!!err}>
            <FieldLabel required>Name</FieldLabel>
            <FieldControl required><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Sydney CC managers" autoFocus /></FieldControl>
            <FieldError>{err}</FieldError>
          </Field>
          <Field>
            <FieldLabel>Description</FieldLabel>
            <FieldControl><Textarea value={desc} onChange={(e) => setDesc(e.target.value)} rows={2} placeholder="Who's in it and why" /></FieldControl>
          </Field>
        </DialogBody>
        <DialogFooter>
          <Button variant="outline" onClick={() => onClose()}>Cancel</Button>
          <Button onClick={save}>{isNew ? "Create group" : "Save"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function DeleteGroupDialog({ group, onClose, onDeleted }: { group: Group | null; onClose: () => void; onDeleted: () => void }) {
  const g = group
  const blocked = !!g && wouldOrphanTenant({ groupId: g.id, deleteGroup: true })
  return (
    <Dialog open={!!g} onOpenChange={(o) => { if (!o) onClose() }}>
      <DialogContent size="sm">
        <DialogHeader>
          <DialogTitle>Delete {g?.name}?</DialogTitle>
          <DialogDescription>
            {g && g.members.length
              ? `${plural(g.members.length, "member")} will lose the roles this group gives them, from their next request. They stay as users.`
              : "Nobody is in this group."}
          </DialogDescription>
        </DialogHeader>
        {g && (g.assignments.length > 0 || blocked) && (
          <DialogBody className="gap-3">
            {g.assignments.length > 0 && (
              <div className="flex flex-col gap-1.5 rounded-lg bg-surface-neutral-subtle p-3">
                <span className="text-label-sm text-content-neutral-muted">Roles they lose</span>
                <div className="flex flex-wrap gap-1">{g.assignments.map((x) => <RoleBadge key={x.id} x={x} />)}</div>
              </div>
            )}
            {blocked && <Alert variant="destructive"><AlertDescription>This group holds the only Tenant Admins. Give Tenant Admin to someone else first.</AlertDescription></Alert>}
          </DialogBody>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button variant="destructive" disabled={blocked} onClick={() => { access.deleteGroup(g!.id); toast({ title: `${g!.name} was deleted.`, description: "Recorded in the audit log." }); onDeleted() }}>Delete group</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
