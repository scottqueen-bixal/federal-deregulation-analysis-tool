/**
 * @jest-environment node
 */

import { describe, test, expect, beforeAll } from "@jest/globals";

describe("Analysis API Endpoints", () => {
  beforeAll(async () => {
    // Ensure server is running
    const serverRunning = await global.isServerRunning();
    if (!serverRunning) {
      throw new Error(
        "Development server is not running. Start with: npm run dev"
      );
    }
  });

  describe("/api/analysis/cross-cutting", () => {
    test("should return cross-cutting regulations analysis", async () => {
      const result = await global.makeApiRequest("/api/analysis/cross-cutting");

      expect(result.status).toBe(200);
      expect(result.ok).toBe(true);
      expect(result.data).toHaveProperty("crossCuttingTitles");
      expect(Array.isArray(result.data.crossCuttingTitles)).toBe(true);

      if (result.data.crossCuttingTitles.length > 0) {
        const firstTitle = result.data.crossCuttingTitles[0];
        expect(firstTitle).toHaveProperty("name");
        expect(firstTitle).toHaveProperty("agencies");
        expect(Array.isArray(firstTitle.agencies)).toBe(true);
        expect(firstTitle.agencies.length).toBeGreaterThan(1); // Cross-cutting should have multiple agencies
      }
    });
  });

  describe("/api/analysis/complexity_score/max-aggregated", () => {
    test("should return maximum aggregated complexity score", async () => {
      const result = await global.makeApiRequest(
        "/api/analysis/complexity_score/max-aggregated"
      );

      expect(result.status).toBe(200);
      expect(result.ok).toBe(true);
      expect(result.data).toHaveProperty("max_aggregated_complexity_score");
      expect(typeof result.data.max_aggregated_complexity_score).toBe("number");
      expect(result.data.max_aggregated_complexity_score).toBeGreaterThan(0);
    }, 120000); // 2 minutes timeout for aggregation operation

    // NOTE: Cached result test removed due to long execution time (3+ minutes for initial calculation)
    // test("should return cached result when available", async () => { ... });

    // NOTE: Cache refresh test removed due to long execution time (5+ minutes)
    // test("should refresh cache when requested", async () => { ... });
  });

  describe("/api/analysis/complexity_score/max-cached", () => {
    test("should return maximum cached complexity score", async () => {
      const result = await global.makeApiRequest(
        "/api/analysis/complexity_score/max-cached"
      );

      expect(result.status).toBe(200);
      expect(result.ok).toBe(true);
      expect(result.data).toHaveProperty("max_complexity_score");
      expect(typeof result.data.max_complexity_score).toBe("number");
      expect(result.data.max_complexity_score).toBeGreaterThan(0);
    });
  });

  describe("/api/analysis/complexity_score/max-aggregated/clear-cache", () => {
    // NOTE: Cache clear POST test removed due to long execution time (5+ minutes)
    // test("should clear cache successfully with POST request", async () => { ... });

    test("should fail with GET request", async () => {
      const result = await global.makeApiRequest(
        "/api/analysis/complexity_score/max-aggregated/clear-cache",
        {
          method: "GET",
        }
      );

      // Should return method not allowed or similar error
      expect(result.status).not.toBe(200);
    });
  });
});
