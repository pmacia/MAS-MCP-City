# actuation-mcp (dev)

**Port:** 8003

## Run (dev)
```bash
npm install
npm run dev
# From repo root:
npm run dev -w mcp-servers/actuation-mcp
```

## Endpoints
- GET /discover
- GET /schema/:tool
- POST /call

### Example
```bash
curl -H "Authorization: Bearer dev-token" http://localhost:8003/discover
```
