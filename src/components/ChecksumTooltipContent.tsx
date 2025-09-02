export default function ChecksumTooltipContent() {
  return (
    <>
      <h4 className="font-semibold mb-2 text-gray-900">Document Checksum</h4>
      <p className="mb-3 text-gray-800">
        A unique cryptographic fingerprint (hash) generated from the regulatory text content.
      </p>
      <ul className="list-disc list-inside mb-3 space-y-1 text-gray-700">
        <li>Verifies document integrity</li>
        <li>Detects any content changes</li>
        <li>Ensures data consistency</li>
        <li>Enables version tracking</li>
      </ul>
      <p className="text-gray-700">
        <strong className="text-gray-900">Why it matters:</strong> Checksums provide audit trails and ensure the regulatory text hasn&apos;t been altered, maintaining data integrity for analysis.
      </p>
    </>
  );
}
