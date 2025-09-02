// Jest setup file
// Global test configuration and utilities for Docker environment

// Set default timeout for async operations (longer for Docker)
jest.setTimeout(60000);

// Global test utilities
global.BASE_URL = process.env.API_BASE_URL || "http://localhost:3000";
global.DOCKER_ENVIRONMENT = true;

// Enhanced helper function to check if Docker server is running
global.isServerRunning = async () => {
  try {
    const response = await fetch(`${global.BASE_URL}/api/data/agencies`, {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
    });
    return response.status === 200;
  } catch (error) {
    console.log(`Server check failed: ${error.message}`);
    return false;
  }
};

// Wait for Docker containers to be ready
global.waitForDockerServer = async (maxAttempts = 10, delayMs = 1000) => {
  console.log("🐳 Waiting for Docker containers to be ready...");

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const response = await fetch(`${global.BASE_URL}/api/data/agencies`, {
        method: "GET",
        headers: {
          Accept: "application/json",
        },
      });

      if (response.ok) {
        console.log(
          `✅ Docker containers are ready (attempt ${attempt}/${maxAttempts})`
        );
        return true;
      }

      console.log(
        `⏳ Docker containers not ready yet... (attempt ${attempt}/${maxAttempts}) - Status: ${response.status}`
      );
    } catch (error) {
      console.log(
        `⏳ Waiting for Docker containers... (attempt ${attempt}/${maxAttempts}) - ${error.message}`
      );
    }

    if (attempt < maxAttempts) {
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }

  console.log("❌ Docker containers not ready after maximum attempts");
  return false;
};

// Helper function to make API requests
global.makeApiRequest = async (endpoint, options = {}) => {
  const url = endpoint.startsWith("http")
    ? endpoint
    : `${global.BASE_URL}${endpoint}`;

  try {
    const response = await fetch(url, {
      method: options.method || "GET",
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
      ...options,
    });

    const data = await response.json();
    return {
      status: response.status,
      ok: response.ok,
      data,
      headers: Object.fromEntries(response.headers.entries()),
    };
  } catch (error) {
    return {
      status: 0,
      ok: false,
      error: error.message,
      data: null,
    };
  }
};

// Before all tests, check if Docker server is running
beforeAll(async () => {
  console.log("🔍 Checking Docker environment...");
  const serverRunning = await global.isServerRunning();

  if (!serverRunning) {
    console.warn("⚠️  Docker containers are not ready yet.");
    console.warn("   Waiting for Docker containers to start...");

    const dockerReady = await global.waitForDockerServer();
    if (!dockerReady) {
      console.warn("❌ Docker containers are not responding.");
      console.warn(
        "   Make sure Docker containers are running with: docker-compose up"
      );
    }
  } else {
    console.log("✅ Docker containers are ready!");
  }
});
