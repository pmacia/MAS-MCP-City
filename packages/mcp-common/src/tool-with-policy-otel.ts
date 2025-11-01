// src/tool-with-policy-otel.ts
import { Server } from "@modelcontextprotocol/sdk/server"
import { z, ZodTypeAny } from "zod"
import { authorizeTool } from "./policy.js"
import { context, trace, SpanStatusCode } from "@opentelemetry/api"

type Capability = "read" | "write"
type ToolClass = "readable" | "writable"

interface ToolPolicyOpts {
  capability: Capability
  toolClass: ToolClass
  requiredScope?: string
}

/**
 * Registra una MCP tool con:
 *  - validación (Zod)
 *  - OPA + budgets
 *  - OTEL span por invocación
 */
export function toolWithPolicyOtel<
  TSchema extends ZodTypeAny,
  TParsed = ReturnType<TSchema["parse"]>
>(
  server: Server,
  name: string,
  meta: {
    description: string
    inputSchema: TSchema
  },
  policy: ToolPolicyOpts,
  handler: (input: TParsed) => Promise<unknown> | unknown
) {
  server.tool(
    name,
    {
      description: meta.description,
      inputSchema: meta.inputSchema
    },
    async (input: any, ctx: any) => {
      const tracer = trace.getTracer("mcp-server")
      // intentamos heredar contexto (por si el cliente manda traceparent)
      return await context.with(trace.setSpan(context.active(), trace.getSpan(context.active())!), async () => {
        const span = tracer.startSpan(`mcp.tool.${name}`)
        try {
          // metadatos (si vienen)
          const scopeFromClient =
            (ctx?.metadata?.scope as string | undefined) ||
            (input?.scope as string | undefined)

          span.setAttribute("mcp.tool", name)
          span.setAttribute("mcp.capability", policy.capability)
          span.setAttribute("mcp.tool_class", policy.toolClass)
          if (scopeFromClient)
            span.setAttribute("mcp.scope", scopeFromClient)

          // 1) comprobación de scope requerido
          if (policy.requiredScope && scopeFromClient !== policy.requiredScope) {
            span.setAttribute("mcp.decision", "capability_mismatch")
            span.setStatus({
              code: SpanStatusCode.ERROR,
              message: "capability_denied"
            })
            return {
              ok: false,
              error: "capability_denied",
              class: "E-V",
              required: policy.requiredScope,
              got: scopeFromClient ?? null
            }
          }

          // 2) OPA + budgets
          const auth = await authorizeTool({
            capability: policy.capability,
            tool: name,
            toolClass: policy.toolClass,
            scope: scopeFromClient
          })
          if (!auth.ok) {
            span.setAttribute("mcp.decision", "denied")
            span.setAttribute("mcp.deny_reason", auth.error)
            span.setStatus({
              code: SpanStatusCode.ERROR,
              message: auth.error
            })
            return auth
          }

          // 3) ejecutar handler real
          const result = await handler(input as TParsed)
          span.setAttribute("mcp.decision", "allow")
          span.setStatus({ code: SpanStatusCode.OK })
          return result
        } catch (err: any) {
          span.setStatus({
            code: SpanStatusCode.ERROR,
            message: err?.message || "handler_error"
          })
          return {
            ok: false,
            error: "handler_error",
            details: String(err),
            class: "E-P"
          }
        } finally {
          span.end()
        }
      })
    }
  )
}
