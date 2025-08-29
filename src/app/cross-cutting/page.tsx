'use client';

import { useState, useEffect } from 'react';

interface Agency {
  id: number;
  name: string;
  slug: string;
}

interface CrossCuttingTitle {
  cfrNumber: number;
  name: string;
  agencyCount: number;
  agencies: Agency[];
  impactLevel: 'HIGH' | 'MEDIUM' | 'LOW';
}

interface Summary {
  totalCfrTitles: number;
  highImpact: number;
  mediumImpact: number;
  lowImpact: number;
  totalTitleAgencyRelationships: number;
  averageAgenciesPerTitle: number;
}

interface CrossCuttingData {
  summary: Summary;
  crossCuttingTitles: CrossCuttingTitle[];
}

export default function CrossCuttingAnalysis() {
  const [data, setData] = useState<CrossCuttingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/analysis/cross-cutting')
      .then(res => res.json())
      .then(data => {
        setData(data);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  if (loading) return <div className="p-8">Loading cross-cutting analysis...</div>;
  if (error) return <div className="p-8 text-red-600">Error: {error}</div>;
  if (!data) return <div className="p-8">No data available</div>;

  const getImpactColor = (level: string) => {
    switch (level) {
      case 'HIGH': return 'bg-red-100 text-red-800 border-red-200';
      case 'MEDIUM': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'LOW': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getImpactIcon = (level: string) => {
    switch (level) {
      case 'HIGH': return '🔴';
      case 'MEDIUM': return '🟡';
      case 'LOW': return '🟢';
      default: return '⚪';
    }
  };

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Cross-Cutting Administrative Rules Analysis</h1>

      {/* Summary Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <div className="text-2xl font-bold text-blue-600">{data.summary.totalCfrTitles}</div>
          <div className="text-sm text-blue-800">Total CFR Titles</div>
        </div>
        <div className="bg-red-50 p-4 rounded-lg border border-red-200">
          <div className="text-2xl font-bold text-red-600">{data.summary.highImpact}</div>
          <div className="text-sm text-red-800">High Impact (4+ agencies)</div>
        </div>
        <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
          <div className="text-2xl font-bold text-yellow-600">{data.summary.mediumImpact}</div>
          <div className="text-sm text-yellow-800">Medium Impact (3 agencies)</div>
        </div>
        <div className="bg-green-50 p-4 rounded-lg border border-green-200">
          <div className="text-2xl font-bold text-green-600">{data.summary.lowImpact}</div>
          <div className="text-sm text-green-800">Low Impact (≤2 agencies)</div>
        </div>
        <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
          <div className="text-2xl font-bold text-purple-600">{data.summary.totalTitleAgencyRelationships}</div>
          <div className="text-sm text-purple-800">Total Relationships</div>
        </div>
        <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-200">
          <div className="text-2xl font-bold text-indigo-600">{data.summary.averageAgenciesPerTitle.toFixed(1)}</div>
          <div className="text-sm text-indigo-800">Avg Agencies/Title</div>
        </div>
      </div>

      {/* Cross-Cutting Titles List */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold mb-4">CFR Titles by Cross-Agency Impact</h2>

        {data.crossCuttingTitles.map((title) => (
          <div key={title.cfrNumber} className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-2xl">{getImpactIcon(title.impactLevel)}</span>
                  <h3 className="text-lg font-semibold">CFR Title {title.cfrNumber}: {title.name}</h3>
                  <span className={`px-2 py-1 rounded text-xs font-medium border ${getImpactColor(title.impactLevel)}`}>
                    {title.impactLevel} IMPACT
                  </span>
                </div>
                <p className="text-gray-600 mb-3">
                  Affects <strong>{title.agencyCount}</strong> {title.agencyCount === 1 ? 'agency' : 'agencies'}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
              {title.agencies.map((agency, index) => (
                <div key={`${title.cfrNumber}-${agency.id}-${index}`} className="bg-gray-50 px-3 py-2 rounded border">
                  <div className="text-sm font-medium text-gray-900">{agency.name}</div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Analysis Insights */}
      <div className="mt-8 bg-gray-50 p-6 rounded-lg border border-gray-200">
        <h3 className="text-lg font-semibold mb-3">📊 Key Insights</h3>
        <ul className="space-y-2 text-gray-700">
          <li>• <strong>{data.summary.highImpact}</strong> CFR titles have high cross-agency impact (affecting 4+ agencies)</li>
          <li>• <strong>{((data.summary.highImpact + data.summary.mediumImpact) / data.summary.totalCfrTitles * 100).toFixed(1)}%</strong> of regulations affect multiple agencies</li>
          <li>• Each CFR title affects an average of <strong>{data.summary.averageAgenciesPerTitle.toFixed(1)}</strong> agencies</li>
          <li>• High-impact titles represent opportunities for coordinated deregulation efforts</li>
        </ul>
      </div>
    </div>
  );
}
