# MAS-MCP City

### Reproducible LLM-Agent Coordination with MCP over NGSI-LD / SensorThings

[![License: CC BY-NC 4.0](https://img.shields.io/badge/License-CC%20BY--NC%204.0-lightgrey.svg)](https://creativecommons.org/licenses/by-nc/4.0/)
[![DOI](https://zenodo.org/badge/DOI/10.5281/zenodo.17500006.svg)](https://doi.org/10.5281/zenodo.17500006)

---

## 🌐 Overview

**MAS-MCP City** provides a complete, reproducible reference implementation of the multi-agent architecture described in the FGCS paper:

> F. Maciá-Pérez, I. Lorenzo-Fonseca, À. Maciá-Fiteni,
> *MAS-MCP City - Reproducible LLM-agent coordination with MCP over NGSI-LD/SensorThings for traceable SmartCampus IAQ and occupancy analytics*,
> *Future Generation Computer Systems*, 2025.

It integrates:

* **Anthropic Model Context Protocol (MCP)** agents and servers using the official Node SDK `@modelcontextprotocol/sdk@^1.20.2`
* **NGSI-LD** (context) and **OGC SensorThings** (timeseries) interoperability
* **OPA policies** and **capability-based authorization**
* **Budgets / rate-limits** and **idempotent actuation**
* **OpenTelemetry** end-to-end tracing and metrics via Helm-deployed collector

All source code, Helm charts, and fixtures are public and reproducible through this repository and its Zenodo release.

---

## 🧱 Repository Structure

```text
MAS-MCP-City/
├── README.md                 ← this file
├── doc/                      ← documentation (code ↔ paper, deployment, artifacts)
│   ├── mcp-to-paper.md
│   ├── deployment.md
│   ├── artifacts.md
│   └── LICENSE.md
├── mcp-servers/              ← three MCP microservices
│   ├── mcp-ngsi/             # NGSI-LD read tools
│   ├── mcp-sta/              # SensorThings read tools
│   └── actuation-mcp/        # Actuation tools (BMS, MQTT)
├── agents/                   ← coordinating agents & client library
│   ├── mcp-client/           # generic MCP WebSocket client
│   ├── iaq-orchestrator/     # SmartCampus IAQ workflow
│   └── README.md             # detailed agent layer doc + diagram
├── charts/                   ← Helm charts for deployment
│   ├── platform/             # MCP servers + OPA + budgets + OTEL
│   ├── observability/        # OTEL collector + ServiceMonitor
│   └── agents/               # smoke test job
├── fixtures/                 ← NGSI/STA sample data for reproducibility
└── .github/workflows/        ← CI (image build & Helm lint)
```

---

## 🧩 Key Components

| Layer             | Description                                                                                            | Main Technologies                  |
| ----------------- | ------------------------------------------------------------------------------------------------------ | ---------------------------------- |
| **MCP Servers**   | NGSI-LD, SensorThings, and Actuation services with OPA, budgets, and OTEL spans (`toolWithPolicyOtel`) | Node 20, MCP SDK 1.20.2, OPA, OTEL |
| **Agents**        | MCP clients (IAQ orchestrator) coordinating across servers using typed MCP tools                       | Node 20, WS transport              |
| **Observability** | OTEL Collector, Prometheus metrics, Grafana/Jaeger dashboards                                          | OpenTelemetry, Helm                |
| **Deployment**    | Kubernetes/Helm with hardened pods and policies                                                        | Helm 3, K8s 1.25+                  |
| **Fixtures**      | Reproducible NGSI-LD and SensorThings data                                                             | JSON/JSON-LD                       |
| **CI/CD**         | GitHub Actions: container builds + Helm lint                                                           | GHCR, Actions                      |

---

## ⚙️ Quick Start (local)

```bash
# 1. Deploy collector
helm upgrade --install masmcp-obs charts/observability -n masmcp --create-namespace

# 2. Deploy servers (OPA + budgets + OTEL)
helm upgrade --install masmcp charts/platform -n masmcp -f charts/platform/values-dev.yaml

# 3. Run agent (IAQ orchestrator)
AUTH_TOKEN=dev-token \
NGSI_WS=ws://localhost:8001 \
STA_WS=ws://localhost:8002 \
ACT_WS=ws://localhost:8003 \
node agents/iaq-orchestrator/dist/cli.js
```

Expected output (dry-run actuation):

```json
{
  "ok": true,
  "action": "ventilation_boost",
  "building": "urn:ngsi-ld:Building:ES-UA:A1",
  "co2": 1120,
  "ack": { "status": "accepted", "effect": "planned", "idempotency_key": "..." }
}
```

---

## 📊 Verification and Reproducibility

* **Traces:** OTEL spans appear as `mcp.tool.<name>` in Jaeger/Tempo.
* **Metrics:** `/metrics` endpoint exports
  `mcp_policy_allow_total`, `mcp_policy_deny_total`, `mcp_quota_exceeded_total`.
* **OPA Policies:** configurable via ConfigMap `masmcp-opa-policies`.
* **Figures reproduced:**

  * Fig. 5–6 → Helm/K8s topology
  * Fig. 7 → Data and control flow (Agents ↔ Servers)
  * Fig. 8 → Trace-linked dashboards

Detailed replication protocol: [`doc/mcp-to-paper.md`](doc/mcp-to-paper.md).

---

## 📚 Documentation Map

| Document                                     | Purpose                                      |
| -------------------------------------------- | -------------------------------------------- |
| [`doc/mcp-to-paper.md`](doc/mcp-to-paper.md) | Code ↔ paper mapping + replication protocol  |
| [`doc/deployment.md`](doc/deployment.md)     | Helm / Kubernetes deployment guide           |
| [`doc/artifacts.md`](doc/artifacts.md)       | List of released artifacts, fixtures, charts |
| [`agents/README.md`](agents/README.md)       | Agent layer design, usage, and diagram       |
| [`README-v1.0.md`](README-v1.0.md)           | Release notes for v1.0 (FGCS submission)     |

---

## 🔐 License

All code and data are released under **Creative Commons Attribution-NonCommercial 4.0 International (CC BY-NC 4.0)**.
Reuse is permitted with citation and acknowledgment of the MAS-MCP City authors.

---

## 🧾 Citation

> F. Maciá-Pérez, I. Lorenzo-Fonseca, À. Maciá-Fiteni,
> *MAS-MCP City - Reproducible LLM-agent coordination with MCP over NGSI-LD/SensorThings for traceable SmartCampus IAQ and occupancy analytics*,
> *Future Generation Computer Systems*, 2025.
> DOI: [10.5281/zenodo.17500006](https://doi.org/10.5281/zenodo.17500006)

---

