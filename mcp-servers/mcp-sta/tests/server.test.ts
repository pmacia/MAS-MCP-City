import { test, describe, expect, beforeAll, afterAll } from 'vitest';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
// import { MemoryServerTransport } from '@modelcontextprotocol/sdk/server/memory.js';
import { MemoryServerTransport } from "@modelcontextprotocol/sdk/testing.js"; 

// Importa mock-tools desde el mismo directorio
import { MOCK_MANIFESTS } from './mock-tools'; 

let server: McpServer;
let transport: MemoryServerTransport;

describe('STA MCP Server (SDK) API Compliance', () => {

    beforeAll(() => {
        server = new McpServer({ 
            name: 'test-mcp-sta', 
            version: '0.0.1' 
        });
        
        server.registerTool(
            "get-sta-observation",
            MOCK_MANIFESTS['get-sta-observation'],
            async (input) => {
                const { thingId } = input;
                // Devolver un mock de resultado
                const result = { thingId, observations: { temperature: 25.5 }, success: true };
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

    test('should successfully call get-sta-observation and validate structured response', async () => {
        const input = { thingId: 'TS_001', datastreams: ['temperature'] };
        
        const response = await transport.call({
            toolName: 'get-sta-observation',
            input,
        });

        expect(response.status).toBe('ok');
        
        const structuredContent = response.content?.find(c => c.structuredContent)?.structuredContent;
        expect(structuredContent).toBeDefined();
        expect(structuredContent.success).toBe(true);
        expect(structuredContent.thingId).toBe(input.thingId);
        expect(structuredContent.observations.temperature).toBe(25.5);
    });

    test('should reject call if required input (thingId) is missing (SDK Validation)', async () => {
        const input = { datastreams: ['pressure'] }; // thingId está ausente

        const response = await transport.call({
            toolName: 'get-sta-observation',
            input,
        });

        // Esperamos que el SDK devuelva un estado de error
        expect(response.status).toBe('error');
        expect(response.error).toBeDefined();
        expect(response.error?.message).toContain('Validation failed');
    });
});
