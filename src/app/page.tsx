import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen p-8">
      <main className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">Federal Deregulation Analysis Tool</h1>
        <p className="text-lg mb-8">
          Analyze eCFR data for word counts, checksums, historical changes, and complexity scores per agency.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Link
            href="/analysis"
            className="block p-6 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
          >
            <h2 className="text-2xl font-semibold mb-2">Analysis Dashboard</h2>
            <p>View word counts, checksums, and historical changes for agencies.</p>
          </Link>
          <div className="p-6 bg-gray-50 dark:bg-gray-900/20 rounded-lg border border-gray-200 dark:border-gray-800">
            <h2 className="text-2xl font-semibold mb-2">Data Management</h2>
            <p>Run data ingestion scripts to fetch and store eCFR data.</p>
            <p className="text-sm mt-2">Use npm run ingest to update data.</p>
          </div>
        </div>
      </main>
    </div>
  );
}
