export interface DailyMetric {
  date: string;
  scanned: number;
  approved: number;
  removed: number;
  removalRate: number;
  tat1Day?: number;
  tat2Day?: number;
  tat3Day?: number;
  tat4Day?: number;
}

export interface PlatformData {
  id: string;
  name: string;
  color: string;
  metrics: DailyMetric[];
}

export enum PlatformKey {
  OVERALL = 'Overall',
  YOUTUBE = 'YouTube',
  INSTAGRAM = 'Instagram',
  WEBLINK = 'Weblink',
  FACEBOOK = 'Facebook',
  REPORTS = 'Reports'
}

export interface WeeklyReport {
  dateRange: string;
  totalSent: number;
  totalApproved: number;
  totalRemoved: number;
  pendingLinks: number;
  removalRate: number;
}

export interface MonthlyPlatformData {
  youtube: { scanned: number; approved: number; removed: number; removalRate: number };
  instagram: { scanned: number; approved: number; removed: number; removalRate: number };
  weblink: { scanned: number; approved: number; removed: number; removalRate: number };
  facebook?: { scanned: number; approved: number; removed: number; removalRate: number };
}

export interface MonthlyReport {
  month: string;
  year: number;
  weeks: WeeklyReport[];
  monthly: WeeklyReport; // Overall monthly summary
  platformData?: MonthlyPlatformData; // Platform-wise breakdown
}

export interface OverallReportsData {
  months: MonthlyReport[];
}