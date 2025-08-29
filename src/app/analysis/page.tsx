'use client';

import { useState, useEffect } from 'react';

interface Agency {
  id: number;
  name: string;
  slug: string;
}

interface AnalysisData {
  wordCount?: number;
  checksum?: string;
  complexityScore?: number;
  metrics?: {
    totalSections: number;
    totalWords: number;
    avgWordsPerSection: number;
  };
}

interface CrossCuttingData {
  summary: {
    agencyName: string;
    totalCfrTitles: number;
    sharedTitles: number;
    exclusiveTitles: number;
    highImpactShared: number;
    sharedWithAgencies: number;
    crossCuttingPercentage: number;
  };
  crossCuttingTitles: Array<{
    cfrNumber: number;
    name: string;
    agencyCount: number;
    agencies: Array<{ id: number; name: string; slug: string }>;
    sharedWith: Array<{ id: number; name: string; slug: string }>;
    impactLevel: 'HIGH' | 'MEDIUM' | 'LOW';
    isShared: boolean;
  }>;
  selectedAgency: {
    id: number;
    name: string;
    slug: string;
  };
}

export default function Analysis() {
  const [agencies, setAgencies] = useState<Agency[]>([]);
  const [selectedAgency, setSelectedAgency] = useState<number | null>(null);
  const [analysisData, setAnalysisData] = useState<AnalysisData>({});
  const [crossCuttingData, setCrossCuttingData] = useState<CrossCuttingData | null>(null);
  const [loading, setLoading] = useState(false);
  const [agenciesLoading, setAgenciesLoading] = useState(true);

  useEffect(() => {
    fetch('/api/data/agencies')
      .then(res => res.json())
      .then(data => {
        if (data.agencies && Array.isArray(data.agencies)) {
          setAgencies(data.agencies);
        } else {
          console.error('Invalid agencies data:', data);
          setAgencies([]);
        }
      })
      .catch(error => {
        console.error('Error fetching agencies:', error);
        setAgencies([]);
      })
      .finally(() => {
        setAgenciesLoading(false);
      });
  }, []);

  const fetchAnalysis = async (endpoint: string) => {
    if (!selectedAgency) return;

    setLoading(true);
    try {
      const url = `/api/analysis/${endpoint}/agency/${selectedAgency}`;
      const res = await fetch(url);
      const data = await res.json();
      setAnalysisData(prev => ({ ...prev, ...data }));
    } catch (error) {
      console.error('Error fetching analysis:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCrossCuttingData = async (agencyId: number) => {
    try {
      const response = await fetch(`/api/analysis/cross-cutting/agency/${agencyId}`);
      const data = await response.json();
      setCrossCuttingData(data);
    } catch (error) {
      console.error('Error fetching cross-cutting data:', error);
    }
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
              onChange={(e) => {
                const agencyId = parseInt(e.target.value);
                setSelectedAgency(agencyId);
                if (agencyId) {
                  fetchCrossCuttingData(agencyId);
                  fetchAnalysis('word_count');
                  fetchAnalysis('checksum');
                  fetchAnalysis('complexity_score');
                }
              }}
              className="w-full p-2 border border-gray-300 rounded-md"
              disabled={agenciesLoading}
            >
              <option value="">
                {agenciesLoading ? 'Loading agencies...' : 'Choose an agency...'}
              </option>
              {Array.isArray(agencies) && agencies.map(agency => (
                <option key={agency.id} value={agency.id}>
                  {agency.name}
                </option>
              ))}
            </select>
          </div>
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

        {/* Cross-Cutting Analysis Section */}
        {crossCuttingData && (
          <div className="mt-8">
            <h2 className="text-2xl font-semibold mb-6">Cross-Cutting Regulatory Analysis</h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div className="p-6 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                <h3 className="text-xl font-semibold mb-4">Shared Titles</h3>
                <p className="text-3xl font-bold text-purple-600">
                  {crossCuttingData.summary.sharedTitles}
                </p>
                <p className="text-sm text-gray-600 mt-2">
                  CFR titles affecting multiple agencies
                </p>
              </div>

              <div className="p-6 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                <h3 className="text-xl font-semibold mb-4">Shared With Agencies</h3>
                <p className="text-3xl font-bold text-orange-600">
                  {crossCuttingData.summary.sharedWithAgencies}
                </p>
                <p className="text-sm text-gray-600 mt-2">
                  Other agencies sharing regulations
                </p>
              </div>

              <div className="p-6 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                <h3 className="text-xl font-semibold mb-4">Cross-Cutting Percentage</h3>
                <p className="text-3xl font-bold text-green-600">
                  {crossCuttingData.summary.crossCuttingPercentage.toFixed(1)}%
                </p>
                <p className="text-sm text-gray-600 mt-2">
                  {crossCuttingData.summary.highImpactShared} high-impact shared titles
                </p>
              </div>
            </div>

            {crossCuttingData.crossCuttingTitles && crossCuttingData.crossCuttingTitles.length > 0 && (
              <div className="p-6 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                <h3 className="text-xl font-semibold mb-4">CFR Titles for {crossCuttingData.summary.agencyName}</h3>
                <div className="space-y-3">
                  {crossCuttingData.crossCuttingTitles.map((title, index) => (
                    <div key={`title-${index}`} className="border-l-4 border-blue-500 pl-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-semibold">Title {title.cfrNumber}: {title.name}</h4>
                          <p className="text-sm text-gray-600 mt-1">
                            {title.isShared ? `Shared with ${title.agencyCount - 1} other agencies` : 'Exclusive to this agency'}
                          </p>
                        </div>
                        <div className="flex space-x-2">
                          <span className={`px-2 py-1 text-xs font-semibold rounded ${
                            title.impactLevel === 'HIGH' ? 'bg-red-100 text-red-800' :
                            title.impactLevel === 'MEDIUM' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-green-100 text-green-800'
                          }`}>
                            {title.impactLevel}
                          </span>
                          {title.isShared && (
                            <span className="px-2 py-1 text-xs font-semibold rounded bg-blue-100 text-blue-800">
                              SHARED
                            </span>
                          )}
                        </div>
                      </div>
                      {title.isShared && title.sharedWith.length > 0 && (
                        <div className="mt-2 text-sm">
                          <p className="text-gray-700">
                            <strong>Shared with:</strong> {title.sharedWith.map(agency => agency.name).join(', ')}
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
