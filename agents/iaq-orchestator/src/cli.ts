#!/usr/bin/env node
import { runIAQWorkflow } from "./index.js"

async function main() {
  const token = process.env.AUTH_TOKEN || "dev-token"
  const ngsiUrl = process.env.NGSI_WS || "ws://localhost:8001/?token=" + token
  const staUrl = process.env.STA_WS || "ws://localhost:8002/?token=" + token
  const actUrl = process.env.ACT_WS || "ws://localhost:8003/?token=" + token

  const res = await runIAQWorkflow({
    ngsiUrl,
    staUrl,
    actUrl,
    token,
    co2Threshold: 1000
  })

  console.log(JSON.stringify(res, null, 2))
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
