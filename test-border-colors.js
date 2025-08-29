// Test file to verify border color logic
// Removed unused testTitle variable

const getBorderClass = (impactLevel) => {
  if (impactLevel === "HIGH") {
    return "border-red-200 dark:border-red-800";
  } else if (impactLevel === "MEDIUM") {
    return "border-yellow-200 dark:border-yellow-800";
  } else {
    return "border-green-200 dark:border-green-800";
  }
};

const getBadgeClass = (impactLevel) => {
  if (impactLevel === "HIGH") {
    return "bg-red-100 text-red-800 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800";
  } else if (impactLevel === "MEDIUM") {
    return "bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-800";
  } else {
    return "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800";
  }
};

// Test all impact levels
const testCases = ["HIGH", "MEDIUM", "LOW"];

console.log("Border Color Test Results:");
testCases.forEach((level) => {
  const borderClass = getBorderClass(level);
  const badgeClass = getBadgeClass(level);

  // Extract border color from badge class
  const badgeBorderMatch = badgeClass.match(/border-(\w+)-(\d+)/);
  const borderColorMatch = borderClass.match(/border-(\w+)-(\d+)/);

  const match =
    badgeBorderMatch &&
    borderColorMatch &&
    badgeBorderMatch[1] === borderColorMatch[1] &&
    badgeBorderMatch[2] === borderColorMatch[2];

  console.log(`${level}: ${match ? "✅ MATCH" : "❌ MISMATCH"}`);
  console.log(`  Border: ${borderClass}`);
  console.log(`  Badge:  ${badgeClass}`);
  console.log("");
});
