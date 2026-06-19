import { useEffect, useState } from "react"
import { Check, ShieldCheck, AlertCircle } from "lucide-react"
import { Dialog } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import { groups, type UserRole } from "@/data/users"

const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export interface InviteDraft {
  email: string
  role: UserRole
  groups: string[]
}

export function InviteMemberDialog({
  open,
  onOpenChange,
  existingEmails,
  onInvite,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  existingEmails: string[]
  onInvite: (draft: InviteDraft) => void
}) {
  const [email, setEmail] = useState("")
  const [role, setRole] = useState<UserRole>("manager")
  const [picked, setPicked] = useState<string[]>([])
  const [touched, setTouched] = useState(false)

  // reset whenever the dialog opens
  useEffect(() => {
    if (open) { setEmail(""); setRole("manager"); setPicked([]); setTouched(false) }
  }, [open])

  const trimmed = email.trim().toLowerCase()
  const emailValid = emailRe.test(trimmed)
  const duplicate = emailValid && existingEmails.some((e) => e.toLowerCase() === trimmed)
  const needsGroups = role === "manager" && picked.length === 0
  const canSend = emailValid && !duplicate && !needsGroups

  const toggleGroup = (id: string) =>
    setPicked((xs) => (xs.includes(id) ? xs.filter((x) => x !== id) : [...xs, id]))

  const submit = () => {
    setTouched(true)
    if (!canSend) return
    onInvite({ email: email.trim(), role, groups: role === "admin" ? [] : picked })
    onOpenChange(false)
  }

  const emailError = touched && !emailValid ? "Enter a valid email address." : touched && duplicate ? "A member with this email already exists." : null

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title="Invite member"
      description="Send an email invite and set their role and groups."
      footer={
        <>
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button size="sm" onClick={submit} disabled={!canSend}>Send invite</Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        {/* email */}
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="invite-email">Email address</Label>
          <Input
            id="invite-email"
            type="email"
            placeholder="name@company.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onBlur={() => setTouched(true)}
            aria-invalid={emailError ? true : undefined}
            autoFocus
          />
          {emailError && (
            <span className="inline-flex items-center gap-1 text-xs" style={{ color: "var(--fg-danger-emphasis)" }}>
              <AlertCircle className="size-3" /> {emailError}
            </span>
          )}
        </div>

        {/* role */}
        <div className="flex flex-col gap-1.5">
          <Label>Role</Label>
          <Select value={role} onValueChange={(v) => setRole(v as UserRole)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="admin">Admin</SelectItem>
              <SelectItem value="manager">CC Manager</SelectItem>
            </SelectContent>
          </Select>
          <span className="text-xs" style={{ color: "var(--fg-neutral-muted)" }}>
            {role === "admin" ? "Full administrative access across the whole org." : "Operational access, scoped to the groups below."}
          </span>
        </div>

        {/* groups */}
        {role === "manager" ? (
          <div className="flex flex-col gap-1.5">
            <Label>Groups</Label>
            <div className="flex flex-wrap gap-1.5">
              {groups.map((g) => {
                const on = picked.includes(g.id)
                return (
                  <button
                    key={g.id}
                    type="button"
                    onClick={() => toggleGroup(g.id)}
                    className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium transition-colors"
                    style={on
                      ? { background: "var(--bg-primary-subtle)", color: "var(--fg-primary-emphasis)", border: "1px solid var(--border-primary-muted)" }
                      : { background: "var(--bg-input-default)", color: "var(--fg-neutral-emphasis)", border: "1px solid var(--border-input-default)" }}
                  >
                    {on && <Check className="size-3" />}
                    {g.name}
                  </button>
                )
              })}
            </div>
            {touched && needsGroups && (
              <span className="inline-flex items-center gap-1 text-xs" style={{ color: "var(--fg-danger-emphasis)" }}>
                <AlertCircle className="size-3" /> Pick at least one group for a CC Manager.
              </span>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-2 rounded-lg p-2.5 text-xs" style={{ background: "var(--bg-neutral-subtle)", color: "var(--fg-neutral-muted)" }}>
            <ShieldCheck className="size-3.5 shrink-0" style={{ color: "var(--fg-primary-emphasis)" }} />
            Admins have access to all groups — no selection needed.
          </div>
        )}
      </div>
    </Dialog>
  )
}
