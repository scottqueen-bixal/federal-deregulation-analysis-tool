/**
 * @jest-environment node
 */

import { describe, test, expect, beforeAll } from "@jest/globals";

describe("Agency-Specific API Endpoints", () => {
  const testAgencyId = 1;

  beforeAll(async () => {
    // Ensure server is running
    const serverRunning = await global.isServerRunning();
    if (!serverRunning) {
      throw new Error(
        "Development server is not running. Start with: npm run dev"
      );
    }
  });

  describe(`/api/analysis/checksum/agency/${testAgencyId}`, () => {
    test("should return agency checksum", async () => {
      const result = await global.makeApiRequest(
        `/api/analysis/checksum/agency/${testAgencyId}`
      );

      expect(result.status).toBe(200);
      expect(result.ok).toBe(true);
      expect(result.data).toHaveProperty("agencyId");
      expect(result.data).toHaveProperty("checksum");
      expect(result.data.agencyId).toBe(testAgencyId);
      expect(typeof result.data.checksum).toBe("string");
      expect(result.data.checksum.length).toBeGreaterThan(0);
    });

    test("should return checksum for specific date", async () => {
      const testDate = "2024-01-01";
      const result = await global.makeApiRequest(
        `/api/analysis/checksum/agency/${testAgencyId}?date=${testDate}`
      );

      expect(result.status).toBe(200);
      expect(result.ok).toBe(true);
      expect(result.data).toHaveProperty("agencyId");
      expect(result.data).toHaveProperty("checksum");
      expect(result.data).toHaveProperty("date");
      expect(result.data.agencyId).toBe(testAgencyId);
      expect(result.data.date).toBe(testDate);
    });

    test("should handle invalid agency ID", async () => {
      const result = await global.makeApiRequest(
        "/api/analysis/checksum/agency/99999"
      );

      // Should either return empty result or appropriate error
      expect([200, 400, 404]).toContain(result.status);
    });
  });

  describe(`/api/analysis/historical_changes/agency/${testAgencyId}`, () => {
    test("should require from and to dates", async () => {
      const result = await global.makeApiRequest(
        `/api/analysis/historical_changes/agency/${testAgencyId}`
      );

      expect(result.status).toBe(400);
      expect(result.data).toHaveProperty("error");
      expect(result.data.error).toContain("from and to dates are required");
    });

    test("should return historical changes with valid date range", async () => {
      const fromDate = "2024-01-01";
      const toDate = "2024-12-31";
      const result = await global.makeApiRequest(
        `/api/analysis/historical_changes/agency/${testAgencyId}?from=${fromDate}&to=${toDate}`
      );

      expect(result.status).toBe(200);
      expect(result.ok).toBe(true);
      // Response structure will depend on actual implementation
      expect(result.data).toBeDefined();
    });

    test("should handle invalid date format", async () => {
      const result = await global.makeApiRequest(
        `/api/analysis/historical_changes/agency/${testAgencyId}?from=invalid-date&to=2024-12-31`
      );

      // Should return error for invalid date
      expect([400, 500]).toContain(result.status);
    });
  });

  describe(`/api/analysis/word_count/agency/${testAgencyId}`, () => {
    test("should return word count analysis", async () => {
      const result = await global.makeApiRequest(
        `/api/analysis/word_count/agency/${testAgencyId}`
      );

      expect(result.status).toBe(200);
      expect(result.ok).toBe(true);
      expect(result.data).toBeDefined();
      // Response structure will depend on actual implementation
    });
  });

  describe(`/api/analysis/complexity_score/agency/${testAgencyId}`, () => {
    test("should return complexity score for agency", async () => {
      const result = await global.makeApiRequest(
        `/api/analysis/complexity_score/agency/${testAgencyId}`
      );

      expect(result.status).toBe(200);
      expect(result.ok).toBe(true);
      expect(result.data).toBeDefined();
      // Response structure will depend on actual implementation
    });
  });

  describe(`/api/analysis/cross-cutting/agency/${testAgencyId}`, () => {
    test("should return cross-cutting analysis for specific agency", async () => {
      const result = await global.makeApiRequest(
        `/api/analysis/cross-cutting/agency/${testAgencyId}`
      );

      expect(result.status).toBe(200);
      expect(result.ok).toBe(true);
      expect(result.data).toBeDefined();
      // Response structure will depend on actual implementation
    });
  });
});
