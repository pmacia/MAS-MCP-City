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
npm -ws run build

npm run dev
```

## Test the end-to-end CLI (in another terminal)
```bash
npm -w agents/cli run dev
# Expected output:
# NGSI tools: [...]
# ngsi_query(ok): true
# sta_get_observations(ok): true
# Happy path completed.
```

## Run de automated test (Vitest)
```bash
npm -ws run test
```


## Layout
- `mcp-servers/*` – Node (Express+TS) servers for NGSI-LD, STA, and actuation
- `fixtures/*` – NGSI-LD / STA synthetic samples
- `schemas/*` – JSON/Avro (envelopes, tools)
- `eval/` – scripts to regenerate KPIs/tables
- `dashboards/` – Grafana/Jaeger placeholders
