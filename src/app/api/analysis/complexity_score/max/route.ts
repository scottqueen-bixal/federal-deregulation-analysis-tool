import { NextResponse } from 'next/server';
import { prisma } from '../../../../../lib/prisma';

export async function GET() {
  console.log(`[Max Complexity Score] Starting calculation`);
  const startTime = Date.now();

  try {
    // Get all agencies
    const agencies = await prisma.agency.findMany({
      select: {
        id: true,
        name: true
      }
    });

    let maxComplexityScore = 0;
    let maxAgency: { id: number; name: string; score: number } | null = null;

    // Calculate complexity score for each agency
    for (const agency of agencies) {
      const sectionCount = await prisma.section.count({
        where: {
          version: {
            title: {
              agencyId: agency.id
            }
          }
        }
      });

      if (sectionCount === 0) continue;

      // Use same sampling logic as the individual endpoint
      const sampleSize = Math.min(sectionCount, 100);
      const sections = await prisma.section.findMany({
        where: {
          version: {
            title: {
              agencyId: agency.id
            }
          }
        },
        select: {
          textContent: true
        },
        take: sampleSize
      });

      // Calculate cross-references and technical terms
      let crossReferencesInSample = 0;
      let technicalTermsInSample = 0;

      sections.forEach(section => {
        const content = section.textContent || '';

        // Count CFR references
        const cfrMatches = content.match(/(\d+\s*CFR\s*\d+\.\d+|§\s*\d+\.\d+)/gi) || [];
        crossReferencesInSample += cfrMatches.length;

        // Count technical terms
        const technicalCount = (content.match(/\b(shall|must|required|prohibited|compliance)\b/gi) || []).length;
        technicalTermsInSample += technicalCount;
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
          id: agency.id,
          name: agency.name,
          score: complexityScore
        };
      }
    }

    console.log(`[Max Complexity Score] Maximum score: ${maxComplexityScore}`);
    console.log(`[Max Complexity Score] Total time: ${Date.now() - startTime}ms`);

    return NextResponse.json({
      max_complexity_score: maxComplexityScore,
      max_agency: maxAgency,
      total_agencies_analyzed: agencies.length
    });

  } catch (error) {
    console.error('Error calculating max complexity score:', error);
    return NextResponse.json(
      { error: 'Failed to calculate max complexity score', details: error },
      { status: 500 }
    );
  }
}
