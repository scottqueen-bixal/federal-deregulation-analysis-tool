import { NextResponse } from 'next/server';
import { prisma } from '../../../../../lib/prisma';

// Cache for max aggregated complexity score
const maxAggregatedScoreCache = { score: 0, expires: 0 };
const MAX_AGGREGATED_SCORE_CACHE_TTL = 60 * 60 * 1000; // 1 hour

export async function GET(request: Request) {
  console.log(`[Max Aggregated Complexity Score] Starting calculation`);
  const startTime = Date.now();

  // Check for cache refresh parameter
  const url = new URL(request.url);
  const shouldRefresh = url.searchParams.get('refresh') === 'true';

  // Check cache first (unless refresh requested)
  if (!shouldRefresh && maxAggregatedScoreCache.expires > Date.now() && maxAggregatedScoreCache.score > 0) {
    console.log(`[Max Aggregated Complexity Score] Returning cached result: ${maxAggregatedScoreCache.score}`);
    return NextResponse.json({
      max_aggregated_complexity_score: maxAggregatedScoreCache.score,
      cached: true,
      cache_expires: new Date(maxAggregatedScoreCache.expires).toISOString()
    });
  }

  try {
    // Get all parent agencies with their children
    const parentAgencies = await prisma.agency.findMany({
      where: {
        children: {
          some: {}
        }
      },
      include: {
        children: true
      }
    });

    console.log(`[Max Aggregated Complexity Score] Analyzing ${parentAgencies.length} parent agencies with sub-agencies`);

    let maxAggregatedScore = 0;
    let maxAgencyGroup: { parentId: number; parentName: string; score: number; agencyCount: number } | null = null;

    // Calculate aggregated complexity for each parent + children group
    for (const parent of parentAgencies) {
      const allAgencyIds = [parent.id, ...parent.children.map(child => child.id)];
      let totalGroupComplexity = 0;

      // Calculate complexity for each agency in the group
      for (const agencyId of allAgencyIds) {
        try {
          // Get section count for this agency
          const sectionCount = await prisma.section.count({
            where: {
              version: {
                title: {
                  agencyId: agencyId
                }
              }
            }
          });

          if (sectionCount === 0) continue;

          // Use small sample for performance
          const sampleSize = Math.min(sectionCount, 20);
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
          totalGroupComplexity += complexityScore;

        } catch (error) {
          console.warn(`[Max Aggregated Complexity Score] Error calculating for agency ${agencyId}:`, error);
        }
      }

      // Check if this group has the highest aggregated complexity
      if (totalGroupComplexity > maxAggregatedScore) {
        maxAggregatedScore = totalGroupComplexity;
        maxAgencyGroup = {
          parentId: parent.id,
          parentName: parent.name,
          score: totalGroupComplexity,
          agencyCount: allAgencyIds.length
        };
      }

      console.log(`[Max Aggregated Complexity Score] ${parent.name}: ${totalGroupComplexity} (${allAgencyIds.length} agencies)`);
    }

    // Update cache
    maxAggregatedScoreCache.score = maxAggregatedScore;
    maxAggregatedScoreCache.expires = Date.now() + MAX_AGGREGATED_SCORE_CACHE_TTL;

    console.log(`[Max Aggregated Complexity Score] Maximum aggregated score: ${maxAggregatedScore}`);
    console.log(`[Max Aggregated Complexity Score] Total time: ${Date.now() - startTime}ms`);

    return NextResponse.json({
      max_aggregated_complexity_score: maxAggregatedScore,
      max_agency_group: maxAgencyGroup,
      parent_agencies_analyzed: parentAgencies.length,
      cached: false,
      cache_expires: new Date(maxAggregatedScoreCache.expires).toISOString()
    });

  } catch (error) {
    console.error('Error calculating max aggregated complexity score:', error);
    return NextResponse.json(
      { error: 'Failed to calculate max aggregated complexity score', details: error },
      { status: 500 }
    );
  }
}
