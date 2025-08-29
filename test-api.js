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

  // Test 1: Get all agencies
  await testEndpoint(`${BASE_URL}/api/data/agencies`, "Get all agencies");

  // Test 2: Get all titles
  await testEndpoint(`${BASE_URL}/api/data/titles`, "Get all titles");

  // For the agency-specific endpoints, we need a valid agencyId
  // First, let's get agencies and use the first one
  try {
    const agenciesResponse = await fetch(`${BASE_URL}/api/data/agencies`);
    if (agenciesResponse.ok) {
      const agenciesData = await agenciesResponse.json();
      const agencies = agenciesData.agencies;

      if (agencies && agencies.length > 0) {
        const agencyId = agencies[0].id;
        console.log(
          `\nUsing agency ID: ${agencyId} (${agencies[0].name}) for further tests\n`
        );

        // Test 3: Checksum for agency
        await testEndpoint(
          `${BASE_URL}/api/analysis/checksum/agency/${agencyId}`,
          "Checksum analysis"
        );

        // Test 4: Complexity score for agency
        await testEndpoint(
          `${BASE_URL}/api/analysis/complexity_score/agency/${agencyId}`,
          "Complexity score analysis"
        );

        // Test 5: Word count for agency
        await testEndpoint(
          `${BASE_URL}/api/analysis/word_count/agency/${agencyId}`,
          "Word count analysis"
        );

        // Test 6: Historical changes (need from and to dates)
        // For now, let's try with some sample dates
        const fromDate = "2024-01-01";
        const toDate = "2024-12-31";
        await testEndpoint(
          `${BASE_URL}/api/analysis/historical_changes/agency/${agencyId}?from=${fromDate}&to=${toDate}`,
          "Historical changes analysis"
        );

        // Test 7: Get titles for specific agency
        await testEndpoint(
          `${BASE_URL}/api/data/titles?agencyId=${agencyId}`,
          "Get titles for specific agency"
        );
      } else {
        console.log("No agencies found in database");
      }
    }
  } catch (error) {
    console.log("Error fetching agencies:", error.message);
  }

  console.log("\nAPI endpoint tests completed.");
}

// Run the tests
runTests().catch(console.error);
