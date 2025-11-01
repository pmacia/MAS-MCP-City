import express from "express"
import http from "http"
import { WebSocketServer } from "ws"
import { WebSocketServerTransport } from "@modelcontextprotocol/sdk/server/websocket"
import { server } from "./server-core.js"

const PORT = Number(process.env.PORT || 8001)
const AUTH_TOKEN = process.env.AUTH_TOKEN || "dev-token"

const app = express()
app.get("/health", (_req, res) => {
  res.json({ ok: true, name: "mcp-ngsi", transport: "websocket" })
})

const httpServer = http.createServer(app)
const wss = new WebSocketServer({ noServer: true })

httpServer.on("upgrade", (req, socket, head) => {
  const url = new URL(req.url || "/", "http://localhost")
  const hdr = req.headers["authorization"]
  const token =
    url.searchParams.get("token") ||
    (typeof hdr === "string" && hdr.startsWith("Bearer ") ? hdr.slice(7) : "")

  if (token !== AUTH_TOKEN) {
    socket.write("HTTP/1.1 401 Unauthorized\r\n\r\n")
    socket.destroy()
    return
  }

  wss.handleUpgrade(req, socket, head, async (ws) => {
    const transport = new WebSocketServerTransport(ws)
    await server.connect(transport)
    // aquí puedes loggear traceparent si viene en metadata
  })
})

httpServer.listen(PORT, () => {
  console.log(`[mcp-ngsi] WS listening on :${PORT}`)
})
