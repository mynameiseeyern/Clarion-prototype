import { useState } from "react"
import { MapPin, MoreHorizontal, Pencil, Plus, ShieldCheck, Trash2 } from "lucide-react"
import {
  Alert, AlertDescription, AlertTitle, Badge, Button, Card, CardAction, CardHeader, CardHeaderText, CardTitle,
  Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
  EmptyState, Field, FieldControl, FieldDescription, FieldError, FieldLabel, Input,
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow, Textarea,
} from "@ir/ui"
import { toast } from "@/components/ui/toast"
import { access, unassignedWidgetUsers, whoSees, widgetUsersIn, type Location } from "@/data/access"
import { RoleBadge, fmt, plural, useAccess } from "@/components/admin/access/AccessBits"
import { GiveAccessDialog } from "@/components/admin/access/GiveAccessDialog"

/**
 * Locations (Iris platform, Client Admin). Flat, named by the customer, shared by every
 * Iris product. In Clarion each widget user — and so their endpoints — sits in at most
 * one location. A product role limited to locations only sees what's in them.
 */
export function LocationsPage({ onOpenWidgetUsers }: { onOpenWidgetUsers?: () => void }) {
  useAccess()
  const [editing, setEditing] = useState<Location | "new" | null>(null)
  const [deleting, setDeleting] = useState<Location | null>(null)
  const [giveFor, setGiveFor] = useState<string | null>(null)
  const locs = access.locations()
  const unassigned = unassignedWidgetUsers()

  return (
    <div className="flex flex-col gap-4">
      {unassigned > 0 && (
        <Alert variant="warning" action={onOpenWidgetUsers && <Button variant="outline" size="xs" onClick={onOpenWidgetUsers}>Set locations</Button>}>
          <AlertTitle>{plural(unassigned, "widget user has", "widget users have")} no location</AlertTitle>
          <AlertDescription>Only people with Clarion access to all locations see them. Set their location in Widget users.</AlertDescription>
        </Alert>
      )}

      <Card className="w-full overflow-hidden">
        <CardHeader className="pb-4">
          <CardHeaderText>
            <div className="flex items-center gap-2"><CardTitle>Locations</CardTitle><Badge>{fmt(locs.length)}</Badge></div>
          </CardHeaderText>
          <CardAction><Button size="sm" onClick={() => setEditing("new")}><Plus aria-hidden /> Add location</Button></CardAction>
        </CardHeader>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead align="start">Location</TableHead>
              <TableHead align="start">Clarion widget users</TableHead>
              <TableHead align="start">Limited to this location</TableHead>
              <TableHead className="w-12"><span className="sr-only">Actions</span></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {locs.map((l) => {
              const who = whoSees(l.id)
              return (
                <TableRow key={l.id}>
                  <TableCell className="max-w-64">
                    <div className="flex min-w-0 flex-col">
                      <span className="truncate text-label-md text-content-neutral-emphasis">{l.name}</span>
                      {l.description && <span className="truncate text-body-xs text-content-neutral-muted">{l.description}</span>}
                    </div>
                  </TableCell>
                  <TableCell className="tabular-nums">{fmt(widgetUsersIn(l.id))}</TableCell>
                  <TableCell className="max-w-96">
                    {who.groups.length + who.people.length ? (
                      <div className="flex flex-wrap items-center gap-1">
                        {who.groups.map((g) => <Badge key={g.id} variant="outline">{g.name}</Badge>)}
                        {who.people.length > 0 && <Badge color="warning">{plural(who.people.length, "person", "people")} directly</Badge>}
                      </div>
                    ) : <span className="text-content-neutral-subtle">Nobody yet</span>}
                    <Button variant="link" size="xs" className="mt-1 px-0" onClick={() => setGiveFor(l.id)}>Give someone access</Button>
                  </TableCell>
                  <TableCell className="pe-3">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild><Button variant="ghost" size="icon-sm" aria-label={`Actions for ${l.name}`}><MoreHorizontal aria-hidden /></Button></DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onSelect={() => setGiveFor(l.id)}><ShieldCheck aria-hidden /> Give access to {l.name}</DropdownMenuItem>
                        <DropdownMenuItem onSelect={() => setEditing(l)}><Pencil aria-hidden /> Rename</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem variant="destructive" onSelect={() => setDeleting(l)}><Trash2 aria-hidden /> Delete…</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              )
            })}
            {!locs.length && (
              <TableRow className="hover:bg-transparent"><TableCell colSpan={4}>
                <EmptyState size="sm" icon={<MapPin />} title="No locations yet" description="Add the sites, offices or regions you want to limit access by." />
              </TableCell></TableRow>
            )}
          </TableBody>
        </Table>
        <p className="border-t border-line-neutral-muted px-6 py-3 text-body-sm text-content-neutral-muted">
          People with a Clarion role for all locations, and Tenant Admins, see every location without being listed here.
        </p>
      </Card>

      <LocationDialog value={editing} onClose={() => setEditing(null)} />
      <DeleteLocationDialog loc={deleting} onClose={() => setDeleting(null)} />
      <GiveAccessDialog open={giveFor !== null} onOpenChange={(o) => { if (!o) setGiveFor(null) }} locations={giveFor ? [giveFor] : []} />
    </div>
  )
}

function LocationDialog({ value, onClose }: { value: Location | "new" | null; onClose: () => void }) {
  const isNew = value === "new"
  const l = value && value !== "new" ? value : null
  const [name, setName] = useState("")
  const [desc, setDesc] = useState("")
  const [tried, setTried] = useState(false)
  const [lastKey, setLastKey] = useState<string | null>(null)
  const key = value === null ? null : isNew ? "new" : l!.id
  if (key !== lastKey) { setLastKey(key); setName(l?.name ?? ""); setDesc(l?.description ?? ""); setTried(false) }
  const clash = access.locations().some((x) => x.id !== l?.id && x.name.trim().toLowerCase() === name.trim().toLowerCase())
  const err = tried && !name.trim() ? "Give the location a name." : clash ? "Another location already has this name." : null
  const save = () => {
    setTried(true)
    if (!name.trim() || clash) return
    if (isNew) { access.createLocation({ name, description: desc }); toast({ title: `${name.trim()} was added.`, description: "Put widget users in it from Widget users." }) }
    else { access.updateLocation(l!.id, { name: name.trim(), description: desc.trim() }); toast({ title: "Location updated." }) }
    onClose()
  }
  return (
    <Dialog open={value !== null} onOpenChange={(o) => { if (!o) onClose() }}>
      <DialogContent size="sm">
        <DialogHeader>
          <DialogTitle>{isNew ? "Add location" : `Rename ${l?.name}`}</DialogTitle>
          {isNew && <DialogDescription>Used by every Iris product in your tenant.</DialogDescription>}
        </DialogHeader>
        <DialogBody className="gap-4">
          <Field invalid={!!err}>
            <FieldLabel required>Name</FieldLabel>
            <FieldControl required><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Sydney" autoFocus /></FieldControl>
            <FieldError>{err}</FieldError>
            <FieldDescription>A site, office or region. Locations can&apos;t contain other locations.</FieldDescription>
          </Field>
          <Field>
            <FieldLabel>Description</FieldLabel>
            <FieldControl><Textarea value={desc} onChange={(e) => setDesc(e.target.value)} rows={2} /></FieldControl>
          </Field>
        </DialogBody>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={save}>{isNew ? "Add location" : "Save"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function DeleteLocationDialog({ loc, onClose }: { loc: Location | null; onClose: () => void }) {
  const n = loc ? widgetUsersIn(loc.id) : 0
  const who = loc ? whoSees(loc.id) : { groups: [], people: [] }
  const assignments = loc
    ? [...who.groups.flatMap((g) => g.assignments.filter((x) => x.locations.includes(loc.id)).map((x) => ({ x, by: g.name }))),
       ...who.people.flatMap((p) => p.direct.filter((x) => x.locations.includes(loc.id)).map((x) => ({ x, by: p.name })))]
    : []
  return (
    <Dialog open={!!loc} onOpenChange={(o) => { if (!o) onClose() }}>
      <DialogContent size="md">
        <DialogHeader>
          <DialogTitle>Delete {loc?.name}?</DialogTitle>
          <DialogDescription>
            {n ? `${plural(n, "widget user")} will have no location, so only people with access to all locations will see them.` : "No widget users are in this location."}
          </DialogDescription>
        </DialogHeader>
        {assignments.length > 0 && (
          <DialogBody>
            <div className="flex flex-col gap-2 rounded-lg bg-surface-neutral-subtle p-3">
              <span className="text-label-sm text-content-neutral-muted">Roles limited to {loc?.name} lose it. A role limited only to {loc?.name} is removed.</span>
              {assignments.map(({ x, by }) => (
                <div key={x.id + by} className="flex flex-wrap items-center gap-2 text-body-sm">
                  <span className="text-content-neutral-emphasis">{by}</span><RoleBadge x={x} />
                  {x.locations.length === 1 && <Badge color="danger">Removed</Badge>}
                </div>
              ))}
            </div>
          </DialogBody>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button variant="destructive" onClick={() => { access.deleteLocation(loc!.id); toast({ title: `${loc!.name} was deleted.`, description: "Recorded in the audit log." }); onClose() }}>Delete location</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
