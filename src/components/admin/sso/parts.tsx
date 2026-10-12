import { Fragment, useState, type ReactNode } from "react"
import { Check, Copy, Info, AlertTriangle, CircleAlert, CheckCircle2 } from "lucide-react"
import { cn } from "@/lib/utils"

/** Renders **bold** spans inside a plain string from the SSO data file. */
export function Rich({ text }: { text: string }) {
  const parts = text.split(/\*\*(.+?)\*\*/g)
  return (
    <>
      {parts.map((p, i) =>
        i % 2 === 1
          ? <strong key={i} className="font-medium" style={{ color: "var(--fg-neutral-emphasis)" }}>{p}</strong>
          : <Fragment key={i}>{p}</Fragment>
      )}
    </>
  )
}

/** Read-only value with a Copy button — for details the admin pastes into their provider. */
export function CopyField({ id, label, hint, aka, value }: { id: string; label: string; hint?: string; aka?: string; value: string }) {
  const [copied, setCopied] = useState(false)
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1500)
    } catch {
      const el = document.getElementById(id) as HTMLInputElement | null
      el?.select()
    }
  }
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
        <label htmlFor={id} className="text-sm font-medium" style={{ color: "var(--fg-neutral-emphasis)" }}>{label}</label>
        {hint && <span className="text-xs" style={{ color: "var(--fg-neutral-muted)" }}>{hint}</span>}
      </div>
      {aka && <span className="text-xs" style={{ color: "var(--fg-neutral-muted)" }}>Also called: {aka}</span>}
      <div className="flex gap-2">
        <input
          id={id}
          readOnly
          value={value}
          onFocus={(e) => e.currentTarget.select()}
          className="h-9 min-w-0 flex-1 rounded-md px-3 font-mono text-xs outline-none focus-visible:ring-2 focus-visible:ring-ring"
          style={{ background: "var(--bg-neutral-subtle)", border: "1px solid var(--border-neutral-muted)", color: "var(--fg-neutral-emphasis)" }}
        />
        <button
          type="button"
          onClick={copy}
          className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-md px-3 text-sm font-medium transition-colors hover:bg-[var(--bg-neutral-subtle-hovered)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          style={{ border: "1px solid var(--border-neutral-muted)", color: "var(--fg-neutral-emphasis)", background: "var(--bg-card)" }}
        >
          {copied ? <Check className="size-4" style={{ color: "var(--fg-success-emphasis)" }} /> : <Copy className="size-4" />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
    </div>
  )
}

type Tone = "info" | "warning" | "danger" | "success"
const toneStyle: Record<Tone, { bg: string; border: string; fg: string; icon: typeof Info }> = {
  info: { bg: "var(--bg-info-subtle)", border: "var(--border-info-muted)", fg: "var(--fg-info-emphasis)", icon: Info },
  warning: { bg: "var(--bg-warning-subtle)", border: "var(--border-warning-muted)", fg: "var(--fg-warning-emphasis)", icon: AlertTriangle },
  danger: { bg: "var(--bg-danger-subtle)", border: "var(--border-danger-muted)", fg: "var(--fg-danger-emphasis)", icon: CircleAlert },
  success: { bg: "var(--bg-success-subtle)", border: "var(--border-success-muted)", fg: "var(--fg-success-emphasis)", icon: CheckCircle2 },
}

/** Inline message. Status is carried by icon shape as well as colour. */
export function Callout({ tone, title, children, action, className, bare = false }: { tone: Tone; title: string; children?: ReactNode; action?: ReactNode; className?: string; /** Drop the border/radius when nested inside a bordered panel. */ bare?: boolean }) {
  const t = toneStyle[tone]
  const Icon = t.icon
  return (
    <div className={cn("flex items-start gap-3 px-3.5 py-3", !bare && "rounded-lg", className)} style={{ background: t.bg, border: bare ? undefined : `1px solid ${t.border}` }}>
      <Icon className="mt-0.5 size-4 shrink-0" style={{ color: t.fg }} aria-hidden />
      <div className="flex min-w-0 flex-1 flex-col gap-0.5 text-sm">
        <span className="font-medium" style={{ color: "var(--fg-neutral-emphasis)" }}>{title}</span>
        {children && <span style={{ color: "var(--fg-neutral-muted)" }}>{children}</span>}
      </div>
      {action && <div className="shrink-0 self-center">{action}</div>}
    </div>
  )
}

/** Numbered setup progress. Collapses to "Step n of N" on narrow screens. */
export function Stepper({ steps, current }: { steps: readonly string[]; current: number }) {
  return (
    <>
      <p className="text-sm sm:hidden" style={{ color: "var(--fg-neutral-muted)" }}>
        Step {Math.min(current + 1, steps.length)} of {steps.length} · <span style={{ color: "var(--fg-neutral-emphasis)" }}>{steps[Math.min(current, steps.length - 1)]}</span>
      </p>
      <ol aria-label="Setup steps" className="hidden items-center gap-2 sm:flex">
        {steps.map((label, i) => {
          const done = i < current
          const active = i === current
          return (
            <Fragment key={label}>
              {i > 0 && <li aria-hidden className="h-px min-w-3 flex-1" style={{ background: done || active ? "var(--border-neutral-emphasis)" : "var(--border-neutral-muted)" }} />}
              <li aria-current={active ? "step" : undefined} className="flex shrink-0 items-center gap-2 text-xs">
                <span
                  className="flex size-6 items-center justify-center rounded-full text-xs font-medium"
                  style={
                    done ? { background: "var(--bg-success-emphasis)", color: "var(--fg-on-success-emphasis)" }
                      : active ? { background: "var(--bg-primary-emphasis)", color: "var(--fg-on-primary-emphasis)" }
                      : { border: "1px solid var(--border-neutral-emphasis)", color: "var(--fg-neutral-muted)" }
                  }
                >
                  {done ? <Check className="size-3.5" aria-label="Done" /> : i + 1}
                </span>
                <span className="hidden lg:inline" style={{ color: active ? "var(--fg-neutral-emphasis)" : "var(--fg-neutral-muted)", fontWeight: active ? 500 : 400 }}>{label}</span>
              </li>
            </Fragment>
          )
        })}
      </ol>
    </>
  )
}

/** Side-panel help card. */
export function TipCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5 rounded-lg p-4" style={{ border: "1px solid var(--border-neutral-muted)" }}>
      <span className="text-sm font-medium" style={{ color: "var(--fg-neutral-emphasis)" }}>{title}</span>
      <div className="text-sm" style={{ color: "var(--fg-neutral-muted)" }}>{children}</div>
    </div>
  )
}

/** Pill-style single choice (e.g. Metadata URL / Upload file / Enter manually). */
export function Segmented<T extends string>({ label, options, value, onChange }: { label: string; options: { value: T; label: string; hint?: string }[]; value: T; onChange: (v: T) => void }) {
  return (
    <div role="radiogroup" aria-label={label} className="inline-flex w-fit flex-wrap gap-1 rounded-lg p-1" style={{ background: "var(--bg-neutral-subtle)" }}>
      {options.map((o) => {
        const on = o.value === value
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={on}
            onClick={() => onChange(o.value)}
            className={cn("h-8 rounded-md px-3 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring", on && "shadow-xs")}
            style={on
              ? { background: "var(--bg-card)", color: "var(--fg-neutral-emphasis)" }
              : { color: "var(--fg-neutral-muted)" }}
          >
            {o.label}
          </button>
        )
      })}
    </div>
  )
}

/** Label / value list used for "what we read back" and connection details. */
export function DetailList({ rows, mono = true }: { rows: [string, ReactNode][]; mono?: boolean }) {
  return (
    <dl className="grid grid-cols-1 text-sm sm:grid-cols-[minmax(0,14rem)_minmax(0,1fr)]">
      {rows.map(([k, v], i) => (
        <Fragment key={k}>
          <dt className="pt-2.5 sm:py-2.5" style={{ color: "var(--fg-neutral-muted)", borderTop: i === 0 ? undefined : "1px solid var(--border-neutral-muted)" }}>{k}</dt>
          <dd className={cn("m-0 pb-2.5 [overflow-wrap:anywhere] sm:py-2.5", i > 0 && "sm:border-t sm:border-[var(--border-neutral-muted)]", mono && "font-mono text-xs leading-5")} style={{ color: "var(--fg-neutral-emphasis)" }}>{v}</dd>
        </Fragment>
      ))}
    </dl>
  )
}

export function SectionTitle({ children, sub }: { children: ReactNode; sub?: ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <h2 className="text-base font-medium" style={{ color: "var(--fg-neutral-emphasis)" }}>{children}</h2>
      {sub && <p className="max-w-[68ch] text-sm" style={{ color: "var(--fg-neutral-muted)" }}>{sub}</p>}
    </div>
  )
}
