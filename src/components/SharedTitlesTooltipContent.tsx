export default function SharedTitlesTooltipContent() {
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
