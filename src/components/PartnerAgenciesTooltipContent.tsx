export default function PartnerAgenciesTooltipContent() {
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
