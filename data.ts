import * as XLSX from 'xlsx';
import { PlatformData, PlatformKey, DailyMetric, OverallReportsData, MonthlyReport, WeeklyReport, MonthlyPlatformData } from './types';
import { getAnalyticsDocument, isDataApiConfigured } from './api/mongodbDataApi';

// Platform configuration
const PLATFORM_CONFIG: Record<PlatformKey, { id: string; name: string; color: string; sheetName: string }> = {
  [PlatformKey.OVERALL]: {
    id: 'overall',
    name: 'Overall Performance',
    color: '#6366f1',
    sheetName: 'Overall'
  },
  [PlatformKey.YOUTUBE]: {
    id: 'youtube',
    name: 'YouTube',
    color: '#ef4444',
    sheetName: 'YouTube'
  },
  [PlatformKey.INSTAGRAM]: {
    id: 'instagram',
    name: 'Instagram',
    color: '#ec4899',
    sheetName: 'Instagram'
  },
  [PlatformKey.WEBLINK]: {
    id: 'weblink',
    name: 'Weblink',
    color: '#3b82f6',
    sheetName: 'Weblink'
  },
  [PlatformKey.FACEBOOK]: {
    id: 'facebook',
    name: 'Facebook',
    color: '#1877F2',
    sheetName: 'Facebook'
  },
  [PlatformKey.REPORTS]: {
    id: 'reports',
    name: 'Overall Reports',
    color: '#6366f1',
    sheetName: 'Reports'
  }
};

// Cache for loaded data
let cachedData: Record<PlatformKey, PlatformData> | null = null;

/** Normalize to DD-MM-YYYY for display and filtering */
function toDDMMYYYY(day: number, month: number, year: number): string {
  const d = day.toString().padStart(2, '0');
  const m = (month + 1).toString().padStart(2, '0');
  return `${d}-${m}-${year}`;
}

/**
 * Formats a date value from Excel to DD-MM-YYYY format
 * Handles Excel serial numbers, date strings (DD-MM-YYYY, DD/MM/YYYY, DD/MM), and YYYY-MM-DD
 */
function formatDateFromExcel(dateValue: any): string {
  if (!dateValue && dateValue !== 0) return '';

  if (typeof dateValue === 'string') {
    const trimmed = dateValue.trim();
    // Already DD-MM-YYYY
    if (/^\d{1,2}-\d{1,2}-\d{4}$/.test(trimmed)) return trimmed;
    // DD/MM/YYYY or DD/MM - parse and convert to DD-MM-YYYY
    const slashParts = trimmed.split('/');
    if (slashParts.length >= 2) {
      const first = parseInt(slashParts[0], 10);
      const second = parseInt(slashParts[1], 10);
      const year = slashParts[2] ? parseInt(slashParts[2], 10) : new Date().getFullYear();
      let day: number, month: number;
      if (first > 12) {
        day = first;
        month = second - 1;
      } else if (second > 12) {
        month = first - 1;
        day = second;
      } else {
        day = first;
        month = second - 1;
      }
      const date = new Date(year, month, day);
      if (!isNaN(date.getTime())) return toDDMMYYYY(day, month, year);
    }
  }

  const excelEpoch = new Date(1899, 11, 30);
  const numValue = typeof dateValue === 'number' ? dateValue : Number(dateValue);
  if (!isNaN(numValue) && numValue > 0 && numValue < 1000000) {
    const days = Math.floor(numValue);
    const date = new Date(excelEpoch.getTime() + days * 24 * 60 * 60 * 1000);
    if (!isNaN(date.getTime()) && date.getFullYear() > 1900 && date.getFullYear() < 2100) {
      return toDDMMYYYY(date.getDate(), date.getMonth(), date.getFullYear());
    }
  }

  if (typeof dateValue === 'string') {
    const trimmed = dateValue.trim();
    const yyyymmdd = trimmed.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
    if (yyyymmdd) {
      const year = parseInt(yyyymmdd[1], 10);
      const month = parseInt(yyyymmdd[2], 10) - 1;
      const day = parseInt(yyyymmdd[3], 10);
      const date = new Date(year, month, day);
      if (!isNaN(date.getTime())) return toDDMMYYYY(day, month, year);
    }
    const date = new Date(trimmed);
    if (!isNaN(date.getTime()) && date.getFullYear() > 1900 && date.getFullYear() < 2100) {
      return toDDMMYYYY(date.getDate(), date.getMonth(), date.getFullYear());
    }
  }

  return String(dateValue);
}

/**
 * Parses raw sheet data (array of rows) into platform analytics.
 * Same logic used whether data comes from Excel or MongoDB Data API.
 */
function parseSheetDataToAnalytics(sheetData: any[][]): Record<PlatformKey, PlatformData> {
  const headerRow = sheetData[0];
    if (!headerRow || headerRow[0] !== 'Date') {
      throw new Error('Invalid Excel format: First cell must be "Date"');
    }

    // Extract dates from first row (skip the 'Date' cell) and format them
    const dates = headerRow.slice(1).map(d => formatDateFromExcel(d));

    // Create a map of metric name to row data
    const metricMap: Record<string, any[]> = {};
    for (let i = 1; i < sheetData.length; i++) {
      const row = sheetData[i];
      if (row && row[0]) {
        const metricName = String(row[0]);
        // Store the values (skip the first cell which is the metric name)
        metricMap[metricName] = row.slice(1);
      }
    }

    const data: Record<PlatformKey, PlatformData> = {} as Record<PlatformKey, PlatformData>;

    // Extract metrics for individual platforms (before processing Overall)
    const youtubeScanned = metricMap['YouTube_Scanned'] || [];
    const youtubeApproved = metricMap['YouTube_Approved'] || [];
    const youtubeRemoved = metricMap['YouTube_Removed'] || [];
    const instagramScanned = metricMap['Instagram_Scanned'] || [];
    const instagramApproved = metricMap['Instagram_Approved'] || [];
    const instagramRemoved = metricMap['Instagram_Removed'] || [];
    const weblinkScanned = metricMap['Weblink_Scanned'] || [];
    const weblinkApproved = metricMap['Weblink_Approved'] || [];
    const weblinkRemoved = metricMap['Weblink_Removed'] || [];
    const facebookScanned = metricMap['Facebook_Scanned'] || [];
    const facebookApproved = metricMap['Facebook_Approved'] || [];
    const facebookRemoved = metricMap['Facebook_Removed'] || [];

    // Extract TAT data for individual platforms (before processing Overall)
    const youtubeTAT1Day = metricMap['YouTube_TAT_1Day'] || [];
    const youtubeTAT2Day = metricMap['YouTube_TAT_2Day'] || [];
    const youtubeTAT3Day = metricMap['YouTube_TAT_3Day'] || [];
    const youtubeTAT4Day = metricMap['YouTube_TAT_4Day'] || [];
    const instagramTAT1Day = metricMap['Instagram_TAT_1Day'] || [];
    const instagramTAT2Day = metricMap['Instagram_TAT_2Day'] || [];
    const instagramTAT3Day = metricMap['Instagram_TAT_3Day'] || [];
    const instagramTAT4Day = metricMap['Instagram_TAT_4Day'] || [];
    const weblinkTAT1Day = metricMap['Weblink_TAT_1Day'] || [];
    const weblinkTAT2Day = metricMap['Weblink_TAT_2Day'] || [];
    const weblinkTAT3Day = metricMap['Weblink_TAT_3Day'] || [];
    const weblinkTAT4Day = metricMap['Weblink_TAT_4Day'] || [];
    const facebookTAT1Day = metricMap['Facebook_TAT_1Day'] || [];
    const facebookTAT2Day = metricMap['Facebook_TAT_2Day'] || [];
    const facebookTAT3Day = metricMap['Facebook_TAT_3Day'] || [];
    const facebookTAT4Day = metricMap['Facebook_TAT_4Day'] || [];

    // Calculate Overall metrics by summing individual platforms
    const overallScanned = dates.map((_, i) => {
      const yt = Number(youtubeScanned[i]) || 0;
      const ig = Number(instagramScanned[i]) || 0;
      const wb = Number(weblinkScanned[i]) || 0;
      const fb = Number(facebookScanned[i]) || 0;
      return yt + ig + wb + fb;
    });

    const overallApproved = dates.map((_, i) => {
      const yt = Number(youtubeApproved[i]) || 0;
      const ig = Number(instagramApproved[i]) || 0;
      const wb = Number(weblinkApproved[i]) || 0;
      const fb = Number(facebookApproved[i]) || 0;
      return yt + ig + wb + fb;
    });

    const overallRemoved = dates.map((_, i) => {
      const yt = Number(youtubeRemoved[i]) || 0;
      const ig = Number(instagramRemoved[i]) || 0;
      const wb = Number(weblinkRemoved[i]) || 0;
      const fb = Number(facebookRemoved[i]) || 0;
      return yt + ig + wb + fb;
    });

    const overallRemovalRate = dates.map((_, i) => {
      const approved = overallApproved[i] || 0;
      const removed = overallRemoved[i] || 0;
      return approved > 0 ? ((removed / approved) * 100) : 0;
    });

    // Calculate Overall TAT by summing individual platforms
    const overallTAT1Day = dates.map((_, i) => {
      const yt1 = Number(youtubeTAT1Day[i]) || 0;
      const ig1 = Number(instagramTAT1Day[i]) || 0;
      const wb1 = Number(weblinkTAT1Day[i]) || 0;
      const fb1 = Number(facebookTAT1Day[i]) || 0;
      return yt1 + ig1 + wb1 + fb1;
    });

    const overallTAT2Day = dates.map((_, i) => {
      const yt2 = Number(youtubeTAT2Day[i]) || 0;
      const ig2 = Number(instagramTAT2Day[i]) || 0;
      const wb2 = Number(weblinkTAT2Day[i]) || 0;
      const fb2 = Number(facebookTAT2Day[i]) || 0;
      return yt2 + ig2 + wb2 + fb2;
    });

    const overallTAT3Day = dates.map((_, i) => {
      const yt3 = Number(youtubeTAT3Day[i]) || 0;
      const ig3 = Number(instagramTAT3Day[i]) || 0;
      const wb3 = Number(weblinkTAT3Day[i]) || 0;
      const fb3 = Number(facebookTAT3Day[i]) || 0;
      return yt3 + ig3 + wb3 + fb3;
    });

    const overallTAT4Day = dates.map((_, i) => {
      const yt4 = Number(youtubeTAT4Day[i]) || 0;
      const ig4 = Number(instagramTAT4Day[i]) || 0;
      const wb4 = Number(weblinkTAT4Day[i]) || 0;
      const fb4 = Number(facebookTAT4Day[i]) || 0;
      return yt4 + ig4 + wb4 + fb4;
    });

    // Process each platform from the transposed data
    Object.values(PlatformKey).forEach((platformKey) => {
      // Skip REPORTS as it's handled separately
      if (platformKey === PlatformKey.REPORTS) {
        return;
      }
      
      const config = PLATFORM_CONFIG[platformKey];
      const prefix = config.sheetName; // Overall, YouTube, Instagram, Weblink

      // Extract metrics for this platform
      const scanned = metricMap[`${prefix}_Scanned`] || [];
      const approved = metricMap[`${prefix}_Approved`] || [];
      const removed = metricMap[`${prefix}_Removed`] || [];
      const removalRate = metricMap[`${prefix}_RemovalRate`] || [];

      // Extract TAT data based on platform
      let tat1Day: number[] = [];
      let tat2Day: number[] = [];
      let tat3Day: number[] = [];
      let tat4Day: number[] = [];

      // For Overall, use calculated metrics (sum of all platforms)
      let scannedData: number[] = [];
      let approvedData: number[] = [];
      let removedData: number[] = [];
      let removalRateData: number[] = [];

      if (platformKey === PlatformKey.OVERALL) {
        // Overall: use calculated metrics (sum of all platforms)
        scannedData = overallScanned;
        approvedData = overallApproved;
        removedData = overallRemoved;
        removalRateData = overallRemovalRate;
        tat1Day = overallTAT1Day;
        tat2Day = overallTAT2Day;
        tat3Day = overallTAT3Day;
        tat4Day = overallTAT4Day;
      } else {
        // Individual platforms: use data from Excel
        scannedData = scanned.map(v => Number(v) || 0);
        approvedData = approved.map(v => Number(v) || 0);
        removedData = removed.map(v => Number(v) || 0);
        removalRateData = removalRate.map(v => {
          const val = typeof v === 'string' ? parseFloat(v) : Number(v);
          return isNaN(val) ? 0 : val;
        });
      }

      if (platformKey === PlatformKey.YOUTUBE) {
        // YouTube: 1 Day, 2 Days, 3 Days, 4 Days
        tat1Day = youtubeTAT1Day.map(v => Number(v) || 0);
        tat2Day = youtubeTAT2Day.map(v => Number(v) || 0);
        tat3Day = youtubeTAT3Day.map(v => Number(v) || 0);
        tat4Day = youtubeTAT4Day.map(v => Number(v) || 0);
      } else if (platformKey === PlatformKey.INSTAGRAM) {
        // Instagram: 1 Day, 2 Days, 3 Days, 4 Days
        tat1Day = instagramTAT1Day.map(v => Number(v) || 0);
        tat2Day = instagramTAT2Day.map(v => Number(v) || 0);
        tat3Day = instagramTAT3Day.map(v => Number(v) || 0);
        tat4Day = instagramTAT4Day.map(v => Number(v) || 0);
      } else if (platformKey === PlatformKey.WEBLINK) {
        // Weblink: 1 Day, 2 Days, 3 Days, 4 Days
        tat1Day = weblinkTAT1Day.map(v => Number(v) || 0);
        tat2Day = weblinkTAT2Day.map(v => Number(v) || 0);
        tat3Day = weblinkTAT3Day.map(v => Number(v) || 0);
        tat4Day = weblinkTAT4Day.map(v => Number(v) || 0);
      } else if (platformKey === PlatformKey.FACEBOOK) {
        // Facebook: 1 Day, 2 Days, 3 Days, 4 Days
        tat1Day = facebookTAT1Day.map(v => Number(v) || 0);
        tat2Day = facebookTAT2Day.map(v => Number(v) || 0);
        tat3Day = facebookTAT3Day.map(v => Number(v) || 0);
        tat4Day = facebookTAT4Day.map(v => Number(v) || 0);
      }

      const metrics: DailyMetric[] = dates.map((date, i) => {
        const metric: DailyMetric = {
          date: String(date || ''),
          scanned: scannedData[i] || 0,
          approved: approvedData[i] || 0,
          removed: removedData[i] || 0,
          removalRate: removalRateData[i] || 0
        };

        // Add TAT fields based on platform
        if (tat1Day.length > 0) {
          metric.tat1Day = tat1Day[i] || 0;
        }
        if (tat2Day.length > 0) {
          metric.tat2Day = tat2Day[i] || 0;
        }
        if (tat3Day.length > 0) {
          metric.tat3Day = tat3Day[i] || 0;
        }
        if (tat4Day.length > 0) {
          metric.tat4Day = tat4Day[i] || 0;
        }

        return metric;
      });

      data[platformKey] = {
        id: config.id,
        name: config.name,
        color: config.color,
        metrics
      };
    });

  return data;
}

/**
 * Loads and parses the Excel file (fallback when Data API is not used or fails)
 */
async function loadExcelData(): Promise<Record<PlatformKey, PlatformData>> {
  if (cachedData) {
    return cachedData;
  }

  try {
    const response = await fetch('/analytics-data%20.xlsx');
    if (!response.ok) {
      throw new Error(`Failed to fetch Excel file: ${response.statusText}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: 'array' });

    const sheetName = workbook.SheetNames[0] || 'Analytics Data';
    const sheet = workbook.Sheets[sheetName];

    if (!sheet) {
      throw new Error(`Sheet "${sheetName}" not found in Excel file`);
    }

    const sheetData = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' }) as any[][];

    if (!sheetData || sheetData.length === 0) {
      throw new Error('Excel sheet is empty');
    }

    const headerRow = sheetData[0];
    if (!headerRow || headerRow[0] !== 'Date') {
      throw new Error('Invalid Excel format: First cell must be "Date"');
    }

    cachedData = parseSheetDataToAnalytics(sheetData);
    return cachedData;
  } catch (error) {
    console.error('Error loading Excel data:', error);
    throw error;
  }
}

/**
 * Gets analytics data. Tries MongoDB Data API first; falls back to Excel file.
 */
export async function getAnalyticsData(): Promise<Record<PlatformKey, PlatformData>> {
  if (isDataApiConfigured()) {
    try {
      const doc = await getAnalyticsDocument();
      if (doc?.sheetData?.length) {
        cachedData = parseSheetDataToAnalytics(doc.sheetData);
        return cachedData;
      }
    } catch (_) {
      // Fall through to Excel fallback
    }
  }
  return loadExcelData();
}

// Export a promise that resolves to the data (for backward compatibility)
export const ANALYTICS_DATA_PROMISE = getAnalyticsData();

// Cache for reports data
let cachedReportsData: OverallReportsData | null = null;

/**
 * Parses raw sheet data into Overall Reports data (Report_* rows).
 */
function parseSheetDataToReports(sheetData: any[][]): OverallReportsData {
  const metricMap: Record<string, any> = {};
  for (let i = 1; i < sheetData.length; i++) {
    const row = sheetData[i];
    if (row && row[0] && String(row[0]).startsWith('Report_')) {
      const metricName = String(row[0]);
      metricMap[metricName] = row[1] || '';
    }
  }

  // Dynamically extract all months present in the data
  const monthSet = new Set<string>();
  const monthYearMap: Record<string, { key: string; name: string; year: number }> = {};
  Object.keys(metricMap).forEach((metricKey) => {
    const match = metricKey.match(/^Report_([A-Za-z]+)_Week\d+_DateRange$/);
    if (match) {
      const key = match[1];
      // Try to infer month name and year from the date range if possible
      let name = key;
      let year = new Date().getFullYear();
      // Try to get a proper month name
      const monthNames: Record<string, string> = {
        Jan: 'January', Feb: 'February', Mar: 'March', Apr: 'April', May: 'May', Jun: 'June',
        Jul: 'July', Aug: 'August', Sep: 'September', Oct: 'October', Nov: 'November', Dec: 'December'
      };
      if (monthNames[key]) name = monthNames[key];
      // Try to extract year from the date range string
      const dateRange = metricMap[metricKey];
      if (typeof dateRange === 'string') {
        const yearMatch = dateRange.match(/\b(20\d{2})\b/);
        if (yearMatch) year = parseInt(yearMatch[1], 10);
      }
      monthSet.add(key);
      monthYearMap[key] = { key, name, year };
    }
  });

  // Sort months by year and month order
  const monthOrder = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const sortedMonths = Array.from(monthSet).sort((a, b) => {
    const yA = monthYearMap[a]?.year || 0;
    const yB = monthYearMap[b]?.year || 0;
    if (yA !== yB) return yA - yB;
    return monthOrder.indexOf(a) - monthOrder.indexOf(b);
  });

  const months: MonthlyReport[] = [];
  sortedMonths.forEach((monthKey) => {
    const monthConfig = monthYearMap[monthKey];
    const weeks: WeeklyReport[] = [];
    for (let weekNum = 1; weekNum <= 4; weekNum++) {
      const dateRange = metricMap[`Report_${monthKey}_Week${weekNum}_DateRange`] || '';
      const sent = Number(metricMap[`Report_${monthKey}_Week${weekNum}_Sent`]) || 0;
      const approved = Number(metricMap[`Report_${monthKey}_Week${weekNum}_Approved`]) || 0;
      const removed = Number(metricMap[`Report_${monthKey}_Week${weekNum}_Removed`]) || 0;
      const pending = Number(metricMap[`Report_${monthKey}_Week${weekNum}_Pending`]) || 0;
      const removalRateStr = metricMap[`Report_${monthKey}_Week${weekNum}_RemovalRate`];
      const removalRate = typeof removalRateStr === 'string' 
        ? parseFloat(removalRateStr) || 0 
        : Number(removalRateStr) || 0;
      weeks.push({
        dateRange: String(dateRange),
        totalSent: sent,
        totalApproved: approved,
        totalRemoved: removed,
        pendingLinks: pending,
        removalRate: removalRate
      });
    }
    // Extract monthly summary
    const monthlyDateRange = metricMap[`Report_${monthKey}_Monthly_DateRange`] || `${monthConfig.name} ${monthConfig.year}`;
    const monthlySent = Number(metricMap[`Report_${monthKey}_Monthly_Sent`]) || 0;
    const monthlyApproved = Number(metricMap[`Report_${monthKey}_Monthly_Approved`]) || 0;
    const monthlyRemoved = Number(metricMap[`Report_${monthKey}_Monthly_Removed`]) || 0;
    const monthlyPending = Number(metricMap[`Report_${monthKey}_Monthly_Pending`]) || 0;
    const monthlyRemovalRateStr = metricMap[`Report_${monthKey}_Monthly_RemovalRate`];
    const monthlyRemovalRate = typeof monthlyRemovalRateStr === 'string'
      ? parseFloat(monthlyRemovalRateStr) || 0
      : Number(monthlyRemovalRateStr) || 0;

    // Extract platform-wise monthly data
    const platformData: MonthlyPlatformData = {
      youtube: {
        scanned: Number(metricMap[`Report_${monthKey}_Platform_YouTube_Scanned`]) || 0,
        approved: Number(metricMap[`Report_${monthKey}_Platform_YouTube_Approved`]) || 0,
        removed: Number(metricMap[`Report_${monthKey}_Platform_YouTube_Removed`]) || 0,
        removalRate: (() => {
          const rateStr = metricMap[`Report_${monthKey}_Platform_YouTube_RemovalRate`];
          return typeof rateStr === 'string' ? parseFloat(rateStr) || 0 : Number(rateStr) || 0;
        })()
      },
      instagram: {
        scanned: Number(metricMap[`Report_${monthKey}_Platform_Instagram_Scanned`]) || 0,
        approved: Number(metricMap[`Report_${monthKey}_Platform_Instagram_Approved`]) || 0,
        removed: Number(metricMap[`Report_${monthKey}_Platform_Instagram_Removed`]) || 0,
        removalRate: (() => {
          const rateStr = metricMap[`Report_${monthKey}_Platform_Instagram_RemovalRate`];
          return typeof rateStr === 'string' ? parseFloat(rateStr) || 0 : Number(rateStr) || 0;
        })()
      },
      weblink: {
        scanned: Number(metricMap[`Report_${monthKey}_Platform_Weblink_Scanned`]) || 0,
        approved: Number(metricMap[`Report_${monthKey}_Platform_Weblink_Approved`]) || 0,
        removed: Number(metricMap[`Report_${monthKey}_Platform_Weblink_Removed`]) || 0,
        removalRate: (() => {
          const rateStr = metricMap[`Report_${monthKey}_Platform_Weblink_RemovalRate`];
          return typeof rateStr === 'string' ? parseFloat(rateStr) || 0 : Number(rateStr) || 0;
        })()
      }
    };
    // Add Facebook data if present for this month
    const fbScanned = metricMap[`Report_${monthKey}_Platform_Facebook_Scanned`];
    if (typeof fbScanned !== 'undefined') {
      platformData.facebook = {
        scanned: Number(metricMap[`Report_${monthKey}_Platform_Facebook_Scanned`]) || 0,
        approved: Number(metricMap[`Report_${monthKey}_Platform_Facebook_Approved`]) || 0,
        removed: Number(metricMap[`Report_${monthKey}_Platform_Facebook_Removed`]) || 0,
        removalRate: (() => {
          const rateStr = metricMap[`Report_${monthKey}_Platform_Facebook_RemovalRate`];
          return typeof rateStr === 'string' ? parseFloat(rateStr) || 0 : Number(rateStr) || 0;
        })()
      };
    }
    months.push({
      month: monthConfig.name,
      year: monthConfig.year,
      weeks: weeks,
      monthly: {
        dateRange: String(monthlyDateRange),
        totalSent: monthlySent,
        totalApproved: monthlyApproved,
        totalRemoved: monthlyRemoved,
        pendingLinks: monthlyPending,
        removalRate: monthlyRemovalRate
      },
      platformData: platformData
    });
  });

  return { months };
}

/**
 * Loads Overall Reports data. Tries MongoDB Data API first; falls back to Excel file.
 */
export async function loadOverallReportsData(): Promise<OverallReportsData> {
  if (cachedReportsData) {
    return cachedReportsData;
  }

  if (isDataApiConfigured()) {
    try {
      const doc = await getAnalyticsDocument();
      if (doc?.sheetData?.length) {
        cachedReportsData = parseSheetDataToReports(doc.sheetData);
        return cachedReportsData;
      }
    } catch (_) {
      // Fall through to Excel fallback
    }
  }

  try {
    const response = await fetch('/analytics-data%20.xlsx');
    if (!response.ok) {
      throw new Error(`Failed to fetch Excel file: ${response.statusText}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: 'array' });

    const sheetName = workbook.SheetNames[0] || 'Analytics Data';
    const sheet = workbook.Sheets[sheetName];

    if (!sheet) {
      throw new Error(`Sheet "${sheetName}" not found in Excel file`);
    }

    const sheetData = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' }) as any[][];

    if (!sheetData || sheetData.length === 0) {
      throw new Error('Excel sheet is empty');
    }

    cachedReportsData = parseSheetDataToReports(sheetData);
    return cachedReportsData;
  } catch (error) {
    console.error('Error loading Overall Reports data:', error);
    throw error;
  }
}
