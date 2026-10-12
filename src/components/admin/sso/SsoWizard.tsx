import { useEffect, useRef, useState, type ReactNode } from "react"
import { Loader2, Plus, Trash2, Upload, FileText, ShieldCheck, KeyRound, Users, Send, ExternalLink } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import { toast } from "@/components/ui/toast"
import { cn } from "@/lib/utils"
import { users, roleLabel, type UserRole } from "@/data/users"
import {
  providers, providerById, connectMethodLabel, tenantDomain, dnsRecord, setupSteps,
  type ProviderId, type ConnectMethod,
} from "@/data/sso"
import { Rich, CopyField, Callout, Stepper, TipCard, Segmented, DetailList, SectionTitle } from "./parts"

// ---- Types shared with the page ---------------------------------------------

export type SsoMode = "optional" | "required"
export type NewUserRule = "invited" | "anyone"

export interface GroupRule { id: string; value: string; label?: string; role: UserRole }

export interface SsoDraft {
  step: number
  domainVerified: boolean
  providerId: ProviderId | null
  addConfirmed: boolean
  connectMethod: ConnectMethod | "oidc" | null
  connected: boolean
  attributes: { email: string; firstName: string; lastName: string; groups: string }
  groupRules: GroupRule[]
  groupsEnabled: boolean
  newUsers: NewUserRule
  tested: boolean
  mode: SsoMode
}

export const emptyDraft: SsoDraft = {
  step: 0,
  domainVerified: false,
  providerId: null,
  addConfirmed: false,
  connectMethod: null,
  connected: false,
  attributes: { email: "", firstName: "", lastName: "", groups: "" },
  groupRules: [],
  groupsEnabled: false,
  newUsers: "invited",
  tested: false,
  mode: "optional",
}

const TURN_ON = setupSteps.length // index of the final "Turn on SSO" screen
const wait = (ms: number) => new Promise((r) => window.setTimeout(r, ms))
let ruleSeq = 0
const newRuleId = () => `g${++ruleSeq}`

/** Fresh provider-specific defaults, applied when the provider changes. */
function forProvider(d: SsoDraft, id: ProviderId): SsoDraft {
  const p = providerById(id)
  return {
    ...d,
    providerId: id,
    addConfirmed: false,
    connectMethod: p.connectDefault,
    connected: false,
    tested: false,
    attributes: {
      email: p.attributes.email,
      firstName: p.attributes.firstName,
      lastName: p.attributes.lastName,
      groups: p.attributes.groups ?? "",
    },
    groupsEnabled: p.groupMode !== "limited",
    groupRules: p.groupExamples.map((g) => ({ id: newRuleId(), ...g })),
  }
}

// ---- Wizard -------------------------------------------------------------------

export function SsoWizard({
  initial,
  onExit,
  onComplete,
}: {
  initial: SsoDraft
  /** Save and exit — the page keeps the draft so setup can resume. */
  onExit: (draft: SsoDraft) => void
  onComplete: (draft: SsoDraft) => void
}) {
  const [d, setD] = useState<SsoDraft>(initial)
  const set = (patch: Partial<SsoDraft>) => setD((x) => ({ ...x, ...patch }))
  const provider = d.providerId ? providerById(d.providerId) : null
  const topRef = useRef<HTMLDivElement>(null)

  // Bring the new step into view on step change.
  useEffect(() => {
    topRef.current?.scrollIntoView({ block: "start", behavior: "smooth" })
  }, [d.step])

  const canContinue = [
    d.domainVerified,
    d.providerId !== null,
    d.addConfirmed,
    d.connected,
    d.attributes.email.trim() !== "",
    d.tested,
  ][d.step] ?? true

  const goto = (step: number) => set({ step })
  const sendLink = () =>
    toast({ title: "Setup link sent", description: "Scoped to SSO setup only. Email stubbed in prototype.", variant: "success" })

  return (
    <Card ref={topRef} className="w-full scroll-mt-4 gap-0 overflow-hidden rounded-xl p-0">
      {/* Header: progress */}
      <div className="flex flex-col gap-3 px-5 py-4" style={{ borderBottom: "1px solid var(--border-neutral-muted)" }}>
        <div className="flex items-center gap-2">
          <KeyRound className="size-4" style={{ color: "var(--fg-neutral-muted)" }} />
          <span className="text-sm font-medium" style={{ color: "var(--fg-neutral-emphasis)" }}>
            {d.step === TURN_ON ? "Turn on single sign-on" : "Set up single sign-on"}
          </span>
          {provider && d.step > 1 && <Badge variant="secondary" className="ml-1">{provider.name}</Badge>}
        </div>
        {d.step < TURN_ON && <Stepper steps={setupSteps} current={d.step} />}
      </div>

      {/* Body */}
      <div className="grid grid-cols-1 gap-6 p-5 lg:grid-cols-[minmax(0,1fr)_17rem]">
        <section className="flex min-w-0 flex-col gap-5">
          {d.step === 0 && <StepDomain verified={d.domainVerified} onVerified={() => set({ domainVerified: true })} />}
          {d.step === 1 && <StepProvider value={d.providerId} onChange={(id) => setD((x) => forProvider(x, id))} />}
          {d.step === 2 && provider && <StepAdd p={provider} confirmed={d.addConfirmed} onConfirm={(v) => set({ addConfirmed: v })} />}
          {d.step === 3 && provider && (
            <StepConnect
              p={provider}
              method={d.connectMethod ?? provider.connectDefault}
              onMethod={(m) => set({ connectMethod: m, connected: false })}
              connected={d.connected}
              onConnected={(v) => set({ connected: v, tested: false })}
            />
          )}
          {d.step === 4 && provider && <StepMap p={provider} d={d} set={set} />}
          {d.step === 5 && provider && <StepTest p={provider} d={d} passed={d.tested} onResult={(ok) => set({ tested: ok })} onFix={goto} />}
          {d.step === TURN_ON && provider && <StepTurnOn p={provider} mode={d.mode} onMode={(m) => set({ mode: m })} />}
        </section>

        <aside className="flex min-w-0 flex-col gap-3">
          {d.step === 0 && (
            <TipCard title="Why verify a domain?">
              It proves {tenantDomain} belongs to your organisation, so Iris can send everyone with that email address to your company sign-in.
            </TipCard>
          )}
          {d.step === 1 && (
            <TipCard title="Why we ask">
              Each provider names the same settings differently. Choosing yours means the next steps use the words you'll see on its screens.
            </TipCard>
          )}
          {provider && d.step === 2 && <TipCard title={provider.addTip.title}><Rich text={provider.addTip.body} /></TipCard>}
          {provider && d.step === 3 && <TipCard title={provider.connectTip.title}><Rich text={provider.connectTip.body} /></TipCard>}
          {provider && d.step === 4 && <TipCard title={provider.mapTip.title}><Rich text={provider.mapTip.body} /></TipCard>}
          {d.step === 5 && (
            <TipCard title="The test is safe">
              It only signs in the person running it, doesn't create a session, and doesn't change anything for other Members.
            </TipCard>
          )}
          {d.step === TURN_ON && (
            <TipCard title="Start with Optional">
              Let people try SSO alongside their passwords for a week, then switch to Required from the SSO page.
            </TipCard>
          )}
          {d.step < TURN_ON && (
            <div className="flex flex-col gap-2.5 rounded-lg p-4" style={{ border: "1px solid var(--border-neutral-muted)" }}>
              <span className="text-sm font-medium" style={{ color: "var(--fg-neutral-emphasis)" }}>Not the right person?</span>
              <p className="text-sm" style={{ color: "var(--fg-neutral-muted)" }}>
                Send this setup to whoever manages your staff sign-in. They'll only get access to SSO setup.
              </p>
              <Button variant="outline" size="sm" onClick={sendLink}><Send /> Send setup link</Button>
            </div>
          )}
          <p className="px-1 text-xs" style={{ color: "var(--fg-neutral-muted)" }}>Progress saves automatically. You can leave and come back.</p>
        </aside>
      </div>

      {/* Footer */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4" style={{ borderTop: "1px solid var(--border-neutral-muted)" }}>
        <Button variant="ghost" onClick={() => (d.step === 0 ? onExit(d) : goto(d.step - 1))}>
          {d.step === 0 ? "Cancel" : "Back"}
        </Button>
        <div className="flex items-center gap-2">
          {d.step < TURN_ON && <Button variant="outline" onClick={() => onExit(d)}>Save and exit</Button>}
          {d.step < TURN_ON ? (
            <Button disabled={!canContinue} onClick={() => goto(d.step + 1)}>
              {d.step === 5 ? "Continue to turn on" : d.step === 4 ? "Continue to test" : "Continue"}
            </Button>
          ) : (
            <Button onClick={() => onComplete(d)}>
              <ShieldCheck /> Turn on SSO{d.mode === "required" ? " (required)" : ""}
            </Button>
          )}
        </div>
      </div>
    </Card>
  )
}

// ---- Step 1: verify domain ----------------------------------------------------

function StepDomain({ verified, onVerified }: { verified: boolean; onVerified: () => void }) {
  const [checking, setChecking] = useState(false)
  const [notFound, setNotFound] = useState(false)
  const [attempts, setAttempts] = useState(0)

  const check = async () => {
    setChecking(true)
    setNotFound(false)
    await wait(1100)
    setChecking(false)
    // First check fails (DNS still propagating), second succeeds — shows both states.
    if (attempts === 0) { setNotFound(true); setAttempts(1) } else onVerified()
  }

  return (
    <>
      <SectionTitle sub={<>Add this DNS record where {tenantDomain}'s DNS is managed. It proves the domain is yours.</>}>
        Verify {tenantDomain}
      </SectionTitle>
      <div className="flex flex-col gap-4 rounded-lg p-4" style={{ border: "1px solid var(--border-neutral-muted)" }}>
        <div className="flex items-center justify-between gap-3">
          <span className="font-mono text-sm" style={{ color: "var(--fg-neutral-emphasis)" }}>{tenantDomain}</span>
          {verified ? <Badge variant="success">Verified</Badge> : <Badge variant="warning">Pending</Badge>}
        </div>
        <div className="flex flex-col gap-1.5">
          <span className="text-sm font-medium" style={{ color: "var(--fg-neutral-emphasis)" }}>Record type</span>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline" className="font-mono">{dnsRecord.type}</Badge>
            <span className="text-xs" style={{ color: "var(--fg-neutral-muted)" }}>Choose this from the record type list at your DNS provider.</span>
          </div>
        </div>
        <CopyField id="dns-host" label="Name / Host" value={dnsRecord.host} />
        <CopyField id="dns-value" label="Value" value={dnsRecord.value} />
      </div>
      {verified ? (
        <Callout tone="success" title={`${tenantDomain} is verified`}>Members with an @{tenantDomain} address can now be sent to your company sign-in.</Callout>
      ) : (
        <>
          {notFound && (
            <Callout tone="warning" title="We couldn't find the record yet">
              DNS changes can take a few hours. We'll keep checking and email you when it's verified, so you can leave this page.
            </Callout>
          )}
          <Button variant="outline" className="w-fit" loading={checking} onClick={check}>
            {checking ? "Checking DNS…" : "Check now"}
          </Button>
        </>
      )}
    </>
  )
}

// ---- Step 2: choose provider --------------------------------------------------

function StepProvider({ value, onChange }: { value: ProviderId | null; onChange: (id: ProviderId) => void }) {
  return (
    <>
      <SectionTitle sub="It's the system your staff use to sign in to their work apps. We'll word the next steps to match its screens.">
        Which identity provider do you use?
      </SectionTitle>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {providers.map((p) => {
          const on = p.id === value
          return (
            <button
              key={p.id}
              type="button"
              aria-pressed={on}
              onClick={() => onChange(p.id)}
              className="flex min-h-28 flex-col items-start gap-3 rounded-lg p-4 text-left transition-colors hover:bg-[var(--bg-neutral-subtle-hovered)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              style={{
                border: on ? "2px solid var(--border-primary-emphasis)" : `1px ${p.generic ? "dashed" : "solid"} var(--border-neutral-emphasis)`,
                background: on ? "var(--bg-primary-subtle)" : "var(--bg-card)",
                padding: on ? 15 : 16,
              }}
            >
              <span className="flex w-full items-center justify-between gap-2">
                <span
                  aria-hidden
                  className="flex size-9 items-center justify-center rounded-md text-xs font-semibold"
                  style={{ background: "var(--bg-neutral-subtle)", color: "var(--fg-neutral-muted)", border: "1px solid var(--border-neutral-muted)" }}
                >
                  {p.generic ? <KeyRound className="size-4" /> : p.short.slice(0, 2)}
                </span>
                {p.mostCommon && <Badge variant="info">Most common</Badge>}
              </span>
              <span className="flex flex-col gap-0.5">
                <span className="text-sm font-medium" style={{ color: "var(--fg-neutral-emphasis)" }}>{p.name}</span>
                <span className="text-xs" style={{ color: "var(--fg-neutral-muted)" }}>{p.blurb} · {p.protocol}</span>
              </span>
            </button>
          )
        })}
      </div>
      <Callout tone="info" title="Not sure which one?">
        Ask whoever manages staff sign-in, usually IT or the identity team, or send them the setup link.
      </Callout>
    </>
  )
}

// ---- Step 3: add Iris to the provider ----------------------------------------

function OrderedSteps({ items, start = 1 }: { items: string[]; start?: number }) {
  if (!items.length) return null
  return (
    <ol start={start} className="flex list-decimal flex-col gap-1.5 pl-5 text-sm" style={{ color: "var(--fg-neutral-muted)" }}>
      {items.map((s) => <li key={s} className="pl-1"><Rich text={s} /></li>)}
    </ol>
  )
}

function StepAdd({ p, confirmed, onConfirm }: { p: ReturnType<typeof providerById>; confirmed: boolean; onConfirm: (v: boolean) => void }) {
  const callout = p.addCallout && (
    <Callout tone={p.addCallout.tone} title={p.addCallout.title}><Rich text={p.addCallout.body} /></Callout>
  )
  const calloutFirst = !!p.addStepsAfter // Google: download metadata before pasting ours

  return (
    <>
      <SectionTitle sub={p.addIntro}>Add Iris to {p.short}</SectionTitle>
      <OrderedSteps items={p.addSteps} />
      {calloutFirst && callout}
      {p.addStepsAfter && <OrderedSteps items={p.addStepsAfter} start={p.addSteps.length + 1} />}

      <div className="flex flex-col gap-4 rounded-lg p-4" style={{ border: "1px solid var(--border-neutral-muted)" }}>
        {p.offerSpMetadata && (
          <div className="flex flex-col gap-3 pb-4 sm:flex-row sm:items-center sm:justify-between" style={{ borderBottom: "1px solid var(--border-neutral-muted)" }}>
            <p className="text-sm" style={{ color: "var(--fg-neutral-muted)" }}>
              <strong className="font-medium" style={{ color: "var(--fg-neutral-emphasis)" }}>Quickest:</strong> if your provider can import an app from a link or file, give it Iris's metadata.
            </p>
            <div className="flex shrink-0 gap-2">
              <Button variant="outline" size="sm" onClick={() => toast({ title: "Metadata link copied", variant: "success" })}>Copy metadata link</Button>
              <Button variant="outline" size="sm" onClick={() => toast({ title: "iris-metadata.xml downloaded", description: "Stubbed in prototype.", variant: "info" })}>Download XML</Button>
            </div>
          </div>
        )}
        {p.spFields.map((f, i) => (
          <CopyField key={f.label} id={`sp-${i}`} label={f.label} hint={f.irisName} aka={f.aka} value={f.value} />
        ))}
        {p.spSettings && (
          <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm">
            {p.spSettings.map(([k, v]) => (
              <span key={k}><span style={{ color: "var(--fg-neutral-muted)" }}>{k}:</span> <span className="font-medium" style={{ color: "var(--fg-neutral-emphasis)" }}>{v}</span></span>
            ))}
          </div>
        )}
      </div>

      {p.addTable && (
        <div className="flex flex-col gap-2">
          <p className="text-sm" style={{ color: "var(--fg-neutral-muted)" }}><Rich text={p.addTable.intro} /></p>
          <div className="overflow-x-auto rounded-lg" style={{ border: "1px solid var(--border-neutral-muted)" }}>
            <table className="w-full min-w-[28rem] text-sm">
              <thead>
                <tr className="text-left text-xs" style={{ color: "var(--fg-neutral-muted)", background: "var(--bg-neutral-subtle)" }}>
                  <th className="px-3 py-2 font-medium">{p.addTable.head[0]}</th>
                  <th className="px-3 py-2 font-medium">{p.addTable.head[1]}</th>
                  <th className="w-28 px-3 py-2 font-medium"><span className="sr-only">Requirement</span></th>
                </tr>
              </thead>
              <tbody>
                {p.addTable.rows.map(([a, b, req]) => (
                  <tr key={a + b} style={{ borderTop: "1px solid var(--border-neutral-muted)" }}>
                    <td className="px-3 py-2 font-mono text-xs" style={{ color: "var(--fg-neutral-emphasis)" }}>{a}</td>
                    <td className="px-3 py-2" style={{ color: "var(--fg-neutral-emphasis)" }}>{b}</td>
                    <td className="px-3 py-2 text-xs" style={{ color: "var(--fg-neutral-muted)" }}>{req}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {p.addTable.foot && <p className="text-sm" style={{ color: "var(--fg-neutral-muted)" }}><Rich text={p.addTable.foot} /></p>}
        </div>
      )}

      {!calloutFirst && callout}

      <label className="flex w-fit cursor-pointer items-center gap-2.5 text-sm" style={{ color: "var(--fg-neutral-emphasis)" }}>
        <input type="checkbox" checked={confirmed} onChange={(e) => onConfirm(e.target.checked)} className="size-4 accent-[var(--bg-primary-emphasis)]" />
        {p.addConfirm}
      </label>
    </>
  )
}

// ---- Step 4: connect the provider -------------------------------------------

function StepConnect({
  p, method, onMethod, connected, onConnected,
}: {
  p: ReturnType<typeof providerById>
  method: ConnectMethod | "oidc"
  onMethod: (m: ConnectMethod) => void
  connected: boolean
  onConnected: (v: boolean) => void
}) {
  const [busy, setBusy] = useState(false)
  const [showErrors, setShowErrors] = useState(false)
  const [url, setUrl] = useState(p.urlExample ?? "")
  const [file, setFile] = useState<string | null>(connected && method === "file" ? p.fileName ?? "metadata.xml" : null)
  const [manual, setManual] = useState({ sso: "", issuer: "", cert: "" })
  const [oidc, setOidc] = useState({ issuer: "https://login.acme.com", clientId: "", secret: "" })

  const run = async () => {
    setBusy(true)
    await wait(1000)
    setBusy(false)
    onConnected(true)
  }

  const ready =
    method === "url" ? url.trim().startsWith("https://")
      : method === "file" ? !!file
      : method === "manual" ? manual.sso.startsWith("https://") && !!manual.issuer && manual.cert.includes("BEGIN CERTIFICATE")
      : !!oidc.issuer && !!oidc.clientId && !!oidc.secret

  const fillManualExample = () =>
    setManual({ sso: p.parsed[0][1], issuer: p.parsed[1][1], cert: "-----BEGIN CERTIFICATE-----\nMIIDpDCCAoygAwIBAgIGAY…\n-----END CERTIFICATE-----" })

  return (
    <>
      <SectionTitle sub={`Give Iris ${p.short}'s sign-in details so it can send your staff there and trust what comes back.`}>
        Connect {p.short} to Iris
      </SectionTitle>

      {method !== "oidc" && (
        <div className="flex flex-col gap-1.5">
          <Segmented
            label={`How to add ${p.short}'s details`}
            options={p.connectMethods.map((m) => ({ value: m, label: connectMethodLabel[m] }))}
            value={method as ConnectMethod}
            onChange={(m) => { onMethod(m); setShowErrors(false) }}
          />
          {p.id === "google" && method === "file" && (
            <span className="text-xs" style={{ color: "var(--fg-neutral-muted)" }}>Selected for you: Google Workspace gives a file, not a link.</span>
          )}
        </div>
      )}

      {method === "url" && (
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="md-url">{p.urlLabel ?? "Metadata URL"}</Label>
          {p.urlWhere && <span className="text-xs" style={{ color: "var(--fg-neutral-muted)" }}><Rich text={p.urlWhere} /></span>}
          <div className="flex gap-2">
            <Input id="md-url" value={url} onChange={(e) => { setUrl(e.target.value); onConnected(false) }} placeholder="https://" className="font-mono text-xs" />
            <Button variant="outline" disabled={!ready} loading={busy} onClick={run}>Fetch</Button>
          </div>
        </div>
      )}

      {method === "file" && (
        <div className="flex items-center gap-3 rounded-lg p-4" style={{ border: "1px dashed var(--border-neutral-emphasis)", background: "var(--bg-neutral-subtle)" }}>
          {file ? <FileText className="size-5 shrink-0" style={{ color: "var(--fg-neutral-muted)" }} /> : <Upload className="size-5 shrink-0" style={{ color: "var(--fg-neutral-muted)" }} />}
          <div className="flex min-w-0 flex-1 flex-col">
            <span className="truncate text-sm font-medium" style={{ color: "var(--fg-neutral-emphasis)" }}>{file ?? "Upload the metadata file (.xml)"}</span>
            <span className="text-xs" style={{ color: "var(--fg-neutral-muted)" }}>{file ? "Uploaded just now" : "Drag it here, or choose a file"}</span>
          </div>
          <Button
            variant="outline"
            loading={busy}
            onClick={async () => { setFile(p.fileName ?? "metadata.xml"); await run() }}
          >
            {file ? "Replace file" : "Choose file"}
          </Button>
        </div>
      )}

      {method === "manual" && (
        <div className="flex flex-col gap-4 rounded-lg p-4" style={{ border: "1px solid var(--border-neutral-muted)" }}>
          <Field id="m-sso" label="Sign-in URL" aka="SSO URL · Login URL · Single Sign-On Service URL">
            <Input id="m-sso" value={manual.sso} placeholder="https://" onChange={(e) => { setManual({ ...manual, sso: e.target.value }); onConnected(false) }} className="font-mono text-xs" />
          </Field>
          <Field id="m-iss" label="Issuer" aka="IdP Entity ID · Identity Provider Issuer · Identifier">
            <Input id="m-iss" value={manual.issuer} onChange={(e) => { setManual({ ...manual, issuer: e.target.value }); onConnected(false) }} className="font-mono text-xs" />
          </Field>
          <Field id="m-cert" label="Signing certificate" aka="X.509 certificate · Token signing certificate. Paste it, or upload a .pem, .cer or .crt file.">
            <textarea
              id="m-cert"
              rows={4}
              value={manual.cert}
              onChange={(e) => { setManual({ ...manual, cert: e.target.value }); onConnected(false) }}
              placeholder="-----BEGIN CERTIFICATE-----"
              className="w-full resize-y rounded-md px-3 py-2 font-mono text-xs outline-none focus-visible:ring-2 focus-visible:ring-ring"
              style={{ background: "var(--bg-input-default)", border: "1px solid var(--border-input-default)", color: "var(--fg-neutral-emphasis)" }}
            />
          </Field>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" disabled={!ready} loading={busy} onClick={run}>Check details</Button>
            <Button variant="ghost" onClick={fillManualExample}>Fill example values</Button>
          </div>
        </div>
      )}

      {method === "oidc" && (
        <div className="flex flex-col gap-4 rounded-lg p-4" style={{ border: "1px solid var(--border-neutral-muted)" }}>
          <Field id="o-iss" label="Issuer URL" aka="Discovery URL · Authority · Domain. The address before /.well-known/openid-configuration.">
            <Input id="o-iss" value={oidc.issuer} onChange={(e) => { setOidc({ ...oidc, issuer: e.target.value }); onConnected(false) }} className="font-mono text-xs" />
          </Field>
          <Field id="o-id" label="Client ID" aka="Application ID · App ID">
            <Input id="o-id" value={oidc.clientId} placeholder="Paste from your provider" onChange={(e) => { setOidc({ ...oidc, clientId: e.target.value }); onConnected(false) }} className="font-mono text-xs" />
          </Field>
          <Field id="o-secret" label="Client secret" aka="Stored encrypted. After you save, Iris only shows the last 4 characters.">
            <Input id="o-secret" type="password" value={oidc.secret} onChange={(e) => { setOidc({ ...oidc, secret: e.target.value }); onConnected(false) }} className="font-mono text-xs" />
          </Field>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" disabled={!ready} loading={busy} onClick={run}>Check details</Button>
            <Button variant="ghost" onClick={() => setOidc({ ...oidc, clientId: "0oa7f2k9xQ", secret: "s3cr3t-example-value" })}>Fill example values</Button>
          </div>
        </div>
      )}

      {connected && (
        <div className="overflow-hidden rounded-lg" style={{ border: "1px solid var(--border-success-muted)" }}>
          <Callout tone="success" title={`Connected to ${p.short}`} bare>
            {method === "url" || method === "oidc"
              ? "Iris re-reads these settings, so certificate and key changes are picked up automatically."
              : "Check these match the app you created."}
          </Callout>
          <div className="px-4 py-1">
            <DetailList
              rows={[
                ...p.parsed,
                ...(p.protocol === "SAML 2.0"
                  ? [["Signing certificate", <span className="flex flex-wrap items-center gap-2 font-sans text-sm">Valid until 14 Mar 2029 <Badge variant="success">Valid</Badge></span>] as [string, ReactNode]]
                  : []),
              ]}
            />
          </div>
        </div>
      )}

      <div className="flex flex-col gap-2">
        <button
          type="button"
          onClick={() => setShowErrors((v) => !v)}
          className="w-fit text-xs underline-offset-4 hover:underline"
          style={{ color: "var(--fg-link-default)" }}
        >
          {showErrors ? "Hide" : "Prototype: preview"} error states
        </button>
        {showErrors && p.connectErrors.map((e) => (
          <Callout key={e.title} tone={e.tone} title={e.title}><Rich text={e.body} /></Callout>
        ))}
      </div>
    </>
  )
}

function Field({ id, label, aka, children }: { id: string; label: string; aka?: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      {aka && <span className="text-xs" style={{ color: "var(--fg-neutral-muted)" }}>{aka.includes("·") ? `Also called: ${aka}` : aka}</span>}
      {children}
    </div>
  )
}

// ---- Step 5: map user details ------------------------------------------------

function StepMap({ p, d, set }: { p: ReturnType<typeof providerById>; d: SsoDraft; set: (patch: Partial<SsoDraft>) => void }) {
  const rows: { key: keyof SsoDraft["attributes"]; label: string; req?: string }[] = [
    { key: "email", label: "Email", req: "Required" },
    { key: "firstName", label: "First name" },
    { key: "lastName", label: "Last name" },
    ...(p.groupMode !== "limited" || d.groupsEnabled ? [{ key: "groups" as const, label: "Groups", req: "Optional" }] : []),
  ]
  const setAttr = (k: keyof SsoDraft["attributes"], v: string) => set({ attributes: { ...d.attributes, [k]: v } })
  const setRule = (id: string, patch: Partial<GroupRule>) =>
    set({ groupRules: d.groupRules.map((r) => (r.id === id ? { ...r, ...patch } : r)) })
  const valueLabel = p.groupMode === "ids" ? "Entra group Object ID" : p.groupMode === "names" ? `${p.short} group name` : "Group value"

  return (
    <>
      <SectionTitle sub={p.mapIntro}>Map user details from {p.short}</SectionTitle>

      <div className="overflow-x-auto rounded-lg" style={{ border: "1px solid var(--border-neutral-muted)" }}>
        <table className="w-full min-w-[32rem] text-sm">
          <thead>
            <tr className="text-left text-xs" style={{ color: "var(--fg-neutral-muted)", background: "var(--bg-neutral-subtle)" }}>
              <th className="w-36 px-3 py-2 font-medium">Clarion field</th>
              <th className="px-3 py-2 font-medium">{p.mapColumn}</th>
              <th className="w-32 px-3 py-2 font-medium"><span className="sr-only">Source</span></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const isDefault = d.attributes[r.key] === (p.attributes[r.key] ?? "")
              return (
                <tr key={r.key} style={{ borderTop: "1px solid var(--border-neutral-muted)" }}>
                  <td className="px-3 py-2 align-middle">
                    <label htmlFor={`attr-${r.key}`} className="font-medium" style={{ color: "var(--fg-neutral-emphasis)" }}>{r.label}</label>
                    {r.req && <span className="ml-1.5 text-xs" style={{ color: "var(--fg-neutral-muted)" }}>{r.req}</span>}
                  </td>
                  <td className="px-3 py-2">
                    <Input
                      id={`attr-${r.key}`}
                      value={d.attributes[r.key]}
                      aria-invalid={r.key === "email" && !d.attributes.email.trim() ? true : undefined}
                      onChange={(e) => setAttr(r.key, e.target.value)}
                      className="font-mono text-xs"
                    />
                  </td>
                  <td className="px-3 py-2">
                    {isDefault ? <Badge variant="secondary">{p.mapBadge}</Badge> : <Badge variant="outline">Changed</Badge>}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Roles from groups */}
      <div className="flex flex-col gap-3 rounded-lg p-4" style={{ border: "1px solid var(--border-neutral-muted)" }}>
        <div className="flex items-start justify-between gap-3">
          <div className="flex flex-col gap-1">
            <h3 className="text-sm font-medium" style={{ color: "var(--fg-neutral-emphasis)" }}>Give Clarion roles from {p.short} groups</h3>
            <p className="max-w-[68ch] text-sm" style={{ color: "var(--fg-neutral-muted)" }}><Rich text={p.groupIntro} /></p>
          </div>
          {p.groupMode === "limited" && !d.groupsEnabled && <Badge variant="secondary">Not set up</Badge>}
        </div>

        {p.groupMode === "limited" && !d.groupsEnabled ? (
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => set({ groupsEnabled: true })}>Set up group mapping</Button>
            <span className="text-xs" style={{ color: "var(--fg-neutral-muted)" }}>or keep assigning roles on the Members page</span>
          </div>
        ) : (
          <>
            <div className="flex flex-col gap-2">
              <div className={cn("hidden gap-2 text-xs sm:grid", p.groupMode === "ids" ? "sm:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)_10rem_2.25rem]" : "sm:grid-cols-[minmax(0,1fr)_10rem_2.25rem]")} style={{ color: "var(--fg-neutral-muted)" }}>
                <span>{valueLabel}</span>
                {p.groupMode === "ids" && <span>Name in Clarion</span>}
                <span>Clarion role</span>
                <span />
              </div>
              {d.groupRules.map((r, i) => (
                <div key={r.id} className={cn("grid grid-cols-1 gap-2", p.groupMode === "ids" ? "sm:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)_10rem_2.25rem]" : "sm:grid-cols-[minmax(0,1fr)_10rem_2.25rem]")}>
                  <Input aria-label={`${valueLabel}, row ${i + 1}`} value={r.value} onChange={(e) => setRule(r.id, { value: e.target.value })} className={cn(p.groupMode === "ids" && "font-mono text-xs")} />
                  {p.groupMode === "ids" && (
                    <Input aria-label={`Name in Clarion, row ${i + 1}`} value={r.label ?? ""} placeholder="e.g. Contact centre managers" onChange={(e) => setRule(r.id, { label: e.target.value })} />
                  )}
                  <Select value={r.role} onValueChange={(v) => setRule(r.id, { role: v as UserRole })}>
                    <SelectTrigger className="w-full" aria-label={`Clarion role, row ${i + 1}`}><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">{roleLabel.admin}</SelectItem>
                      <SelectItem value="manager">{roleLabel.manager}</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button variant="ghost" size="icon" aria-label={`Remove row ${i + 1}`} onClick={() => set({ groupRules: d.groupRules.filter((x) => x.id !== r.id) })}>
                    <Trash2 />
                  </Button>
                </div>
              ))}
            </div>
            <Button
              variant="outline"
              size="sm"
              className="w-fit"
              onClick={() => set({ groupRules: [...d.groupRules, { id: newRuleId(), value: "", label: p.groupMode === "ids" ? "" : undefined, role: "manager" }] })}
            >
              <Plus /> Add group
            </Button>
            <p className="text-xs" style={{ color: "var(--fg-neutral-muted)" }}>
              CC Managers still need Groups assigned in Clarion to see any Widgets. Skip this to keep assigning roles on the Members page.
            </p>
          </>
        )}
      </div>

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-2 text-sm font-medium" style={{ color: "var(--fg-neutral-emphasis)" }}>Who can sign in with SSO</legend>
        {([
          ["invited", "Only people invited in Clarion", "(recommended) Everyone else is turned away at sign-in."],
          ["anyone", `Anyone at ${tenantDomain}`, "gets a CC Manager account with no Groups on first sign-in."],
        ] as const).map(([v, title, rest]) => (
          <label key={v} className="flex cursor-pointer items-start gap-2.5 text-sm">
            <input type="radio" name="new-users" checked={d.newUsers === v} onChange={() => set({ newUsers: v })} className="mt-0.5 size-4 accent-[var(--bg-primary-emphasis)]" />
            <span><span className="font-medium" style={{ color: "var(--fg-neutral-emphasis)" }}>{title}</span> <span style={{ color: "var(--fg-neutral-muted)" }}>{rest}</span></span>
          </label>
        ))}
      </fieldset>
    </>
  )
}

// ---- Step 6: test sign-in ----------------------------------------------------

function StepTest({
  p, d, passed, onResult, onFix,
}: {
  p: ReturnType<typeof providerById>
  d: SsoDraft
  passed: boolean
  onResult: (ok: boolean) => void
  onFix: (step: number) => void
}) {
  const [state, setState] = useState<"idle" | "running" | "passed" | "failed">(passed ? "passed" : "idle")
  const tester = users.find((u) => u.role === "admin" && u.status === "active") ?? users[0]

  const run = async (fail = false) => {
    setState("running")
    onResult(false)
    await wait(1600)
    if (fail) { setState("failed"); return }
    setState("passed")
    onResult(true)
  }

  const groupsSent = d.groupsEnabled && d.attributes.groups
    ? d.groupRules.filter((r) => r.role === tester.role).map((r) => r.value).filter(Boolean)
    : []
  const matchedRule = groupsSent.length ? d.groupRules.find((r) => r.value === groupsSent[0]) : undefined

  const [first, ...rest] = tester.name.split(" ")
  const received: [string, ReactNode][] = [
    [d.attributes.email || "email", tester.email],
    [d.attributes.firstName || "first name", first],
    [d.attributes.lastName || "last name", rest.join(" ")],
    ...(groupsSent.length ? [[d.attributes.groups, groupsSent.join(", ")] as [string, ReactNode]] : []),
  ]

  return (
    <>
      <SectionTitle sub={`Sign in once through ${p.short} to check everything lines up before anyone else uses it.`}>
        Test sign-in
      </SectionTitle>

      {state === "idle" && (
        <div className="flex flex-col items-start gap-3 rounded-lg p-4" style={{ border: "1px solid var(--border-neutral-muted)" }}>
          <p className="text-sm" style={{ color: "var(--fg-neutral-muted)" }}>
            We'll open {p.short} in a new tab. Sign in as yourself, and you'll come straight back here with the result.
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <Button onClick={() => run()}><ExternalLink /> Run test</Button>
            <button type="button" onClick={() => run(true)} className="text-xs underline-offset-4 hover:underline" style={{ color: "var(--fg-link-default)" }}>
              Prototype: preview a failed test
            </button>
          </div>
        </div>
      )}

      {state === "running" && (
        <div className="flex items-center gap-3 rounded-lg p-4" style={{ border: "1px solid var(--border-neutral-muted)" }} role="status">
          <Loader2 className="size-5 animate-spin" style={{ color: "var(--fg-neutral-muted)" }} />
          <span className="text-sm" style={{ color: "var(--fg-neutral-emphasis)" }}>Waiting for you to sign in to {p.short}…</span>
        </div>
      )}

      {state === "passed" && (
        <div className="overflow-hidden rounded-lg" style={{ border: "1px solid var(--border-success-muted)" }}>
          <Callout tone="success" title="Test passed" bare>
            {p.short} signed in {tester.name} and sent everything Clarion needs.
          </Callout>
          <div className="flex flex-col gap-3 px-4 py-3">
            <span className="text-xs font-medium" style={{ color: "var(--fg-neutral-muted)" }}>What {p.short} sent</span>
            <DetailList rows={received} />
            <div className="flex flex-wrap items-center gap-2 text-sm" style={{ color: "var(--fg-neutral-muted)" }}>
              <Users className="size-4" />
              Matched Member <span className="font-medium" style={{ color: "var(--fg-neutral-emphasis)" }}>{tester.name}</span> ·
              <Badge variant="secondary">{roleLabel[tester.role]}</Badge>
              {matchedRule && <span>from group {matchedRule.label || matchedRule.value}</span>}
            </div>
            <Button variant="outline" size="sm" className="w-fit" onClick={() => run()}>Run test again</Button>
          </div>
        </div>
      )}

      {state === "failed" && (
        <Callout
          tone="danger"
          title="Test failed: the signature didn't match"
          action={<Button size="sm" variant="outline" onClick={() => onFix(3)}>Back to step 4</Button>}
        >
          {p.short} signed the response with a different certificate from the one Iris has. This usually means the certificate was rotated. Reconnect in step 4 to pick up the new one.
        </Callout>
      )}
      {state === "failed" && (
        <Button variant="outline" className="w-fit" onClick={() => run()}>Run test again</Button>
      )}
    </>
  )
}

// ---- Turn on -----------------------------------------------------------------

function StepTurnOn({ p, mode, onMode }: { p: ReturnType<typeof providerById>; mode: SsoMode; onMode: (m: SsoMode) => void }) {
  const onDomain = users.filter((u) => u.status !== "deactivated" && u.email.endsWith(`@${tenantDomain}`))
  const offDomain = users.filter((u) => u.status !== "deactivated" && !u.email.endsWith(`@${tenantDomain}`))
  const admins = users.filter((u) => u.role === "admin" && u.status === "active").length

  const options: { value: SsoMode; title: string; body: string }[] = [
    { value: "optional", title: "Optional", body: `Members can sign in with ${p.short} or their Clarion password.` },
    { value: "required", title: "Required", body: `Everyone at ${tenantDomain} must sign in with ${p.short}.` },
  ]

  return (
    <>
      <Callout tone="success" title="Your connection is tested and ready">
        Choose how Members sign in. You can change this at any time.
      </Callout>
      <div role="radiogroup" aria-label="How Members sign in" className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {options.map((o) => {
          const on = mode === o.value
          return (
            <button
              key={o.value}
              type="button"
              role="radio"
              aria-checked={on}
              onClick={() => onMode(o.value)}
              className="flex flex-col items-start gap-1 rounded-lg text-left transition-colors hover:bg-[var(--bg-neutral-subtle-hovered)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              style={{
                border: on ? "2px solid var(--border-primary-emphasis)" : "1px solid var(--border-neutral-emphasis)",
                background: on ? "var(--bg-primary-subtle)" : "var(--bg-card)",
                padding: on ? 15 : 16,
              }}
            >
              <span className="text-sm font-medium" style={{ color: "var(--fg-neutral-emphasis)" }}>{o.title}{o.value === "optional" && <span className="ml-1.5 text-xs font-normal" style={{ color: "var(--fg-neutral-muted)" }}>Suggested first</span>}</span>
              <span className="text-sm" style={{ color: "var(--fg-neutral-muted)" }}>{o.body}</span>
            </button>
          )
        })}
      </div>

      {mode === "required" && (
        <div className="flex flex-col gap-3 rounded-lg p-4" style={{ border: "1px solid var(--border-warning-muted)", background: "var(--bg-warning-subtle)" }}>
          <span className="text-sm font-medium" style={{ color: "var(--fg-neutral-emphasis)" }}>What changes when you turn this on</span>
          <ul className="flex list-disc flex-col gap-1.5 pl-5 text-sm" style={{ color: "var(--fg-neutral-emphasis)" }}>
            <li><strong className="font-medium">{onDomain.length} Members</strong> at {tenantDomain} will sign in through {p.short}. Their Clarion passwords stop working.</li>
            {offDomain.length > 0 && <li><strong className="font-medium">{offDomain.length} Members</strong> outside {tenantDomain} keep their passwords.</li>}
            <li>People already signed in stay signed in until their session ends.</li>
            <li>
              <strong className="font-medium">Emergency access:</strong> {admins === 1 ? "your Admin" : `your ${admins} Admins`} can still sign in with password and MFA if {p.short} is down.
            </li>
          </ul>
        </div>
      )}
    </>
  )
}
