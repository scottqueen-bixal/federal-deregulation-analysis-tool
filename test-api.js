import "dotenv/config";

const BASE_URL = process.env.BASE_URL || "http://localhost:3000";

async function testEndpoint(url, description) {
  try {
    console.log(`\nTesting: ${description}`);
    console.log(`URL: ${url}`);

    const response = await fetch(url);
    const status = response.status;
    console.log(`Status: ${status}`);

    if (status === 200) {
      const data = await response.json();
      console.log("Response:", JSON.stringify(data, null, 2));
    } else {
      const text = await response.text();
      console.log("Error Response:", text);
    }
  } catch (error) {
    console.log(`Error: ${error.message}`);
  }
}

async function runTests() {
  console.log("Starting API endpoint tests...\n");

  // Define the agencies we want to test
  const selectedNames = [
    "Department of Agriculture",
    "Department of Defense",
    "Department of Commerce",
    "Department of Labor",
    "Department of Justice",
  ];

  console.log("Testing agencies:", selectedNames.join(", "));
  console.log("=".repeat(60));

  // Test 1: Get all agencies and filter for our selected ones
  try {
    const agenciesResponse = await fetch(`${BASE_URL}/api/data/agencies`);
    if (agenciesResponse.ok) {
      const agenciesData = await agenciesResponse.json();
      const allAgencies = agenciesData.agencies;

      // Filter to only our selected agencies
      const selectedAgencies = allAgencies.filter((agency) =>
        selectedNames.includes(agency.name)
      );

      console.log(
        `\nFound ${selectedAgencies.length} out of ${selectedNames.length} selected agencies:\n`
      );

      if (selectedAgencies.length === 0) {
        console.log("❌ No selected agencies found in the database!");
        console.log("Available agencies:");
        allAgencies.slice(0, 10).forEach((agency) => {
          console.log(`  - ${agency.name} (ID: ${agency.id})`);
        });
        return;
      }

      // Test each selected agency
      for (const agency of selectedAgencies) {
        console.log(`\n🔍 Testing Agency: ${agency.name} (ID: ${agency.id})`);
        console.log("-".repeat(50));

        // Test 3: Checksum for agency
        await testEndpoint(
          `${BASE_URL}/api/analysis/checksum/agency/${agency.id}`,
          `Checksum analysis for ${agency.name}`
        );

        // Test 4: Complexity score for agency
        await testEndpoint(
          `${BASE_URL}/api/analysis/complexity_score/agency/${agency.id}`,
          `Complexity score analysis for ${agency.name}`
        );

        // Test 5: Word count for agency
        await testEndpoint(
          `${BASE_URL}/api/analysis/word_count/agency/${agency.id}`,
          `Word count analysis for ${agency.name}`
        );
      }

      // Show which agencies were not found
      const foundNames = selectedAgencies.map((a) => a.name);
      const missingNames = selectedNames.filter(
        (name) => !foundNames.includes(name)
      );

      if (missingNames.length > 0) {
        console.log(`\n⚠️  Agencies not found in database:`);
        missingNames.forEach((name) => console.log(`  - ${name}`));
      }
    } else {
      console.log("❌ Failed to fetch agencies from API");
    }
  } catch (error) {
    console.log("❌ Error fetching agencies:", error.message);
  }

  console.log("\n" + "=".repeat(60));
  console.log("API endpoint tests completed.");
}

// Run the tests
runTests().catch(console.error);
