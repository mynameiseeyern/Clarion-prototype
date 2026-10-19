import { useEffect, useMemo, useState } from "react"
import { ArrowLeft, Download, FileText, UserMinus, UserPlus, Users } from "lucide-react"
import {
  Alert, AlertDescription, AlertTitle, Badge, Button,
  Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
  Field, FieldControl, FieldLabel, FileUpload, Input,
  SegmentedControl, SegmentedControlItem,
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@ir/ui"
import { toast } from "@/components/ui/toast"
import {
  TEMPLATE_CSV, applyPlan, changeListCsv, downloadText, planImport, samples, store, toCsv,
  type ImportMode, type Plan, type PlanKind,
} from "@/data/widgetUsers"
import { cn } from "@/lib/utils"

const modes: { id: ImportMode; title: string; body: string; icon: typeof Users }[] = [
  { id: "upsert", icon: UserPlus, title: "Add or update people",
    body: "New login IDs are added. People already on the list get the name, email or site in the file. Nobody is removed." },
  { id: "remove", icon: UserMinus, title: "Take people off",
    body: "A file of login IDs to deactivate or remove. Only the people listed are affected." },
  { id: "replace", icon: Users, title: "Replace the whole list",
    body: "Advanced. The file becomes the list: anyone not in it is deactivated or removed. Use a full export, not a filtered one." },
]

const kindLabel: Record<PlanKind, string> = {
  new: "New", update: "Updates", unchanged: "No change", invalid: "Invalid", duplicate: "Duplicates", remove: "To take off", notFound: "Not on list",
}
const kindColor: Record<PlanKind, "success" | "info" | "neutral" | "danger" | "warning"> = {
  new: "success", update: "info", unchanged: "neutral", invalid: "danger", duplicate: "warning", remove: "danger", notFound: "warning",
}

const fmt = (n: number) => n.toLocaleString()

export function ImportFlow({ open, onOpenChange, initialMode }: { open: boolean; onOpenChange: (o: boolean) => void; initialMode: ImportMode }) {
  const [mode, setMode] = useState<ImportMode>(initialMode)
  const [text, setText] = useState<string | null>(null)
  const [fileName, setFileName] = useState("")
  const [step, setStep] = useState<"choose" | "review">("choose")
  const [removal, setRemoval] = useState<"deactivate" | "remove">("deactivate")
  const [typed, setTyped] = useState("")
  const [show, setShow] = useState<string>("changes")

  useEffect(() => {
    if (open) { setMode(initialMode); setText(null); setFileName(""); setStep("choose"); setRemoval("deactivate"); setTyped(""); setShow("changes") }
  }, [open, initialMode])

  const plan: Plan | null = useMemo(() => (text != null ? planImport(text, mode) : null), [text, mode])

  const load = async (file: File | undefined) => {
    if (!file) return
    setFileName(file.name)
    setText(await file.text())
    setStep("review")
  }
  const useSample = (name: string, csv: string) => { setFileName(name); setText(csv); setStep("review") }

  const apply = () => {
    if (!plan || text == null) return
    const s = applyPlan(plan, text, { removalAction: removal })
    const parts = [
      s.added && `${fmt(s.added)} added`, s.updated && `${fmt(s.updated)} updated`,
      s.deactivated && `${fmt(s.deactivated)} deactivated`, s.removed && `${fmt(s.removed)} removed`,
    ].filter(Boolean)
    toast({ title: parts.length ? `Done: ${parts.join(", ")}.` : "Nothing to change.", description: s.skipped ? `${fmt(s.skipped)} rows were skipped.` : "Recorded in the audit log." })
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="lg">
        <DialogHeader>
          <DialogTitle>{step === "choose" ? "Import from a file" : `Review ${fileName || "file"}`}</DialogTitle>
          <DialogDescription>
            {step === "choose" ? "Nothing changes until you've reviewed what the file will do." : `${modes.find((m) => m.id === mode)!.title} · ${fmt(plan?.fileRows ?? 0)} rows`}
          </DialogDescription>
        </DialogHeader>

        <DialogBody className="max-h-[68vh] gap-5 overflow-y-auto">
          {step === "choose" ? (
            <Choose mode={mode} setMode={setMode} onFile={load} onSample={useSample} />
          ) : plan ? (
            <Review plan={plan} removal={removal} setRemoval={setRemoval} typed={typed} setTyped={setTyped} show={show} setShow={setShow} />
          ) : null}
        </DialogBody>

        <DialogFooter className="justify-between">
          {step === "review" ? (
            <Button variant="ghost" onClick={() => { setStep("choose"); setText(null) }}><ArrowLeft /> Choose another file</Button>
          ) : <span />}
          <div className="flex gap-2">
            {step === "review" && plan && (
              <Button variant="outline" onClick={() => downloadText("widget-user-changes.csv", changeListCsv(plan))}><Download /> Download changes</Button>
            )}
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            {step === "review" && plan && <ApplyButton plan={plan} removal={removal} typed={typed} onApply={apply} />}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function ApplyButton({ plan, removal, typed, onApply }: { plan: Plan; removal: "deactivate" | "remove"; typed: string; onApply: () => void }) {
  const leaving = plan.mode === "remove" ? plan.counts.remove : plan.removals.length
  const changes = plan.counts.new + plan.counts.update + leaving
  const skipped = plan.counts.invalid + plan.counts.duplicate
  const needsTyped = plan.mode === "replace" && leaving > 0
  const disabled = !!plan.blocking.length || changes === 0 || (needsTyped && typed.replace(/[,\s]/g, "") !== String(leaving))
  const verb = leaving && !plan.counts.new && !plan.counts.update ? (removal === "remove" ? "Remove" : "Deactivate") : "Apply"
  const label = skipped && plan.mode !== "replace" ? `${verb} ${fmt(changes)} valid ${changes === 1 ? "change" : "changes"}` : `${verb} ${fmt(changes)} ${changes === 1 ? "change" : "changes"}`
  return <Button variant={removal === "remove" && leaving ? "destructive" : "default"} disabled={disabled} onClick={onApply}>{label}</Button>
}

function Choose({ mode, setMode, onFile, onSample }: {
  mode: ImportMode; setMode: (m: ImportMode) => void; onFile: (f: File | undefined) => void; onSample: (name: string, csv: string) => void
}) {
  return (
    <>
      <div className="flex flex-col gap-2">
        <span className="text-label-md text-content-neutral-emphasis">What should this file do?</span>
        <div className="grid gap-2 sm:grid-cols-3">
          {modes.map((m) => (
            <button
              key={m.id}
              type="button"
              aria-pressed={mode === m.id}
              onClick={() => setMode(m.id)}
              className={cn(
                "flex flex-col gap-1.5 rounded-lg border p-3 text-start transition-colors",
                mode === m.id ? "border-line-focused bg-surface-selected-subtle" : "border-line-neutral-muted hover:bg-surface-neutral-subtle-hovered",
              )}
            >
              <span className="flex items-center gap-2 text-label-md text-content-neutral-emphasis"><m.icon className="size-4" />{m.title}</span>
              <span className="text-body-sm text-content-neutral-muted">{m.body}</span>
            </button>
          ))}
        </div>
      </div>

      <Field>
        <FieldLabel>CSV file</FieldLabel>
        <FieldControl><FileUpload accept=".csv,text/csv" onFilesChange={(fs) => onFile(fs[0])} /></FieldControl>
      </Field>
      <div className="flex flex-wrap gap-2">
        <Button variant="ghost" size="sm" onClick={() => downloadText("clarion-widget-users-template.csv", TEMPLATE_CSV)}><FileText /> Template</Button>
        <Button variant="ghost" size="sm" onClick={() => downloadText("clarion-widget-users.csv", toCsv(store.all(), true))}><Download /> Export the current list to edit</Button>
      </div>

      <div className="flex flex-col gap-2 rounded-lg border border-dashed border-line-neutral-muted p-3">
        <span className="text-label-sm text-content-neutral-muted">Prototype only — try a test file</span>
        <div className="flex flex-wrap gap-2">
          {mode === "upsert" && <Button variant="secondary" size="xs" onClick={() => onSample("new-starters-and-fixes.csv", samples.addUpdate())}>New starters, fixes and a few bad rows</Button>}
          {mode === "remove" && <Button variant="secondary" size="xs" onClick={() => onSample("leavers.csv", samples.remove())}>Leavers list</Button>}
          {mode === "replace" && (
            <>
              <Button variant="secondary" size="xs" onClick={() => onSample("full-export-edited.csv", samples.replaceFull())}>Full export, lightly edited</Button>
              <Button variant="secondary" size="xs" onClick={() => onSample("sydney-filtered-export.csv", samples.replacePartial())}>A filtered export by mistake</Button>
            </>
          )}
        </div>
      </div>
    </>
  )
}

function Review({ plan, removal, setRemoval, typed, setTyped, show, setShow }: {
  plan: Plan; removal: "deactivate" | "remove"; setRemoval: (r: "deactivate" | "remove") => void
  typed: string; setTyped: (t: string) => void; show: string; setShow: (s: string) => void
}) {
  const leaving = plan.mode === "remove" ? plan.counts.remove : plan.removals.length
  const kinds: PlanKind[] =
    plan.mode === "remove" ? ["remove", "notFound", "duplicate", "invalid"] : ["new", "update", "unchanged", "invalid", "duplicate"]
  const lookalikes = plan.rows.filter((r) => r.lookalike)
  const problems = plan.counts.invalid + plan.counts.duplicate + plan.counts.notFound

  const rows = plan.rows.filter((r) =>
    show === "changes" ? r.kind === "new" || r.kind === "update" || r.kind === "remove" :
    show === "problems" ? r.kind === "invalid" || r.kind === "duplicate" || r.kind === "notFound" :
    show === "all" ? true : false)

  return (
    <>
      {/* counts */}
      <div className="flex flex-wrap gap-2">
        {kinds.map((k) => (
          <div key={k} className="flex min-w-28 flex-1 flex-col gap-1 rounded-lg border border-line-neutral-muted p-3">
            <span className="text-body-sm text-content-neutral-muted">{kindLabel[k]}</span>
            <span className="font-mono text-heading-sm text-content-neutral-emphasis">{fmt(plan.counts[k])}</span>
          </div>
        ))}
        {plan.mode === "replace" && (
          <div className="flex min-w-28 flex-1 flex-col gap-1 rounded-lg border border-line-danger-muted bg-surface-danger-subtle p-3">
            <span className="text-body-sm text-content-on-danger-subtle">Not in file</span>
            <span className="font-mono text-heading-sm text-content-on-danger-subtle">{fmt(leaving)}</span>
          </div>
        )}
      </div>

      {plan.blocking.map((b) => (
        <Alert key={b} variant="destructive" role="alert"><AlertTitle>Can't apply this file</AlertTitle><AlertDescription>{b}</AlertDescription></Alert>
      ))}
      {plan.warnings.map((w) => (
        <Alert key={w} variant="warning"><AlertTitle>Check before you apply</AlertTitle><AlertDescription>{w}</AlertDescription></Alert>
      ))}
      {!plan.blocking.length && plan.mode === "upsert" && (plan.counts.invalid > 0) && (
        <Alert variant="info">
          <AlertTitle>{fmt(plan.counts.invalid)} {plan.counts.invalid === 1 ? "row" : "rows"} will be skipped</AlertTitle>
          <AlertDescription>Safe to skip here: this mode never removes anyone, so a skipped row just means that person isn't added or updated. Fix the file and import again to include them.</AlertDescription>
        </Alert>
      )}
      {lookalikes.length > 0 && (
        <Alert variant="warning">
          <AlertTitle>{fmt(lookalikes.length)} new {lookalikes.length === 1 ? "login ID looks" : "login IDs look"} like someone already on the list</AlertTitle>
          <AlertDescription>
            For example <span className="font-mono">{lookalikes[0].loginId}</span> and <span className="font-mono">{lookalikes[0].lookalike}</span>. Login IDs must match exactly, so these would be added as a second person and use another licence.
          </AlertDescription>
        </Alert>
      )}
      {plan.counts.new > 0 && (
        <p className="text-body-sm text-content-neutral-muted">
          Uses {fmt(plan.licence.newUsers)} of {fmt(plan.licence.available)} available {plan.licence.available === 1 ? "licence" : "licences"}.
        </p>
      )}

      {/* what happens to people leaving */}
      {leaving > 0 && (
        <div className="flex flex-col gap-3 rounded-lg border border-line-neutral-muted p-4">
          <span className="text-label-md text-content-neutral-emphasis">
            {fmt(leaving)} {leaving === 1 ? "person" : "people"} will come off the list. What should happen to them?
          </span>
          <SegmentedControl value={removal} onValueChange={(v: string) => setRemoval(v as "deactivate" | "remove")} size="sm" className="self-start">
            <SegmentedControlItem value="deactivate">Deactivate (can undo)</SegmentedControlItem>
            <SegmentedControlItem value="remove">Remove permanently</SegmentedControlItem>
          </SegmentedControl>
          {plan.mode === "replace" && (
            <>
              <ul className="flex max-h-32 flex-col gap-1 overflow-y-auto text-body-sm text-content-neutral-emphasis">
                {plan.removals.slice(0, 50).map((u) => <li key={u.userId} className="truncate">{u.name || u.loginId} <span className="text-content-neutral-muted">· {u.loginId}</span></li>)}
                {leaving > 50 && <li className="text-content-neutral-muted">…and {fmt(leaving - 50)} more (in Download changes)</li>}
              </ul>
              <Field>
                <FieldLabel>Type {fmt(leaving)} to confirm</FieldLabel>
                <FieldControl><Input inputMode="numeric" className="max-w-40" value={typed} onChange={(e) => setTyped(e.target.value)} /></FieldControl>
              </Field>
            </>
          )}
        </div>
      )}

      {/* rows */}
      <div className="flex flex-col gap-2">
        <SegmentedControl value={show} onValueChange={setShow} size="sm" className="self-start">
          <SegmentedControlItem value="changes">Changes</SegmentedControlItem>
          <SegmentedControlItem value="problems">Problems ({fmt(problems)})</SegmentedControlItem>
          <SegmentedControlItem value="all">All rows</SegmentedControlItem>
        </SegmentedControl>
        <div className="max-h-72 overflow-y-auto rounded-lg border border-line-neutral-muted">
          <Table size="sm">
            <TableHeader>
              <TableRow><TableHead className="w-14">Row</TableHead><TableHead>Login ID</TableHead><TableHead>Name</TableHead><TableHead>What happens</TableHead></TableRow>
            </TableHeader>
            <TableBody>
              {rows.slice(0, 200).map((r) => (
                <TableRow key={`${r.row}-${r.loginId}`}>
                  <TableCell numeric>{r.row}</TableCell>
                  <TableCell className="max-w-48 truncate font-mono text-body-sm">{r.loginId || "—"}</TableCell>
                  <TableCell className="max-w-40 truncate">{r.name || "—"}</TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      <Badge color={kindColor[r.kind]} className="self-start">{kindLabel[r.kind].replace(/s$/, "")}</Badge>
                      {r.changes?.map((c) => (
                        <span key={c.field} className="text-body-sm text-content-neutral-muted">
                          {c.field}: <s>{c.from || "(blank)"}</s> → <span className="text-content-neutral-emphasis">{c.to}</span>
                        </span>
                      ))}
                      {r.reason && <span className="text-body-sm text-content-neutral-muted">{r.reason}</span>}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {rows.length === 0 && (
                <TableRow><TableCell colSpan={4} className="text-center text-content-neutral-muted">Nothing here.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        {rows.length > 200 && <span className="text-body-sm text-content-neutral-muted">Showing 200 of {fmt(rows.length)}. Download changes for the full list.</span>}
        {plan.mode !== "remove" && <span className="text-body-sm text-content-neutral-muted">Blank cells keep the current value. Extra columns from an export (status, connection, last seen, added) are ignored.</span>}
      </div>
    </>
  )
}
