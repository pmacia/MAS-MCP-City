import { test, describe, expect, beforeAll, afterAll } from 'vitest';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { MemoryServerTransport } from '@modelcontextprotocol/sdk/server/memory.js';
// Importa mock-tools desde el mismo directorio
import { MOCK_MANIFESTS } from './mock-tools'; 

let server: McpServer;
let transport: MemoryServerTransport;

describe('Actuation MCP Server (SDK) API Compliance', () => {

    beforeAll(() => {
        // Inicializa el servidor MCP de prueba
        server = new McpServer({ 
            name: 'test-actuation-mcp', 
            version: '0.0.1' 
        });
        
        // Simula el registro de la herramienta usando la API moderna
        server.registerTool(
            "actuate-device",
            MOCK_MANIFESTS['actuate-device'], // Usando el manifiesto mockeado (.shape)
            async (input) => {
                const { deviceId, action } = input;
                const result = { ok: true, message: `Actuación exitosa simulada en ${deviceId} con ${action}.` };
                return { 
                    content: [{ type: "text", text: JSON.stringify(result) }], 
                    structuredContent: result 
                };
            }
        );
        
        transport = new MemoryServerTransport();
        server.connect(transport);
    });

    afterAll(() => {
        // Desconecta el servidor después de todas las pruebas
        server.disconnect();
    });

    test('should successfully call actuate-device tool and receive structured response', async () => {
        const input = { deviceId: 'valve-01', action: 'turn_off' };
        
        const response = await transport.call({
            toolName: 'actuate-device',
            input,
        });

        expect(response.status).toBe('ok');
        
        // Verificación del contenido estructurado
        const structuredContent = response.content?.find(c => c.structuredContent)?.structuredContent;
        expect(structuredContent).toBeDefined();
        expect(structuredContent.ok).toBe(true);
        expect(structuredContent.message).toContain('Actuación exitosa');
    });

    test('should reject call if required input (deviceId) is missing (SDK Validation)', async () => {
        const input = { action: 'turn_on' }; // deviceId está ausente

        // El SDK valida el input usando Zod y debe devolver un estado de error
        const response = await transport.call({
            toolName: 'actuate-device',
            input,
        });

        expect(response.status).toBe('error');
        expect(response.error).toBeDefined();
        expect(response.error?.message).toContain('Validation failed');
    });
});
