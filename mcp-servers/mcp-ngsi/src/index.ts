import express from 'express';
import cors from 'cors';
import pino from 'pino';
import fs from 'fs';
import path, { dirname } from 'path';
import { fileURLToPath } from 'url';
import { z } from 'zod';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
app.use(express.json());
app.use(cors());
const logger = pino();

const PORT = 8001;
const AUTH_TOKEN = process.env.AUTH_TOKEN || 'dev-token';

const toolsDir = path.join(__dirname, '..', 'tools');
const toolFiles = fs.readdirSync(toolsDir).filter(f => f.endsWith('.json'));
const toolManifests: Record<string, any> = Object.fromEntries(
  toolFiles.map(f => { const m = JSON.parse(fs.readFileSync(path.join(toolsDir, f), 'utf-8')); return [m.name, m]; })
);

const quotas: Record<string, number> = {}, QUOTA_LIMIT = 1000;

function auth(req:any, res:any, next:any) {
  const hdr = req.headers['authorization'] || '';
  if (!hdr.startsWith('Bearer ')) return res.status(401).json({ error: 'unauthorized' });
  const token = hdr.slice(7);
  if (token !== AUTH_TOKEN) return res.status(403).json({ error: 'forbidden' });
  next();
}

app.get('/discover', auth, (req, res) => {
  res.json({
    server: 'mcp-ngsi',
    tools: Object.values(toolManifests).map((m:any) => ({ name: m.name, capabilities: m.capabilities, effects: m.effects }))
  });
});

app.get('/schema/:tool', auth, (req, res) => {
  const t = req.params.tool;
  const m = toolManifests[t];
  if (!m) return res.status(404).json({ error: 'tool_not_found' });
  res.json(m);
});

app.post('/call', auth, async (req, res) => {
  const traceparent = req.headers['traceparent'] || '00-00000000000000000000000000000000-0000000000000000-00';
  const { tool, args, scope } = req.body || {};
  const m = toolManifests[tool];
  if (!m) return res.status(404).json({ error: 'tool_not_found', class: 'E-P' });

  // capability check
  if (m.capabilities && m.capabilities.read && scope && scope.read) {
    const allowed = (m.capabilities.read as string[]).some((s:string) => scope.read.includes(s));
    if (!allowed) return res.status(403).json({ error: 'capability_denied', class: 'E-V' });
  }
  if (m.capabilities && m.capabilities.write && scope && scope.write) {
    const allowed = (m.capabilities.write as string[]).some((s:string) => scope.write.includes(s));
    if (!allowed) return res.status(403).json({ error: 'capability_denied', class: 'E-V' });
  }

  quotas[tool] = (quotas[tool] || 0) + 1;
  if (quotas[tool] > QUOTA_LIMIT) return res.status(429).json({ error: 'quota_exceeded', class: 'E-U' });

  try {
    const schema = m.input_schema ? z.object(Object.fromEntries(Object.keys(m.input_schema.properties || {})
                     .map((k:any) => [k, z.any()]))) : z.any();
    schema.parse(args || {});
  } catch (e:any) {
    return res.status(400).json({ error: 'validation_error', class: 'E-V', details: String(e) });
  }

  await new Promise(r => setTimeout(r, 8));
  return res.json({ ok: true, tool, args, scope, traceparent });
});

app.listen(PORT, () => logger.info({ msg: 'MCP server started', name: 'mcp-ngsi', port: PORT }));
