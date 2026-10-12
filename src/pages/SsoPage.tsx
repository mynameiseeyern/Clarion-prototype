import { useState, type ReactNode } from "react"
import { KeyRound, ShieldCheck, Users, LogIn, CircleAlert, Send, Check, X, CheckCircle2 } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { toast } from "@/components/ui/toast"
import { users, roleLabel } from "@/data/users"
import { providers, providerById, tenantDomain, setupSteps, recentSignIns, connectMethodLabel } from "@/data/sso"
import { SsoWizard, emptyDraft, type SsoDraft, type SsoMode } from "@/components/admin/sso/SsoWizard"
import { Callout, DetailList } from "@/components/admin/sso/parts"

type View = "overview" | "setup" | "active"

// Kept at module level so the prototype remembers SSO state while you move
// between Administration pages (the page component unmounts on navigation).
let memory: { view: View; draft: SsoDraft | null; live: SsoDraft | null } = { view: "overview", draft: null, live: null }

export function SsoPage() {
  const [view, setViewState] = useState<View>(memory.view)
  const [draft, setDraftState] = useState<SsoDraft | null>(memory.draft)
  const [live, setLiveState] = useState<SsoDraft | null>(memory.live)

  const save = (next: Partial<typeof memory>) => {
    memory = { ...memory, ...next }
    if (next.view !== undefined) setViewState(next.view)
    if ("draft" in next) setDraftState(next.draft ?? null)
    if ("live" in next) setLiveState(next.live ?? null)
  }

  const start = (from: SsoDraft = draft ?? emptyDraft) => save({ view: "setup", draft: from })

  if (view === "setup") {
    return (
      <SsoWizard
        initial={draft ?? emptyDraft}
        onExit={(d) => {
          // An untouched wizard isn't worth resuming.
          const touched = d.domainVerified || d.providerId !== null
          save({ view: live ? "active" : "overview", draft: touched ? d : null })
          if (touched) toast({ title: "Setup saved", description: `Paused at "${setupSteps[Math.min(d.step, setupSteps.length - 1)]}".`, variant: "info" })
        }}
        onComplete={(d) => {
          save({ view: "active", live: d, draft: null })
          toast({
            title: `SSO is on (${d.mode})`,
            description: d.mode === "required" ? `Members at ${tenantDomain} now sign in with ${providerById(d.providerId!).short}.` : "Members can choose SSO or their password.",
            variant: "success",
          })
        }}
      />
    )
  }

  if (view === "active" && live) {
    return (
      <ActiveView
        live={live}
        onMode={(mode) => {
          save({ live: { ...live, mode } })
          toast({ title: mode === "required" ? "SSO is now required" : "SSO is now optional", variant: "success" })
        }}
        onEdit={() => start({ ...live, step: 3, connected: false, tested: false })}
        onTurnOff={() => {
          save({ view: "overview", live: null, draft: null })
          toast({ title: "SSO turned off", description: "Members sign in with their Clarion passwords. Anyone without one gets a reset email. (Stubbed)", variant: "danger" })
        }}
      />
    )
  }

  return <EmptyView draft={draft} onStart={() => start()} onStartOver={() => start(emptyDraft)} />
}

// ---- Not set up ----------------------------------------------------------------

function EmptyView({ draft, onStart, onStartOver }: { draft: SsoDraft | null; onStart: () => void; onStartOver: () => void }) {
  const sendLink = () => toast({ title: "Setup link sent", description: "Scoped to SSO setup only. Email stubbed in prototype.", variant: "success" })

  return (
    <div className="flex flex-col gap-4">
      {draft && (
        <Callout
          tone="info"
          title={`Setup paused at step ${Math.min(draft.step, setupSteps.length - 1) + 1}: ${setupSteps[Math.min(draft.step, setupSteps.length - 1)]}`}
          action={
            <div className="flex gap-2">
              <Button size="sm" variant="ghost" onClick={onStartOver}>Start over</Button>
              <Button size="sm" onClick={onStart}>Resume</Button>
            </div>
          }
        >
          {draft.providerId ? `Connecting ${providerById(draft.providerId).name}.` : "Provider not chosen yet."}
        </Callout>
      )}

      <Card className="w-full gap-0 overflow-hidden rounded-xl p-0">
        <div className="flex flex-col gap-5 p-5 sm:p-6">
          <div className="flex items-start gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-lg" style={{ background: "var(--bg-primary-subtle)", color: "var(--fg-primary-emphasis)" }}>
              <KeyRound className="size-5" />
            </span>
            <div className="flex flex-col gap-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-base font-medium" style={{ color: "var(--fg-neutral-emphasis)" }}>Single sign-on</h2>
                <Badge variant="secondary">Not set up</Badge>
              </div>
              <p className="max-w-[64ch] text-sm" style={{ color: "var(--fg-neutral-muted)" }}>
                Let Members sign in to Clarion with the company account they already use for work, instead of a separate Clarion password.
              </p>
            </div>
          </div>

          <ul className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {[
              ["One less password", "Members sign in the way they do every morning, with your company's MFA."],
              ["Access ends when they leave", "Turn someone off in your identity provider and they lose Clarion too."],
              ["Tested before it's live", "You run a test sign-in first, and Admins keep an emergency way in."],
            ].map(([t, b]) => (
              <li key={t} className="flex flex-col gap-1 rounded-lg p-3.5" style={{ background: "var(--bg-neutral-subtle)" }}>
                <span className="flex items-center gap-1.5 text-sm font-medium" style={{ color: "var(--fg-neutral-emphasis)" }}>
                  <Check className="size-4" style={{ color: "var(--fg-success-emphasis)" }} /> {t}
                </span>
                <span className="text-sm" style={{ color: "var(--fg-neutral-muted)" }}>{b}</span>
              </li>
            ))}
          </ul>

          <p className="text-xs" style={{ color: "var(--fg-neutral-muted)" }}>
            Works with {providers.filter((p) => !p.generic).map((p) => p.name).join(", ")}, and any SAML 2.0 or OIDC provider. Takes about 15 minutes with access to your identity provider.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 px-5 py-4 sm:px-6" style={{ borderTop: "1px solid var(--border-neutral-muted)" }}>
          {!draft && <Button onClick={onStart}><KeyRound /> Set up SSO</Button>}
          <Button variant="outline" onClick={sendLink}><Send /> Send setup link to your IT team</Button>
        </div>
      </Card>
    </div>
  )
}

// ---- Active --------------------------------------------------------------------

function Stat({ label, value, icon: Icon, tone }: { label: string; value: string | number; icon: typeof Users; tone?: "danger" }) {
  return (
    <Card className="flex-1 gap-0 rounded-xl p-4">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium" style={{ color: "var(--fg-neutral-emphasis)" }}>{label}</span>
        <Icon className="size-4" style={{ color: tone === "danger" ? "var(--fg-danger-emphasis)" : "var(--fg-neutral-subtle)" }} />
      </div>
      <span className="mt-2 font-mono text-2xl font-semibold" style={{ color: "var(--fg-neutral-emphasis)" }}>{value}</span>
    </Card>
  )
}

function ActiveView({
  live, onMode, onEdit, onTurnOff,
}: {
  live: SsoDraft
  onMode: (m: SsoMode) => void
  onEdit: () => void
  onTurnOff: () => void
}) {
  const [confirmOff, setConfirmOff] = useState(false)
  const [confirmRequired, setConfirmRequired] = useState(false)
  const p = providerById(live.providerId!)
  const onDomain = users.filter((u) => u.status !== "deactivated" && u.email.endsWith(`@${tenantDomain}`)).length
  const failed = recentSignIns.filter((s) => s.outcome === "failed").length
  const method = live.connectMethod === "oidc" ? "Issuer URL, client ID and secret" : connectMethodLabel[live.connectMethod ?? "url"]
  const autoRefresh = live.connectMethod === "url" || live.connectMethod === "oidc"

  return (
    <div className="flex flex-col gap-4">
      {/* Status */}
      <Card className="w-full gap-0 overflow-hidden rounded-xl p-0">
        <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-lg" style={{ background: "var(--bg-success-subtle)", color: "var(--fg-success-emphasis)" }}>
              <ShieldCheck className="size-5" />
            </span>
            <div className="flex flex-col gap-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-base font-medium" style={{ color: "var(--fg-neutral-emphasis)" }}>Single sign-on is on</h2>
                <Badge variant="success"><CheckCircle2 /> Active</Badge>
                <Badge variant={live.mode === "required" ? "info" : "secondary"}>{live.mode === "required" ? "Required" : "Optional"}</Badge>
              </div>
              <p className="text-sm" style={{ color: "var(--fg-neutral-muted)" }}>
                Members at {tenantDomain} sign in with {p.name}
                {live.mode === "optional" ? " or their Clarion password" : ""}. Last successful sign-in {recentSignIns.find((s) => s.outcome === "success")?.when}.
              </p>
            </div>
          </div>
          <div className="flex shrink-0 flex-wrap gap-2">
            {live.mode === "optional"
              ? <Button variant="outline" onClick={() => setConfirmRequired(true)}>Make required</Button>
              : <Button variant="outline" onClick={() => onMode("optional")}>Make optional</Button>}
            <Button variant="outline" onClick={onEdit}>Edit connection</Button>
          </div>
        </div>

        {confirmRequired && (
          <div className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between" style={{ borderTop: "1px solid var(--border-neutral-muted)", background: "var(--bg-warning-subtle)" }}>
            <p className="text-sm" style={{ color: "var(--fg-neutral-emphasis)" }}>
              <strong className="font-medium">{onDomain} Members</strong> will have to sign in with {p.short}; their Clarion passwords stop working. Admins keep emergency access.
            </p>
            <div className="flex shrink-0 gap-2">
              <Button variant="ghost" onClick={() => setConfirmRequired(false)}>Cancel</Button>
              <Button onClick={() => { setConfirmRequired(false); onMode("required") }}>Make SSO required</Button>
            </div>
          </div>
        )}
      </Card>

      {/* KPI strip */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <Stat label="Members on SSO" value={onDomain} icon={Users} />
        <Stat label="Sign-ins, last 24 h" value={recentSignIns.length * 7} icon={LogIn} />
        <Stat label="Failed, last 24 h" value={failed} icon={CircleAlert} tone={failed ? "danger" : undefined} />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        {/* Connection */}
        <Card className="gap-0 rounded-xl p-0">
          <div className="flex items-center justify-between px-4 py-3.5" style={{ borderBottom: "1px solid var(--border-neutral-muted)" }}>
            <h3 className="text-sm font-medium" style={{ color: "var(--fg-neutral-emphasis)" }}>Connection</h3>
            <Badge variant="secondary">{p.protocol}</Badge>
          </div>
          <div className="px-4 py-1">
            <DetailList
              mono={false}
              rows={[
                ["Identity provider", p.name],
                ["Verified domain", <span className="flex items-center gap-2">{tenantDomain} <Badge variant="success">Verified</Badge></span>],
                ["Connected with", method],
                [p.parsed[0][0], <span className="font-mono text-xs">{p.parsed[0][1]}</span>],
                ...(p.protocol === "SAML 2.0"
                  ? [["Signing certificate", <span className="flex flex-col gap-0.5">Valid until 14 Mar 2029<span className="text-xs" style={{ color: "var(--fg-neutral-muted)" }}>{autoRefresh ? "New certificates are picked up automatically." : "We'll email Admins 30 and 7 days before it expires."}</span></span>] as [string, ReactNode]]
                  : []),
              ]}
            />
          </div>
        </Card>

        {/* Who can sign in */}
        <Card className="gap-0 rounded-xl p-0">
          <div className="flex items-center justify-between px-4 py-3.5" style={{ borderBottom: "1px solid var(--border-neutral-muted)" }}>
            <h3 className="text-sm font-medium" style={{ color: "var(--fg-neutral-emphasis)" }}>Who can sign in</h3>
            <Button variant="link" size="sm" className="h-auto px-0" onClick={onEdit}>Edit</Button>
          </div>
          <div className="px-4 py-1">
            <DetailList
              mono={false}
              rows={[
                ["New people", live.newUsers === "invited" ? "Only people invited in Clarion" : `Anyone at ${tenantDomain}, as a CC Manager with no Groups`],
                ["Roles from groups", live.groupsEnabled && live.groupRules.length
                  ? <span className="flex flex-col gap-1">{live.groupRules.map((r) => <span key={r.id}>{r.label || r.value} → {roleLabel[r.role]}</span>)}</span>
                  : "Not set up. Roles are assigned on the Members page."],
                ["Emergency access", "Admins can sign in with password and MFA if the provider is down"],
              ]}
            />
          </div>
        </Card>
      </div>

      {/* Recent sign-ins */}
      <Card className="w-full gap-0 overflow-hidden rounded-xl p-0">
        <div className="flex items-center gap-2 px-4 py-3.5">
          <h3 className="text-sm font-medium" style={{ color: "var(--fg-neutral-emphasis)" }}>Recent SSO sign-ins</h3>
          <Badge variant="secondary">{recentSignIns.length}</Badge>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[36rem] text-sm">
            <thead>
              <tr className="text-left text-xs" style={{ color: "var(--fg-neutral-muted)", background: "var(--bg-neutral-subtle)" }}>
                <th className="px-4 py-2 font-medium">Person</th>
                <th className="px-4 py-2 font-medium">Outcome</th>
                <th className="px-4 py-2 font-medium">Reason</th>
                <th className="px-4 py-2 text-right font-medium">When</th>
              </tr>
            </thead>
            <tbody>
              {recentSignIns.map((s) => (
                <tr key={s.who + s.when} style={{ borderTop: "1px solid var(--border-neutral-muted)" }}>
                  <td className="px-4 py-2.5" style={{ color: "var(--fg-neutral-emphasis)" }}>{s.who}@{tenantDomain}</td>
                  <td className="px-4 py-2.5">
                    {s.outcome === "success"
                      ? <Badge variant="success"><Check /> Signed in</Badge>
                      : <Badge variant="danger"><X /> Failed</Badge>}
                  </td>
                  <td className="px-4 py-2.5" style={{ color: "var(--fg-neutral-muted)" }}>{s.reason ?? "–"}</td>
                  <td className="px-4 py-2.5 text-right" style={{ color: "var(--fg-neutral-muted)" }}>{s.when}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Turn off */}
      <Card className="w-full gap-0 rounded-xl p-0">
        {confirmOff ? (
          <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between" style={{ background: "var(--bg-danger-subtle)" }}>
            <p className="text-sm" style={{ color: "var(--fg-neutral-emphasis)" }}>
              Members go back to Clarion passwords. Anyone who never had one gets a reset email.
            </p>
            <div className="flex shrink-0 gap-2">
              <Button variant="ghost" onClick={() => setConfirmOff(false)}>Keep SSO on</Button>
              <Button variant="destructive" onClick={onTurnOff}>Turn off SSO</Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-col gap-0.5">
              <span className="text-sm font-medium" style={{ color: "var(--fg-neutral-emphasis)" }}>Turn off single sign-on</span>
              <span className="text-sm" style={{ color: "var(--fg-neutral-muted)" }}>Your connection settings are deleted. You'd need to set it up again.</span>
            </div>
            <Button variant="outline" className="shrink-0" onClick={() => setConfirmOff(true)}>Turn off…</Button>
          </div>
        )}
      </Card>
    </div>
  )
}
