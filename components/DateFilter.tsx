import React, { useState } from 'react';
import { Calendar, ChevronDown } from 'lucide-react';

export type DateFilterOption =
  | 'all'
  | 'today'
  | 'yesterday'
  | 'last7days'
  | 'currentMonth'
  | 'lastMonth';

interface DateFilterProps {
  value: DateFilterOption;
  onChange: (option: DateFilterOption, startDate?: Date, endDate?: Date) => void;
}

const DateFilter: React.FC<DateFilterProps> = ({ value, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleOptionSelect = (option: DateFilterOption) => {
    if (option === 'all') {
      onChange(option);
      setIsOpen(false);
      return;
    }

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
              <button
                onClick={() => handleOptionSelect('all')}
                className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                  value === 'all' 
                    ? 'bg-indigo-50 text-indigo-700 font-medium' 
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                All Data
              </button>
              <button
                onClick={() => handleOptionSelect('today')}
                className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                  value === 'today' 
                    ? 'bg-indigo-50 text-indigo-700 font-medium' 
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                Today
              </button>
              <button
                onClick={() => handleOptionSelect('yesterday')}
                className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                  value === 'yesterday' 
                    ? 'bg-indigo-50 text-indigo-700 font-medium' 
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                Yesterday
              </button>
              <button
                onClick={() => handleOptionSelect('last7days')}
                className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                  value === 'last7days' 
                    ? 'bg-indigo-50 text-indigo-700 font-medium' 
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                Last 7 Days
              </button>
              <button
                onClick={() => handleOptionSelect('currentMonth')}
                className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                  value === 'currentMonth'
                    ? 'bg-indigo-50 text-indigo-700 font-medium'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                Current Month
              </button>
              <button
                onClick={() => handleOptionSelect('lastMonth')}
                className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                  value === 'lastMonth'
                    ? 'bg-indigo-50 text-indigo-700 font-medium'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                Last Month
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default DateFilter;

