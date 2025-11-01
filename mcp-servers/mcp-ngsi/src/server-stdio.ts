import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio"
import { server } from "./server-core.js"

const transport = new StdioServerTransport()
await server.connect(transport)
console.log("[mcp-ngsi] ready on stdio")
