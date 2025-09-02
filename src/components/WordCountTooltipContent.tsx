export default function WordCountTooltipContent() {
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
