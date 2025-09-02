export function WordCountTooltipContent() {
  return (
    <>
      <h4 className="font-semibold mb-2 text-gray-900">Word Count Calculation</h4>
      <p className="mb-3 text-gray-800">
        Counts all words in the agency&apos;s Code of Federal Regulations (CFR) sections, including:
      </p>
      <ul className="list-disc list-inside mb-3 space-y-1 text-gray-700">
        <li>Regulatory text and definitions</li>
        <li>Requirements and procedures</li>
        <li>Compliance guidelines</li>
        <li>Enforcement provisions</li>
      </ul>
      <p className="text-gray-700">
        <strong className="text-gray-900">Why it matters:</strong> Higher word counts often indicate more complex regulations that may burden businesses and citizens with compliance costs.
      </p>
    </>
  );
}

export function ChecksumTooltipContent() {
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

export function ComplexityTooltipContent() {
  return (
    <>
      <h4 className="font-semibold mb-2 text-gray-900">Relative Complexity Score</h4>
      <p className="mb-3 text-gray-800">
        Score from 0-100 showing this agency&apos;s regulatory complexity relative to the most complex agency in the dataset.
      </p>
      <ul className="list-disc list-inside mb-3 space-y-1 text-gray-700">
        <li><strong>Volume:</strong> Total number of regulatory sections</li>
        <li><strong>Cross-references:</strong> Citations to other CFR sections</li>
        <li><strong>Technical density:</strong> Regulatory jargon frequency</li>
        <li><strong>Relative scaling:</strong> Normalized against highest complexity agency</li>
      </ul>
      <div className="mb-3 space-y-1 text-gray-700">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 bg-green-500 rounded"></span>
          <span>0-24: Low complexity</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 bg-orange-500 rounded"></span>
          <span>25-60: Moderate complexity</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 bg-red-500 rounded"></span>
          <span>61-100: High complexity</span>
        </div>
      </div>
      <p className="text-gray-700">
        <strong className="text-gray-900">Why it matters:</strong> Higher scores indicate regulations with complex navigation and compliance requirements, making them prime candidates for simplification.
      </p>
    </>
  );
}

export function SharedTitlesTooltipContent() {
  return (
    <>
      <h4 className="font-semibold mb-2 text-gray-900">Shared CFR Titles</h4>
      <p className="mb-3 text-gray-800">
        The number of Code of Federal Regulations (CFR) titles that this agency shares regulatory authority over with other federal agencies.
      </p>
      <ul className="list-disc list-inside mb-3 space-y-1 text-gray-700">
        <li>Indicates regulatory overlap between agencies</li>
        <li>Shows potential coordination requirements</li>
        <li>Highlights areas of joint regulatory responsibility</li>
        <li>May indicate bureaucratic complexity</li>
      </ul>
      <p className="text-gray-700">
        <strong className="text-gray-900">Why it matters:</strong> Higher numbers suggest more complex inter-agency coordination requirements and potential regulatory inefficiencies.
      </p>
    </>
  );
}

export function PartnerAgenciesTooltipContent() {
  return (
    <>
      <h4 className="font-semibold mb-2 text-gray-900">Partner Agencies</h4>
      <p className="mb-3 text-gray-800">
        The total number of other federal agencies that share regulatory authority with this agency across various CFR titles.
      </p>
      <ul className="list-disc list-inside mb-3 space-y-1 text-gray-700">
        <li>Measures the breadth of inter-agency relationships</li>
        <li>Indicates coordination complexity</li>
        <li>Shows regulatory network connectivity</li>
        <li>Reflects jurisdictional overlap extent</li>
      </ul>
      <p className="text-gray-700">
        <strong className="text-gray-900">Why it matters:</strong> More partner agencies mean more complex coordination requirements and potential for conflicting regulations or duplicated efforts.
      </p>
    </>
  );
}

export function CrossCuttingImpactTooltipContent() {
  return (
    <>
      <h4 className="font-semibold mb-2 text-gray-900">Cross-Cutting Impact Analysis</h4>
      <p className="mb-3 text-gray-800">
        Multi-factor severity score evaluating regulatory complexity across agencies.
      </p>
      <ul className="list-disc list-inside mb-3 space-y-1 text-gray-700">
        <li>Impact level distribution (HIGH/MEDIUM/LOW)</li>
        <li>Number of agencies involved</li>
        <li>Regulatory density (shared vs. exclusive)</li>
        <li>High-impact concentration bonus</li>
      </ul>
      <p className="text-gray-700 mb-2">
        <strong className="text-gray-900">Severity levels:</strong>
      </p>
      <ul className="list-disc list-inside mb-3 space-y-1 text-gray-700 ml-4">
        <li className="text-gray-800 dark:text-gray-200"><strong>MINIMAL (0-1):</strong> Limited cross-agency impact</li>
        <li className="text-green-700 dark:text-green-400"><strong>LOW (2-3):</strong> Minor overlap concerns</li>
        <li className="text-yellow-700 dark:text-yellow-400"><strong>MODERATE (4-5):</strong> Significant coordination needed</li>
        <li className="text-orange-700 dark:text-orange-400"><strong>HIGH (6-10):</strong> Complex inter-agency effects</li>
        <li className="text-red-700 dark:text-red-400"><strong>CRITICAL (11+):</strong> Major bureaucratic entanglement</li>
      </ul>
      <p className="text-gray-700">
        <strong className="text-gray-900">Why it matters:</strong> Higher scores indicate regulations requiring coordinated reform efforts and potential sources of bureaucratic inefficiency.
      </p>
    </>
  );
}
