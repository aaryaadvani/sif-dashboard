// api/data.js
// Returns latest SIF data from KV store, with fallback to seed data

import { kv } from '@vercel/kv';

const SEED = {
  parsedAt: '2026-03-06T00:00:00.000Z',
  aum: 4321292,
  cumReturn: '+11.05%',
  benchReturn: '+18.43%',
  alpha: '-7.38%',
  allocation: [
    { label: 'Domestic Equity', current: 38.1, target: 44.0 },
    { label: 'International',   current: 14.7, target: 18.0 },
    { label: 'Emerging',        current: 11.5, target: 7.0  },
    { label: 'Alternatives',    current: 6.4,  target: 4.0  },
    { label: 'Bonds',           current: 21.2, target: 17.0 },
    { label: 'Cash',            current: 1.6,  target: 3.0  },
  ],
  sectors: [
    { name: 'Info Tech',      portfolio: 32.3, benchmark: 27.5 },
    { name: 'Consumer Disc',  portfolio: 20.3, benchmark: 11.2 },
    { name: 'Financials',     portfolio: 18.3, benchmark: 10.9 },
    { name: 'Consumer Stap',  portfolio: 11.4, benchmark: 7.0  },
    { name: 'Communications', portfolio: 7.6,  benchmark: 8.9  },
    { name: 'Real Estate',    portfolio: 3.0,  benchmark: 3.5  },
    { name: 'Energy',         portfolio: 2.9,  benchmark: 4.1  },
    { name: 'Industrials',    portfolio: 2.9,  benchmark: 8.0  },
    { name: 'Healthcare',     portfolio: 1.3,  benchmark: 13.6 },
    { name: 'Materials',      portfolio: 0.0,  benchmark: 2.7  },
    { name: 'Utilities',      portfolio: 0.0,  benchmark: 2.8  },
  ],
  fellows: [
    { name: 'Luis',     ret:  0.002,  beta: 1.02, rank: 1 },
    { name: 'Leon',     ret: -0.012,  beta: 1.39, rank: 2 },
    { name: 'Owen',     ret: -0.057,  beta: 0.92, rank: 3 },
    { name: 'Boram',    ret: -0.076,  beta: 0.90, rank: 4 },
    { name: 'Kellie',   ret: -0.107,  beta: 1.18, rank: 5 },
    { name: 'Isabella', ret: -0.144,  beta: 0.94, rank: 6 },
    { name: 'Rodrigo',  ret: -0.152,  beta: 1.19, rank: 7 },
    { name: 'JP',       ret: -0.163,  beta: 1.24, rank: 8 },
    { name: 'Aarya',    ret: -0.175,  beta: 1.36, rank: 9 },
  ],
  overlap: [
    { ticker: 'META',  count: 6, fellows: 'Aarya, JP, Kellie, Leon, Luis, Owen' },
    { ticker: 'AMZN',  count: 4, fellows: 'Isabella, JP, Kellie, Rodrigo' },
    { ticker: 'JPM',   count: 4, fellows: 'Isabella, Kellie, Leon, Luis' },
    { ticker: 'MSFT',  count: 3, fellows: 'Isabella, Kellie, Rodrigo' },
    { ticker: 'GOOGL', count: 3, fellows: 'JP, Luis, Owen' },
    { ticker: 'MELI',  count: 3, fellows: 'Aarya, Leon, Rodrigo' },
    { ticker: 'C',     count: 2, fellows: 'Luis, Rodrigo' },
    { ticker: 'NKE',   count: 2, fellows: 'Isabella, Kellie' },
    { ticker: 'IAUM',  count: 2, fellows: 'JP, Owen' },
  ],
};

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate');

  try {
    const raw = await kv.get('sif:latest');
    const data = raw ? JSON.parse(raw) : SEED;
    // Always merge overlap from seed if not in parsed data
    if (!data.overlap) data.overlap = SEED.overlap;
    res.status(200).json(data);
  } catch (err) {
    // KV not configured yet — return seed data
    res.status(200).json(SEED);
  }
}
