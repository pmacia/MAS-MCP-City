import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

// --- Configuración del Servidor ---
const STA_SERVER_NAME = "mcp-sta";
const STA_SERVER_VERSION = "1.0.0";

// Esquema de entrada para la herramienta 'get-sta-observation'
const GetStaObservationInputSchema = z.object({
  thingId: z.string().describe("El ID de la Thing/Sensor en la API STA (e.g., 'TS_001')."),
  datastreams: z.array(z.string()).optional().describe("Lista de Datastreams a consultar."),
  latest: z.boolean().default(true).describe("True para obtener la última observación, False para histórico."),
});

// Esquema de salida (JSON de observación simulada)
const StaOutputSchema = z.object({
  thingId: z.string(),
  observations: z.any().describe("Las observaciones del sensor."),
  success: z.boolean(),
});

// --- Lógica del Servidor ---
const server = new McpServer({
  name: STA_SERVER_NAME,
  version: STA_SERVER_VERSION,
});

// 2. Registrar la herramienta 'get-sta-observation'
server.registerTool(
  "get-sta-observation",
  {
    title: "Obtener Observaciones STA",
    description: "Consulta observaciones de sensores a través de la API SensorThings (STA).",
    // Corregido: Se usa .shape para compatibilidad con el SDK
    inputSchema: GetStaObservationInputSchema.shape,
    outputSchema: StaOutputSchema.shape,
  },
  async (input) => {
    const { thingId, datastreams, latest } = input;

    console.log(`[STA] Consultando Thing ${thingId}. Datastreams: ${datastreams?.join(', ') || 'todos'}. Última: ${latest}`);

    // --- Simulación de la Lógica de STA ---
    await new Promise(resolve => setTimeout(resolve, 50));

    const mockObservations = {
      'TS_001': {
        temperature: { value: 25.5, time: new Date().toISOString() },
        pressure: { value: 1012, time: new Date().toISOString() },
      }
    };

    const entityData = mockObservations[thingId as keyof typeof mockObservations];
    let observationData: any = {};
    let success = false;

    if (entityData) {
      success = true;
      if (datastreams && datastreams.length > 0) {
        datastreams.forEach(ds => {
          if (entityData[ds as keyof typeof entityData]) {
            observationData[ds] = entityData[ds as keyof typeof entityData];
          }
        });
      } else {
        observationData = entityData;
      }
    }

    const result = { thingId, observations: observationData, success };

    return {
      content: [{ type: "text", text: JSON.stringify(result) }],
      structuredContent: result,
    };
  }
);

// 3. Transporte STDIO
const transport = new StdioServerTransport();

server.connect(transport)
  .then(() => console.log(`[${STA_SERVER_NAME}] Servidor MCP (SDK) conectado y escuchando vía STDIO.`))
  .catch((error) => console.error(`[${STA_SERVER_NAME}] Error al conectar el servidor:`, error));

process.on("SIGINT", () => {
  console.log(`[${STA_SERVER_NAME}] Señal SIGINT recibida. Cerrando transporte...`);
  transport.close();
  process.exit(0);
});
