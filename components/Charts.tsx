import React from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  AreaChart,
  Area,
  BarChart
} from 'recharts';
import { DailyMetric } from '../types';

interface ChartProps {
  metrics: DailyMetric[];
  color: string;
}

/** Format as DD-MM-YYYY for display */
const toDDMMYYYY = (day: number, month: number, year: number): string => {
  const d = day.toString().padStart(2, '0');
  const m = (month + 1).toString().padStart(2, '0');
  return `${d}-${m}-${year}`;
};

/**
 * Formats a date value for display in charts (DD-MM-YYYY)
 * Handles Excel serial numbers, DD-MM-YYYY, DD/MM/YYYY, DD/MM, YYYY-MM-DD
 */
const formatDateForDisplay = (dateValue: any): string => {
  if (!dateValue && dateValue !== 0) return '';

  if (typeof dateValue === 'string') {
    const trimmed = dateValue.trim();
    if (/^\d{1,2}-\d{1,2}-\d{4}$/.test(trimmed)) return trimmed;
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
};

export const VolumeTrendChart: React.FC<{ metrics: DailyMetric[] }> = ({ metrics }) => {
  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-full">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">Daily Volume Trends</h3>
      <div className="h-[400px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={metrics} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
            <XAxis 
              dataKey="date" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: '#6b7280', fontSize: 12 }}
              tickFormatter={formatDateForDisplay}
            />
            <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 12 }} />
            <Tooltip 
              contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e5e7eb', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
              labelFormatter={(value) => formatDateForDisplay(value)}
            />
            <Legend verticalAlign="top" height={36}/>
            <Bar dataKey="scanned" name="Links Scanned" barSize={12} fill="#93c5fd" radius={[4, 4, 0, 0]} />
            <Line type="monotone" dataKey="removed" name="Removed" stroke="#ef4444" strokeWidth={2} dot={{ r: 2 }} activeDot={{ r: 5 }} />
            <Line type="monotone" dataKey="approved" name="Approved" stroke="#22c55e" strokeWidth={2} dot={false} strokeDasharray="3 3" />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export const EfficiencyChart: React.FC<ChartProps> = ({ metrics, color }) => {
  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-full">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">Daily Removal Efficiency (%)</h3>
      <div className="h-[400px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={metrics} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorRate" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={color} stopOpacity={0.2} />
                <stop offset="95%" stopColor={color} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
            <XAxis 
              dataKey="date" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: '#6b7280', fontSize: 12 }}
              tickFormatter={formatDateForDisplay}
            />
            <YAxis domain={[0, 100]} axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 12 }} />
            <Tooltip 
              contentStyle={{ borderRadius: '8px' }} 
              formatter={(value: number) => [`${value.toFixed(1)}%`, 'Removal Rate']}
              labelFormatter={(value) => formatDateForDisplay(value)}
            />
            <Area type="monotone" dataKey="removalRate" stroke={color} fillOpacity={1} fill="url(#colorRate)" name="Removal %" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

interface TATChartProps {
  metrics: DailyMetric[];
  platform: string;
}

export const TATChart: React.FC<TATChartProps> = ({ metrics, platform }) => {
  // Determine which TAT days to show based on platform
  // All platforms now show TAT up to 4 days
  const showTAT3Day = true;
  const showTAT4Day = true;

  // Prepare data for the chart
  const chartData = metrics.map(metric => {
    const data: any = {
      date: metric.date,
      '1 Day': metric.tat1Day || 0,
      '2 Days': metric.tat2Day || 0
    };
    
    if (showTAT3Day) {
      data['3 Days'] = metric.tat3Day || 0;
    }
    if (showTAT4Day) {
      data['4 Days'] = metric.tat4Day || 0;
    }
    
    return data;
  });

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">Turn Around Time (TAT) Breakdown</h3>
      <div className="h-[400px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
            <XAxis 
              dataKey="date" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: '#6b7280', fontSize: 12 }}
              tickFormatter={formatDateForDisplay}
            />
            <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 12 }} />
            <Tooltip 
              contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e5e7eb', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
              labelFormatter={(value) => formatDateForDisplay(value)}
            />
            <Legend verticalAlign="top" height={36} />
            <Bar dataKey="1 Day" name="1 Day" stackId="tat" fill="#22c55e" radius={[0, 0, 0, 0]} />
            {showTAT4Day ? (
              <>
                <Bar dataKey="2 Days" name="2 Days" stackId="tat" fill="#3b82f6" radius={[0, 0, 0, 0]} />
                <Bar dataKey="3 Days" name="3 Days" stackId="tat" fill="#a855f7" radius={[0, 0, 0, 0]} />
                <Bar dataKey="4 Days" name="4 Days" stackId="tat" fill="#ef4444" radius={[4, 4, 0, 0]} />
              </>
            ) : showTAT3Day ? (
              <>
                <Bar dataKey="2 Days" name="2 Days" stackId="tat" fill="#3b82f6" radius={[0, 0, 0, 0]} />
                <Bar dataKey="3 Days" name="3 Days" stackId="tat" fill="#a855f7" radius={[4, 4, 0, 0]} />
              </>
            ) : (
              <Bar dataKey="2 Days" name="2 Days" stackId="tat" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            )}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};