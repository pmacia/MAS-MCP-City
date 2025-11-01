import { describe, it, expect } from "vitest"
import { MCPAgentClient } from "../src/index.js"

describe("MCPAgentClient", () => {
  it("connects and lists tools", async () => {
    const client = await MCPAgentClient.connect({
      url: "ws://localhost:8001/?token=dev-token",
      scope: "ngsi"
    })
    const tools = await client.listTools()
    expect(Array.isArray(tools)).toBe(true)
    await client.close()
  })
})
