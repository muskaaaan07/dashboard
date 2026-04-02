import React, { useState } from 'react';
import { Calendar, ChevronDown } from 'lucide-react';

export type DateFilterOption =
  | 'all'
  | 'today'
  | 'yesterday'
  | 'last7days'
  | 'currentMonth'
  | 'lastMonth'
  | 'custom';

interface DateFilterProps {
  value: DateFilterOption;
  onChange: (option: DateFilterOption, startDate?: Date, endDate?: Date) => void;
}

const DateFilter: React.FC<DateFilterProps> = ({ value, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');

  const handleOptionSelect = (option: DateFilterOption) => {
    if (option === 'all') {
      onChange(option);
      setIsOpen(false);
      return;
    }

    if (option === 'custom') return;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let startDate: Date;
    let endDate: Date = new Date(today);
    endDate.setHours(23, 59, 59, 999);

    switch (option) {
      case 'today':
        startDate = new Date(today);
        break;
      case 'yesterday':
        startDate = new Date(today);
        startDate.setDate(startDate.getDate() - 1);
        endDate = new Date(startDate);
        endDate.setHours(23, 59, 59, 999);
        break;
      case 'last7days':
        startDate = new Date(today);
        startDate.setDate(startDate.getDate() - 6);
        break;
      case 'currentMonth': {
        const year = today.getFullYear();
        const month = today.getMonth();
        startDate = new Date(year, month, 1);
        endDate = new Date(year, month + 1, 0);
        endDate.setHours(23, 59, 59, 999);
        break;
      }
      case 'lastMonth': {
        const year = today.getFullYear();
        const month = today.getMonth();
        startDate = new Date(year, month - 1, 1);
        endDate = new Date(year, month, 0);
        endDate.setHours(23, 59, 59, 999);
        break;
      }
      default:
        startDate = new Date(today);
    }

    onChange(option, startDate, endDate);
    setIsOpen(false);
  };

  const handleCustomApply = () => {
    if (!customStart || !customEnd) return;

    const startDate = new Date(customStart);
    const endDate = new Date(customEnd);
    endDate.setHours(23, 59, 59, 999);

    onChange('custom', startDate, endDate);
    setIsOpen(false);
  };

  const getDisplayLabel = () => {
    switch (value) {
      case 'all':
        return 'All Data';
      case 'today':
        return 'Today';
      case 'yesterday':
        return 'Yesterday';
      case 'last7days':
        return 'Last 7 Days';
      case 'currentMonth':
        return 'Current Month';
      case 'lastMonth':
        return 'Last Month';
      case 'custom':
        return 'Custom Range';
      default:
        return 'Select Date';
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-md border border-gray-200 hover:bg-gray-100 transition-colors"
      >
        <Calendar className="w-4 h-4 text-gray-500" />
        <span className="text-sm font-medium text-gray-700">{getDisplayLabel()}</span>
        <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 z-20">
            <div className="p-2">

              {/* existing options */}
              {[
                ['all', 'All Data'],
                ['today', 'Today'],
                ['yesterday', 'Yesterday'],
                ['last7days', 'Last 7 Days'],
                ['currentMonth', 'Current Month'],
                ['lastMonth', 'Last Month'],
              ].map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => handleOptionSelect(key as DateFilterOption)}
                  className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                    value === key
                      ? 'bg-indigo-50 text-indigo-700 font-medium'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {label}
                </button>
              ))}

              {/* CUSTOM RANGE */}
              <div className="mt-2 border-t pt-2">
                <div className="text-xs text-gray-500 px-3 mb-1">Custom Range</div>

                <div className="px-3 flex flex-col gap-2">
                  <input
                    type="date"
                    value={customStart}
                    onChange={(e) => setCustomStart(e.target.value)}
                    className="border rounded px-2 py-1 text-sm"
                  />
                  <input
                    type="date"
                    value={customEnd}
                    onChange={(e) => setCustomEnd(e.target.value)}
                    className="border rounded px-2 py-1 text-sm"
                  />

                  <button
                    onClick={handleCustomApply}
                    className="bg-indigo-600 text-white text-sm py-1 rounded hover:bg-indigo-700"
                  >
                    Apply
                  </button>
                </div>
              </div>

            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default DateFilter;