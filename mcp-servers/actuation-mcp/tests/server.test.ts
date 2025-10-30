import request from 'supertest';
import { app as actuationApp } from '../src/index';

// Configuración de prueba
const AUTH_TOKEN = 'dev-token';
const AUTH_HEADER = `Bearer ${AUTH_TOKEN}`;

// Mock de la función emitOtlpSpan para evitar escrituras en disco durante el test
jest.mock('fs', () => ({
    ...jest.requireActual('fs'),
    writeFileSync: jest.fn(),
    mkdirSync: jest.fn(),
}));

describe('Actuation MCP Server Endpoints (Port 8000)', () => {
    // -----------------------------------------------------------
    // /call - Idempotency and Basic Logic Tests
    // -----------------------------------------------------------

    describe('POST /call - Idempotency and Validation', () => {
        const TEST_TOOL = 'actuation_tool_a';
        const IDEMPOTENCY_KEY = 'test-id-12345';
        
        // Test 1: Primera llamada exitosa
        it('should process the first call successfully and register idempotency key (status: accepted)', async () => {
            const payload = {
                tool: TEST_TOOL,
                args: { 
                    idempotency_key: IDEMPOTENCY_KEY,
                    required_field: 'data',
                    dry_run: false
                },
                scope: { write: ['power'] }
            };

            const response = await request(actuationApp)
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
                    required_field: 'different_data' // Changing args doesn't matter
                },
                scope: { write: ['power'] }
            };
            
            // La segunda llamada debería ser aceptada pero con status 'already_processed'
            const response = await request(actuationApp)
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
                    // required_field está ausente
                },
                scope: { write: ['power'] }
            };

            const response = await request(actuationApp)
                .post('/call')
                .set('Authorization', AUTH_HEADER)
                .send(payload)
                .expect(400);

            expect(response.body.error).toBe('validation_error');
            expect(response.body.class).toBe('E-V');
            expect(response.body.missing).toBe('required_field'); // Verifica el campo faltante
        });
        
        // Test 4: Validación de herramienta faltante
        it('should return 400 tool_missing if tool field is absent in body', async () => {
            const payload = {
                args: { key: 'value' },
                scope: { write: ['power'] }
            };

            const response = await request(actuationApp)
                .post('/call')
                .set('Authorization', AUTH_HEADER)
                .send(payload)
                .expect(400);

            expect(response.body.error).toBe('tool_missing');
            expect(response.body.class).toBe('E-P');
        });
    });

    // -----------------------------------------------------------
    // /discover and /schema Tests
    // -----------------------------------------------------------

    describe('GET /discover', () => {
        it('should return 200 and a list of tools', async () => {
            const response = await request(actuationApp)
                .get('/discover')
                .set('Authorization', AUTH_HEADER)
                .expect(200);

            expect(response.body.server).toBe('actuation-mcp');
            expect(Array.isArray(response.body.tools)).toBe(true);
            expect(response.body.tools.length).toBeGreaterThan(0);
            expect(response.body.tools[0]).toHaveProperty('name');
        });
    });

    describe('GET /schema/:tool', () => {
        it('should return 200 and schema for a valid tool', async () => {
            const response = await request(actuationApp)
                .get('/schema/actuation_tool_a')
                .set('Authorization', AUTH_HEADER)
                .expect(200);

            expect(response.body.name).toBe('actuation_tool_a');
            expect(response.body).toHaveProperty('input_schema');
        });

        it('should return 404 for an invalid tool', async () => {
            await request(actuationApp)
                .get('/schema/non_existent_tool')
                .set('Authorization', AUTH_HEADER)
                .expect(404);
        });
    });
    
    // -----------------------------------------------------------
    // Auth Tests (Applicable to all endpoints)
    // -----------------------------------------------------------

    describe('Authentication', () => {
        it('should return 401 if Authorization header is missing', async () => {
            await request(actuationApp)
                .get('/discover')
                .expect(401);
        });

        it('should return 403 if Authorization token is incorrect', async () => {
            await request(actuationApp)
                .get('/discover')
                .set('Authorization', 'Bearer wrong-token')
                .expect(403);
        });
    });
    
    // -----------------------------------------------------------
    // Quota Test (Should fail after 25 calls)
    // -----------------------------------------------------------
    
    describe('Quota Limit Test', () => {
        it('should exceed quota and return 429 after 25 calls', async () => {
            const QUOTA_TOOL = 'actuation_tool_b'; // Usa una herramienta diferente para no afectar las pruebas anteriores
            const MAX_CALLS = 25; // QUOTA_LIMIT en el servidor
            const payload = {
                tool: QUOTA_TOOL,
                args: { required_field: 'data' },
                scope: { write: ['power'] }
            };

            // Realiza 25 llamadas exitosas (0 a 24)
            for (let i = 0; i < MAX_CALLS; i++) {
                const response = await request(actuationApp)
                    .post('/call')
                    .set('Authorization', AUTH_HEADER)
                    .send(payload);
                
                // Asegúrate de que las primeras 25 llamadas sean 200 OK
                expect(response.statusCode).toBe(200);
            }

            // Llamada 26 (la que excede la cuota)
            const finalResponse = await request(actuationApp)
                .post('/call')
                .set('Authorization', AUTH_HEADER)
                .send(payload)
                .expect(429); // Espera 429 Too Many Requests

            expect(finalResponse.body.error).toBe('quota_exceeded');
            expect(finalResponse.body.class).toBe('E-U');
        }, 10000); // Aumenta el timeout para la prueba de cuota
    });
});
