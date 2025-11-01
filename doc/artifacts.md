# MAS-MCP City — Released Artifacts (v1.0)

This document enumerates all public artifacts released with version 1.0 of **MAS-MCP City** and maps each component to the corresponding sections and figures of the FGCS paper.


### Dataset Cards
- [CO₂ Dataset](data-card-co2.md)
- [Wi-Fi Dataset](data-card-wifi.md)
- [Room Booking Dataset](data-card-bookings.md)

---

## 1. Source Code (core)
| Component | Path | Description | Paper Section |
|------------|------|-------------|----------------|
| `mcp-servers/mcp-ngsi` | MCP server for NGSI-LD read tools (`ngsi_query`, `ngsi_read_entity`) | §3–4 |
| `mcp-servers/mcp-sta` | MCP server for OGC SensorThings (`sta_get_datastreams`, `sta_get_observations`) | §3–4 |
| `mcp-servers/actuation-mcp` | MCP server for actuation (`bms_setpoint_write`, `iot_publish_mqtt`) | §8 |
| `packages/mcp-common` *(optional)* | Shared OTEL + policy wrappers (`toolWithPolicyOtel`) | §6–7 |

Each server exposes a WebSocket endpoint and a health check (`/health`), runs OPA sidecar authorization, and publishes Prometheus metrics (`/metrics`).

---

## 2. Fixtures
| Path | Format | Purpose | Paper Section |
|------|---------|----------|---------------|
| `fixtures/ngsi/building_A1.jsonld` | JSON-LD | Sample NGSI-LD building entity (`urn:ngsi-ld:Building:ES-UA:A1`) | §5.2 (SmartCampus) |
| `fixtures/sta/datastream_1001.json` | JSON | Sample SensorThings datastream (“CO₂ A1-1.01”) | §5.2 |
| `fixtures/sta/observations_1001.json` | JSON | Sample time-series CO₂ readings | Fig. 7B–C |

These fixtures allow deterministic re-runs of the campus scenario and were used to generate all ablation and validation traces.

---

## 3. Helm Charts
| Chart | Path | Purpose | Paper Section |
|--------|------|----------|---------------|
| `platform/` | `charts/platform` | Deploys MCP servers with OPA sidecar, budgets, and OTLP telemetry | §9–10 |
| `observability/` | `charts/observability` | OpenTelemetry Collector, ServiceMonitor (Prometheus) | Fig. 5C |
| `agents/` | `charts/agents` | Smoke-test Job verifying `/health` of all services | §10 |

All charts include liveness/readiness probes and token authentication for the WebSocket endpoints.

---

## 4. Continuous Integration
| Workflow | Path | Description |
|-----------|------|-------------|
| `build-images.yml` | `.github/workflows/` | Builds and pushes Docker images for all MCP servers to GHCR upon tagging |
| `helm-lint.yml` | `.github/workflows/` | Lints all Helm charts on pull requests |

These workflows correspond to the reproducibility guarantees described in §10 (“public artifacts and CI pipelines”).

---

## 5. Observability & Metrics
| Component | Path | Metrics Exported | Figure |
|------------|------|------------------|---------|
| MCP servers | `/metrics` endpoint | `mcp_policy_allow_total`, `mcp_policy_deny_total`, `mcp_quota_exceeded_total` | Fig. 8A |
| OTEL Collector | `charts/observability` | OTLP traces + Prometheus metrics | Fig. 8B–C |
| Traces (sample) | `traces/golden/` (if replayed) | Shareable JSON spans for deterministic runs | Fig. 8D |

---

## 6. Documentation
| File | Purpose |
|------|----------|
| `doc/mcp-to-paper.md` | Explains mapping between code and FGCS paper |
| `doc/artifacts.md` | Current file: enumerates artifacts and their linkage |
| `doc/deployment.md` | Explains Helm/K8s deployment (Phase 4+) |
| `README.md` | Project overview and quick start |

---

## 7. Citation
F. Maciá-Pérez, I. Lorenzo-Fonseca, À. Maciá-Fiteni, *MAS-MCP City - Reproducible LLM-agent coordination with MCP over NGSI-LD/SensorThings for traceable SmartCampus IAQ and occupancy analytics*, *Future Generation Computer Systems*, 2025.  
DOI: [10.5281/zenodo.17500006](https://doi.org/10.5281/zenodo.17500006)
