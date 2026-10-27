import { Check, Eye, MapPin, X } from "lucide-react"
import {
  Alert, AlertDescription, AlertTitle, Badge, Card, CardHeader, CardHeaderText, CardTitle, CardDescription,
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow, Tabs, TabsContent, TabsList, TabsTrigger,
} from "@ir/ui"
import { access, roles, type RoleDef } from "@/data/access"
import { useAccess } from "@/components/admin/access/AccessBits"

/**
 * Roles (Iris platform, Client Admin) — read-only. IR owns a fixed catalogue; tenants
 * can't create roles. Shows what each role means here and in Clarion, and who has it.
 */
export function RolesPage() {
  useAccess()
  const holders = (r: RoleDef) => {
    const groups = access.groups().filter((g) => g.assignments.some((x) => x.role === r.id)).length
    const direct = access.people().filter((p) => p.direct.some((x) => x.role === r.id)).length
    return [groups && `${groups} ${groups === 1 ? "group" : "groups"}`, direct && `${direct} direct`].filter(Boolean).join(" · ") || "Nobody"
  }

  return (
    <Tabs defaultValue="overview" className="flex flex-col gap-4">
      <TabsList>
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="details">Permission details</TabsTrigger>
      </TabsList>
      <TabsContent value="overview" className="flex flex-col gap-4">
      <Alert variant="info">
        <AlertTitle>IR maintains these roles</AlertTitle>
        <AlertDescription>You can&apos;t create or edit roles. Give them to groups, and limit Clarion roles to locations where you need to.</AlertDescription>
      </Alert>

      <RoleTable
        title="Whole tenant"
        description="Cover everything in your Iris tenant. They can't be limited to a location."
        rows={roles.filter((r) => r.level === "tenant")}
        holders={holders}
      />
      <RoleTable
        title="Clarion"
        description="Cover Clarion only. Each can be given for all locations or limited to some."
        rows={roles.filter((r) => r.level === "product")}
        holders={holders}
        product
      />

      <Card className="w-full overflow-hidden">
        <CardHeader className="pb-4">
          <CardHeaderText>
            <CardTitle>What each role sees in Clarion</CardTitle>
            <CardDescription>Proposed mapping, to agree with the Clarion team.</CardDescription>
          </CardHeaderText>
        </CardHeader>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead align="start">Can</TableHead>
              {["Viewer", "Editor", "Product Admin", "Tenant Admin"].map((h) => <TableHead key={h} align="center">{h}</TableHead>)}
            </TableRow>
          </TableHeader>
          <TableBody>
            {matrix.map(([cap, ...cells]) => (
              <TableRow key={cap as string}>
                <TableCell>{cap}</TableCell>
                {cells.map((c, i) => <TableCell key={i} align="center"><Mark v={c as Cell} /></TableCell>)}
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <p className="border-t border-line-neutral-muted px-6 py-3 text-body-sm text-content-neutral-muted">
          Limited to locations, a role only covers widget users and endpoints in those locations — in lists, search, the map, drill-downs and exports.
        </p>
      </Card>
      </TabsContent>
      <TabsContent value="details"><PermissionDetails /></TabsContent>
    </Tabs>
  )
}

// ------------------------------------------------------- permission details --
// Vanta-style: every permission against every role, in words rather than ticks.

type P = "full" | "loc" | "view" | "none"
const roleCols = ["Tenant Admin", "User Admin", "Auditor", "Product Admin", "Editor", "Viewer"]
const details: { area: string; rows: [string, P, P, P, P, P, P][] }[] = [
  { area: "Clarion", rows: [
    ["Overview and Endpoints", "full", "none", "none", "loc", "loc", "loc"],
    ["Search and export endpoints", "full", "none", "none", "loc", "loc", "loc"],
    ["Thresholds", "full", "none", "none", "full", "none", "none"],
    ["Add, edit and remove widget users", "full", "none", "none", "loc", "none", "none"],
    ["Set a widget user's location", "full", "none", "none", "loc", "none", "none"],
  ] },
  { area: "Users and groups", rows: [
    ["See users, groups and roles", "full", "full", "view", "none", "none", "none"],
    ["Invite and deactivate users", "full", "full", "none", "none", "none", "none"],
    ["Create groups and change members", "full", "full", "none", "none", "none", "none"],
    ["Give roles (up to their own)", "full", "full", "none", "none", "none", "none"],
  ] },
  { area: "Locations", rows: [
    ["See locations", "full", "view", "view", "none", "none", "none"],
    ["Create, rename and delete locations", "full", "none", "none", "none", "none", "none"],
  ] },
  { area: "Sign-in", rows: [
    ["SSO, SCIM and break-glass settings", "full", "none", "view", "none", "none", "none"],
  ] },
  { area: "Audit", rows: [
    ["Audit log", "full", "none", "view", "none", "none", "none"],
    ["Export who has access", "full", "none", "full", "none", "none", "none"],
  ] },
]

function Perm({ v }: { v: P }) {
  if (v === "full") return <span className="inline-flex items-center gap-1 text-body-sm text-content-success-emphasis"><Check className="size-4" aria-hidden /> Full</span>
  if (v === "loc") return <span className="inline-flex items-center gap-1 text-body-sm text-content-neutral-emphasis"><MapPin className="size-4" aria-hidden /> Their locations</span>
  if (v === "view") return <span className="inline-flex items-center gap-1 text-body-sm text-content-neutral-muted"><Eye className="size-4" aria-hidden /> View only</span>
  return <span className="inline-flex items-center gap-1 text-body-sm text-content-neutral-subtle"><X className="size-4" aria-hidden /> No access</span>
}

function PermissionDetails() {
  return (
    <Card className="w-full overflow-hidden">
      <CardHeader className="pb-4">
        <CardHeaderText>
          <CardTitle>Permission details</CardTitle>
          <CardDescription>What each role can do. &ldquo;Their locations&rdquo; means everywhere, unless the role is limited to some locations.</CardDescription>
        </CardHeaderText>
      </CardHeader>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead align="start" className="min-w-56">Permission</TableHead>
              {roleCols.map((r, i) => (
                <TableHead key={r} align="start" className={i === 3 ? "border-s border-line-neutral-muted" : undefined}>
                  <div className="flex flex-col"><span>{r}</span><span className="text-body-xs font-normal text-content-neutral-muted">{i < 3 ? "Whole tenant" : "Clarion"}</span></div>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {details.map((d) => [
              <TableRow key={d.area} className="bg-surface-neutral-subtle hover:bg-surface-neutral-subtle">
                <TableCell colSpan={7} className="text-label-sm text-content-neutral-muted">{d.area}</TableCell>
              </TableRow>,
              ...d.rows.map(([cap, ...cells]) => (
                <TableRow key={d.area + cap}>
                  <TableCell className="text-content-neutral-emphasis">{cap}</TableCell>
                  {cells.map((c, i) => <TableCell key={i} className={i === 3 ? "border-s border-line-neutral-muted" : undefined}><Perm v={c as P} /></TableCell>)}
                </TableRow>
              )),
            ])}
          </TableBody>
        </Table>
      </div>
    </Card>
  )
}

type Cell = "yes" | "loc" | "no"
const matrix: [string, Cell, Cell, Cell, Cell][] = [
  ["See Overview and Endpoints", "loc", "loc", "loc", "yes"],
  ["Change Thresholds", "no", "no", "yes", "yes"],
  ["Add, edit and remove widget users", "no", "no", "loc", "yes"],
  ["Set a widget user's location", "no", "no", "loc", "yes"],
  ["Manage users, groups and locations", "no", "no", "no", "yes"],
]

function Mark({ v }: { v: Cell }) {
  if (v === "yes") return <Check className="mx-auto size-4 text-content-success-emphasis" aria-label="Yes" />
  if (v === "loc") return <span className="text-label-sm text-content-neutral-emphasis">In their locations</span>
  return <X className="mx-auto size-4 text-content-neutral-subtle" aria-label="No" />
}

function RoleTable({ title, description, rows, holders, product }: { title: string; description: string; rows: RoleDef[]; holders: (r: RoleDef) => string; product?: boolean }) {
  return (
    <Card className="w-full overflow-hidden">
      <CardHeader className="pb-4">
        <CardHeaderText><CardTitle>{title}</CardTitle><CardDescription>{description}</CardDescription></CardHeaderText>
      </CardHeader>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead align="start" className="w-44">Role</TableHead>
            <TableHead align="start">What it allows</TableHead>
            <TableHead align="start">{product ? "In Clarion" : "Clarion data"}</TableHead>
            <TableHead align="start" className="w-40">Given to</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((r) => (
            <TableRow key={r.id}>
              <TableCell className="align-top text-label-md text-content-neutral-emphasis">{r.name}</TableCell>
              <TableCell className="align-top whitespace-normal text-body-sm text-content-neutral-muted">{r.summary}</TableCell>
              <TableCell className="align-top whitespace-normal text-body-sm">
                {r.clarion}
                {r.open && <div className="mt-1"><Badge color="warning">To decide</Badge> <span className="text-body-xs text-content-neutral-muted">{r.open}</span></div>}
              </TableCell>
              <TableCell className="align-top text-body-sm text-content-neutral-muted">{holders(r)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  )
}
