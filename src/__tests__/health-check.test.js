/**
 * @jest-environment node
 */

import { describe, test, expect, beforeAll } from "@jest/globals";

describe("Test Suite Health Check", () => {
  beforeAll(async () => {
    console.log("🔍 Running Docker environment health checks...");
  });

  describe("Environment Setup", () => {
    test("should have Docker containers running", async () => {
      const isRunning = await global.isServerRunning();
      expect(isRunning).toBe(true);
    });

    test("should have base URL configured", () => {
      expect(global.BASE_URL).toBeDefined();
      expect(global.BASE_URL).toMatch(/^https?:\/\//);
    });

    test("should be Docker environment", () => {
      expect(global.DOCKER_ENVIRONMENT).toBe(true);
    });
  });

  describe("Core API Availability", () => {
    test("data endpoints should be available", async () => {
      const endpoints = ["/api/data/agencies", "/api/data/titles"];

      for (const endpoint of endpoints) {
        const result = await global.makeApiRequest(endpoint);
        expect(result.status).toBe(200);
      }
    });

    test("analysis endpoints should be available", async () => {
      const endpoints = [
        "/api/analysis/cross-cutting",
        "/api/analysis/complexity_score/max-cached",
      ];

      for (const endpoint of endpoints) {
        const result = await global.makeApiRequest(endpoint);
        expect(result.status).toBe(200);
      }
    });
  });

  describe("Database Connectivity", () => {
    test("should have agency data", async () => {
      const result = await global.makeApiRequest("/api/data/agencies");
      expect(result.status).toBe(200);
      expect(result.data.agencies).toBeDefined();
      expect(result.data.agencies.length).toBeGreaterThan(0);
    });

    test("should have title data", async () => {
      const result = await global.makeApiRequest("/api/data/titles");
      expect(result.status).toBe(200);
      expect(result.data.titles).toBeDefined();
      expect(result.data.titles.length).toBeGreaterThan(0);
    });

    test("agency-title relationships should be valid", async () => {
      const agenciesResult = await global.makeApiRequest("/api/data/agencies");
      const titlesResult = await global.makeApiRequest("/api/data/titles");

      expect(agenciesResult.status).toBe(200);
      expect(titlesResult.status).toBe(200);

      const agencyIds = new Set(agenciesResult.data.agencies.map((a) => a.id));
      const titleAgencyIds = titlesResult.data.titles.map((t) => t.agency.id);

      // All title agency IDs should reference valid agencies
      titleAgencyIds.forEach((id) => {
        expect(agencyIds.has(id)).toBe(true);
      });
    });
  });
});
