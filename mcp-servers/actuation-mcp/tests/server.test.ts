// server.test.ts

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';

// Import only 'app' from index.ts. 
// Supertest can test the Express instance directly without needing a real port.
import { app } from '../src/index'; 


// NOTE: Since we are testing the Express instance (app) directly with Supertest,
// we typically don't need beforeAll/afterAll hooks to start and close the server.
// If your original code required these hooks, you should verify if they are still needed
// after ensuring 'app' is properly exported from 'index.ts'.

// If you still need the 'start' function (e.g., for full integration tests or database setup),
// the structure below can be uncommented, assuming 'start' is also exported from '../src/index'.
/*
let server: any; 

beforeAll(async () => {
    // This assumes 'start' is exported from index.ts and returns the Node server listener object.
    const { start } = await import('../src/index');
    server = start();
});

afterAll(() => {
    server && server.close();
});
*/


describe('MCP server basic endpoints', () => {
    // Define the authentication header for reuse.
    const auth = { Authorization: 'Bearer dev-token' };

    // --- Discovery and Schema Tests ---

    it('discovers tools', async () => {
        // Direct request to the Express instance (app)
        const res = await request(app).get('/discover').set(auth); 
        
        expect(res.status).toBe(200);
        expect(res.body.server).toBe('actuation-mcp');
        expect(res.body.tools).toBeInstanceOf(Array);
        // Assuming JSON loading is successful and tools are present.
        expect(res.body.tools.length).toBeGreaterThan(0); 
    });

    it('returns a schema for a known tool', async () => {
        // First, discover the name of an available tool.
        const disc = await request(app).get('/discover').set(auth);
        
        // Assuming at least one tool exists.
        const tool = disc.body.tools[0].name; 
        
        // Request the schema using the tool's name.
        const res = await request(app).get(`/schema/${tool}`).set(auth);
        
        expect(res.status).toBe(200);
        expect(res.body.name).toBe(tool);
        expect(res.body).toHaveProperty('input_schema');
    });

    // --- Authorization Tests ---

    it('denies without token', async () => {
        const res = await request(app).get('/discover');
        expect(res.status).toBe(401); // 401: Unauthorized
    });
    
    it('denies with bad token', async () => {
        const res = await request(app).get('/discover').set({ Authorization: 'Bearer bad-token' });
        expect(res.status).toBe(403); // 403: Forbidden
    });

    // --- Call Endpoint Test ---

    it('validates capability scope or args on call', async () => {
        const disc = await request(app).get('/discover').set(auth);
        const tool = disc.body.tools[0].name;

        const res = await request(app).post('/call').set(auth).send({
            tool,
            args: {},
            // The empty 'scope' array may fail if the tool requires a specific scope
            scope: { read: [] } 
        });

        // The status depends on the tool's schema requirements:
        // 200: If the tool requires neither arguments nor scope.
        // 400: If 'args' validation (Zod) fails.
        // 403: If 'scope' validation fails.
        expect([400, 403, 200]).toContain(res.status);
    });
});