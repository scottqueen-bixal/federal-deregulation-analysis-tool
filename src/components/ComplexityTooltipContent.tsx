export default function ComplexityTooltipContent() {
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
