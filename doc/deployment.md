# MAS-MCP City — Deployment Guide (Helm & Kubernetes)

This guide describes how to deploy and verify the MAS-MCP City platform, including MCP servers, observability stack, and smoke tests.

---

## 1. Requirements
- Kubernetes ≥ 1.25 (kind, minikube, or managed cluster)
- Helm ≥ 3.14
- Docker / GHCR access to images `ghcr.io/<owner>/mcp-*`
- Node 20+ for local testing

---

## 2. Deploy OpenTelemetry Collector

```bash
cd charts/observability
helm upgrade --install masmcp-obs . -n masmcp --create-namespace
kubectl -n masmcp get pods
```

Default ports:

* OTLP/gRPC : 4317
* OTLP/HTTP : 4318
* Prometheus : 8888

---

## 3. Deploy MCP Platform

```bash
cd charts/platform
helm upgrade --install masmcp . -n masmcp -f values-dev.yaml
```

This creates:

* Deployments: `mcp-ngsi`, `mcp-sta`, `actuation-mcp`
* OPA sidecars on port 8181
* Secrets (`AUTH_TOKEN`), ConfigMaps (`masmcp-config`)
* Services on ports 8001–8003

---

## 4. Deploy Agents (Smoke Tests)

```bash
cd charts/agents
helm upgrade --install masmcp-agents . -n masmcp
kubectl -n masmcp logs job/mas-mcp-agents-smoke -f
```

The Job confirms that all `/health` endpoints respond with HTTP 200.

---

## 5. Accessing Services

| Service   | Port | WebSocket URL                          | Health    |
| --------- | ---- | -------------------------------------- | --------- |
| NGSI      | 8001 | `ws://<host>:8001/?token=<AUTH_TOKEN>` | `/health` |
| STA       | 8002 | `ws://<host>:8002/?token=<AUTH_TOKEN>` | `/health` |
| Actuation | 8003 | `ws://<host>:8003/?token=<AUTH_TOKEN>` | `/health` |

Forward ports locally:

```bash
kubectl -n masmcp port-forward svc/mcp-ngsi 8001:8001
```

---

## 6. Observability

| Path             | Description                                |
| ---------------- | ------------------------------------------ |
| `/metrics`       | Prometheus exposition from each MCP server |
| `/health`        | readiness/liveness probe                   |
| OTLP HTTP : 4318 | Trace exporter endpoint (collector)        |

All spans contain attributes:
`mcp.tool`, `mcp.capability`, `mcp.scope`, `mcp.decision`, `mcp.deny_reason`.

---

## 7. Uninstall

```bash
helm uninstall masmcp-agents -n masmcp
helm uninstall masmcp -n masmcp
helm uninstall masmcp-obs -n masmcp
```

---

## 8. Reference Figures (FGCS Paper)

| Figure | Deployment Element                    |
| ------ | ------------------------------------- |
| Fig. 5 | Helm + K8s topology                   |
| Fig. 6 | Deployment workflow                   |
| Fig. 7 | Demonstrator data flow                |
| Fig. 8 | Observability panels (spans, metrics) |

```

---

### ✅ Confirmación

Sí — los *fixtures* y los *charts* son los **mismos que en la v1.0**:  
- No hay cambios en los datos ni en los templates.  
- El único cambio conceptual es que ahora las invocaciones MCP se trazan con OTEL y las policies están integradas en cada tool.

¿Quieres que te genere ahora el **Dockerfile multistage** para estos servidores (Node 20 ESM + non-root, preparado para GHCR) para cerrar el ciclo de publicación y CI?
```
