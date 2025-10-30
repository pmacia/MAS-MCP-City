import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import pino from 'pino';
import fs from 'fs';
import path, { dirname } from 'path'; 
import { fileURLToPath } from 'url'; 
import { z, ZodRawShape, ZodTypeAny } from 'zod';

// --- Type Definitions ---

interface ToolManifest {
    name: string;
    capabilities?: {
        read?: string[];
        write?: string[];
    };
    effects?: Record<string, any>;
    input_schema?: {
        type: 'object';
        required?: string[];
        properties?: Record<string, any>;
    };
}

interface OtlpAttributes {
    traceparent?: string;
    server?: string;
    tool?: string;
    found?: boolean;
    class?: string;
    reason?: string;
    count?: number;
    details?: string;
    missing?: string;
}

interface CallBody {
    tool: string;
    args: Record<string, any>;
    scope: {
        read?: string[];
        write?: string[];
    };
}

// --- Application Setup ---

export const app = express();
app.use(express.json());
app.use(cors());
const logger = pino();

// PORT is 8001 for mcp-ngsi
const PORT = 8001; 
const AUTH_TOKEN = process.env.AUTH_TOKEN || 'dev-token';
const OTLP_DIR = process.env.OTLP_DIR || path.join(process.cwd(), 'traces', 'golden');

// --- Idempotency Store (In-Memory) ---
// Stores idempotency keys that have been successfully accepted/processed.
const processedKeys = new Set<string>();

// --- Handle ESM __dirname compatibility ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// --- Tool Manifest Loading ---

const toolsDir = path.join(__dirname, '..', 'tools');
if (!fs.existsSync(toolsDir)) {
    logger.warn(`Tools directory not found: ${toolsDir}`);
}

const toolFiles = fs.readdirSync(toolsDir).filter(f => f.endsWith('.json'));

const toolManifests: Record<string, ToolManifest> = Object.fromEntries(
    toolFiles.map(f => {
        const filePath = path.join(toolsDir, f);
        const m: ToolManifest = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
        return [m.name, m];
    })
);

const quotas: Record<string, number> = {};
const QUOTA_LIMIT = 25; // lowered for tests

// --- Middleware and Helpers ---

function auth(req: Request, res: Response, next: NextFunction): Response | void {
    const hdr = req.headers['authorization'] || '';
    if (!hdr.startsWith('Bearer ')) return res.status(401).json({ error: 'unauthorized' });
    const token = hdr.slice(7);
    if (token !== AUTH_TOKEN) return res.status(403).json({ error: 'forbidden' });
    next();
}

function withTrace(req: Request): string {
    const tp = req.headers['traceparent'] || '00-00000000000000000000000000000000-0000000000000000-00';
    return String(tp);
}

function emitOtlpSpan(name: string, attrs: OtlpAttributes): void {
    try {
        fs.mkdirSync(OTLP_DIR, { recursive: true });
        const span = {
            name,
            time: Date.now(),
            attributes: attrs
        };
        const safe = name.replace(/[^a-zA-Z0-9_-]/g, '_') + '-' + String(span.time) + '.json';
        fs.writeFileSync(path.join(OTLP_DIR, safe), JSON.stringify(span, null, 2));
    } catch (e) {
        // ignore in dev
    }
}

// --- Route Handlers (/discover, /schema) ---

app.get('/discover', auth, (req: Request, res: Response) => {
    const traceparent = withTrace(req);
    logger.info({ msg: 'discover', traceparent, server: 'mcp-ngsi' });
    emitOtlpSpan('discover', { traceparent, server: 'mcp-ngsi' });
    res.json({
        server: 'mcp-ngsi',
        tools: Object.values(toolManifests).map((m) => ({ name: m.name, capabilities: m.capabilities, effects: m.effects }))
    });
});

app.get('/schema/:tool', auth, (req: Request, res: Response) => {
    const traceparent = withTrace(req);
    const t = req.params.tool;
    const m = toolManifests[t];
    logger.info({ msg: 'schema', t, found: !!m, traceparent });
    emitOtlpSpan('schema', { tool: t, found: !!m, traceparent });
    if (!m) return res.status(404).json({ error: 'tool_not_found' });
    res.json(m);
});

// --- Route Handler /call (Updated with Validation and Idempotency Logic) ---

app.post('/call', auth, async (req: Request<{}, {}, Partial<CallBody>>, res: Response) => {
    const traceparent = withTrace(req);
    const { tool, args = {}, scope = {} } = req.body || {};
    
    if (!tool) return res.status(400).json({ error: 'tool_missing', class: 'E-P' });
    const m = toolManifests[tool];
    if (!m) return res.status(404).json({ error: 'tool_not_found', class: 'E-P' });

    // 1. Determine Idempotency Key
    const idempotencyKey = (args && args.idempotency_key) ? String(args.idempotency_key) : String(Date.now());
    const dryRun = !!(args && args.dry_run);

    // Check if the key has already been processed 
    if (processedKeys.has(idempotencyKey)) {
        logger.warn({ msg: 'call_already_processed', tool, traceparent, idempotencyKey });
        // Return 200 OK with 'already_processed' status 
        const ack = { 
            status: 'already_processed', 
            effect: 'none', 
            idempotency_key: idempotencyKey 
        };
        return res.json({ ok: true, tool, args, scope, traceparent, ack });
    }

    // Capability check 
    const capabilities = m.capabilities;
    if (capabilities && capabilities.read && scope.read) {
        const allowed = capabilities.read.some((s: string) => scope.read!.includes(s) || scope.read!.includes('*'));
        if (!allowed) {
            emitOtlpSpan('call_denied', { tool, class: 'E-V', reason: 'capability', traceparent });
            return res.status(403).json({ error: 'capability_denied', class: 'E-V' });
        }
    }
    if (capabilities && capabilities.write && scope.write) {
        const allowed = capabilities.write.some((s: string) => scope.write!.includes(s));
        if (!allowed) {
            emitOtlpSpan('call_denied', { tool, class: 'E-V', reason: 'capability', traceparent });
            return res.status(403).json({ error: 'capability_denied', class: 'E-V' });
        }
    }

    // Quota check 
    quotas[tool] = (quotas[tool] || 0) + 1;
    if (quotas[tool] > QUOTA_LIMIT) {
        emitOtlpSpan('quota_exceeded', { tool, class: 'E-U', traceparent, count: quotas[tool] });
        return res.status(429).json({ error: 'quota_exceeded', class: 'E-U' });
    }

    // Validation (Required Fields + Zod)
    try {
        const reqs: string[] = (m.input_schema && Array.isArray(m.input_schema.required)) ? m.input_schema.required : [];
        
        // ** Required field check ** (This handles the 'missing' error)
        for (const k of reqs) {
            if (!args || args[k] === undefined || args[k] === null) { 
                emitOtlpSpan('validation_error', { tool, class: 'E-V', traceparent, missing: k }); 
                return res.status(400).json({ error: 'validation_error', class: 'E-V', missing: k }); 
            }
        }
        
        // Zod validation
        let schema: ZodTypeAny;
        if (m.input_schema && m.input_schema.properties) {
            const properties: ZodRawShape = Object.fromEntries(
                Object.keys(m.input_schema.properties).map((k) => [k, z.any()])
            );
            schema = z.object(properties);
        } else {
            schema = z.any();
        }
        
        schema.parse(args);

    } catch (e) {
        const details = e instanceof Error ? e.message : String(e);
        emitOtlpSpan('validation_error', { tool, class: 'E-V', traceparent, details });
        return res.status(400).json({ error: 'validation_error', class: 'E-V', details });
    }

    // Simulate work completion
    await new Promise(r => setTimeout(r, 5));
    emitOtlpSpan('call_ok', { tool, traceparent });
    logger.info({ msg: 'call_ok', tool, traceparent });

    // Register key if not a dry run
    if (!dryRun) {
        processedKeys.add(idempotencyKey);
    }
    
    // Final ACK response
    const ack = { 
        status: 'accepted', 
        effect: dryRun ? 'none' : 'planned', 
        idempotency_key: idempotencyKey 
    };
    
    // NOTE: NGSI servers typically return data, but for this generic mock, we return ack for consistency
    return res.json({ ok: true, tool, args, scope, traceparent, ack });
});

// --- Server Startup ---

export function start() {
    return app.listen(PORT, () => logger.info({ msg: 'MCP server started', name: 'mcp-ngsi', port: PORT }));
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
    start();
}
