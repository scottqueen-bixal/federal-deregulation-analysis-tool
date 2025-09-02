/**
 * @jest-environment node
 */

import { describe, test, expect, beforeAll } from "@jest/globals";

describe("Data API Endpoints", () => {
  beforeAll(async () => {
    // Ensure server is running
    const serverRunning = await global.isServerRunning();
    if (!serverRunning) {
      throw new Error(
        "Development server is not running. Start with: npm run dev"
      );
    }
  });

  describe("/api/data/agencies", () => {
    test("should return list of agencies", async () => {
      const result = await global.makeApiRequest("/api/data/agencies");

      expect(result.status).toBe(200);
      expect(result.ok).toBe(true);
      expect(result.data).toHaveProperty("agencies");
      expect(Array.isArray(result.data.agencies)).toBe(true);
      expect(result.data.agencies.length).toBeGreaterThan(0);

      // Check structure of first agency
      const firstAgency = result.data.agencies[0];
      expect(firstAgency).toHaveProperty("id");
      expect(firstAgency).toHaveProperty("name");
      expect(firstAgency).toHaveProperty("slug");
      expect(typeof firstAgency.id).toBe("number");
      expect(typeof firstAgency.name).toBe("string");
      expect(typeof firstAgency.slug).toBe("string");
    });

    test("should include agency hierarchy information", async () => {
      const result = await global.makeApiRequest("/api/data/agencies");

      expect(result.status).toBe(200);
      const firstAgency = result.data.agencies[0];

      // Should have parent and children properties (even if null/empty)
      expect(firstAgency).toHaveProperty("parent");
      expect(firstAgency).toHaveProperty("children");
      expect(firstAgency).toHaveProperty("parentId");
    });
  });

  describe("/api/data/titles", () => {
    test("should return list of all titles", async () => {
      const result = await global.makeApiRequest("/api/data/titles");

      expect(result.status).toBe(200);
      expect(result.ok).toBe(true);
      expect(result.data).toHaveProperty("titles");
      expect(Array.isArray(result.data.titles)).toBe(true);
      expect(result.data.titles.length).toBeGreaterThan(0);

      // Check structure of first title
      const firstTitle = result.data.titles[0];
      expect(firstTitle).toHaveProperty("id");
      expect(firstTitle).toHaveProperty("code");
      expect(firstTitle).toHaveProperty("name");
      expect(firstTitle).toHaveProperty("agency");
      expect(typeof firstTitle.id).toBe("number");
      expect(typeof firstTitle.code).toBe("string");
      expect(typeof firstTitle.name).toBe("string");
      expect(typeof firstTitle.agency).toBe("object");
    });

    test("should filter titles by agency ID", async () => {
      const result = await global.makeApiRequest("/api/data/titles?agencyId=1");

      expect(result.status).toBe(200);
      expect(result.ok).toBe(true);
      expect(result.data).toHaveProperty("titles");
      expect(Array.isArray(result.data.titles)).toBe(true);

      // All returned titles should be for agency 1
      result.data.titles.forEach((title) => {
        expect(title.agency.id).toBe(1);
      });
    });

    test("should return empty array for non-existent agency", async () => {
      const result = await global.makeApiRequest(
        "/api/data/titles?agencyId=99999"
      );

      expect(result.status).toBe(200);
      expect(result.ok).toBe(true);
      expect(result.data).toHaveProperty("titles");
      expect(Array.isArray(result.data.titles)).toBe(true);
      expect(result.data.titles.length).toBe(0);
    });
  });
});
