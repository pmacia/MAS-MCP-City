// src/policy.ts
import axios from "axios"

const OPA_URL =
  process.env.OPA_URL || "http://127.0.0.1:8181/v1/data/masmcp/authz/allow"

const PER_MINUTE = Number(process.env.BUDGETS_PER_MIN || "120")
const WINDOW_MS = 60_000
const budgets: Record<string, { since: number; count: number }> = {}

function checkBudget(tool: string): boolean {
  const now = Date.now()
  const rec = budgets[tool] || { since: now, count: 0 }
  if (now - rec.since > WINDOW_MS) {
    rec.since = now
    rec.count = 0
  }
  rec.count += 1
  budgets[tool] = rec
  return rec.count <= PER_MINUTE
}

export async function authorizeTool(opts: {
  capability: "read" | "write"
  tool: string
  toolClass: "readable" | "writable"
  scope?: string
}): Promise<{ ok: true } | { ok: false; error: string; class: string }> {
  // budgets primero
  if (!checkBudget(opts.tool)) {
    return { ok: false, error: "quota_exceeded", class: "E-U" }
  }

  // OPA
  try {
    const res = await axios.post(
      OPA_URL,
      { input: opts },
      { timeout: 1000 }
    )
    const allowed = Boolean(res.data?.result)
    if (!allowed) {
      return { ok: false, error: "policy_denied", class: "E-V" }
    }
    return { ok: true }
  } catch (err) {
    // fail-closed
    return { ok: false, error: "opa_unreachable", class: "E-P" }
  }
}
