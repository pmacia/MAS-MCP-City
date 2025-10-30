import request from 'supertest';
import { app as ngsiApp } from '../src/mcp-ngsi';

// Configuración de prueba
const AUTH_TOKEN = 'dev-token';
const AUTH_HEADER = `Bearer ${AUTH_TOKEN}`;

// Mock de la función emitOtlpSpan para evitar escrituras en disco durante el test
jest.mock('fs', () => ({
    ...jest.requireActual('fs'),
    writeFileSync: jest.fn(),
    mkdirSync: jest.fn(),
}));

describe('NGSI MCP Server Endpoints (Port 8001)', () => {
    // -----------------------------------------------------------
    // /call - Idempotency and Basic Logic Tests
    // -----------------------------------------------------------

    describe('POST /call - Idempotency and Validation', () => {
        const TEST_TOOL = 'ngsi_tool_a';
        const IDEMPOTENCY_KEY = 'ngsi-id-67890';
        
        // Test 1: Primera llamada exitosa
        it('should process the first call successfully and register idempotency key (status: accepted)', async () => {
            const payload = {
                tool: TEST_TOOL,
                args: { 
                    idempotency_key: IDEMPOTENCY_KEY,
                    required_param: 'value',
                    dry_run: false
                },
                scope: { read: ['*'] }
            };

            const response = await request(ngsiApp)
                .post('/call')
                .set('Authorization', AUTH_HEADER)
                .send(payload)
                .expect(200);

            expect(response.body.ok).toBe(true);
            expect(response.body.ack.status).toBe('accepted');
            expect(response.body.ack.effect).toBe('planned');
            expect(response.body.ack.idempotency_key).toBe(IDEMPOTENCY_KEY);
        });

        // Test 2: Segunda llamada con la misma clave (Idempotencia)
        it('should return "already_processed" for subsequent calls with the same key', async () => {
            const payload = {
                tool: TEST_TOOL,
                args: { 
                    idempotency_key: IDEMPOTENCY_KEY,
                    required_param: 'other_value' 
                },
                scope: { read: ['*'] }
            };
            
            const response = await request(ngsiApp)
                .post('/call')
                .set('Authorization', AUTH_HEADER)
                .send(payload)
                .expect(200);

            expect(response.body.ok).toBe(true);
            expect(response.body.ack.status).toBe('already_processed');
            expect(response.body.ack.effect).toBe('none');
            expect(response.body.ack.idempotency_key).toBe(IDEMPOTENCY_KEY);
        });
        
        // Test 3: Validación de campo obligatorio faltante (missing)
        it('should return 400 validation_error with "missing" field if a required argument is absent', async () => {
            const payload = {
                tool: TEST_TOOL,
                args: { 
                    // required_param está ausente
                },
                scope: { read: ['*'] }
            };

            const response = await request(ngsiApp)
                .post('/call')
                .set('Authorization', AUTH_HEADER)
                .send(payload)
                .expect(400);

            expect(response.body.error).toBe('validation_error');
            expect(response.body.class).toBe('E-V');
            expect(response.body.missing).toBe('required_param'); 
        });
    });

    // -----------------------------------------------------------
    // /discover and /schema Tests
    // -----------------------------------------------------------

    describe('GET /discover', () => {
        it('should return 200 and the server name', async () => {
            const response = await request(ngsiApp)
                .get('/discover')
                .set('Authorization', AUTH_HEADER)
                .expect(200);

            expect(response.body.server).toBe('mcp-ngsi');
        });
    });

    describe('GET /schema/:tool', () => {
        it('should return 200 and schema for a valid tool', async () => {
            const response = await request(ngsiApp)
                .get('/schema/ngsi_tool_a')
                .set('Authorization', AUTH_HEADER)
                .expect(200);

            expect(response.body.name).toBe('ngsi_tool_a');
            expect(response.body.capabilities.read).toContain('*');
        });
    });
});
