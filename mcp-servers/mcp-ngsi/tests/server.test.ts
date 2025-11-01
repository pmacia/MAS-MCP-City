import { test, describe, expect, beforeAll, afterAll } from 'vitest';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
// import { MemoryServerTransport } from '@modelcontextprotocol/sdk/server/memory.js';
import { MemoryServerTransport } from "@modelcontextprotocol/sdk/testing.js"; 

// Importa mock-tools desde el mismo directorio
import { MOCK_MANIFESTS } from './mock-tools'; 

let server: McpServer;
let transport: MemoryServerTransport;

describe('NGSI MCP Server (SDK) API Compliance', () => {

    beforeAll(() => {
        server = new McpServer({ 
            name: 'test-mcp-ngsi', 
            version: '0.0.1' 
        });
        
        server.registerTool(
            "get-ngsi-data",
            MOCK_MANIFESTS['get-ngsi-data'],
            async (input) => {
                const { entityId } = input;
                // Devolver un mock de resultado
                const result = { entityId, result: { temperature: 25.5 }, success: true };
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
        server.disconnect();
    });

    test('should successfully call get-ngsi-data and validate structured response', async () => {
        const input = { entityId: 'AirQualitySensor:001', attribute: 'temperature' };
        
        const response = await transport.call({
            toolName: 'get-ngsi-data',
            input,
        });

        expect(response.status).toBe('ok');
        
        const structuredContent = response.content?.find(c => c.structuredContent)?.structuredContent;
        expect(structuredContent).toBeDefined();
        expect(structuredContent.success).toBe(true);
        expect(structuredContent.entityId).toBe(input.entityId);
        expect(structuredContent.result.temperature).toBe(25.5);
    });

    test('should reject call if required input (entityId) is missing (SDK Validation)', async () => {
        const input = { attribute: 'pressure' }; // entityId está ausente

        const response = await transport.call({
            toolName: 'get-ngsi-data',
            input,
        });

        // Esperamos que el SDK devuelva un estado de error
        expect(response.status).toBe('error');
        expect(response.error).toBeDefined();
        expect(response.error?.message).toContain('Validation failed');
    });
});
