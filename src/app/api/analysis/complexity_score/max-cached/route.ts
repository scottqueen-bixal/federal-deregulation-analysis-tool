import { NextResponse } from 'next/server';
import { prisma } from '../../../../../lib/prisma';

// Cache for max complexity score - longer TTL since this changes infrequently
const maxScoreCache = { score: 0, expires: 0 };
const MAX_SCORE_CACHE_TTL = 60 * 60 * 1000; // 1 hour

export async function GET() {
  console.log(`[Max Complexity Score - Cached] Starting calculation`);
  const startTime = Date.now();

  // Check cache first
  if (maxScoreCache.expires > Date.now() && maxScoreCache.score > 0) {
    console.log(`[Max Complexity Score - Cached] Returning cached result: ${maxScoreCache.score}`);
    return NextResponse.json({
      max_complexity_score: maxScoreCache.score,
      cached: true,
      cache_expires: new Date(maxScoreCache.expires).toISOString()
    });
  }

  try {
    // Use more efficient approach: get top agencies by section count first
    const topAgencies = await prisma.$queryRaw<Array<{agency_id: number, section_count: bigint}>>`
      SELECT
        t."agencyId" as agency_id,
        COUNT(s.id) as section_count
      FROM sections s
      JOIN versions v ON s."versionId" = v.id
      JOIN titles t ON v."titleId" = t.id
      GROUP BY t."agencyId"
      ORDER BY section_count DESC
      LIMIT 10
    `;

    console.log(`[Max Complexity Score - Cached] Analyzing top ${topAgencies.length} agencies by section count`);

    let maxComplexityScore = 0;
    let maxAgency: { id: number; score: number } | null = null;

    // Only calculate for top agencies to find the max
    for (const agency of topAgencies) {
      const agencyId = agency.agency_id;
      const sectionCount = Number(agency.section_count);

      if (sectionCount === 0) continue;

      // Use smaller sample for max calculation
      const sampleSize = Math.min(sectionCount, 25);
      const sections = await prisma.section.findMany({
        where: {
          version: {
            title: {
              agencyId: agencyId
            }
          }
        },
        select: {
          textContent: true
        },
        take: sampleSize
      });

      // Fast text analysis
      const cfrPattern = /(\d+\s*CFR\s*\d+\.\d+|§\s*\d+\.\d+)/gi;
      const technicalPattern = /\b(shall|must|required|prohibited|compliance|pursuant|thereunder|thereof|hereby|wherein)\b/gi;

      let crossReferencesInSample = 0;
      let technicalTermsInSample = 0;

      sections.forEach(section => {
        const content = section.textContent || '';
        cfrPattern.lastIndex = 0;
        technicalPattern.lastIndex = 0;

        crossReferencesInSample += (content.match(cfrPattern) || []).length;
        technicalTermsInSample += (content.match(technicalPattern) || []).length;
      });

      // Scale up estimates
      const scaleFactor = sectionCount / sections.length;
      const crossReferences = Math.round(crossReferencesInSample * scaleFactor);
      const technicalTerms = Math.round(technicalTermsInSample * scaleFactor);

      // Calculate complexity score using same formula
      const complexity = (
        (sectionCount * 0.5) +
        (crossReferences * 2) +
        (technicalTerms * 0.1)
      );

      const complexityScore = Math.round(complexity);

      if (complexityScore > maxComplexityScore) {
        maxComplexityScore = complexityScore;
        maxAgency = {
          id: agencyId,
          score: complexityScore
        };
      }
    }

    // Update cache
    maxScoreCache.score = maxComplexityScore;
    maxScoreCache.expires = Date.now() + MAX_SCORE_CACHE_TTL;

    console.log(`[Max Complexity Score - Cached] Maximum score: ${maxComplexityScore}`);
    console.log(`[Max Complexity Score - Cached] Total time: ${Date.now() - startTime}ms`);

    return NextResponse.json({
      max_complexity_score: maxComplexityScore,
      max_agency: maxAgency,
      agencies_analyzed: topAgencies.length,
      cached: false,
      cache_expires: new Date(maxScoreCache.expires).toISOString()
    });

  } catch (error) {
    console.error('Error calculating max complexity score:', error);
    return NextResponse.json(
      { error: 'Failed to calculate max complexity score', details: error },
      { status: 500 }
    );
  }
}
