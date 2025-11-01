import { Server } from "@modelcontextprotocol/sdk/server"
import { z } from "zod"
import { toolWithPolicyOtel } from "./tool-with-policy-otel.js"

export const server = new Server({
  name: "mcp-sta",
  version: "1.0.0"
})

/**
 * sta_get_datastreams
 * - lectura
 * - clase: readable
 * - scope esperado: "sta"
 */
toolWithPolicyOtel(
  server,
  "sta_get_datastreams",
  {
    description: "List SensorThings datastreams, optionally filtered by name",
    inputSchema: z.object({
      name: z.string().optional()
    })
  },
  {
    capability: "read",
    toolClass: "readable",
    requiredScope: "sta"
  },
  async ({ name }) => {
    // fixture / demo
    const ds = {
      "@iot.id": 1001,
      name: "CO2 A1-1.01",
      description: "CO2 ppm",
      unitOfMeasurement: {
        name: "ppm",
        symbol: "ppm",
        definition: "parts per million"
      }
    }
    const all = [ds]
    if (!name) return { ok: true, datastreams: all }
    return {
      ok: true,
      datastreams: all.filter((d) =>
        d.name.toLowerCase().includes(name.toLowerCase())
      )
    }
  }
)

/**
 * sta_get_observations
 * - lectura
 * - clase: readable
 * - scope esperado: "sta"
 */
toolWithPolicyOtel(
  server,
  "sta_get_observations",
  {
    description: "Get SensorThings observations for a given datastream_id",
    inputSchema: z.object({
      datastream_id: z.number(),
      interval: z.string().optional()
    })
  },
  {
    capability: "read",
    toolClass: "readable",
    requiredScope: "sta"
  },
  async ({ datastream_id, interval }) => {
    if (datastream_id !== 1001) {
      return { ok: true, observations: [] }
    }
    // fixture / demo
    const observations = [
      { phenomenonTime: "2025-10-31T09:00:00Z", result: 650 },
      { phenomenonTime: "2025-10-31T09:15:00Z", result: 980 },
      { phenomenonTime: "2025-10-31T09:30:00Z", result: 1120 },
      { phenomenonTime: "2025-10-31T09:45:00Z", result: 900 }
    ]
    return { ok: true, observations }
  }
)
