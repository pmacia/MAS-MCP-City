import { WebSocketClientTransport } from "@modelcontextprotocol/sdk/client/websocket"
import { Client } from "@modelcontextprotocol/sdk/client"
import pino from "pino"

export interface MCPClientOptions {
  url: string               // ws://host:port/?token=...
  token?: string            // si no va en query
  scope?: string            // mcp metadata scope -> ngsi | sta | bms | mqtt
  traceparent?: string      // si lo quieres propagar
}

const logger = pino({ name: "agents-mcp-client" })

export class MCPAgentClient {
  private client: Client
  private scope?: string
  private traceparent?: string

  private constructor(client: Client, scope?: string, traceparent?: string) {
    this.client = client
    this.scope = scope
    this.traceparent = traceparent
  }

  static async connect(opts: MCPClientOptions): Promise<MCPAgentClient> {
    // si no pusiste el token en la query, lo metemos nosotros
    let wsUrl = opts.url
    if (opts.token && !wsUrl.includes("token=")) {
      const u = new URL(wsUrl)
      u.searchParams.set("token", opts.token)
      wsUrl = u.toString()
    }

    const transport = new WebSocketClientTransport(wsUrl)
    const client = new Client({ transport })
    await client.connect()
    logger.info({ msg: "connected to MCP server", url: wsUrl })

    return new MCPAgentClient(client, opts.scope, opts.traceparent)
  }

  async callTool<T = unknown>(name: string, input: any): Promise<T> {
    const metadata: Record<string, string> = {}
    if (this.scope) {
      metadata["scope"] = this.scope
    }
    if (this.traceparent) {
      metadata["traceparent"] = this.traceparent
    }

    const res = await this.client.callTool({
      name,
      arguments: input,
      metadata
    })

    // nuestros servidores devuelven siempre {ok: boolean, ...}
    return res as T
  }

  async listTools() {
    return this.client.listTools()
  }

  async close() {
    await this.client.close()
  }
}
