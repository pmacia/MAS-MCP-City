# MAS-MCP City v1.0.0
Reproducible LLM-agent coordination with MCP over NGSI-LD/SensorThings for traceable SmartCampus IAQ and occupancy analytics

This release delivers the complete implementation corresponding to the FGCS submission, including:
- MCP servers in Node.js using the official SDK `@modelcontextprotocol/sdk@^1.20.2`
- Three domain endpoints:
  - `mcp-ngsi` (NGSI-LD read tools: `ngsi_query`, `ngsi_read_entity`)
  - `mcp-sta` (SensorThings tools: `sta_get_datastreams`, `sta_get_observations`)
  - `actuation-mcp` (BMS / MQTT actuation with idempotent acks)
- Capability-gated tool-use:
  - OPA sidecar per service
  - Per-tool budgets (default: 120 calls/min)
  - Scope-aware tools (`ngsi`, `sta`, `bms`, `mqtt`)
- Full observability:
  - OTLP export (traces + metrics)
  - `/metrics` with `mcp_policy_allow_total`, `mcp_policy_deny_total`, `mcp_quota_exceeded_total`
  - Helm chart for OpenTelemetry Collector and ServiceMonitor
- Deployment artifacts:
  - `charts/platform`
  - `charts/observability`
  - `charts/agents` (smoke tests)
- Agent layer:
  - `agents/mcp-client` (WS MCP client with scopes)
  - `agents/iaq-orchestrator` (SmartCampus IAQ workflow)

## Repository structure
- `mcp-servers/` — 3 MCP services (NGSI, STA, Actuation)
- `agents/` — MCP client + IAQ orchestrator
- `charts/` — Helm charts to deploy the whole stack on Kubernetes
- `fixtures/` — reproducible NGSI-LD and SensorThings data
- `doc/` — documentation for reviewers:
  - `mcp-to-paper.md` (code ↔ paper mapping + replication protocol)
  - `deployment.md` (Helm, observability)
  - `artifacts.md` (enumeration of released assets)

## How to deploy (development)
```bash
# 1. Observability
helm upgrade --install masmcp-obs charts/observability -n masmcp --create-namespace

# 2. MCP servers (with OPA + budgets + OTEL)
helm upgrade --install masmcp charts/platform -n masmcp -f charts/platform/values-dev.yaml

# 3. Smoke tests
helm upgrade --install masmcp-agents charts/agents -n masmcp
kubectl -n masmcp logs job/mas-mcp-agents-smoke -f
