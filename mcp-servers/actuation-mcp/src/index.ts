
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import pino from 'pino';
import fs from 'fs';
import path, { dirname } from 'path'; // Added 'dirname' for ESM pathing
import { fileURLToPath } from 'url'; // Added for ESM pathing
import { z, ZodObject, ZodRawShape, ZodTypeAny } from 'zod';

// --- Type Definitions ---

// Define a type for tools/manifests
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

// Define a type for OTLP attributes object
interface OtlpAttributes {
    traceparent?: string;
    server?: string;
    tool?: string;
    found?: boolean;
    class?: string;
    reason?: string;
    count?: number;
    details?: string;
}

// Define interface for the POST /call request body
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

// The logger is already typed by the pino library
const logger = pino();

const PORT = 8003;
const AUTH_TOKEN = process.env.AUTH_TOKEN || 'dev-token';
const OTLP_DIR = process.env.OTLP_DIR || path.join(process.cwd(), 'traces', 'golden');

// --- Handle ESM __dirname compatibility ---
// This is necessary because the rest of the code is likely run in an ESM context.
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// --- Tool Manifest Loading ---

const toolsDir = path.join(__dirname, '..', 'tools');
// Using fs.existsSync to prevent errors if the directory is missing
if (!fs.existsSync(toolsDir)) {
    logger.warn(`Tools directory not found: ${toolsDir}`);
}

const toolFiles = fs.readdirSync(toolsDir).filter(f => f.endsWith('.json'));

// Explicitly type toolManifests
const toolManifests: Record<string, ToolManifest> = Object.fromEntries(
    toolFiles.map(f => {
        const filePath = path.join(toolsDir, f);
        const m: ToolManifest = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
        return [m.name, m];
    })
);

// Explicitly type quotas
const quotas: Record<string, number> = {};
const QUOTA_LIMIT = 25; // lowered for tests

// --- Middleware Functions ---

// 1. Typed auth function (Express Middleware)
function auth(req: Request, res: Response, next: NextFunction): Response | void {
    const hdr = req.headers['authorization'] || '';
    if (!hdr.startsWith('Bearer ')) return res.status(401).json({ error: 'unauthorized' });
    const token = hdr.slice(7);
    if (token !== AUTH_TOKEN) return res.status(403).json({ error: 'forbidden' });
    next();
}

// 2. Typed withTrace (Receives Request, returns string)
function withTrace(req: Request): string {
    const tp = req.headers['traceparent'] || '00-00000000000000000000000000000000-0000000000000000-00';
    return String(tp);
}

// 3. Typed emitOtlpSpan (Receives string and Attributes Object)
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

// --- Route Handlers ---

app.get('/discover', auth, (req: Request, res: Response) => {
    const traceparent = withTrace(req);
    logger.info({ msg: 'discover', traceparent, server: 'actuation-mcp' });
    emitOtlpSpan('discover', { traceparent, server: 'actuation-mcp' });
    res.json({
        server: 'actuation-mcp',
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

app.post('/call', auth, async (req: Request<{}, {}, Partial<CallBody>>, res: Response) => {
    const traceparent = withTrace(req);
    // Destructure with default values to avoid reference errors
    const { tool, args = {}, scope = {} } = req.body || {};
    
    // Tool existence check
    if (!tool) return res.status(400).json({ error: 'tool_missing', class: 'E-P' });
    const m = toolManifests[tool];
    if (!m) return res.status(404).json({ error: 'tool_not_found', class: 'E-P' });

    // Capability check
    const capabilities = m.capabilities;

    if (capabilities && capabilities.read && scope.read) {
        // Explicitly type 's' as string in .some()
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

    // Validation
    try {
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
        // Correctly handle and extract the error details
        const details = e instanceof Error ? e.message : String(e);
        emitOtlpSpan('validation_error', { tool, class: 'E-V', traceparent, details });
        return res.status(400).json({ error: 'validation_error', class: 'E-V', details });
    }

    await new Promise(r => setTimeout(r, 5));
    emitOtlpSpan('call_ok', { tool, traceparent });
    logger.info({ msg: 'call_ok', tool, traceparent });
    return res.json({ ok: true, tool, args, scope, traceparent });
});

// --- Server Startup ---

// Export start() so it can be called in tests
export function start() {
    return app.listen(PORT, () => logger.info({ msg: 'MCP server started', name: 'actuation-mcp', port: PORT }));
}

// Start the server only if the file is executed directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
    start();
}