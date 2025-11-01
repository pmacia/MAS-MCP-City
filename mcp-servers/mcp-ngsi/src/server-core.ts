// src/server-core.ts
import { Server } from "@modelcontextprotocol/sdk/server"
import { z } from "zod"
import { toolWithPolicyOtel } from "./tool-with-policy-otel.js"

export const server = new Server({
  name: "mcp-ngsi",
  version: "1.0.0"
})

toolWithPolicyOtel(
  server,
  "ngsi_query",
  {
    description: "Query NGSI-LD entities by type",
    inputSchema: z.object({
      type: z.string(),
      q: z.string().optional(),
      limit: z.number().optional()
    })
  },
  {
    capability: "read",
    toolClass: "readable",
    requiredScope: "ngsi"
  },
  async ({ type, q, limit }) => {
    return {
      ok: true,
      results: [
        {
          id: "urn:ngsi-ld:Building:ES-UA:A1",
          type,
          filter: q ?? null
        }
      ]
    }
  }
)
