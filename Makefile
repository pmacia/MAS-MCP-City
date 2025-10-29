SHELL := /bin/bash
PY := python3

.PHONY: help deploy-dev load-fixtures replay-traces eval export all verify

help:
	@echo "Targets:"
	@echo "  deploy-dev     - Deploy minimal dev stack (stubs)"
	@echo "  load-fixtures  - Load NGSI-LD/STA fixtures (synthetic/anon)"
	@echo "  replay-traces  - Replay golden OTel traces to collector"
	@echo "  eval           - Recompute KPIs and generate tables/figures"
	@echo "  verify         - Consistency checks vs paper tolerances"
	@echo "  export         - Collect outputs under out/"
	@echo "  all            - End-to-end: deploy, load, replay, eval, export"

deploy-dev:
	@echo "[stub] Deploying dev stack (K8s manifests/Helm would go here)"

load-fixtures:
	$(PY) scripts/load_fixtures.py --ngsi fixtures/ngsi --sta fixtures/sta

replay-traces:
	$(PY) scripts/replay_traces.py traces/golden

eval:
	$(PY) eval/metrics.py --fixtures fixtures --out out

verify:
	$(PY) scripts/paper_consistency_check.py --out out

export:
	@echo "Artifacts exported under out/"

all: deploy-dev load-fixtures replay-traces eval export
