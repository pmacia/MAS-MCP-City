import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

// --- Configuración del Servidor ---
const NGSI_SERVER_NAME = "mcp-ngsi";
const NGSI_SERVER_VERSION = "1.0.0";

// Esquema de entrada para la herramienta 'get-ngsi-data'
const GetNgsiDataInputSchema = z.object({
  entityId: z.string().describe("El ID de la entidad NGSI (e.g., 'urn:ngsi-ld:TemperatureSensor:001')."),
  attribute: z.string().optional().describe("El atributo específico a recuperar (e.g., 'temperature')."),
});

// Esquema de salida (JSON genérico)
const NgsiOutputSchema = z.object({
  entityId: z.string(),
  result: z.any().describe("Los datos de la entidad solicitada."),
  success: z.boolean(),
});

// --- Lógica del Servidor ---
const server = new McpServer({
  name: NGSI_SERVER_NAME,
  version: NGSI_SERVER_VERSION,
});

// 2. Registrar la herramienta 'get-ngsi-data'
server.registerTool(
  "get-ngsi-data",
  {
    title: "Obtener Datos de Entidad NGSI",
    description: "Consulta datos en tiempo real de una entidad a través de un Context Broker (NGSI).",
    // Corregido: Se usa .shape para compatibilidad con el SDK
    inputSchema: GetNgsiDataInputSchema.shape,
    outputSchema: NgsiOutputSchema.shape,
  },
  async (input) => {
    const { entityId, attribute } = input;

    console.log(`[NGSI] Consultando ${attribute || 'todos los atributos'} para la entidad ${entityId}.`);

    // --- Simulación de la Lógica de NGSI ---
    await new Promise(resolve => setTimeout(resolve, 50));

    const mockData = {
      'urn:ngsi-ld:AirQualitySensor:001': {
        temperature: { value: 25.5, type: 'Number' },
        humidity: { value: 60, type: 'Number' },
      }
    };

    const entityData = mockData[entityId as keyof typeof mockData];
    let resultData: any = {};
    let success = false;

    if (entityData) {
      success = true;
      resultData = attribute && entityData[attribute as keyof typeof entityData] 
        ? entityData[attribute as keyof typeof entityData] 
        : entityData;
    }

    const result = { entityId, result: resultData, success };

    return {
      content: [{ type: "text", text: JSON.stringify(result) }],
      structuredContent: result,
    };
  }
);

// 3. Transporte STDIO
const transport = new StdioServerTransport();

server.connect(transport)
  .then(() => console.log(`[${NGSI_SERVER_NAME}] Servidor MCP (SDK) conectado y escuchando vía STDIO.`))
  .catch((error) => console.error(`[${NGSI_SERVER_NAME}] Error al conectar el servidor:`, error));

process.on("SIGINT", () => {
  console.log(`[${NGSI_SERVER_NAME}] Señal SIGINT recibida. Cerrando transporte...`);
  transport.close();
  process.exit(0);
});
