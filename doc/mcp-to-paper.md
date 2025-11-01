# Code ↔ Paper Mapping (MAS-MCP City)

This document explains how the MCP server code (NGSI, STA, and Actuation) implements the architectural elements described in the paper **“MAS-MCP City - Reproducible LLM-agent coordination with MCP over NGSI-LD/SensorThings…”**.
All source code, Helm charts, and fixtures referenced below are included in the public repository and Zenodo record accompanying the paper.
Reviewers and readers can reproduce every figure and trace by deploying the Helm charts (`charts/platform`, `charts/observability`) and invoking the same MCP tools described here; each invocation generates OTEL spans and policy logs matching those used in the evaluation.

---

## 1. MCP and Typed Tools (Sections 3–4)

* Each server instantiates a `Server` from `@modelcontextprotocol/sdk@^1.20.2`.
* The NGSI-LD operations (`ngsi_query`, `ngsi_read_entity`) and OGC SensorThings operations (`sta_get_datastreams`, `sta_get_observations`) are registered as **MCP tools**.
* This implements the paper’s statement that *“agents perform tool-use through MCP over NGSI-LD/STA, rather than via ad-hoc REST calls.”*

---

## 2. Capability-Gated Tool-Use (Section 7, revised)

* The helper `toolWithPolicyOtel(...)` wraps every tool registration.
  Before execution, it performs:

  1. **Scope validation** — using the scope declared by the agent in MCP metadata (*capability-based policies*).
  2. **OPA check** — querying the local OPA sidecar (*federated policy engine*).
  3. **Per-tool budget** — enforcing *rate-limit/budget* constraints.
* If any check fails, the server returns an MCP-style error with aligned classes:

  * `E-V` – policy / capability violation
  * `E-U` – quota exceeded
  * `E-P` – provider / OPA failure

---

## 3. Observability and Traceability (Section 6)

* Every tool invocation creates an **OTEL span** named `mcp.tool.<name>`.
* Spans record attributes such as tool, scope, decision, and denial reason.
* These attributes feed the Jaeger / Grafana panels shown in the results section (*trace-linked policy decisions*).

---

## 4. Safe Actuation (Section 8)

* The actuation server uses the same wrapper, but with:

  * `capability: "write"`
  * `toolClass: "writable"`
  * `requiredScope: "bms"` or `"mqtt"`
* The handler returns an **idempotent acknowledgment** containing `idempotency_key` and `effect` (`none` when `dry_run`), matching the discussion on *hysteresis / dwell, rate-limits / budgets, idempotency keys, and rollback*.

---

## 5. Reproducibility (Section 10 and Appendices)

* All tools are defined with Zod (`inputSchema`), allowing publication of:

  * the complete list of tools,
  * each tool’s validated schema,
  * OTEL traces with invocation IDs.
* This realizes the paper’s claim that *“public artifacts (code, fixtures, shareable traces, dashboards)”* enable full **experimental reproducibility**.

---

## 6. Differences from the Initial REST Version

* The original REST implementation was used only to accelerate early testing.
* The MCP version using SDK 1.20.2 is the definitive, reviewer-aligned architecture reflecting the Section 7.7 revisions.

---

## Appendix A — How to Verify (Replication Protocol)

The following steps reproduce the runtime environment and traces used in the evaluation.

### A.1 Deploy the Platform

```bash
# Deploy OpenTelemetry Collector
helm upgrade --install masmcp-obs charts/observability -n masmcp --create-namespace

# Deploy MCP servers with OPA + budgets + OTEL
helm upgrade --install masmcp charts/platform -n masmcp -f charts/platform/values-dev.yaml

# Verify pods
kubectl -n masmcp get pods
```

### A.2 Run Smoke Tests

```bash
helm upgrade --install masmcp-agents charts/agents -n masmcp
kubectl -n masmcp logs job/mas-mcp-agents-smoke -f
```

Expected output:
`All health endpoints OK.`

### A.3 Inspect Traces and Metrics

1. **Port-forward** the collector and a sample MCP service:

   ```bash
   kubectl -n masmcp port-forward svc/otel-collector 4318:4318 8888:8888 &
   kubectl -n masmcp port-forward svc/mcp-ngsi 8001:8001 &
   ```
2. **Generate a trace** by calling an MCP tool (for example, using your agent or `wscat`):

   ```bash
   wscat -c "ws://localhost:8001/?token=dev-token"
   # send: { "method": "ngsi_query", "params": {"type": "Building"} }
   ```
3. **Open Jaeger / Tempo / Grafana** connected to the OTEL Collector and verify that a span
   `mcp.tool.ngsi_query` appears with attributes:

   ```
   mcp.tool = "ngsi_query"
   mcp.scope = "ngsi"
   mcp.decision = "allow"
   ```
4. **Metrics endpoint**:

   ```bash
   curl http://localhost:8001/metrics | grep mcp_policy
   ```

   should show counters `mcp_policy_allow_total`, `mcp_policy_deny_total`, `mcp_quota_exceeded_total`.

Successful reproduction of these steps confirms that the runtime environment and observability traces correspond exactly to those described in Figures 7–8 and Section 10 of the paper.

---
