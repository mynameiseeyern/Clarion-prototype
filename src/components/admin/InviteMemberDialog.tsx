import { useEffect, useState } from "react"
import {
  Alert, AlertDescription, AlertTitle, Button,
  Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
  Field, FieldControl, FieldDescription, FieldError, FieldLabel, FieldOption,
  Input, Radio, RadioGroup,
} from "@ir/ui"
import { GroupTreePicker } from "@/components/admin/GroupTreePicker"
import { roleBlurb, roleLabel, type UserRole } from "@/data/users"

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

  const submit = () => {
    setTouched(true)
    if (!canSend) return
    onInvite({ email: email.trim(), role, groups: role === "admin" ? [] : picked })
    onOpenChange(false)
  }

  const emailError = touched && !emailValid ? "Enter a valid email address." : touched && duplicate ? "A member with this email already exists." : null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="md">
        <DialogHeader>
          <DialogTitle>Invite member</DialogTitle>
          <DialogDescription>Send an email invite and set their role and groups.</DialogDescription>
        </DialogHeader>

        <DialogBody className="gap-5">
          <Field invalid={!!emailError}>
            <FieldLabel required>Email address</FieldLabel>
            <FieldControl required>
              <Input
                type="email"
                placeholder="name@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onBlur={() => setTouched(true)}
                autoFocus
              />
            </FieldControl>
            <FieldError>{emailError}</FieldError>
          </Field>

          <fieldset className="flex flex-col gap-2">
            <legend className="mb-2 text-label-md text-content-neutral-emphasis">Role</legend>
            <RadioGroup value={role} onValueChange={(v) => setRole(v as UserRole)}>
              {(["admin", "manager"] as const).map((r) => (
                <FieldOption key={r} control={<Radio value={r} />} description={roleBlurb[r]}>
                  {roleLabel[r]}
                </FieldOption>
              ))}
            </RadioGroup>
          </fieldset>

          {role === "manager" ? (
            <Field invalid={touched && needsGroups}>
              <FieldLabel required>Groups</FieldLabel>
              <GroupTreePicker value={picked} onChange={setPicked} />
              <FieldError>Pick at least one group for a CC Manager.</FieldError>
              <FieldDescription>Assigning a group includes everything beneath it.</FieldDescription>
            </Field>
          ) : (
            <Alert variant="info">
              <AlertTitle>Admins see every group</AlertTitle>
              <AlertDescription>No group selection needed.</AlertDescription>
            </Alert>
          )}
        </DialogBody>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={submit} disabled={touched && !canSend}>Send invite</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
