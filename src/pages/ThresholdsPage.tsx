import { useState } from "react"
import { Pencil, Trash2, Plus, RotateCcw } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Chip } from "@/components/ui/chip"
import { ThresholdSlider } from "@/components/thresholds/ThresholdSlider"
import { RuleEditor } from "@/components/thresholds/RuleEditor"
import { toast } from "@/components/ui/toast"
import {
  METRICS, metricById, defaultPolicy, initialRules, scopeById, fmtRange,
  type ThresholdRule, type ThresholdPolicy,
} from "@/data/thresholds"

export function ThresholdsPage() {
  // default policy: `policy` is the working draft, `savedPolicy` is the committed state.
  // Edits stay in the draft until Save (these thresholds drive alerting fleet-wide).
  // TODO(eng): seed/reset values from real engineering defaults.
  const clone = (p: ThresholdPolicy) => JSON.parse(JSON.stringify(p)) as ThresholdPolicy
  const [savedPolicy, setSavedPolicy] = useState<ThresholdPolicy>(() => clone(defaultPolicy))
  const [policy, setPolicy] = useState<ThresholdPolicy>(() => clone(defaultPolicy))
  const [rules, setRules] = useState<ThresholdRule[]>(initialRules)
  const [editorOpen, setEditorOpen] = useState(false)
  const [editing, setEditing] = useState<ThresholdRule | null>(null)
  const [saving, setSaving] = useState(false)
  const [justSaved, setJustSaved] = useState(false)

  const dirty = JSON.stringify(policy) !== JSON.stringify(savedPolicy)
  const isCustom = JSON.stringify(savedPolicy) !== JSON.stringify(defaultPolicy)

  const setBand = (id: string, warn: number, crit: number) => setPolicy((p) => ({ ...p, [id]: { warn, crit } }))
  const resetMetric = (id: string) => { const m = metricById(id); if (m) setBand(id, m.defaultWarn, m.defaultCrit) }
  // TODO(api): POST default thresholds; map the response → success/error here.
  const savePolicy = () => {
    setSaving(true)
    window.setTimeout(() => {
      setSavedPolicy(clone(policy))
      setSaving(false)
      setJustSaved(true)
      window.setTimeout(() => setJustSaved(false), 3000)
    }, 700) // mock backend round-trip
  }
  const discardPolicy = () => setPolicy(clone(savedPolicy))
  const resetToDefaults = () => setPolicy(clone(defaultPolicy))

  const openNew = () => { setEditing(null); setEditorOpen(true) }
  const openEdit = (r: ThresholdRule) => { setEditing(r); setEditorOpen(true) }
  const removeRule = (id: string) => {
    const name = rules.find((r) => r.id === id)?.name
    setRules((rs) => rs.filter((r) => r.id !== id))
    toast({ variant: "info", title: "Custom rule deleted", description: name })
  }
  // TODO(api): PUT/POST custom rule; map the response → toast (success/error).
  const saveRule = (rule: ThresholdRule) => {
    const existed = rules.some((r) => r.id === rule.id)
    setRules((rs) => (existed ? rs.map((r) => (r.id === rule.id ? rule : r)) : [...rs, rule]))
    toast({ variant: "success", title: existed ? "Custom rule updated" : "Custom rule created", description: rule.name })
  }

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-4">
      {/* Section 1 — Default thresholds */}
      <Card className="w-full gap-0 overflow-hidden rounded-xl p-0">
        <div className="flex flex-wrap items-start justify-between gap-3 px-5 py-4" style={{ borderBottom: "1px solid var(--border-neutral-subtle)" }}>
          <div className="flex flex-col">
            <h2 className="text-base font-medium" style={{ color: "var(--fg-neutral-emphasis)" }}>Default thresholds</h2>
            <span className="text-sm" style={{ color: "var(--fg-neutral-muted)" }}>Applies to every device unless a custom rule overrides it</span>
          </div>
          {/* Save-gated: edits stay in a draft until committed. After save, a confirmation + Reset appears. */}
          <div className="flex items-center gap-2">
            {saving ? (
              <Button size="sm" loading>Saving…</Button>
            ) : dirty ? (
              <>
                <Button variant="ghost" size="sm" onClick={discardPolicy}>Discard</Button>
                <Button size="sm" onClick={savePolicy}>Save changes</Button>
              </>
            ) : (
              <>
                {justSaved && <span className="text-xs font-medium" style={{ color: "var(--fg-success-emphasis)" }}>Changes have been applied</span>}
                {isCustom ? (
                  <Button variant="outline" size="sm" className="gap-1.5" onClick={resetToDefaults}>
                    <RotateCcw className="size-3.5" /> Reset to defaults
                  </Button>
                ) : !justSaved ? (
                  <span className="text-xs" style={{ color: "var(--fg-neutral-subtle)" }}>Using defaults</span>
                ) : null}
              </>
            )}
          </div>
        </div>

        {METRICS.map((m, i) => (
          <div key={m.id} className="flex flex-col gap-3 px-5 py-5 sm:flex-row sm:items-center sm:gap-6" style={{ borderTop: i ? "1px solid var(--border-neutral-subtle)" : undefined }}>
            <div className="flex items-start gap-2.5 sm:w-52 sm:shrink-0">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-lg" style={{ background: "var(--bg-neutral-subtle)", color: "var(--fg-neutral-muted)" }}>
                <m.icon className="size-4" />
              </span>
              <div className="flex flex-col">
                <span className="text-sm font-medium" style={{ color: "var(--fg-neutral-emphasis)" }}>{m.name}</span>
                <span className="text-xs" style={{ color: "var(--fg-neutral-subtle)" }}>{m.direction === "higher" ? "Higher is worse" : "Lower is worse"}</span>
              </div>
            </div>
            <div className="min-w-px flex-1">
              <ThresholdSlider metric={m} warn={policy[m.id].warn} crit={policy[m.id].crit} onChange={(w, c) => setBand(m.id, w, c)} />
            </div>
            <div className="flex sm:w-8 sm:shrink-0 sm:justify-end">
              {(policy[m.id].warn !== m.defaultWarn || policy[m.id].crit !== m.defaultCrit) && (
                <button type="button" aria-label={`Set ${m.name} to default`} title="Set to default" onClick={() => resetMetric(m.id)}
                  className="flex size-8 items-center justify-center rounded-md transition-colors hover:bg-[var(--bg-neutral-subtle-hovered)]" style={{ color: "var(--fg-neutral-muted)" }}>
                  <RotateCcw className="size-4" />
                </button>
              )}
            </div>
          </div>
        ))}
      </Card>

      {/* Section 2 — Rules */}
      <Card className="w-full gap-0 overflow-hidden rounded-xl p-0">
        <div className="flex flex-col px-5 py-4" style={{ borderBottom: "1px solid var(--border-neutral-subtle)" }}>
          <h2 className="text-base font-medium" style={{ color: "var(--fg-neutral-emphasis)" }}>Custom rules</h2>
          <span className="text-sm" style={{ color: "var(--fg-neutral-muted)" }}>Custom thresholds for specific scopes. Each rule applies to the regions you select. Only metrics you override differ from the default.</span>
        </div>

        {rules.length === 0 ? (
          <div className="px-5 py-12 text-center">
            <p className="text-sm font-medium" style={{ color: "var(--fg-neutral-emphasis)" }}>No custom rules yet</p>
            <p className="mt-1 text-sm" style={{ color: "var(--fg-neutral-muted)" }}>Create a custom rule to override the default thresholds for specific regions.</p>
          </div>
        ) : (
          rules.map((r, i) => {
            const overridden = METRICS.filter((m) => m.id in r.overrides)
            return (
              <div key={r.id} className="flex items-start justify-between gap-3 px-5 py-4" style={{ borderTop: i ? "1px solid var(--border-neutral-subtle)" : undefined }}>
                <div className="flex min-w-px flex-col gap-2">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    <span className="text-sm font-medium" style={{ color: "var(--fg-neutral-emphasis)" }}>{r.name}</span>
                    {r.scopes.map((id) => <Chip key={id} size="sm">{scopeById(id)?.name ?? id}</Chip>)}
                  </div>
                  {/* expose exactly which metrics + threshold values this rule overrides */}
                  <div className="flex flex-wrap items-center gap-1.5">
                    {overridden.map((m) => (
                      <span key={m.id} className="inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs" style={{ background: "var(--bg-neutral-subtle)", border: "1px solid var(--border-neutral-subtle)" }}>
                        <span style={{ color: "var(--fg-neutral-muted)" }}>{m.name}</span>
                        <span className="font-mono font-semibold" style={{ color: "var(--fg-neutral-emphasis)" }}>{fmtRange(m, r.overrides[m.id].warn, r.overrides[m.id].crit)}</span>
                      </span>
                    ))}
                    <span className="text-xs" style={{ color: "var(--fg-neutral-subtle)" }}>· {overridden.length} of {METRICS.length} overridden</span>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <button type="button" aria-label={`Edit ${r.name}`} onClick={() => openEdit(r)}
                    className="flex size-8 items-center justify-center rounded-md transition-colors hover:bg-[var(--bg-neutral-subtle-hovered)]" style={{ color: "var(--fg-neutral-muted)" }}>
                    <Pencil className="size-4" />
                  </button>
                  <button type="button" aria-label={`Delete ${r.name}`} onClick={() => removeRule(r.id)}
                    className="flex size-8 items-center justify-center rounded-md transition-colors hover:bg-[var(--bg-neutral-subtle-hovered)]" style={{ color: "var(--fg-neutral-muted)" }}>
                    <Trash2 className="size-4" />
                  </button>
                </div>
              </div>
            )
          })
        )}

        <button type="button" onClick={openNew}
          className="flex w-full items-center justify-center gap-1.5 px-5 py-3 text-sm font-medium transition-colors hover:bg-[var(--bg-neutral-subtle-hovered)]"
          style={{ borderTop: "1px solid var(--border-neutral-subtle)", color: "var(--fg-link-default)" }}>
          <Plus className="size-4" /> New custom rule
        </button>
      </Card>

      <RuleEditor open={editorOpen} rule={editing} baseline={savedPolicy} onOpenChange={setEditorOpen} onSave={saveRule} />
    </div>
  )
}
