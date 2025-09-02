export default function CrossCuttingImpactTooltipContent() {
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
