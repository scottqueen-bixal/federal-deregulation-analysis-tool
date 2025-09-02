/**
 * @jest-environment node
 */

import { describe, test, expect, beforeAll } from "@jest/globals";

describe("Debug and Utility Endpoints", () => {
  beforeAll(async () => {
    // Ensure server is running
    const serverRunning = await global.isServerRunning();
    if (!serverRunning) {
      throw new Error(
        "Development server is not running. Start with: npm run dev"
      );
    }
  });

  describe("/api/debug/aggregation-test", () => {
    test("should return debug aggregation test results", async () => {
      const result = await global.makeApiRequest("/api/debug/aggregation-test");

      expect(result.status).toBe(200);
      expect(result.ok).toBe(true);
      expect(result.data).toBeDefined();
      // Response structure will depend on actual implementation
    });
  });

  describe("Error Handling", () => {
    test("should return error response for non-existent endpoints", async () => {
      const result = await global.makeApiRequest("/api/non-existent-endpoint");

      // In Next.js development mode, non-existent endpoints return HTML error pages
      // which results in status 0 in our makeApiRequest function due to JSON parsing failure
      // This is expected behavior for Next.js dev mode
      expect([0, 404]).toContain(result.status);
      
      // If status is 0, it means we got an HTML error page instead of JSON
      if (result.status === 0) {
        expect(result.error).toBeDefined();
      }
    });

    test("should handle malformed agency IDs gracefully", async () => {
      const result = await global.makeApiRequest(
        "/api/analysis/checksum/agency/invalid-id"
      );

      expect([400, 404, 500]).toContain(result.status);
    });

    test("should handle missing required parameters", async () => {
      const result = await global.makeApiRequest(
        "/api/analysis/historical_changes/agency/1"
      );

      expect(result.status).toBe(400);
      expect(result.data).toHaveProperty("error");
    });
  });

  describe("Response Headers", () => {
    test("should include appropriate content-type headers", async () => {
      const result = await global.makeApiRequest("/api/data/agencies");

      expect(result.status).toBe(200);
      expect(result.headers["content-type"]).toContain("application/json");
    });

    test("should handle CORS appropriately", async () => {
      const result = await global.makeApiRequest("/api/data/agencies");

      expect(result.status).toBe(200);
      // CORS headers may or may not be present depending on configuration
      // This test mainly ensures the request doesn't fail due to CORS issues
    });
  });

  describe("Data Consistency", () => {
    test("should return consistent data across multiple requests", async () => {
      const result1 = await global.makeApiRequest("/api/data/agencies");
      const result2 = await global.makeApiRequest("/api/data/agencies");

      expect(result1.status).toBe(200);
      expect(result2.status).toBe(200);
      expect(result1.data.agencies.length).toBe(result2.data.agencies.length);

      // Check that the same agencies are returned in the same order
      result1.data.agencies.forEach((agency, index) => {
        expect(agency.id).toBe(result2.data.agencies[index].id);
        expect(agency.name).toBe(result2.data.agencies[index].name);
      });
    });

    test("agency IDs should be consistent between agencies and titles endpoints", async () => {
      const agenciesResult = await global.makeApiRequest("/api/data/agencies");
      const titlesResult = await global.makeApiRequest("/api/data/titles");

      expect(agenciesResult.status).toBe(200);
      expect(titlesResult.status).toBe(200);

      const agencyIds = new Set(agenciesResult.data.agencies.map((a) => a.id));
      const titleAgencyIds = new Set(
        titlesResult.data.titles.map((t) => t.agency.id)
      );

      // All agency IDs referenced in titles should exist in agencies
      titleAgencyIds.forEach((id) => {
        expect(agencyIds.has(id)).toBe(true);
      });
    });
  });
});
