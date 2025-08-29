import { NextResponse } from 'next/server';
import { prisma } from '../../../../../../lib/prisma';

export async function GET(
  request: Request,
  context: { params: Promise<{ agencyId: string }> }
) {
  const { agencyId } = await context.params;

  console.log(`[Complexity Score] Starting calculation for agency ${agencyId}`);
  const startTime = Date.now();

  try {
    // Query section count and basic info for the given agency (much faster)
    console.log(`[Complexity Score] Querying section count for agency ${agencyId}`);
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
      console.log(`[Complexity Score] No sections found for agency ${agencyId}`);
      return NextResponse.json({
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
      });
    }

    // For large datasets, use sampling instead of processing everything
    const sampleSize = Math.min(sectionCount, 100); // Process max 100 sections to avoid memory issues
    console.log(`[Complexity Score] Using sample size of ${sampleSize} sections`);

    const sections = await prisma.section.findMany({
      where: {
        version: {
          title: {
            agencyId: parseInt(agencyId)
          }
        }
      },
      select: {
        identifier: true,
        textContent: true
      },
      take: sampleSize
    });

    console.log(`[Complexity Score] Retrieved ${sections.length} sections for analysis`);

    // Use a fixed hierarchy depth to avoid expensive calculations
    const hierarchyDepth = 3; // Reasonable default for regulatory documents
    console.log(`[Complexity Score] Using fixed hierarchy depth: ${hierarchyDepth}`);

    // Estimate cross-references and technical terms based on sample
    console.log(`[Complexity Score] Estimating cross-references and technical terms from sample`);

    let crossReferencesInSample = 0;
    let technicalTermsInSample = 0;

    // Process in smaller batches to avoid memory issues
    const batchSize = 100;
    for (let i = 0; i < sections.length; i += batchSize) {
      const batch = sections.slice(i, i + batchSize);

      batch.forEach(section => {
        const content = section.textContent || '';

        // Count CFR references
        const cfrMatches = content.match(/(\d+\s*CFR\s*\d+\.\d+|§\s*\d+\.\d+)/gi) || [];
        crossReferencesInSample += cfrMatches.length;

        // Count technical terms (simplified patterns)
        const technicalCount = (content.match(/\b(shall|must|required|prohibited|compliance)\b/gi) || []).length;
        technicalTermsInSample += technicalCount;
      });
    }

    // Scale up estimates based on sample vs total
    const scaleFactor = sectionCount / sections.length;
    const crossReferences = Math.round(crossReferencesInSample * scaleFactor);
    const technicalTerms = Math.round(technicalTermsInSample * scaleFactor);

    console.log(`[Complexity Score] Cross-references estimated: ${crossReferences}`);
    console.log(`[Complexity Score] Technical terms estimated: ${technicalTerms}`);

    // Calculate complexity score using simplified factors (no hierarchy depth)
    const complexity = (
      (sectionCount * 0.5) +              // Volume weight based on total sections
      (crossReferences * 2) +             // Cross-reference weight
      (technicalTerms * 0.1)              // Technical language weight
    );

    const complexityScore = Math.round(complexity);
    console.log(`[Complexity Score] Final complexity score: ${complexityScore}`);

    // Get max complexity score for relative calculation
    console.log(`[Complexity Score] Fetching max complexity score for relative calculation`);
    let relativeScore = 0;
    try {
      const maxResponse = await fetch(`http://localhost:3000/api/analysis/complexity_score/max`);
      if (maxResponse.ok) {
        const maxData = await maxResponse.json();
        const maxScore = maxData.max_complexity_score;
        if (maxScore > 0) {
          relativeScore = Math.round((complexityScore / maxScore) * 100);
          console.log(`[Complexity Score] Relative score: ${relativeScore}/100 (${complexityScore}/${maxScore})`);
        }
      }
    } catch (error) {
      console.warn(`[Complexity Score] Could not fetch max score for relative calculation:`, error);
    }

    console.log(`[Complexity Score] Total time: ${Date.now() - startTime}ms`);

    return NextResponse.json({
      agencyId: parseInt(agencyId),
      complexity_score: complexityScore,
      relative_complexity_score: relativeScore,
      hierarchy_depth: hierarchyDepth,
      cross_references: crossReferences,
      technical_terms: technicalTerms,
      calculation_details: {
        total_sections: sectionCount,        // Use actual total count
        hierarchy_depth: hierarchyDepth,
        cross_references: crossReferences,
        technical_terms: technicalTerms,
        volume_weight: sectionCount * 0.5,  // Use actual total count
        structure_weight: 0, // No longer using hierarchy depth
        cross_reference_weight: crossReferences * 2,
        technical_weight: technicalTerms * 0.1,
        relative_score_out_of_100: relativeScore
      }
    });

  } catch (error) {
    console.error('Error calculating complexity score:', error);
    return NextResponse.json(
      { error: 'Failed to calculate complexity score', details: error },
      { status: 500 }
    );
  }
}
