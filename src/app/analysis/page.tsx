'use client';

import { useState, useEffect } from 'react';

interface Agency {
  id: number;
  name: string;
  slug: string;
  description?: string;
}

interface Metrics {
  totalSections?: number;
  totalWords?: number;
  avgWordsPerSection?: number;
  hierarchyDepth?: number;
}

interface AnalysisData {
  wordCount?: number;
  checksum?: string;
  complexityScore?: number;
  metrics?: Metrics;
}

export default function Analysis() {
  const [agencies, setAgencies] = useState<Agency[]>([]);
  const [selectedAgency, setSelectedAgency] = useState<number | null>(null);
  const [date, setDate] = useState('');
  const [analysisData, setAnalysisData] = useState<AnalysisData>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch('/api/data/agencies')
      .then(res => res.json())
      .then(data => setAgencies(data.agencies));
  }, []);

  const fetchAnalysis = async (endpoint: string) => {
    if (!selectedAgency) return;

    setLoading(true);
    try {
      const url = `/api/analysis/${endpoint}/agency/${selectedAgency}${date ? `?date=${date}` : ''}`;
      const res = await fetch(url);
      const data = await res.json();
      setAnalysisData(prev => ({ ...prev, ...data }));
    } catch (error) {
      console.error('Error fetching analysis:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAll = () => {
    fetchAnalysis('word_count');
    fetchAnalysis('checksum');
    fetchAnalysis('complexity_score');
  };

  return (
    <div className="min-h-screen p-8">
      <main className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">Analysis Dashboard</h1>

        <div className="mb-8 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Select Agency</label>
            <select
              value={selectedAgency || ''}
              onChange={(e) => setSelectedAgency(parseInt(e.target.value))}
              className="w-full p-2 border border-gray-300 rounded-md"
            >
              <option value="">Choose an agency...</option>
              {agencies.map(agency => (
                <option key={agency.id} value={agency.id}>
                  {agency.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Date (optional)</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="p-2 border border-gray-300 rounded-md"
            />
          </div>

          <button
            onClick={fetchAll}
            disabled={!selectedAgency || loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Loading...' : 'Analyze'}
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <h3 className="text-xl font-semibold mb-4">Word Count</h3>
            <p className="text-3xl font-bold text-blue-600">
              {analysisData.wordCount?.toLocaleString() || 'N/A'}
            </p>
          </div>

          <div className="p-6 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <h3 className="text-xl font-semibold mb-4">Checksum</h3>
            <p className="text-sm font-mono break-all">
              {analysisData.checksum || 'N/A'}
            </p>
          </div>

          <div className="p-6 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <h3 className="text-xl font-semibold mb-4">Complexity Score</h3>
            <p className="text-3xl font-bold text-green-600">
              {analysisData.complexityScore?.toFixed(2) || 'N/A'}
            </p>
            {analysisData.metrics && (
              <div className="mt-2 text-sm text-gray-600">
                <p>Sections: {analysisData.metrics.totalSections}</p>
                <p>Total Words: {analysisData.metrics.totalWords}</p>
                <p>Avg Words/Section: {analysisData.metrics.avgWordsPerSection?.toFixed(1)}</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
