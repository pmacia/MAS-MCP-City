# mcp-sta (dev)

**Port:** 8002

## Run (dev)
```bash
npm install
npm run dev
# From repo root:
npm run dev -w mcp-servers/mcp-sta
```

## Endpoints
- GET /discover
- GET /schema/:tool
- POST /call

### Example
```bash
curl -H "Authorization: Bearer dev-token" http://localhost:8002/discover
```
