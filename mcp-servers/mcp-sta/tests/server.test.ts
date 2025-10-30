import request from 'supertest';
import { app as staApp } from '../src/mcp-sta';

// Configuración de prueba
const AUTH_TOKEN = 'dev-token';
const AUTH_HEADER = `Bearer ${AUTH_TOKEN}`;

// Mock de la función emitOtlpSpan para evitar escrituras en disco durante el test
jest.mock('fs', () => ({
    ...jest.requireActual('fs'),
    writeFileSync: jest.fn(),
    mkdirSync: jest.fn(),
}));

describe('STA MCP Server Endpoints (Port 8002)', () => {
    // -----------------------------------------------------------
    // /call - Idempotency and Basic Logic Tests
    // -----------------------------------------------------------

    describe('POST /call - Idempotency and Validation', () => {
        const TEST_TOOL = 'sta_tool_a';
        const IDEMPOTENCY_KEY = 'sta-id-11223';
        
        // Test 1: Primera llamada exitosa
        it('should process the first call successfully and register idempotency key (status: accepted)', async () => {
            const payload = {
                tool: TEST_TOOL,
                args: { 
                    idempotency_key: IDEMPOTENCY_KEY,
                    location_id: 101,
                    dry_run: false
                },
                scope: { read: ['sensors'] }
            };

            const response = await request(staApp)
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
                    location_id: 202 
                },
                scope: { read: ['sensors'] }
            };
            
            const response = await request(staApp)
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
                    // location_id está ausente
                },
                scope: { read: ['sensors'] }
            };

            const response = await request(staApp)
                .post('/call')
                .set('Authorization', AUTH_HEADER)
                .send(payload)
                .expect(400);

            expect(response.body.error).toBe('validation_error');
            expect(response.body.class).toBe('E-V');
            expect(response.body.missing).toBe('location_id'); 
        });
        
        // Test 4: Denegación por capacidad (capability denied)
        it('should return 403 capability_denied if scope does not cover the tool capability', async () => {
            const payload = {
                tool: TEST_TOOL,
                args: { 
                    location_id: 101 
                },
                scope: { read: ['wrong_scope'] } // Scope incorrecto
            };

            const response = await request(staApp)
                .post('/call')
                .set('Authorization', AUTH_HEADER)
                .send(payload)
                .expect(403);

            expect(response.body.error).toBe('capability_denied');
            expect(response.body.class).toBe('E-V');
        });
    });

    // -----------------------------------------------------------
    // /discover and /schema Tests
    // -----------------------------------------------------------

    describe('GET /discover', () => {
        it('should return 200 and the server name', async () => {
            const response = await request(staApp)
                .get('/discover')
                .set('Authorization', AUTH_HEADER)
                .expect(200);

            expect(response.body.server).toBe('mcp-sta');
        });
    });
});
