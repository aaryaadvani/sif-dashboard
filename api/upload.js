// api/upload.js
// Accepts multipart PDF upload, parses key data, stores in Vercel KV

import { Redis } from '@upstash/redis';
const redis = Redis.fromEnv();
import formidable from 'formidable';
import fs from 'fs';
import pdf from 'pdf-parse';

export const config = { api: { bodyParser: false } };

// ── helpers ──────────────────────────────────────────────
const num  = (s) => parseFloat((s || '').replace(/[^0-9.\-]/g, '')) || 0;
const pct  = (s) => parseFloat((s || '').replace(/[^0-9.\-]/g, '')) || 0;

function parseText(text) {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);

  // ── KPIs ─────────────────────────────────────────────
  const aum = (() => {
    const m = text.match(/Total SIF Portfolio[^\d]*\$?([\d,]+)/i);
    return m ? num(m[1]) : null;
  })();

  const cumReturn = (() => {
    const m = text.match(/SIF Composite[^\d\-]*(-?[\d.]+%)/i);
    return m ? m[1] : null;
  })();

  const benchReturn = (() => {
    const m = text.match(/Composite Benchmark[^\d\-]*(-?[\d.]+%)/i);
    return m ? m[1] : null;
  })();

  const alpha = (() => {
    const m = text.match(/Relative Performance vs\. Benchmark[^\d\-]*(-?[\d.]+%)[^\d\-]*(-?[\d.]+%)/i);
    return m ? m[2] : null;
  })();

  // ── Asset allocation ──────────────────────────────────
  const assetClasses = [
    { label: 'Domestic Equity', regex: /Domestic\s+\$[\d,]+\s+\$[\d,]+\s+\$[\d,]+\s+([\d.]+)%\s+([\d.]+)%/ },
    { label: 'International',   regex: /International\s+\$[\d,]+\s+\$[\d,]+\s+\$[\d,]+\s+([\d.]+)%\s+([\d.]+)%/ },
    { label: 'Emerging',        regex: /Emerging\s+\$[\d,]+\s+\$[\d,]+\s+\$[\d,]+\s+([\d.]+)%\s+([\d.]+)%/ },
    { label: 'Alternatives',    regex: /Alternative\s+\$[\d,]+\s+\$[\d,]+\s+\$[\d,]+\s+([\d.]+)%\s+([\d.]+)%/ },
    { label: 'Bonds',           regex: /Bond\s+\$[\d,]+\s+\$[\d,]+\s+\$[\d,]+\s+([\d.]+)%\s+([\d.]+)%/ },
    { label: 'Cash',            regex: /Cash\s+\$[\d,]+\s+\$[\d,]+\s+\$[\d,]+\s+([\d.]+)%\s+([\d.]+)%/ },
  ];

  const allocation = assetClasses.map(ac => {
    const m = text.match(ac.regex);
    return {
      label:   ac.label,
      current: m ? pct(m[1]) : null,
      target:  m ? pct(m[2]) : null,
    };
  });

  // ── Sector weights ────────────────────────────────────
  const sectorNames = [
    'Financials','Information Technology','Industrials','Consumer Discretionary',
    'Materials','Communications','Utilities','Consumer Staples','Energy','Healthcare','Real Estate'
  ];

  const sectors = sectorNames.map(name => {
    // Match "SectorName  XX.X%  XX.X%  XX.X%  ±X.X%"
    const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const m = text.match(new RegExp(escaped + '\\s+([\\d.]+)%\\s+([\\d.]+)%\\s+([\\d.]+)%'));
    return {
      name,
      portfolio:  m ? pct(m[3]) : null,
      benchmark:  m ? pct(m[1]) : null,
    };
  });

  // ── Fellow returns ────────────────────────────────────
  const fellowNames = ['Aarya','Boram','Isabella','JP','Kellie','Leon','Luis','Owen','Rodrigo'];
  const fellows = fellowNames.map(name => {
    const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    // Match fellow row: "Name  $gain  -X.X%  rank  -X.X%"
    const m = text.match(new RegExp(escaped + '[^\\d\\-]*(-?[\\d.]+)%\\s+\\d+\\s+(-?[\\d.]+)%'));
    return {
      name,
      ret:  m ? pct(m[1]) / 100 : null,
      relVsBench: m ? pct(m[2]) / 100 : null,
    };
  });

  return { aum, cumReturn, benchReturn, alpha, allocation, sectors, fellows, parsedAt: new Date().toISOString() };
}

// ── handler ───────────────────────────────────────────────
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  // Auth
  const key = req.headers['x-upload-key'];
  if (key !== process.env.UPLOAD_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const form = formidable({ maxFileSize: 10 * 1024 * 1024 });
    const [, files] = await form.parse(req);
    const file = Array.isArray(files.pdf) ? files.pdf[0] : files.pdf;
    if (!file) return res.status(400).json({ error: 'No PDF file provided' });

    const buffer = fs.readFileSync(file.filepath);
    const { text } = await pdf(buffer);
    const data = parseText(text);

    await redis.set(`sif:latest', JSON.stringify(data));
    await redis.set(`sif:history:' + Date.now(), JSON.stringify(data));

    res.status(200).json({ success: true, parsedAt: data.parsedAt, preview: { aum: data.aum, cumReturn: data.cumReturn } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
}
