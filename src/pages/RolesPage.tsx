import { Check, X } from "lucide-react"
import {
  Alert, AlertDescription, AlertTitle, Badge, Card, CardHeader, CardHeaderText, CardTitle, CardDescription,
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
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
    <div className="flex flex-col gap-4">
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
    </div>
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
