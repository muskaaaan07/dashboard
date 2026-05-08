
import React, { useState, useEffect, useMemo } from 'react';
import { getAnalyticsData, loadOverallReportsData } from './data';
import { PlatformKey, PlatformData, OverallReportsData } from './types';
import { KpiCards } from './components/KpiCards';
import { EfficiencyChart, VolumeTrendChart, TATChart } from './components/Charts';
import { OverallReports } from './components/OverallReports';
import Login from './components/Login';
import DateFilter, { DateFilterOption } from './components/DateFilter';
import { Youtube, Instagram, Link as LinkIcon, Layers, Loader2, LogOut, Facebook, FileText } from 'lucide-react';

// Helper function to parse date string from Excel (handles various formats)
const parseDate = (dateStr: string): Date | null => {
  if (!dateStr || typeof dateStr !== 'string') return null;
  
  const trimmed = dateStr.trim();
  if (!trimmed) return null;
  
  // Handle Excel date serial numbers (if dateStr is a number)
  if (!isNaN(Number(trimmed)) && Number(trimmed) > 0) {
    // Excel epoch starts from 1900-01-01, but JavaScript Date uses 1899-12-30
    const excelEpoch = new Date(1899, 11, 30);
    const days = Number(trimmed);
    const date = new Date(excelEpoch.getTime() + days * 24 * 60 * 60 * 1000);
    if (!isNaN(date.getTime()) && date.getFullYear() > 1900) {
      return date;
    }
  }
  
  // Format: DD/MM/YYYY or D/M/YYYY (most common in Excel exports)
  const ddmmyyyy = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (ddmmyyyy) {
    const first = parseInt(ddmmyyyy[1], 10);
    const second = parseInt(ddmmyyyy[2], 10);
    const year = parseInt(ddmmyyyy[3], 10);
    
    // If first number > 12, it's definitely DD/MM format
    // If second number > 12, it's MM/DD format
    if (first > 12 || second > 12) {
      if (first > 12) {
        // DD/MM/YYYY
        const day = first;
        const month = second - 1;
        const date = new Date(year, month, day);
        if (!isNaN(date.getTime())) {
          return date;
        }
      } else {
        // MM/DD/YYYY
        const month = first - 1;
        const day = second;
        const date = new Date(year, month, day);
        if (!isNaN(date.getTime())) {
          return date;
        }
      }
    } else {
      // Ambiguous case - try both formats, prefer DD/MM (more common in international)
      // Try DD/MM first
      let date = new Date(year, second - 1, first);
      if (!isNaN(date.getTime()) && date.getDate() === first && date.getMonth() === second - 1) {
        return date;
      }
      // Try MM/DD
      date = new Date(year, first - 1, second);
      if (!isNaN(date.getTime()) && date.getDate() === second && date.getMonth() === first - 1) {
        return date;
      }
    }
  }
  
  // Format: DD/MM (without year, assume current year or 2025)
  const ddmm = trimmed.match(/^(\d{1,2})\/(\d{1,2})$/);
  if (ddmm) {
    const first = parseInt(ddmm[1], 10);
    const second = parseInt(ddmm[2], 10);
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth(); // 0-indexed
    if (first > 12) {
      // DD/MM
      const day = first;
      const month = second - 1;
      // If the parsed month is "in the future" relative to now, assume it belongs to last year
      const inferredYear = month > currentMonth ? currentYear - 1 : currentYear;
      const date = new Date(inferredYear, month, day);
      if (!isNaN(date.getTime())) {
        return date;
      }
    } else if (second > 12) {
      // MM/DD
      const month = first - 1;
      const day = second;
      const inferredYear = month > currentMonth ? currentYear - 1 : currentYear;
      const date = new Date(inferredYear, month, day);
      if (!isNaN(date.getTime())) {
        return date;
      }
    }
  }
  
  // Format: DD-MM-YYYY or DD-MM (convenience format)
  const ddmmyyyyDash = trimmed.match(/^(\d{1,2})-(\d{1,2})-(\d{4})$/);
  if (ddmmyyyyDash) {
    const first = parseInt(ddmmyyyyDash[1], 10);
    const second = parseInt(ddmmyyyyDash[2], 10);
    const year = parseInt(ddmmyyyyDash[3], 10);
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
    if (!isNaN(date.getTime())) return date;
  }
  const ddmmDash = trimmed.match(/^(\d{1,2})-(\d{1,2})$/);
  if (ddmmDash) {
    const first = parseInt(ddmmDash[1], 10);
    const second = parseInt(ddmmDash[2], 10);
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
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
    const inferredYear = month > currentMonth ? currentYear - 1 : currentYear;
    const date = new Date(inferredYear, month, day);
    if (!isNaN(date.getTime())) return date;
  }

  // Format: YYYY-MM-DD
  const yyyymmdd = trimmed.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (yyyymmdd) {
    const year = parseInt(yyyymmdd[1], 10);
    const month = parseInt(yyyymmdd[2], 10) - 1;
    const day = parseInt(yyyymmdd[3], 10);
    const date = new Date(year, month, day);
    if (!isNaN(date.getTime())) {
      return date;
    }
  }
  
  // Try native Date parsing as fallback
  const parsed = new Date(trimmed);
  if (!isNaN(parsed.getTime()) && parsed.getFullYear() > 1900) {
    return parsed;
  }
  
  return null;
};

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return sessionStorage.getItem('isAuthenticated') === 'true';
  });
  const [activePlatform, setActivePlatform] = useState<PlatformKey>(PlatformKey.OVERALL);
  const [dateFilter, setDateFilter] = useState<DateFilterOption>('all');
  const [dateRange, setDateRange] = useState<{ start: Date; end: Date } | null>(null);
  const [analyticsData, setAnalyticsData] = useState<Record<PlatformKey, PlatformData> | null>(null);
  const [reportsData, setReportsData] = useState<OverallReportsData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = () => {
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    sessionStorage.removeItem('isAuthenticated');
    sessionStorage.removeItem('userId');
    setIsAuthenticated(false);
  };

  // Load data from Excel on component mount
  useEffect(() => {
    if (!isAuthenticated) return; // Don't load data if not authenticated
    
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);
        const [analytics, reports] = await Promise.all([
          getAnalyticsData(),
          loadOverallReportsData()
        ]);
        setAnalyticsData(analytics);
        setReportsData(reports);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load data from Excel file');
        console.error('Error loading analytics data:', err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [isAuthenticated]);

  // Filter data based on selected date range - use useMemo to recalculate when dependencies change
  // MUST be called before any conditional returns to follow Rules of Hooks
  const currentData = useMemo(() => {
    // Skip data processing for REPORTS tab
    if (activePlatform === PlatformKey.REPORTS) {
      return {
        id: 'reports',
        name: 'Overall Reports',
        color: '#6366f1',
        metrics: []
      };
    }
    
    if (!analyticsData || !analyticsData[activePlatform]) {
      // Return empty structure instead of null to prevent blank page
      return {
        id: '',
        name: '',
        color: '#6366f1',
        metrics: []
      };
    }

    const rawMetrics = analyticsData[activePlatform].metrics || [];
    
    const filteredMetrics = dateFilter === 'all' 
      ? rawMetrics 
      : rawMetrics.filter(metric => {
          if (!metric || !dateRange) return false;
          
          // If no date string, exclude it when filtering by date range
          if (!metric.date) return false;
          
          const metricDate = parseDate(metric.date);
          if (!metricDate) {
            // If date parsing fails, exclude it when filtering by date range
            // (We can't determine if it's in range)
            return false;
          }
          
          // Reset time to compare dates only
          const metricDateOnly = new Date(metricDate.getFullYear(), metricDate.getMonth(), metricDate.getDate());
          const startDateOnly = new Date(dateRange.start.getFullYear(), dateRange.start.getMonth(), dateRange.start.getDate());
          const endDateOnly = new Date(dateRange.end.getFullYear(), dateRange.end.getMonth(), dateRange.end.getDate());
          
          return metricDateOnly >= startDateOnly && metricDateOnly <= endDateOnly;
        });

    return {
      ...analyticsData[activePlatform],
      metrics: filteredMetrics
    };
  }, [analyticsData, activePlatform, dateFilter, dateRange]);

  // Show login page if not authenticated (after all hooks are called)
  if (!isAuthenticated) {
    return <Login onLogin={handleLogin} />;
  }

  const tabs = [
    { key: PlatformKey.OVERALL, label: 'Overall', icon: Layers },
    { key: PlatformKey.YOUTUBE, label: 'YouTube', icon: Youtube },
    { key: PlatformKey.INSTAGRAM, label: 'Instagram', icon: Instagram },
    { key: PlatformKey.WEBLINK, label: 'Weblink', icon: LinkIcon },
    { key: PlatformKey.FACEBOOK, label: 'Facebook', icon: Facebook },
    { key: PlatformKey.REPORTS, label: 'Overall Reports', icon: FileText },
  ];

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading analytics data from Excel...</p>
        </div>
      </div>
    );
  }

  // Show error state only if there's an actual error (not just missing data)
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-red-800 mb-2">Error Loading Data</h2>
            <p className="text-red-600 mb-4">{error}</p>
            <p className="text-sm text-gray-600">
              Please ensure the Excel file (analytics-data .xlsx) is in the public folder.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const handleDateFilterChange = (option: DateFilterOption, startDate?: Date, endDate?: Date) => {
    setDateFilter(option);
    if (option === 'all') {
      setDateRange(null);
    } else if (startDate && endDate) {
      setDateRange({ start: startDate, end: endDate });
    }
  };

  const getDateRangeLabel = () => {
    if (dateFilter === 'all') {
      return 'All Data';
    }
    if (!dateRange) {
      return '';
    }
    const start = dateRange.start.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    const end = dateRange.end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    
    if (start === end) {
      return start;
    }
    
    return `${start} - ${end}`;
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between h-auto sm:h-16 py-4 sm:py-0 gap-4">
            <div className="flex items-center gap-3">
              <img 
                src="/logo.jpeg" 
                alt="Logo" 
                className="h-10 w-auto object-contain"
              />
              <h1 className="text-xl font-bold text-gray-900">Axio Principle | PW Analytics</h1>
            </div>
            
            <div className="flex items-center gap-4">
              <a
                href="/admin"
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 rounded-lg transition-colors"
                title="Admin"
              >
                <span className="hidden sm:inline">Admin</span>
              </a>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                title="Logout"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Logout</span>
              </button>
              <DateFilter 
                value={dateFilter} 
                onChange={handleDateFilterChange}
              />
              {dateFilter !== 'all' && dateRange && (
                <div className="text-sm text-gray-500 font-medium hidden sm:block">
                  {getDateRangeLabel()}
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Navigation Tabs */}
        <div className="mb-8">
            <div className="sm:hidden">
              <label htmlFor="tabs" className="sr-only">Select a platform</label>
              <select
                id="tabs"
                name="tabs"
                className="block w-full rounded-md border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 py-3 px-4 shadow-sm"
                value={activePlatform}
                onChange={(e) => setActivePlatform(e.target.value as PlatformKey)}
              >
                {tabs.map((tab) => (
                  <option key={tab.key} value={tab.key}>{tab.label}</option>
                ))}
              </select>
            </div>
            <div className="hidden sm:block">
              <div className="border-b border-gray-200">
                <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                  {tabs.map((tab) => {
                    const isActive = activePlatform === tab.key;
                    return (
                      <button
                        key={tab.key}
                        onClick={() => setActivePlatform(tab.key)}
                        className={`
                          group inline-flex items-center py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200
                          ${isActive 
                            ? 'border-indigo-500 text-indigo-600' 
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}
                        `}
                      >
                        <tab.icon className={`
                          -ml-0.5 mr-2 h-5 w-5
                          ${isActive ? 'text-indigo-500' : 'text-gray-400 group-hover:text-gray-500'}
                        `} />
                        {tab.label}
                      </button>
                    );
                  })}
                </nav>
              </div>
            </div>
        </div>

        {/* Dashboard Content */}
        <div className="space-y-6 animate-fade-in">
          {activePlatform === PlatformKey.REPORTS ? (
            /* Overall Reports View */
            reportsData ? (
              <OverallReports data={reportsData} analyticsData={analyticsData} />
            ) : (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
                <p className="text-gray-600">No reports data available.</p>
              </div>
            )
          ) : (
            /* Regular Dashboard View */
            <>
              {/* Summary Cards */}
              <KpiCards metrics={currentData.metrics} />

              {/* Charts Area */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <VolumeTrendChart metrics={currentData.metrics} />
                <EfficiencyChart metrics={currentData.metrics} color={currentData.color} />
              </div>

              {/* TAT Chart */}
              <TATChart metrics={currentData.metrics} platform={currentData.name} />
            </>
          )}
        </div>
      </main>
    </div>
  );
};

export default App;
