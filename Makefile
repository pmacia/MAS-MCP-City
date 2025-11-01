SHELL := /bin/bash
PY := python3

.PHONY: help load-fixtures replay-traces eval export all verify mcp-dev mcp-build

help:
	@echo "Targets:"
	@echo "  load-fixtures  - Load NGSI-LD/STA fixtures (local validation)"
	@echo "  replay-traces  - Replay golden traces (stub)"
	@echo "  eval           - Generate KPIs/tables (placeholders)"
	@echo "  verify         - Consistency checks vs paper tolerances"
	@echo "  mcp-build      - Build all MCP servers (TypeScript)"
	@echo "  mcp-dev        - Run all MCP servers in dev mode"

load-fixtures:
	$(PY) scripts/load_fixtures.py --ngsi fixtures/ngsi --sta fixtures/sta

replay-traces:
	$(PY) scripts/replay_traces.py traces/golden

eval:
	$(PY) eval/metrics.py --fixtures fixtures --out out

verify:
	$(PY) scripts/paper_consistency_check.py --out out

mcp-build:
	npm -ws run build

mcp-dev:
	npm run dev

export:
	@echo "Artifacts exported under out/"

all: load-fixtures eval verify
