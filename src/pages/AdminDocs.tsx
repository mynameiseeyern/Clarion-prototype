import { ShieldCheck, UserCog, Crown, ReceiptText, KeyRound, Network, Users, Boxes, Check, AlertTriangle, type LucideIcon } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

// Internal documentation for the Administration domain — RBAC, Groups, billing.
// Mirrors the Fleet "Product development" docs, but scoped to admin concepts.
// See ADMIN-TICKETS.md for the source decisions.

function DocHeader({ title, blurb }: { title: string; blurb: string }) {
  return (
    <Card className="w-full rounded-xl p-5">
      <div className="flex items-center gap-2">
        <Badge variant="info" className="uppercase tracking-wide">Internal</Badge>
        <span className="text-xs" style={{ color: "var(--fg-neutral-muted)" }}>Product development · Administration · not shipped in the built product</span>
      </div>
      <h2 className="mt-3 text-heading-sm" style={{ color: "var(--fg-neutral-emphasis)" }}>{title}</h2>
      <p className="mt-1 text-body-sm" style={{ color: "var(--fg-neutral-muted)" }}>{blurb}</p>

      <div
        className="mt-4 flex items-start gap-2 rounded-lg p-3"
        style={{ background: "var(--bg-warning-subtle)", border: "1px solid var(--border-warning-muted)", color: "var(--fg-on-warning-subtle)" }}
      >
        <AlertTriangle className="mt-0.5 size-4 shrink-0" />
        <p className="text-sm">
          <strong>Working draft.</strong> Everything in Product development is exploratory and not finalised —
          roles, permissions, and flows here are for discussion and may change.
        </p>
      </div>
    </Card>
  )
}

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card className="w-full gap-0 overflow-hidden rounded-xl p-0">
      <div className="px-5 py-3 text-xs font-semibold uppercase tracking-wide" style={{ borderBottom: "1px solid var(--border-neutral-subtle)", color: "var(--fg-neutral-subtle)" }}>
        {title}
      </div>
      <div className="p-5">{children}</div>
    </Card>
  )
}

function ConceptRow({ icon: Icon, title, children }: { icon: LucideIcon; title: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3">
      <span className="flex size-9 shrink-0 items-center justify-center rounded-lg" style={{ background: "var(--bg-neutral-subtle)", color: "var(--fg-neutral-muted)" }}><Icon className="size-4" /></span>
      <div className="flex min-w-px flex-1 flex-col">
        <span className="text-sm font-semibold" style={{ color: "var(--fg-neutral-emphasis)" }}>{title}</span>
        <span className="text-sm" style={{ color: "var(--fg-neutral-muted)" }}>{children}</span>
      </div>
    </div>
  )
}

const em = (t: string) => <strong style={{ color: "var(--fg-neutral-emphasis)" }}>{t}</strong>

const phaseVariant = { MVP: "success", "1.0": "info", Later: "secondary" } as const

const tag = (label: string, phase: "MVP" | "1.0" | "Later") => (
  <Badge variant={phaseVariant[phase]} className="ml-2 uppercase tracking-wide">{label}</Badge>
)

/* ------------------------------------------------------ Permissions matrix -- */

type Access = "full" | "scoped" | "view" | "none"

const roleCols: { name: string; phase: "MVP" | "Later" }[] = [
  { name: "Owner", phase: "Later" },
  { name: "Admin", phase: "MVP" },
  { name: "CC Manager", phase: "MVP" },
  { name: "Billing admin", phase: "Later" },
]

// Order matches roleCols: [Owner, Admin, CC Manager, Billing admin]
const matrix: { domain: string; rows: { cap: string; access: [Access, Access, Access, Access] }[] }[] = [
  { domain: "Members", rows: [
    { cap: "View members & roles", access: ["full", "full", "none", "none"] },
    { cap: "Invite & deactivate members", access: ["full", "full", "none", "none"] },
    { cap: "Assign & change roles", access: ["full", "full", "none", "none"] },
    { cap: "Manage Admins & transfer ownership", access: ["full", "none", "none", "none"] },
  ] },
  { domain: "Groups", rows: [
    { cap: "View Group hierarchy", access: ["full", "full", "scoped", "none"] },
    { cap: "Create & edit Groups", access: ["full", "full", "none", "none"] },
    { cap: "Assign Managers & Widgets to Groups", access: ["full", "full", "none", "none"] },
  ] },
  { domain: "Device management", rows: [
    { cap: "View estate (status, last-seen)", access: ["full", "full", "scoped", "none"] },
    { cap: "Register, move & revoke Widgets / tokens", access: ["full", "full", "none", "none"] },
  ] },
  { domain: "Monitoring", rows: [
    { cap: "Monitor devices & issues", access: ["full", "full", "scoped", "none"] },
  ] },
  { domain: "Subscription & billing", rows: [
    { cap: "View plan, usage & invoices", access: ["full", "full", "none", "full"] },
    { cap: "Change plan, add-ons & payment", access: ["full", "view", "none", "full"] },
  ] },
  { domain: "Audit log", rows: [
    { cap: "View audit log", access: ["full", "full", "none", "none"] },
  ] },
]

function Cell({ access }: { access: Access }) {
  if (access === "full") return <Check className="mx-auto size-4" style={{ color: "var(--fg-success-emphasis)" }} aria-label="Full" />
  if (access === "scoped") return <span className="text-xs font-medium" style={{ color: "var(--fg-warning-emphasis)" }}>Scoped</span>
  if (access === "view") return <span className="text-xs font-medium" style={{ color: "var(--fg-neutral-muted)" }}>View</span>
  return <span style={{ color: "var(--fg-neutral-subtle)" }} aria-label="No access">–</span>
}

function PermissionsMatrix() {
  return (
    <SectionCard title="Permissions matrix">
      <p className="mb-4 text-sm" style={{ color: "var(--fg-neutral-muted)" }}>
        A strawman of who can do what. {em("Admin")} and {em("CC Manager")} are the MVP roles; {em("Owner")} and {em("Billing admin")} are planned. CC Manager access is {em("scoped")} to their assigned Group(s) and everything beneath.
      </p>
      <div className="overflow-x-auto" style={{ border: "1px solid var(--border-neutral-subtle)", borderRadius: "10px" }}>
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr style={{ background: "var(--bg-neutral-subtle)", borderBottom: "1px solid var(--border-neutral-muted)" }}>
              <th className="px-4 py-2.5 text-left text-xs font-medium" style={{ color: "var(--fg-neutral-muted)" }}>Capability</th>
              {roleCols.map((r) => (
                <th key={r.name} className="px-3 py-2.5 text-center">
                  <div className="flex flex-col items-center gap-1">
                    <span className="text-xs font-semibold" style={{ color: "var(--fg-neutral-emphasis)" }}>{r.name}</span>
                    <Badge variant={r.phase === "MVP" ? "success" : "secondary"} className="uppercase tracking-wide">{r.phase}</Badge>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          {matrix.map((group) => (
            <tbody key={group.domain}>
              <tr style={{ background: "var(--bg-neutral-subtle)" }}>
                <td colSpan={5} className="px-4 py-1.5 text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--fg-neutral-subtle)" }}>{group.domain}</td>
              </tr>
              {group.rows.map((row) => (
                <tr key={row.cap} style={{ borderBottom: "1px solid var(--border-neutral-subtle)" }}>
                  <td className="px-4 py-2.5" style={{ color: "var(--fg-neutral-emphasis)" }}>{row.cap}</td>
                  {row.access.map((a, i) => (
                    <td key={i} className="px-3 py-2.5 text-center">
                      <Cell access={a} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          ))}
        </table>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs" style={{ color: "var(--fg-neutral-muted)" }}>
        <span className="inline-flex items-center gap-1.5"><Check className="size-3.5" style={{ color: "var(--fg-success-emphasis)" }} /> Full</span>
        <span className="inline-flex items-center gap-1.5"><b style={{ color: "var(--fg-warning-emphasis)" }}>Scoped</b> within their Groups</span>
        <span className="inline-flex items-center gap-1.5"><b style={{ color: "var(--fg-neutral-muted)" }}>View</b> read-only</span>
        <span className="inline-flex items-center gap-1.5"><span style={{ color: "var(--fg-neutral-subtle)" }}>–</span> No access</span>
      </div>
    </SectionCard>
  )
}

/* ------------------------------------------------------------------ RBAC -- */

export function RbacDocPage() {
  return (
    <div className="flex flex-col gap-4">
      <DocHeader
        title="Roles & permissions (RBAC)"
        blurb="Who can do what in Clarity. Role sets the permission level; Group assignment sets the scope. Two roles for MVP, with Owner and a billing-scoped role planned for later."
      />

      <SectionCard title="Roles">
        <div className="flex flex-col gap-4">
          <ConceptRow icon={ShieldCheck} title={<>Admin <span>{tag("MVP", "MVP")}</span></>}>
            Full administrative control across the whole org: manage Members &amp; roles, Groups, Device management (Widgets), subscription, and read the audit log. Sees the entire estate.
          </ConceptRow>
          <ConceptRow icon={UserCog} title={<>CC Manager (Supervisor) <span>{tag("MVP", "MVP")}</span></>}>
            Operational role scoped to assigned Group(s). Sees and acts on the Widgets/Issues in their Groups only — a subset of the org. No access to the Administration area.
          </ConceptRow>
          <ConceptRow icon={Crown} title={<>Owner / Super Admin <span>{tag("Later", "Later")}</span></>}>
            Billing/ownership root: manages Admins, owns the subscription, can transfer ownership. Nearly every SaaS has exactly one (Slack Primary Owner, Atlassian Org admin). Planned, not in MVP.
          </ConceptRow>
          <ConceptRow icon={ReceiptText} title={<>Billing admin (Finance) <span>{tag("Later", "Later")}</span></>}>
            A billing-scoped role that sees Subscription &amp; billing only — no Device management. Models GitHub&apos;s &ldquo;Billing manager&rdquo; / Google&apos;s &ldquo;Billing admin&rdquo;. Lets Finance manage spend without operational access.
          </ConceptRow>
        </div>
      </SectionCard>

      <SectionCard title="How access is decided">
        <div className="flex flex-col gap-3 text-sm" style={{ color: "var(--fg-neutral-muted)" }}>
          <p>{em("Role = permission level")}; {em("scope = position in the Group tree")}. A CC Manager&apos;s reach is the union of their Groups (and everything beneath them — see Groups &amp; hierarchy).</p>
          <p>Gating is {em("per capability")}, not one all-or-nothing admin flag. That&apos;s what lets Owner and Billing admin layer on later without restructuring: each nav item checks the specific capability it needs.</p>
          <p>Guardrails: at least one Admin must always exist (can&apos;t deactivate or demote the last Admin). The audit log is read-only — no one can edit or delete entries.</p>
        </div>
      </SectionCard>

      <PermissionsMatrix />

      <SectionCard title="Authentication">
        <div className="flex flex-col gap-3">
          <ConceptRow icon={KeyRound} title={<>Email / password + admin reset <span>{tag("MVP", "MVP")}</span></>}>
            Members sign in with email and password. Admins can trigger a reset on a Member&apos;s behalf from the Members list (no IR ticket needed).
          </ConceptRow>
          <ConceptRow icon={ShieldCheck} title={<>SSO <span>{tag("1.0", "1.0")}</span></>}>
            Single sign-on via the customer&apos;s identity provider, offered as an add-on. When enabled, &ldquo;reset&rdquo; is handled by the IdP rather than in-app.
          </ConceptRow>
        </div>
      </SectionCard>
    </div>
  )
}

/* ---------------------------------------------------------------- Groups -- */

export function GroupsDocPage() {
  return (
    <div className="flex flex-col gap-4">
      <DocHeader
        title="Groups & hierarchy"
        blurb="Groups organise Widgets to mirror your team structure and scope what each Manager sees. Visibility cascades down the tree; depth is flexible."
      />

      <SectionCard title="The hierarchy">
        <div className="flex flex-col gap-4">
          <ConceptRow icon={Network} title="A Group tree, mirroring the org">
            Groups nest to match how the business is organised. A real example is four levels deep:
            <span className="mt-2 block rounded-lg p-3 font-mono text-xs leading-6" style={{ background: "var(--bg-neutral-subtle)", color: "var(--fg-neutral-muted)" }}>
              Australia — Head of Country<br />
              &nbsp;&nbsp;→ Sydney — Area Manager<br />
              &nbsp;&nbsp;&nbsp;&nbsp;→ Chatswood office — Supervisor<br />
              &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;→ Shift 1 — Team Lead<br />
              &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;→ Shift 2 — Team Lead
            </span>
            <span className="mt-2 block">Depth is {em("flexible")} — design for arbitrary nesting, not a fixed cap.</span>
          </ConceptRow>
          <ConceptRow icon={Users} title="Titles are positions, not roles">
            Head of Country, Area Manager, Supervisor and Team Lead are all the same role — {em("CC Manager")}. What differs is where they sit, which sets how much they see.
          </ConceptRow>
        </div>
      </SectionCard>

      <SectionCard title="Cascading visibility">
        <div className="flex flex-col gap-3 text-sm" style={{ color: "var(--fg-neutral-muted)" }}>
          <p>A Manager assigned to a Group sees that Group {em("and every Group beneath it")}. Head of Country sees all of Australia; a Team Lead on Shift 1 sees only that shift.</p>
          <p>Changing a Manager&apos;s Group assignment updates their visible estate immediately — without touching individual Widget records.</p>
        </div>
      </SectionCard>

      <SectionCard title="Assigning Widgets">
        <div className="flex flex-col gap-3">
          <ConceptRow icon={Boxes} title={<>Bulk-assign unassigned Widgets <span>{tag("MVP", "MVP")}</span></>}>
            New Widgets arrive unassigned. Multi-select them and place them in the right Group so they become visible to the right Manager(s) immediately.
          </ConceptRow>
          <ConceptRow icon={Network} title={<>Bulk-move between Groups <span>{tag("MVP", "MVP")}</span></>}>
            Restructuring a team? Move Widgets between Groups in bulk to keep the hierarchy aligned with the business.
          </ConceptRow>
        </div>
      </SectionCard>
    </div>
  )
}

/* --------------------------------------------------------------- Billing -- */

export function BillingDocPage() {
  return (
    <div className="flex flex-col gap-4">
      <DocHeader
        title="Subscription & billing"
        blurb="Plan entitlements, seat usage, overage and payment. Only the plan breakdown is in scope for trial/MVP; plan changes, add-ons, invoices and payment arrive for 1.0."
      />

      <SectionCard title="What's in scope when">
        <div className="flex flex-col gap-3">
          <ConceptRow icon={ReceiptText} title={<>Current tier breakdown <span>{tag("MVP", "MVP")}</span></>}>
            A clear, read-only view of the current plan: included entitlements (seats, Widget capacity, features) and what&apos;s not included. The one billing surface genuinely useful during trial.
          </ConceptRow>
          <ConceptRow icon={Users} title={<>Seat usage & warnings <span>{tag("1.0", "1.0")}</span></>}>
            A usage meter (seats used / included) with an in-app warning before the cap (e.g. ≥80%), so an upgrade can be planned rather than triggering surprise overage. Email warnings are 1.0.
          </ConceptRow>
          <ConceptRow icon={Boxes} title={<>Upgrade & add-ons (e.g. SSO) <span>{tag("1.0", "1.0")}</span></>}>
            Change plan, add seats, and opt into add-ons like SSO without a new contract. Entry points show as &ldquo;coming soon&rdquo; in MVP.
          </ConceptRow>
        </div>
      </SectionCard>

      <SectionCard title="Billing & payment">
        <div className="flex flex-col gap-3">
          <ConceptRow icon={ReceiptText} title={<>Invoices & overage <span>{tag("1.0", "1.0")}</span></>}>
            Peak seat usage and any overage for the period, plus a history of past invoices and charges to reconcile and share with Finance.
          </ConceptRow>
          <ConceptRow icon={KeyRound} title={<>Payment method & failures <span>{tag("1.0", "1.0")}</span></>}>
            Update card / billing details, and clear in-app + email warnings on a failed payment with a grace period before the team loses access. Not collected during MVP.
          </ConceptRow>
        </div>
      </SectionCard>
    </div>
  )
}
