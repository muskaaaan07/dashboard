/**
 * MongoDB client: uses Atlas Data API if configured, otherwise local Node server (/api).
 */

const DATA_API_URL = import.meta.env.VITE_MONGODB_DATA_API_URL as string | undefined;
const DATA_API_KEY = import.meta.env.VITE_MONGODB_DATA_API_KEY as string | undefined;
const USE_LOCAL_SERVER = import.meta.env.VITE_USE_MONGODB_SERVER === 'true';

const DATABASE = 'axio_analytics';
const COLLECTION = 'sheetData';
const DATA_SOURCE = 'Cluster0';

const useDataApi = Boolean(DATA_API_URL && DATA_API_KEY);

export function isDataApiConfigured(): boolean {
  return useDataApi || USE_LOCAL_SERVER;
}

// ——— Data API (Atlas) ———
async function dataApiPost<T>(action: string, body: Record<string, unknown>): Promise<T> {
  if (!DATA_API_URL || !DATA_API_KEY) {
    throw new Error('MongoDB Data API is not configured.');
  }
  const url = `${DATA_API_URL.replace(/\/$/, '')}/action/${action}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'api-key': DATA_API_KEY,
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Data API ${action} failed: ${res.status} ${text}`);
  }
  return res.json() as Promise<T>;
}

// ——— Local Node server ———
async function localGet(): Promise<{ document: AnalyticsDocument | null }> {
  const res = await fetch('/api/analytics');
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API get failed: ${res.status} ${text}`);
  }
  return res.json();
}

async function localSave(sheetData: any[][]): Promise<void> {
  const res = await fetch('/api/analytics', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sheetData }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API save failed: ${res.status} ${text}`);
  }
}

export interface AnalyticsDocument {
  _id: string;
  sheetData: any[][];
  updatedAt?: string;
}

export async function getAnalyticsDocument(): Promise<AnalyticsDocument | null> {
  if (useDataApi) {
    const result = await dataApiPost<{ document: AnalyticsDocument | null }>('findOne', {
      dataSource: DATA_SOURCE,
      database: DATABASE,
      collection: COLLECTION,
      filter: { _id: 'analytics' },
    });
    return result.document ?? null;
  }
  if (USE_LOCAL_SERVER) {
    const result = await localGet();
    return result.document ?? null;
  }
  throw new Error('MongoDB not configured. Set Data API (VITE_MONGODB_DATA_API_*) or local server (VITE_USE_MONGODB_SERVER=true) and run npm run server.');
}

export async function saveAnalyticsDocument(sheetData: any[][]): Promise<void> {
  if (useDataApi) {
    const updatedAt = new Date().toISOString();
    const doc = await getAnalyticsDocument();
    if (doc) {
      await dataApiPost('updateOne', {
        dataSource: DATA_SOURCE,
        database: DATABASE,
        collection: COLLECTION,
        filter: { _id: 'analytics' },
        update: { $set: { sheetData, updatedAt } },
      });
    } else {
      await dataApiPost('insertOne', {
        dataSource: DATA_SOURCE,
        database: DATABASE,
        collection: COLLECTION,
        document: { _id: 'analytics', sheetData, updatedAt },
      });
    }
    return;
  }
  if (USE_LOCAL_SERVER) {
    await localSave(sheetData);
    return;
  }
  throw new Error('MongoDB not configured.');
}
