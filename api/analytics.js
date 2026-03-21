/**
 * Vercel serverless function: GET/POST /api/analytics (MongoDB).
 * Set MONGODB_URI in Vercel project Environment Variables.
 */

import { MongoClient } from 'mongodb';

const DATABASE = 'axio_analytics';
const COLLECTION = 'sheetData';
const DOC_ID = 'analytics';

let cachedClient = null;
async function getDb() {
  const uri = process.env.MONGODB_URI;
  if (!uri) return null;
  if (!cachedClient) {
    cachedClient = new MongoClient(uri);
    await cachedClient.connect();
  }
  return cachedClient.db(DATABASE);
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).end();

  const db = await getDb();
  if (!db) {
    return res.status(500).json({ error: 'MONGODB_URI not configured' });
  }

  try {
    if (req.method === 'GET') {
      const doc = await db.collection(COLLECTION).findOne({ _id: DOC_ID });
      return res.status(200).json({ document: doc ?? null });
    }
    if (req.method === 'POST') {
      const { sheetData } = req.body || {};
      if (!Array.isArray(sheetData)) {
        return res.status(400).json({ error: 'Body must include { sheetData: array }' });
      }
      const updatedAt = new Date().toISOString();
      const col = db.collection(COLLECTION);
      const existing = await col.findOne({ _id: DOC_ID });
      if (existing) {
        await col.updateOne({ _id: DOC_ID }, { $set: { sheetData, updatedAt } });
      } else {
        await col.insertOne({ _id: DOC_ID, sheetData, updatedAt });
      }
      return res.status(200).json({ ok: true });
    }
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('[api/analytics]', err);
    return res.status(500).json({ error: err.message || 'Server error' });
  }
}
