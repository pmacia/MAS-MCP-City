# MAS-MCP City — Artifacts (v0.1 NodeJS)

This scaffold contains the artifacts for Section 10 with NodeJS MCP servers.

## Quickstart (NodeJS servers on ports 8001–8003)
```bash
npm install
npm run dev  # starts all MCP servers (ngsi, sta, actuation)
```

## Repro steps for evaluation
```bash
python3 -m venv .venv && source .venv/bin/activate
pip install -r docs/requirements.txt
make load-fixtures
make eval
make verify
```

## Layout
- `mcp-servers/*` – Node (Express+TS) servers for NGSI-LD, STA, and actuation
- `fixtures/*` – NGSI-LD / STA synthetic samples
- `schemas/*` – JSON/Avro (envelopes, tools)
- `eval/` – scripts to regenerate KPIs/tables
- `dashboards/` – Grafana/Jaeger placeholders
