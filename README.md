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

## Run (test)
```bash
unzip MAS-MCP-City-v0.2.zip
cd MAS-MCP-City-v0.2
npm install
npm run build

npm run dev
```

## Minimal Agent CLI
Test the end-to-end CLI
Start servers (in another terminal) and run the CLI:
```bash
npm install
npm run dev  # starts MCP servers 8001–8003
npm gents/cli run dev
# Expected output:
# NGSI tools: [...]
# ngsi_query(ok): true
# sta_get_observations(ok): true
# Happy path completed.
```

## Run de automated test (Vitest)
```bash
npm run test
```

## Layout
- `mcp-servers/*` – Node (Express+TS) servers for NGSI-LD, STA, and actuation
- `fixtures/*` – NGSI-LD / STA synthetic samples
- `schemas/*` – JSON/Avro (envelopes, tools)
- `eval/` – scripts to regenerate KPIs/tables
- `dashboards/` – Grafana/Jaeger placeholders

## v0.3 updates
- Traceparent logging + OTLP JSON spans in `traces/golden/`
- Hardened tests for capabilities, validation, quotas
