import { NextResponse } from 'next/server';
import { prisma } from '../../../../../../lib/prisma';

// Simple in-memory cache with TTL
interface CacheEntry {
  data: ComplexityScoreResponse;
  expires: number;
}

interface ComplexityScoreResponse {
  agencyId: number;
  complexity_score: number;
  relative_complexity_score: number;
  hierarchy_depth: number;
  cross_references: number;
  technical_terms: number;
  calculation_details: {
    total_sections: number;
    hierarchy_depth: number;
    cross_references: number;
    technical_terms: number;
    volume_weight?: number;
    structure_weight?: number;
    cross_reference_weight?: number;
    technical_weight?: number;
    relative_score_out_of_100: number;
  };
}

const cache = new Map<string, CacheEntry>();
const CACHE_TTL = 10 * 60 * 1000; // 10 minutes

function getCached(key: string): ComplexityScoreResponse | null {
  const cached = cache.get(key);
  if (cached && cached.expires > Date.now()) {
    return cached.data;
  }
  cache.delete(key);
  return null;
}

function setCache(key: string, data: ComplexityScoreResponse): void {
  cache.set(key, { data, expires: Date.now() + CACHE_TTL });
}

export async function GET(
  request: Request,
  context: { params: Promise<{ agencyId: string }> }
) {
  const { agencyId } = await context.params;

  // Check cache first
  const cacheKey = `complexity_score_${agencyId}`;
  const cached = getCached(cacheKey);
  if (cached) {
    console.log(`[Complexity Score] Returning cached result for agency ${agencyId}`);
    return NextResponse.json(cached);
  }

  console.log(`[Complexity Score] Starting calculation for agency ${agencyId}`);
  const startTime = Date.now();

  try {
    // Use a single aggregation query to get both count and sample data efficiently
    console.log(`[Complexity Score] Querying section data for agency ${agencyId}`);

    // First get the count to determine sample strategy
    const sectionCount = await prisma.section.count({
      where: {
        version: {
          title: {
            agencyId: parseInt(agencyId)
          }
        }
      }
    });

    console.log(`[Complexity Score] Found ${sectionCount} sections total`);

    if (sectionCount === 0) {
      const result: ComplexityScoreResponse = {
        agencyId: parseInt(agencyId),
        complexity_score: 0,
        relative_complexity_score: 0,
        hierarchy_depth: 3,
        cross_references: 0,
        technical_terms: 0,
        calculation_details: {
          total_sections: 0,
          hierarchy_depth: 3,
          cross_references: 0,
          technical_terms: 0,
          relative_score_out_of_100: 0
        }
      };
      setCache(cacheKey, result);
      return NextResponse.json(result);
    }

    // Get sample with random offset for better representation
    const sampleSize = Math.min(sectionCount, 50); // Reduced sample size
    const randomSkip = sectionCount > sampleSize ? Math.floor(Math.random() * (sectionCount - sampleSize)) : 0;

    const sampleSections = await prisma.section.findMany({
      where: {
        version: {
          title: {
            agencyId: parseInt(agencyId)
          }
        }
      },
      select: {
        textContent: true,
        wordCount: true
      },
      take: sampleSize,
      skip: randomSkip
    });

    console.log(`[Complexity Score] Analyzing ${sampleSections.length} sample sections`);

    // Use a fixed hierarchy depth to avoid expensive calculations
    const hierarchyDepth = 3; // Reasonable default for regulatory documents
    console.log(`[Complexity Score] Using fixed hierarchy depth: ${hierarchyDepth}`);

    // Optimized text analysis with pre-compiled regex patterns
    console.log(`[Complexity Score] Analyzing text patterns in sample`);

    // Pre-compile regex patterns for better performance
    const cfrPattern = /(\d+\s*CFR\s*\d+\.\d+|§\s*\d+\.\d+)/gi;
    const technicalPattern = /\b(shall|must|required|prohibited|compliance|pursuant|thereunder|thereof|hereby|wherein)\b/gi;

    let crossReferencesInSample = 0;
    let technicalTermsInSample = 0;

    // Process all sections in a single pass without batching
    sampleSections.forEach(section => {
      const content = section.textContent || '';

      // Reset regex lastIndex to ensure fresh matching
      cfrPattern.lastIndex = 0;
      technicalPattern.lastIndex = 0;

      // Count CFR references
      const cfrMatches = content.match(cfrPattern) || [];
      crossReferencesInSample += cfrMatches.length;

      // Count technical terms
      const technicalMatches = content.match(technicalPattern) || [];
      technicalTermsInSample += technicalMatches.length;
    });

    // Scale up estimates based on sample vs total with improved estimation
    const scaleFactor = sectionCount / sampleSections.length;
    const crossReferences = Math.round(crossReferencesInSample * scaleFactor);
    const technicalTerms = Math.round(technicalTermsInSample * scaleFactor);

    console.log(`[Complexity Score] Cross-references estimated: ${crossReferences}`);
    console.log(`[Complexity Score] Technical terms estimated: ${technicalTerms}`);

    // Calculate complexity score using simplified factors
    const complexity = (
      (sectionCount * 0.5) +              // Volume weight based on total sections
      (crossReferences * 2) +             // Cross-reference weight
      (technicalTerms * 0.1)              // Technical language weight
    );

    const complexityScore = Math.round(complexity);
    console.log(`[Complexity Score] Final complexity score: ${complexityScore}`);

    // Use a cached or estimated max complexity score to avoid expensive API call
    console.log(`[Complexity Score] Calculating relative score`);
    let relativeScore = 0;

    // Try to get max score from the cached endpoint
    try {
      const maxResponse = await fetch(`http://localhost:3000/api/analysis/complexity_score/max-cached`);
      if (maxResponse.ok) {
        const maxData = await maxResponse.json();
        const maxScore = maxData.max_complexity_score;
        if (maxScore > 0) {
          relativeScore = Math.round((complexityScore / maxScore) * 100);
          console.log(`[Complexity Score] Relative score: ${relativeScore}/100 (${complexityScore}/${maxScore})`);
        }
      }
    } catch (error) {
      console.warn(`[Complexity Score] Could not fetch max score, using estimate:`, error);
      // Fallback to estimate
      const estimatedMaxScore = 100000;
      relativeScore = Math.round((complexityScore / estimatedMaxScore) * 100);
    }

    console.log(`[Complexity Score] Total time: ${Date.now() - startTime}ms`);

    const result: ComplexityScoreResponse = {
      agencyId: parseInt(agencyId),
      complexity_score: complexityScore,
      relative_complexity_score: relativeScore,
      hierarchy_depth: hierarchyDepth,
      cross_references: crossReferences,
      technical_terms: technicalTerms,
      calculation_details: {
        total_sections: sectionCount,
        hierarchy_depth: hierarchyDepth,
        cross_references: crossReferences,
        technical_terms: technicalTerms,
        volume_weight: sectionCount * 0.5,
        structure_weight: 0, // No longer using hierarchy depth
        cross_reference_weight: crossReferences * 2,
        technical_weight: technicalTerms * 0.1,
        relative_score_out_of_100: relativeScore
      }
    };

    // Cache the result before returning
    setCache(cacheKey, result);

    return NextResponse.json(result);

  } catch (error) {
    console.error('Error calculating complexity score:', error);
    return NextResponse.json(
      { error: 'Failed to calculate complexity score', details: error },
      { status: 500 }
    );
  }
}
