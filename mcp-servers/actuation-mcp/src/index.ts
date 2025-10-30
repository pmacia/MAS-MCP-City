import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

// --- Configuración ---
const ACTUATION_SERVER_NAME = "actuation-mcp";
const ACTUATION_SERVER_VERSION = "1.0.0";

// Esquema de entrada para la herramienta 'actuate-device'
const ActuateInputSchema = z.object({
  deviceId: z.string().describe("El ID único del dispositivo a actuar (e.g., 'light-001')."),
  action: z.enum(["turn_on", "turn_off", "set_level"]).describe("La acción a realizar en el dispositivo."),
  params: z.record(z.any()).optional().describe("Parámetros adicionales, si son necesarios (e.g., { level: 50 })."),
});

// Esquema de salida para la herramienta 'actuate-device'
const ActuateOutputSchema = z.object({
  ok: z.boolean().describe("True si la acción se realizó con éxito."),
  message: z.string().optional().describe("Mensaje de confirmación o error."),
});


// --- Lógica del Servidor ---

// 1. Crear el servidor MCP
const server = new McpServer({
  name: ACTUATION_SERVER_NAME,
  version: ACTUATION_SERVER_VERSION,
});

// 2. Registrar la herramienta 'actuate-device'
server.registerTool(
  "actuate-device", // Nombre de la herramienta
  {
    title: "Actuador de Dispositivo Inteligente",
    description: "Permite actuar sobre dispositivos IoT, como luces, válvulas o calefacción, cambiando su estado o nivel.",
    // CORRECCIÓN: Se usa .shape para pasar el ZodRawShape, tal como lo requiere el SDK.
    inputSchema: ActuateInputSchema.shape, 
    outputSchema: ActuateOutputSchema.shape,
  },
  // Handler (input, context) => Promise<{ content: ..., structuredContent: ... }>
  async (input) => {
    const { deviceId, action, params } = input;

    console.log(`[Actuation] Procesando acción: ${action} en ${deviceId}. Params: ${JSON.stringify(params)}`);

    // --- Simulación de la Lógica de Actuación Real ---
    // En un entorno real, aquí se realizaría la llamada a un servicio HTTP/MQTT/etc.
    await new Promise(resolve => setTimeout(resolve, 100)); // Simular latencia

    let result;
    if (deviceId.startsWith("error")) {
        result = { ok: false, message: `Error simulado al actuar sobre ${deviceId}.` };
    } else {
        const actionDetail = action === 'set_level' && params?.level !== undefined 
            ? `ajustando el nivel a ${params.level}` 
            : `realizando la acción '${action}'`;
            
        result = { ok: true, message: `Actuación exitosa. Dispositivo ${deviceId}: ${actionDetail}.` };
    }
    // --------------------------------------------------

    // Devolver el resultado en el formato oficial del SDK
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(result),
        },
      ],
      structuredContent: result,
    };
  }
);

// 3. Crear el transporte (Stdio para modo local/desarrollo)
const transport = new StdioServerTransport();

// Conectar el servidor al transporte y comenzar a escuchar (async)
server.connect(transport)
  .then(() => console.log(`[${ACTUATION_SERVER_NAME}] Servidor MCP (SDK) conectado y escuchando vía STDIO.`))
  .catch((error) => console.error(`[${ACTUATION_SERVER_NAME}] Error al conectar el servidor:`, error));

// Manejar el cierre elegante (Ctrl+C)
process.on("SIGINT", () => {
  console.log(`[${ACTUATION_SERVER_NAME}] Señal SIGINT recibida. Cerrando transporte...`);
  transport.close();
  process.exit(0);
});
