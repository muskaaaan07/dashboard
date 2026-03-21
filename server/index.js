/**
 * Node.js server: MongoDB direct connection and REST API for analytics.
 * Set MONGODB_URI in .env (e.g. mongodb+srv://user:pass@cluster.mongodb.net/?appName=Cluster0).
 */

import 'dotenv/config';
import express from 'express';
import { MongoClient } from 'mongodb';

const app = express();
const PORT = process.env.PORT || 3001;

const MONGODB_URI = process.env.MONGODB_URI;
const DATABASE = 'axio_analytics';
const COLLECTION = 'sheetData';
const DOC_ID = 'analytics';

if (!MONGODB_URI) {
  console.error('Missing MONGODB_URI. Add it to .env in the project root (same folder as package.json).');
  console.error('Example: MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/?appName=Cluster0');
  process.exit(1);
}

app.use(express.json({ limit: '10mb' }));

// CORS: allow frontend origin(s)
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

let client;
async function getDb() {
  if (!client) {
    client = new MongoClient(MONGODB_URI);
    await client.connect();
  }
  return client.db(DATABASE);
}

// GET /api/analytics — return the single analytics document or null
app.get('/api/analytics', async (req, res) => {
  try {
    const db = await getDb();
    const doc = await db.collection(COLLECTION).findOne({ _id: DOC_ID });
    res.json({ document: doc ?? null });
  } catch (err) {
    console.error('GET /api/analytics:', err);
    res.status(500).json({ error: err.message || 'Failed to fetch analytics' });
  }
});

// POST /api/analytics — save sheetData (insert or update)
app.post('/api/analytics', async (req, res) => {
  try {
    const { sheetData } = req.body;
    if (!Array.isArray(sheetData)) {
      return res.status(400).json({ error: 'Body must include { sheetData: array }' });
    }
    const updatedAt = new Date().toISOString();
    const db = await getDb();
    const col = db.collection(COLLECTION);
    const existing = await col.findOne({ _id: DOC_ID });
    if (existing) {
      await col.updateOne(
        { _id: DOC_ID },
        { $set: { sheetData, updatedAt } }
      );
    } else {
      await col.insertOne({ _id: DOC_ID, sheetData, updatedAt });
    }
    res.json({ ok: true });
  } catch (err) {
    console.error('POST /api/analytics:', err);
    res.status(500).json({ error: err.message || 'Failed to save analytics' });
  }
});

// Health check for proxy
app.get('/api/health', (req, res) => {
  res.json({ ok: true, service: 'analytics-api' });
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
  console.log('  GET  /api/analytics  - fetch analytics document');
  console.log('  POST /api/analytics  - save sheetData');
});
