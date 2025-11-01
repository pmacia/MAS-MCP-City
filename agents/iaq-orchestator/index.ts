import { MCPAgentClient } from "../../mcp-client/src/index.js"

interface IAQParams {
  ngsiUrl: string
  staUrl: string
  actUrl?: string
  token: string
  buildingType?: string
  co2Threshold?: number
}

export async function runIAQWorkflow(params: IAQParams) {
  const {
    ngsiUrl,
    staUrl,
    actUrl,
    token,
    buildingType = "Building",
    co2Threshold = 1000
  } = params

  // 1) NGSI: qué espacios tengo
  const ngsi = await MCPAgentClient.connect({
    url: ngsiUrl,
    token,
    scope: "ngsi"
  })
  const q = await ngsi.callTool<{
    ok: boolean
    results: Array<{ id: string; type: string }>
  }>("ngsi_query", { type: buildingType })

  if (!q.ok || !q.results?.length) {
    await ngsi.close()
    return { ok: false, error: "no_buildings" }
  }
  const building = q.results[0]
  await ngsi.close()

  // 2) STA: observaciones de CO2
  const sta = await MCPAgentClient.connect({
    url: staUrl,
    token,
    scope: "sta"
  })
  const obs = await sta.callTool<{
    ok: boolean
    observations: Array<{ phenomenonTime: string; result: number }>
  }>("sta_get_observations", { datastream_id: 1001 })
  await sta.close()

  if (!obs.ok) {
    return { ok: false, error: "no_observations" }
  }

  const last = obs.observations.at(-1)
  const co2 = last ? last.result : null

  // 3) política de decisión mínima
  if (co2 === null) {
    return { ok: false, error: "no_last_value" }
  }

  if (co2 <= co2Threshold) {
    return {
      ok: true,
      action: "noop",
      building: building.id,
      co2
    }
  }

  // 4) opcional: actuamos
  if (!actUrl) {
    return {
      ok: true,
      action: "threshold_exceeded_no_actuation",
      building: building.id,
      co2
    }
  }

  const act = await MCPAgentClient.connect({
    url: actUrl,
    token,
    scope: "bms" // ¡esto es lo que mira el servidor de actuación!
  })

  const ack = await act.callTool<{
    ok: boolean
    ack: { status: string; effect: string; idempotency_key: string }
  }>("bms_setpoint_write", {
    zone: building.id,
    setpoint: 22.0,
    dry_run: true
  })

  await act.close()

  return {
    ok: true,
    action: "ventilation_boost",
    building: building.id,
    co2,
    ack
  }
}
