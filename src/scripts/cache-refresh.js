#!/usr/bin/env node

/**
 * Background cache refresh script for complexity score calculations
 * Run this periodically (e.g., via cron) to keep caches warm
 */

const BASE_URL = process.env.BASE_URL || "http://localhost:3000";

async function refreshMaxComplexityCache() {
  console.log("[Cache Refresh] Starting max complexity score cache refresh...");

  try {
    const response = await fetch(
      `${BASE_URL}/api/analysis/complexity_score/max-cached`
    );
    const data = await response.json();

    if (response.ok) {
      console.log(
        `[Cache Refresh] Max complexity score refreshed: ${data.max_complexity_score}`
      );
      console.log(`[Cache Refresh] Cache expires: ${data.cache_expires}`);
      return data.max_complexity_score;
    } else {
      console.error(
        "[Cache Refresh] Failed to refresh max complexity cache:",
        data
      );
      return null;
    }
  } catch (error) {
    console.error(
      "[Cache Refresh] Error refreshing max complexity cache:",
      error
    );
    return null;
  }
}

async function warmComplexityScoreCache() {
  console.log(
    "[Cache Refresh] Warming complexity score cache for top agencies..."
  );

  try {
    // Get list of agencies first
    const agenciesResponse = await fetch(`${BASE_URL}/api/data/agencies`);
    const agencies = await agenciesResponse.json();

    if (!Array.isArray(agencies)) {
      console.error("[Cache Refresh] Invalid agencies response");
      return;
    }

    // Warm cache for first 10 agencies (most commonly accessed)
    const topAgencies = agencies.slice(0, 10);
    console.log(
      `[Cache Refresh] Warming cache for ${topAgencies.length} agencies...`
    );

    const promises = topAgencies.map(async (agency) => {
      try {
        const response = await fetch(
          `${BASE_URL}/api/analysis/complexity_score/agency/${agency.id}`
        );
        const data = await response.json();
        console.log(
          `[Cache Refresh] Warmed cache for agency ${agency.id}: score ${data.complexity_score}`
        );
        return { agencyId: agency.id, success: true };
      } catch (error) {
        console.error(
          `[Cache Refresh] Failed to warm cache for agency ${agency.id}:`,
          error
        );
        return { agencyId: agency.id, success: false };
      }
    });

    const results = await Promise.all(promises);
    const successful = results.filter((r) => r.success).length;
    console.log(
      `[Cache Refresh] Successfully warmed ${successful}/${results.length} agency caches`
    );
  } catch (error) {
    console.error(
      "[Cache Refresh] Error warming complexity score cache:",
      error
    );
  }
}

async function main() {
  console.log("[Cache Refresh] Starting cache refresh job...");
  const startTime = Date.now();

  // Refresh max complexity score cache
  await refreshMaxComplexityCache();

  // Warm individual agency caches
  await warmComplexityScoreCache();

  const duration = Date.now() - startTime;
  console.log(`[Cache Refresh] Cache refresh completed in ${duration}ms`);
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { refreshMaxComplexityCache, warmComplexityScoreCache };
