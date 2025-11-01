import { Server } from "@modelcontextprotocol/sdk/server"
import { z } from "zod"
import { toolWithPolicyOtel } from "./tool-with-policy-otel.js"

export const server = new Server({
  name: "actuation-mcp",
  version: "1.0.0"
})

/**
 * bms_setpoint_write
 * - escritura
 * - clase: writable
 * - scope esperado: "bms"
 * - devuelve ack idempotente
 */
toolWithPolicyOtel(
  server,
  "bms_setpoint_write",
  {
    description: "Write HVAC/BMS setpoint for a zone (supports dry-run)",
    inputSchema: z.object({
      zone: z.string(),
      setpoint: z.number(),
      dry_run: z.boolean().optional(),
      idempotency_key: z.string().optional()
    })
  },
  {
    capability: "write",
    toolClass: "writable",
    requiredScope: "bms"
  },
  async ({ zone, setpoint, dry_run, idempotency_key }) => {
    const ack = {
      status: "accepted",
      effect: dry_run ? "none" : "planned",
      idempotency_key: idempotency_key || String(Date.now())
    }
    // aquí iría la integración real con MQTT/BMS, condicionada por dry_run
    return {
      ok: true,
      ack,
      zone,
      setpoint
    }
  }
)

/**
 * iot_publish_mqtt
 * - escritura
 * - clase: writable
 * - scope esperado: "mqtt"
 * - idempotente también
 */
toolWithPolicyOtel(
  server,
  "iot_publish_mqtt",
  {
    description: "Publish an MQTT message to an IoT topic (dry-run aware)",
    inputSchema: z.object({
      topic: z.string(),
      payload: z.record(z.any()),
      qos: z.number().min(0).max(2).optional(),
      retain: z.boolean().optional(),
      dry_run: z.boolean().optional(),
      idempotency_key: z.string().optional()
    })
  },
  {
    capability: "write",
    toolClass: "writable",
    requiredScope: "mqtt"
  },
  async ({ topic, payload, qos, retain, dry_run, idempotency_key }) => {
    const ack = {
      status: "accepted",
      effect: dry_run ? "none" : "planned",
      idempotency_key: idempotency_key || String(Date.now())
    }
    return {
      ok: true,
      ack,
      topic,
      payload,
      qos: qos ?? 0,
      retain: retain ?? false
    }
  }
)
