import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { getAnalyticsDocument, saveAnalyticsDocument, isDataApiConfigured } from '../api/mongodbDataApi';
import { Download, Upload, Database, Loader2, AlertCircle, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ADMIN_AUTH_KEY } from './AdminLogin';

const TEMPLATE_URL = '/analytics-data%20.xlsx';

const AdminPanel: React.FC = () => {
  const navigate = useNavigate();
  const [sheetData, setSheetData] = useState<any[][]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadingDb, setLoadingDb] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const loadFromDb = async () => {
    if (!isDataApiConfigured()) {
      setMessage({ type: 'error', text: 'MongoDB Data API is not configured. Set VITE_MONGODB_DATA_API_URL and VITE_MONGODB_DATA_API_KEY.' });
      setLoading(false);
      return;
    }
    setLoadingDb(true);
    setMessage(null);
    try {
      const doc = await getAnalyticsDocument();
      if (doc && doc.sheetData && doc.sheetData.length > 0) {
        setSheetData(doc.sheetData);
        setMessage({ type: 'success', text: 'Data loaded from database.' });
      } else {
        setSheetData([]);
        setMessage({ type: 'error', text: 'No data in database. Upload Excel or paste and save.' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Failed to load from database.' });
      setSheetData([]);
    } finally {
      setLoadingDb(false);
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFromDb();
  }, []);

  const handleDownloadTemplate = () => {
    const link = document.createElement('a');
    link.href = TEMPLATE_URL;
    link.download = 'analytics-template.xlsx';
    link.rel = 'noopener noreferrer';
    link.click();
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setMessage(null);
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const arrayBuffer = ev.target?.result as ArrayBuffer;
        const workbook = XLSX.read(arrayBuffer, { type: 'array' });
        const sheetName = workbook.SheetNames[0] || 'Analytics Data';
        const sheet = workbook.Sheets[sheetName];
        if (!sheet) {
          setMessage({ type: 'error', text: 'Sheet not found.' });
          return;
        }
        const data = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' }) as any[][];
        if (!data || data.length === 0) {
          setMessage({ type: 'error', text: 'Sheet is empty.' });
          return;
        }
        setSheetData(data);
        setMessage({ type: 'success', text: 'File loaded. Edit and click Save to database.' });
      } catch (err) {
        setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Failed to parse Excel.' });
      }
    };
    reader.readAsArrayBuffer(file);
    e.target.value = '';
  };

  const handleSaveToDb = async () => {
    if (!isDataApiConfigured()) {
      setMessage({ type: 'error', text: 'MongoDB Data API is not configured.' });
      return;
    }
    if (!sheetData.length) {
      setMessage({ type: 'error', text: 'No data to save. Upload Excel first.' });
      return;
    }
    setSaving(true);
    setMessage(null);
    try {
      await saveAnalyticsDocument(sheetData);
      setMessage({ type: 'success', text: 'Data saved to database.' });
    } catch (err) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Failed to save.' });
    } finally {
      setSaving(false);
    }
  };

  const handleCellChange = (rowIndex: number, colIndex: number, value: string) => {
    setSheetData((prev) => {
      const next = prev.map((row) => [...(row || [])]);
      if (!next[rowIndex]) next[rowIndex] = [];
      while (next[rowIndex].length <= colIndex) next[rowIndex].push('');
      next[rowIndex][colIndex] = value;
      return next;
    });
  };

  const handleLogout = () => {
    sessionStorage.removeItem(ADMIN_AUTH_KEY);
    navigate('/admin', { replace: true });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between h-auto sm:h-16 py-4 sm:py-0 gap-4">
            <h1 className="text-xl font-bold text-gray-900">Admin Panel | Analytics Data</h1>
            <div className="flex items-center gap-2">
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </button>
              <a href="/" className="text-sm text-indigo-600 hover:underline">Dashboard</a>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-wrap gap-4 mb-6">
          <button
            type="button"
            onClick={handleDownloadTemplate}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            <Download className="w-4 h-4" />
            Download template
          </button>
          <label className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 cursor-pointer">
            <Upload className="w-4 h-4" />
            Upload Excel
            <input type="file" accept=".xlsx" onChange={handleFileSelect} className="hidden" />
          </label>
          <button
            onClick={loadFromDb}
            disabled={loadingDb || !isDataApiConfigured()}
            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50"
          >
            {loadingDb ? <Loader2 className="w-4 h-4 animate-spin" /> : <Database className="w-4 h-4" />}
            Load from DB
          </button>
          <button
            onClick={handleSaveToDb}
            disabled={saving || !sheetData.length || !isDataApiConfigured()}
            className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Database className="w-4 h-4" />}
            Save to database
          </button>
        </div>

        {message && (
          <div
            className={`mb-4 p-4 rounded-lg flex items-start gap-3 ${
              message.type === 'error' ? 'bg-red-50 border border-red-200' : 'bg-green-50 border border-green-200'
            }`}
          >
            <AlertCircle className={`w-5 h-5 flex-shrink-0 mt-0.5 ${message.type === 'error' ? 'text-red-600' : 'text-green-600'}`} />
            <p className={message.type === 'error' ? 'text-red-600' : 'text-green-700'}>{message.text}</p>
          </div>
        )}

        {sheetData.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-500">
            No data. Upload an Excel file or load from database.
          </div>
        ) : (
          (() => {
            const maxCols = Math.max(0, ...sheetData.map((r) => (r && r.length) || 0));
            return (
              <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <tbody className="divide-y divide-gray-200">
                    {sheetData.map((row, rowIndex) => (
                      <tr key={rowIndex}>
                        {Array.from({ length: maxCols }, (_, colIndex) => (
                          <td key={colIndex} className="px-2 py-1 whitespace-nowrap">
                            <input
                              type="text"
                              aria-label={`Row ${rowIndex + 1}, column ${colIndex + 1}`}
                              value={row && row[colIndex] != null ? String(row[colIndex]) : ''}
                              onChange={(e) => handleCellChange(rowIndex, colIndex, e.target.value)}
                              className={`w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-indigo-500 focus:border-indigo-500 ${
                                colIndex === 0 ? 'min-w-[200px] max-w-[280px]' : 'min-w-[80px] max-w-[140px]'
                              }`}
                            />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          })()
        )}
      </main>
    </div>
  );
};

export default AdminPanel;
