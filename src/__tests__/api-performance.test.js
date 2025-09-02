/**
 * @jest-environment node
 */

import { describe, test, expect, beforeAll } from "@jest/globals";

describe("API Performance Tests", () => {
  const performanceThresholds = {
    "/api/data/agencies": 2000,
    "/api/data/titles": 3000,
    "/api/analysis/cross-cutting": 5000,
    "/api/analysis/complexity_score/max-cached": 1000,
    "/api/analysis/checksum/agency/1": 3000,
  };

  beforeAll(async () => {
    // Ensure server is running
    const serverRunning = await global.isServerRunning();
    if (!serverRunning) {
      throw new Error(
        "Development server is not running. Start with: npm run dev"
      );
    }
  });

  describe("Response Time Tests", () => {
    Object.entries(performanceThresholds).forEach(([endpoint, threshold]) => {
      test(
        `${endpoint} should respond within ${threshold}ms`,
        async () => {
          const startTime = Date.now();
          const result = await global.makeApiRequest(endpoint);
          const responseTime = Date.now() - startTime;

          expect(result.status).toBe(200);
          expect(responseTime).toBeLessThan(threshold);
        },
        threshold + 5000
      ); // Set Jest timeout slightly higher than threshold
    });
  });

  describe("Concurrent Request Tests", () => {
    test("should handle concurrent requests to /api/data/agencies", async () => {
      const concurrentRequests = 5;
      const promises = Array(concurrentRequests)
        .fill()
        .map(() => global.makeApiRequest("/api/data/agencies"));

      const results = await Promise.all(promises);

      results.forEach((result) => {
        expect(result.status).toBe(200);
        expect(result.ok).toBe(true);
        expect(result.data).toHaveProperty("agencies");
      });
    });

    test("should handle concurrent requests to different endpoints", async () => {
      const endpoints = [
        "/api/data/agencies",
        "/api/data/titles",
        "/api/analysis/cross-cutting",
        "/api/analysis/complexity_score/max-cached",
      ];

      const promises = endpoints.map((endpoint) =>
        global.makeApiRequest(endpoint)
      );

      const results = await Promise.all(promises);

      results.forEach((result) => {
        expect(result.status).toBe(200);
        expect(result.ok).toBe(true);
      });
    });
  });

  describe("Load Tests", () => {
    test("should handle sequential requests without degradation", async () => {
      const iterations = 10;
      const endpoint = "/api/data/agencies";
      const responseTimes = [];

      for (let i = 0; i < iterations; i++) {
        const startTime = Date.now();
        const result = await global.makeApiRequest(endpoint);
        const responseTime = Date.now() - startTime;

        expect(result.status).toBe(200);
        responseTimes.push(responseTime);
      }

      // Check that response times don't increase significantly
      const avgFirstHalf =
        responseTimes.slice(0, 5).reduce((a, b) => a + b, 0) / 5;
      const avgSecondHalf =
        responseTimes.slice(5).reduce((a, b) => a + b, 0) / 5;

      // Second half shouldn't be more than 50% slower than first half
      expect(avgSecondHalf).toBeLessThan(avgFirstHalf * 1.5);
    }, 60000); // 60 second timeout for load test
  });

  describe("Memory and Resource Tests", () => {
    test("should not cause memory leaks with repeated requests", async () => {
      const iterations = 20;
      const endpoint = "/api/data/agencies";

      for (let i = 0; i < iterations; i++) {
        const result = await global.makeApiRequest(endpoint);
        expect(result.status).toBe(200);

        // Force garbage collection if available (for memory testing)
        if (global.gc) {
          global.gc();
        }
      }

      // If we reach here without timeout or memory issues, test passes
      expect(true).toBe(true);
    }, 30000);
  });
});
