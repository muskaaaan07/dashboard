import React, { useState, useMemo } from 'react';
import { OverallReportsData, PlatformData, PlatformKey } from '../types';
import { ChevronDown } from 'lucide-react';

interface OverallReportsProps {
  data: OverallReportsData;
  analyticsData?: Record<PlatformKey, PlatformData> | null;
}

export const OverallReports: React.FC<OverallReportsProps> = ({ data, analyticsData }) => {
  const [selectedMonth, setSelectedMonth] = useState<string>('all');

  const formatNumber = (num: number): string => {
    return num.toLocaleString('en-US');
  };

  const formatPercentage = (num: number): string => {
    return `${num.toFixed(2)}%`;
  };

  // Get unique months for the filter dropdown
  const availableMonths = data.months.map(m => m.month);

  // Resolve 'current'/'last' selection into an actual month name (or a sentinel for "no match")
  const resolvedSelectedMonth = useMemo(() => {
    if (selectedMonth !== 'current' && selectedMonth !== 'last') return selectedMonth;

    const now = new Date();
    const target = selectedMonth === 'current'
      ? now
      : new Date(now.getFullYear(), now.getMonth() - 1, 1);

    const monthName = target.toLocaleString('en-US', { month: 'long' });
    return availableMonths.includes(monthName) ? monthName : '__none__';
  }, [selectedMonth, availableMonths]);

  // Filter months based on selection (resolved)
  const filteredMonths = resolvedSelectedMonth === 'all'
    ? data.months
    : resolvedSelectedMonth === '__none__'
      ? []
      : data.months.filter(month => month.month === resolvedSelectedMonth);

  // Calculate platform totals from analytics data for selected month(s)
  const platformSummary = useMemo(() => {
    if (!analyticsData) {
      return {
        youtube: { scanned: 0, approved: 0, removed: 0, removalRate: 0 },
        instagram: { scanned: 0, approved: 0, removed: 0, removalRate: 0 },
        weblink: { scanned: 0, approved: 0, removed: 0, removalRate: 0 },
        facebook: { scanned: 0, approved: 0, removed: 0, removalRate: 0 }
      };
    }

    // If selection doesn't map to any available month, return zeros (UI shows empty state below)
    if (resolvedSelectedMonth === '__none__') {
      return {
        youtube: { scanned: 0, approved: 0, removed: 0, removalRate: 0 },
        instagram: { scanned: 0, approved: 0, removed: 0, removalRate: 0 },
        weblink: { scanned: 0, approved: 0, removed: 0, removalRate: 0 },
        facebook: { scanned: 0, approved: 0, removed: 0, removalRate: 0 }
      };
    }

    // Get month number from selected month name
    const getMonthNumber = (monthName: string): number => {
      const months: Record<string, number> = {
        'January': 0, 'February': 1, 'March': 2, 'April': 3, 'May': 4, 'June': 5,
        'July': 6, 'August': 7, 'September': 8, 'October': 9, 'November': 10, 'December': 11
      };
      return months[monthName] ?? -1;
    };

    const platforms = [
      { key: PlatformKey.YOUTUBE, name: 'youtube' },
      { key: PlatformKey.INSTAGRAM, name: 'instagram' },
      { key: PlatformKey.WEBLINK, name: 'weblink' },
      { key: PlatformKey.FACEBOOK, name: 'facebook' }
    ];

    const summary: Record<string, { scanned: number; approved: number; removed: number; removalRate: number }> = {
      youtube: { scanned: 0, approved: 0, removed: 0, removalRate: 0 },
      instagram: { scanned: 0, approved: 0, removed: 0, removalRate: 0 },
      weblink: { scanned: 0, approved: 0, removed: 0, removalRate: 0 },
      facebook: { scanned: 0, approved: 0, removed: 0, removalRate: 0 }
    };

    platforms.forEach(platform => {
      const platformData = analyticsData[platform.key];
      if (!platformData) return;

      platformData.metrics.forEach(metric => {
        // Parse date (DD-MM-YYYY or DD/MM/YYYY or DD/MM)
        const dateStr = metric.date;
        if (!dateStr) return;

        const parts = dateStr.split(/[-/]/);
        if (parts.length < 2) return;

        const first = parseInt(parts[0], 10);
        const second = parseInt(parts[1], 10);
        const year = parts[2] ? parseInt(parts[2], 10) : new Date().getFullYear();
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

        // Check if this date is in the selected month(s)
        let include = false;
        if (resolvedSelectedMonth === 'all') {
          include = true; // All time: include all dates
        } else {
          const targetMonth = getMonthNumber(resolvedSelectedMonth);
          include = month === targetMonth;
        }

        if (include) {
          summary[platform.name].scanned += metric.scanned || 0;
          summary[platform.name].approved += metric.approved || 0;
          summary[platform.name].removed += metric.removed || 0;
        }
      });

      // Calculate removal rate
      if (summary[platform.name].approved > 0) {
        summary[platform.name].removalRate = (summary[platform.name].removed / summary[platform.name].approved) * 100;
      }
    });

    return summary;
  }, [analyticsData, resolvedSelectedMonth]);

  // Helper function to calculate TAT summary for a specific month
  const calculateTATSummary = (monthName: string): Record<string, { tat1Day: number; tat2Day: number; tat3Day: number; tat4Day: number }> => {
    if (!analyticsData) {
      return {
        youtube: { tat1Day: 0, tat2Day: 0, tat3Day: 0, tat4Day: 0 },
        instagram: { tat1Day: 0, tat2Day: 0, tat3Day: 0, tat4Day: 0 },
        weblink: { tat1Day: 0, tat2Day: 0, tat3Day: 0, tat4Day: 0 },
        facebook: { tat1Day: 0, tat2Day: 0, tat3Day: 0, tat4Day: 0 }
      };
    }

    // Get month number from month name
    const getMonthNumber = (monthName: string): number => {
      const months: Record<string, number> = {
        'January': 0, 'February': 1, 'March': 2, 'April': 3, 'May': 4, 'June': 5,
        'July': 6, 'August': 7, 'September': 8, 'October': 9, 'November': 10, 'December': 11
      };
      return months[monthName] ?? -1;
    };

    const targetMonth = getMonthNumber(monthName);
    if (targetMonth === -1) {
      return {
        youtube: { tat1Day: 0, tat2Day: 0, tat3Day: 0, tat4Day: 0 },
        instagram: { tat1Day: 0, tat2Day: 0, tat3Day: 0, tat4Day: 0 },
        weblink: { tat1Day: 0, tat2Day: 0, tat3Day: 0, tat4Day: 0 },
        facebook: { tat1Day: 0, tat2Day: 0, tat3Day: 0, tat4Day: 0 }
      };
    }

    const platforms = [
      { key: PlatformKey.YOUTUBE, name: 'youtube' },
      { key: PlatformKey.INSTAGRAM, name: 'instagram' },
      { key: PlatformKey.WEBLINK, name: 'weblink' },
      { key: PlatformKey.FACEBOOK, name: 'facebook' }
    ];

    const summary: Record<string, { tat1Day: number; tat2Day: number; tat3Day: number; tat4Day: number }> = {
      youtube: { tat1Day: 0, tat2Day: 0, tat3Day: 0, tat4Day: 0 },
      instagram: { tat1Day: 0, tat2Day: 0, tat3Day: 0, tat4Day: 0 },
      weblink: { tat1Day: 0, tat2Day: 0, tat3Day: 0, tat4Day: 0 },
      facebook: { tat1Day: 0, tat2Day: 0, tat3Day: 0, tat4Day: 0 }
    };

    platforms.forEach(platform => {
      const platformData = analyticsData[platform.key];
      if (!platformData) return;

      platformData.metrics.forEach(metric => {
        // Parse date (DD-MM-YYYY or DD/MM/YYYY or DD/MM)
        const dateStr = metric.date;
        if (!dateStr) return;

        const parts = dateStr.split(/[-/]/);
        if (parts.length < 2) return;

        const first = parseInt(parts[0], 10);
        const second = parseInt(parts[1], 10);
        const year = parts[2] ? parseInt(parts[2], 10) : new Date().getFullYear();
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

        // Check if this date is in the target month
        const include = month === targetMonth;

        if (include) {
          summary[platform.name].tat1Day += metric.tat1Day || 0;
          summary[platform.name].tat2Day += metric.tat2Day || 0;
          summary[platform.name].tat3Day += metric.tat3Day || 0;
          summary[platform.name].tat4Day += metric.tat4Day || 0;
        }
      });
    });

    return summary;
  };

  return (
    <div className="space-y-6">
      {/* Month Filter */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <div className="flex items-center justify-between">
          <label htmlFor="month-filter" className="text-sm font-medium text-gray-700">
            Filter by Month:
          </label>
          <div className="relative">
            <select
              id="month-filter"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="appearance-none bg-white border border-gray-300 rounded-lg px-4 py-2 pr-10 text-sm font-medium text-gray-700 hover:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors cursor-pointer"
            >
              <option value="all">All Months</option>
              <option value="current">Current Month</option>
              <option value="last">Last Month</option>
              {availableMonths.map((month) => (
                <option key={month} value={month}>
                  {month}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Platform Summary Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Platform Summary</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Metric
                </th>
                <th className="px-6 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Youtube
                </th>
                <th className="px-6 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Instagram
                </th>
                <th className="px-6 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Weblinks
                </th>
                <th className="px-6 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Facebook
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              <tr className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  Total Link Scanned
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-700">
                  {formatNumber(platformSummary.youtube.scanned)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-700">
                  {formatNumber(platformSummary.instagram.scanned)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-700">
                  {formatNumber(platformSummary.weblink.scanned)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-700">
                  {formatNumber(platformSummary.facebook.scanned)}
                </td>
              </tr>
              <tr className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  Total Link Approved
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-700">
                  {formatNumber(platformSummary.youtube.approved)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-700">
                  {formatNumber(platformSummary.instagram.approved)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-700">
                  {formatNumber(platformSummary.weblink.approved)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-700">
                  {formatNumber(platformSummary.facebook.approved)}
                </td>
              </tr>
              <tr className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  Total Link Removed
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-700">
                  {formatNumber(platformSummary.youtube.removed)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-700">
                  {formatNumber(platformSummary.instagram.removed)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-700">
                  {formatNumber(platformSummary.weblink.removed)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-700">
                  {formatNumber(platformSummary.facebook.removed)}
                </td>
              </tr>
              <tr className="hover:bg-gray-50 transition-colors bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                  Removal Rate
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-center font-semibold text-indigo-600">
                  {formatPercentage(platformSummary.youtube.removalRate)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-center font-semibold text-indigo-600">
                  {formatPercentage(platformSummary.instagram.removalRate)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-center font-semibold text-indigo-600">
                  {formatPercentage(platformSummary.weblink.removalRate)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-center font-semibold text-indigo-600">
                  {formatPercentage(platformSummary.facebook.removalRate)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Reports Tables */}
      <div className="space-y-8">
        {filteredMonths.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
            <p className="text-gray-600">No data available for the selected month.</p>
          </div>
        ) : (
          filteredMonths.map((month, monthIndex) => {
            const hasFacebook = month.month === 'December' && month.platformData?.facebook;
            const platforms = hasFacebook 
              ? ['YouTube', 'Instagram', 'Weblinks', 'Facebook']
              : ['YouTube', 'Instagram', 'Weblinks'];
            
            return (
              <div key={monthIndex} className="space-y-6">
                {/* Monthly Report Table */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                  {/* Month Header */}
                  <div className="bg-indigo-50 border-b border-indigo-200 px-6 py-4">
                    <h2 className="text-xl font-bold text-gray-900">
                      AXIO OVERALL REPORT - {month.month.toUpperCase()} {month.year}
                    </h2>
                  </div>

                  {/* Table */}
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                            Date Range
                          </th>
                          <th className="px-6 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">
                            Total Links Sent
                          </th>
                          <th className="px-6 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">
                            Total Links Approved
                          </th>
                          <th className="px-6 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">
                            Total Links Removed
                          </th>
                          <th className="px-6 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">
                            Pending Links
                          </th>
                          <th className="px-6 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">
                            Removal %
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {/* Week rows */}
                        {month.weeks.map((week, weekIndex) => (
                          <tr key={weekIndex} className="hover:bg-gray-50 transition-colors">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              <div>Week {weekIndex + 1}</div>
                              <div className="text-xs text-gray-500 font-normal mt-1">{week.dateRange}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-700">
                              {formatNumber(week.totalSent)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-700">
                              {formatNumber(week.totalApproved)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-700">
                              {formatNumber(week.totalRemoved)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-700">
                              {formatNumber(week.pendingLinks)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-semibold text-indigo-600">
                              {formatPercentage(week.removalRate)}
                            </td>
                          </tr>
                        ))}
                        {/* Monthly summary row */}
                        <tr className="bg-indigo-50 font-semibold hover:bg-indigo-100 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                            Overall Monthly
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-bold text-gray-900">
                            {formatNumber(month.monthly.totalSent)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-bold text-gray-900">
                            {formatNumber(month.monthly.totalApproved)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-bold text-gray-900">
                            {formatNumber(month.monthly.totalRemoved)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-bold text-gray-900">
                            {formatNumber(month.monthly.pendingLinks)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-bold text-indigo-700">
                            {formatPercentage(month.monthly.removalRate)}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* Monthly Summary Info */}
                  <div className="px-6 py-3 bg-gray-50 border-t border-gray-200">
                    <div className="text-xs text-gray-600">
                      <span className="font-medium">Monthly Summary:</span> {month.monthly.dateRange}
                    </div>
                  </div>
                </div>

                {/* Platform Breakdown Table */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-200 bg-indigo-50">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {month.month} {month.year} - Platform Breakdown
                    </h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                            Metric
                          </th>
                          {platforms.map((platform) => (
                            <th key={platform} className="px-6 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                              {platform}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        <tr className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            Total Link Scanned
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-700">
                            {formatNumber(month.platformData?.youtube.scanned || 0)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-700">
                            {formatNumber(month.platformData?.instagram.scanned || 0)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-700">
                            {formatNumber(month.platformData?.weblink.scanned || 0)}
                          </td>
                          {hasFacebook && (
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-700">
                              {formatNumber(month.platformData?.facebook?.scanned || 0)}
                            </td>
                          )}
                        </tr>
                        <tr className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            Total Link Approved
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-700">
                            {formatNumber(month.platformData?.youtube.approved || 0)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-700">
                            {formatNumber(month.platformData?.instagram.approved || 0)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-700">
                            {formatNumber(month.platformData?.weblink.approved || 0)}
                          </td>
                          {hasFacebook && (
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-700">
                              {formatNumber(month.platformData?.facebook?.approved || 0)}
                            </td>
                          )}
                        </tr>
                        <tr className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            Total Link Removed
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-700">
                            {formatNumber(month.platformData?.youtube.removed || 0)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-700">
                            {formatNumber(month.platformData?.instagram.removed || 0)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-700">
                            {formatNumber(month.platformData?.weblink.removed || 0)}
                          </td>
                          {hasFacebook && (
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-700">
                              {formatNumber(month.platformData?.facebook?.removed || 0)}
                            </td>
                          )}
                        </tr>
                        <tr className="hover:bg-gray-50 transition-colors bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                            Removal Rate
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-center font-semibold text-indigo-600">
                            {formatPercentage(month.platformData?.youtube.removalRate || 0)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-center font-semibold text-indigo-600">
                            {formatPercentage(month.platformData?.instagram.removalRate || 0)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-center font-semibold text-indigo-600">
                            {formatPercentage(month.platformData?.weblink.removalRate || 0)}
                          </td>
                          {hasFacebook && (
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-center font-semibold text-indigo-600">
                              {formatPercentage(month.platformData?.facebook?.removalRate || 0)}
                            </td>
                          )}
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* TAT Breakdown Table */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-200 bg-indigo-50">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {month.month} {month.year} - Turn Around Time (TAT) Breakdown
                    </h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                            Metric
                          </th>
                          <th className="px-6 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                            Youtube
                          </th>
                          <th className="px-6 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                            Instagram
                          </th>
                          <th className="px-6 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                            Weblinkk
                          </th>
                          {hasFacebook && (
                            <th className="px-6 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                              Facebook
                            </th>
                          )}
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {(() => {
                          const tatSummary = calculateTATSummary(month.month);
                          return (
                            <>
                              <tr className="hover:bg-gray-50 transition-colors">
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                  Link removed in 1 day
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-700">
                                  {formatNumber(tatSummary.youtube.tat1Day)}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-700">
                                  {formatNumber(tatSummary.instagram.tat1Day)}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-700">
                                  {formatNumber(tatSummary.weblink.tat1Day)}
                                </td>
                                {hasFacebook && (
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-700">
                                    {formatNumber(tatSummary.facebook.tat1Day)}
                                  </td>
                                )}
                              </tr>
                              <tr className="hover:bg-gray-50 transition-colors">
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                  Link removed in 2 day
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-700">
                                  {formatNumber(tatSummary.youtube.tat2Day)}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-700">
                                  {formatNumber(tatSummary.instagram.tat2Day)}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-700">
                                  {formatNumber(tatSummary.weblink.tat2Day)}
                                </td>
                                {hasFacebook && (
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-700">
                                    {formatNumber(tatSummary.facebook.tat2Day)}
                                  </td>
                                )}
                              </tr>
                              <tr className="hover:bg-gray-50 transition-colors">
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                  Link removed in 3 day
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-700">
                                  {formatNumber(tatSummary.youtube.tat3Day)}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-700">
                                  {formatNumber(tatSummary.instagram.tat3Day)}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-700">
                                  {formatNumber(tatSummary.weblink.tat3Day)}
                                </td>
                                {hasFacebook && (
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-700">
                                    {formatNumber(tatSummary.facebook.tat3Day)}
                                  </td>
                                )}
                              </tr>
                              <tr className="hover:bg-gray-50 transition-colors">
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                  Link removed in 4 day
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-700">
                                  {formatNumber(tatSummary.youtube.tat4Day)}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-700">
                                  {formatNumber(tatSummary.instagram.tat4Day)}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-700">
                                  {formatNumber(tatSummary.weblink.tat4Day)}
                                </td>
                                {hasFacebook && (
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-700">
                                    {formatNumber(tatSummary.facebook.tat4Day)}
                                  </td>
                                )}
                              </tr>
                            </>
                          );
                        })()}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

