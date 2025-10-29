# MAS-MCP City — Artifacts (v0 scaffold)

This repository contains the scaffold for the artifacts promised in Section 10 of the paper.

## Quickstart (10 minutes, dev profile)

1. Clone the repo and ensure Python 3.10+ is available.
2. (Optional) Create a venv.
3. Install minimal deps:
   ```bash
   pip install -r docs/requirements.txt
   ```
4. Load fixtures and replay traces:
   ```bash
   make load-fixtures
   make replay-traces
   ```
5. Recompute KPIs (Tables 3–4) and regenerate Figure 8 panels:
   ```bash
   make eval
   ```

> Note: This v0 uses stubs for deployment. K8s/Helm charts will arrive in a later tag.

## Layout
- `agents/` – reference agents (to be added)
- `mcp-servers/` – MCP NGSI-LD / SensorThings / Actuation stubs
- `schemas/` – JSON/Avro schemas for envelopes and tools
- `fixtures/` – NGSI-LD and STA synthetic/anon datasets
- `traces/golden/` – redacted/time-shifted OTel traces (placeholders)
- `eval/` – scripts to regenerate KPIs and plots
- `dashboards/` – Grafana/Jaeger exports
- `docs/` – DPIA summary, data cards, reproduction guide

## License
Creative Commons Attribution–NonCommercial 4.0 (CC BY-NC 4.0).
