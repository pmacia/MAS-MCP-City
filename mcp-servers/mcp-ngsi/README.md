# mcp-ngsi (dev)

**Port:** 8001

## Run (dev)
```bash
npm install
npm run dev
# From repo root:
npm run dev -w mcp-servers/mcp-ngsi
```

## Endpoints
- GET /discover
- GET /schema/:tool
- POST /call

### Example
```bash
curl -H "Authorization: Bearer dev-token" http://localhost:8001/discover
```
