import React from 'react';
import { DailyMetric } from '../types';
import { ScanEye, CheckCircle, Trash2, Activity } from 'lucide-react';

interface KpiCardsProps {
  metrics: DailyMetric[];
}

export const KpiCards: React.FC<KpiCardsProps> = ({ metrics }) => {
  // Aggregate data
  const totalScanned = metrics.reduce((acc, curr) => acc + curr.scanned, 0);
  const totalRemoved = metrics.reduce((acc, curr) => acc + curr.removed, 0);
  const totalApproved = metrics.reduce((acc, curr) => acc + curr.approved, 0);
  
  // Calculation based on Total Removed / Total Approved * 100
  const avgRemovalRate = totalApproved > 0 
    ? ((totalRemoved / totalApproved) * 100).toFixed(2) 
    : '0.00';

  const cards = [
    {
      title: 'Total Scanned',
      value: totalScanned.toLocaleString(),
      icon: ScanEye,
      color: 'text-blue-600',
      bg: 'bg-blue-100'
    },
    {
      title: 'Total Approved',
      value: totalApproved.toLocaleString(),
      icon: CheckCircle,
      color: 'text-green-600',
      bg: 'bg-green-100'
    },
    {
      title: 'Total Removed',
      value: totalRemoved.toLocaleString(),
      icon: Trash2,
      color: 'text-red-600',
      bg: 'bg-red-100'
    },
    {
      title: 'Avg. Removal Rate',
      value: `${avgRemovalRate}%`,
      icon: Activity,
      color: 'text-purple-600',
      bg: 'bg-purple-100'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {cards.map((card) => (
        <div key={card.title} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex items-center justify-between transition hover:shadow-md">
          <div>
            <p className="text-sm font-medium text-gray-500">{card.title}</p>
            <h3 className="text-2xl font-bold text-gray-800 mt-1">{card.value}</h3>
          </div>
          <div className={`p-3 rounded-full ${card.bg}`}>
            <card.icon className={`w-6 h-6 ${card.color}`} />
          </div>
        </div>
      ))}
    </div>
  );
};